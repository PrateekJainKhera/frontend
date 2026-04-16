"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Search } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Product } from '@/types/product'
import { estimationService } from '@/lib/api/estimations'
import { EstimationResponse } from '@/types/estimation'
import { ProductSearchDialog } from '@/components/dialogs/product-search-dialog'
import { apiClient } from '@/lib/api/axios-config'

interface ReviseItem {
  productId: number
  partCode: string
  productName: string
  quantity: number
  unitPrice: number
  notes: string
}

export default function ReviseEstimationPage() {
  const params = useParams()
  const router = useRouter()
  const id = parseInt(params.id as string)

  const [original, setOriginal] = useState<EstimationResponse | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [items, setItems] = useState<ReviseItem[]>([])
  const [discountType, setDiscountType] = useState<'None' | 'Percent' | 'Fixed'>('None')
  const [discountValue, setDiscountValue] = useState(0)
  const [notes, setNotes] = useState('')
  const [termsAndConditions, setTermsAndConditions] = useState('Payment due within 30 days of invoice.')
  const [productSearchOpen, setProductSearchOpen] = useState(false)
  const [gstRate, setGstRate] = useState(18)

  useEffect(() => { loadOriginal() }, [id])

  const loadOriginal = async () => {
    try {
      const data = await estimationService.getById(id)
      setOriginal(data)

      // Pre-fill everything from original
      setDiscountType((data.discountType as 'None' | 'Percent' | 'Fixed') || 'None')
      setDiscountValue(data.discountValue)
      setNotes(data.notes || '')
      setTermsAndConditions(data.termsAndConditions || 'Payment due within 30 days of invoice.')
      setGstRate(data.gstRate || 18)

      // Pre-fill all products with original qty + price
      setItems(data.items.map(i => ({
        productId: i.productId,
        partCode: i.partCode || i.productName || '',
        productName: i.productName || '',
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        notes: i.notes || '',
      })))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load estimation')
    }
  }

  // Also load current GST rate from settings
  useEffect(() => {
    apiClient.get('/app-settings/GSTRate').then(res => {
      const v = parseFloat(res.data?.data?.value)
      if (!isNaN(v)) setGstRate(v)
    }).catch(() => {})
  }, [])

  const handleProductSelected = (product: Product) => {
    if (items.find(i => i.productId === product.id)) {
      toast.error('Product already added')
      return
    }
    setItems(prev => [...prev, {
      productId: product.id,
      partCode: product.partCode,
      productName: product.partCode,
      quantity: 1,
      unitPrice: 0,
      notes: '',
    }])
    setProductSearchOpen(false)
  }

  const updateItem = (index: number, field: 'quantity' | 'unitPrice' | 'notes', value: string | number) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  // Calculations
  const subTotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)
  const discountAmount = discountType === 'Percent'
    ? Math.round(subTotal * discountValue / 100 * 100) / 100
    : discountType === 'Fixed' ? Math.min(discountValue, subTotal) : 0
  const taxableAmount = subTotal - discountAmount
  const gstAmount = Math.round(taxableAmount * gstRate / 100 * 100) / 100
  const grandTotal = taxableAmount + gstAmount

  const handleSubmit = async () => {
    if (!original) return
    if (items.length === 0) { toast.error('Please add at least one product'); return }
    if (items.some(i => i.quantity <= 0)) { toast.error('All quantities must be greater than 0'); return }

    setIsSubmitting(true)
    try {
      const result = await estimationService.revise(id, {
        customerId: original.customerId,
        discountType: discountType === 'None' ? undefined : discountType,
        discountValue: discountType === 'None' ? 0 : discountValue,
        notes: notes || undefined,
        termsAndConditions: termsAndConditions || undefined,
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          notes: item.notes || undefined,
        })),
      })
      toast.success(`Revision ${result.estimateNo} created`)
      router.push(`/sales/estimations/${result.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create revision')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!original) return <div className="text-center py-12 text-muted-foreground">Loading...</div>

  const newRevNo = original.revisionNumber + 1

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/sales/estimations/${id}`}><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Revise Estimation</h1>
            <Badge variant="outline" className="font-mono">{original.estimateNo}</Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            All fields pre-filled from original — change only what you need. Both versions are stored in the database.
          </p>
        </div>
      </div>

      {/* Customer (read-only) */}
      <Card className="border-2 border-border">
        <CardHeader><CardTitle className="text-base">Customer</CardTitle></CardHeader>
        <CardContent>
          <p className="font-semibold">{original.customerName}</p>
          <p className="text-xs text-muted-foreground mt-1">Customer cannot be changed during revision</p>
        </CardContent>
      </Card>

      {/* Products */}
      <Card className="border-2 border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Products</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setProductSearchOpen(true)}>
              <Search className="mr-2 h-4 w-4" /> Add Product
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No products</p>
              <Button variant="outline" className="mt-3" onClick={() => setProductSearchOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Product
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground hidden sm:grid px-1">
                <div className="col-span-4">Product</div>
                <div className="col-span-2 text-center">Qty</div>
                <div className="col-span-3 text-center">Unit Price (₹)</div>
                <div className="col-span-2 text-right">Total</div>
                <div className="col-span-1"></div>
              </div>
              {items.map((item, index) => (
                <div key={item.productId} className="grid grid-cols-12 gap-2 items-center border rounded-lg p-3 sm:border-0 sm:rounded-none sm:p-0">
                  <div className="col-span-12 sm:col-span-4">
                    <p className="font-medium text-sm">{item.partCode}</p>
                    <p className="text-xs text-muted-foreground">{item.productName !== item.partCode ? item.productName : ''}</p>
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <Label className="sm:hidden text-xs">Qty</Label>
                    <Input
                      type="number" min={1} value={item.quantity}
                      onChange={e => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="text-center"
                    />
                  </div>
                  <div className="col-span-5 sm:col-span-3">
                    <Label className="sm:hidden text-xs">Unit Price</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                      <Input
                        type="number" min={0} step={0.01} value={item.unitPrice}
                        onChange={e => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="pl-7 text-right"
                      />
                    </div>
                  </div>
                  <div className="col-span-12 sm:col-span-2 sm:text-right flex sm:block items-center justify-between">
                    <span className="sm:hidden text-xs text-muted-foreground">Total:</span>
                    <span className="font-semibold text-sm">
                      ₹{(item.quantity * item.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="col-span-3 sm:col-span-1 flex justify-end">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={() => setProductSearchOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Another Product
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Discount + Summary */}
      <div className="grid sm:grid-cols-2 gap-6">
        <Card className="border-2 border-border">
          <CardHeader><CardTitle className="text-base">Discount</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Discount Type</Label>
              <Select value={discountType} onValueChange={v => setDiscountType(v as 'None' | 'Percent' | 'Fixed')}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="None">No Discount</SelectItem>
                  <SelectItem value="Percent">Percentage (%)</SelectItem>
                  <SelectItem value="Fixed">Fixed Amount (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {discountType !== 'None' && (
              <div>
                <Label>Value {discountType === 'Percent' ? '(%)' : '(₹)'}</Label>
                <Input type="number" min={0} value={discountValue}
                  onChange={e => setDiscountValue(parseFloat(e.target.value) || 0)}
                  className="mt-1" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 border-border">
          <CardHeader><CardTitle className="text-base">Summary</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sub Total</span>
                <span>₹{subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>- ₹{discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Taxable Amount</span>
                <span>₹{taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-blue-600">
                <span>GST ({gstRate}%)</span>
                <span>₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>Grand Total</span>
                <span>₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      <Card className="border-2 border-border">
        <CardHeader><CardTitle className="text-base">Notes & Terms</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Internal Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} className="mt-1" rows={2} />
          </div>
          <div>
            <Label>Terms & Conditions</Label>
            <Textarea value={termsAndConditions} onChange={e => setTermsAndConditions(e.target.value)} className="mt-1" rows={3} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" asChild>
          <Link href={`/sales/estimations/${id}`}>Cancel</Link>
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Creating Revision...' : `Create Revision .${newRevNo}`}
        </Button>
      </div>

      <ProductSearchDialog
        open={productSearchOpen}
        onOpenChange={setProductSearchOpen}
        onSelectProduct={handleProductSelected}
      />
    </div>
  )
}
