"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Search } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Customer } from '@/types/customer'
import { Product } from '@/types/product'
import { customerService } from '@/lib/api/customer'
import { estimationService } from '@/lib/api/estimations'
import { ProductSearchDialog } from '@/components/dialogs/product-search-dialog'
import { CreateCustomerDialog } from '@/components/forms/create-customer-dialog'

interface EstimationItem {
  product: Product
  quantity: number
  unitPrice: number
  notes: string
}

export default function CreateEstimationPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [items, setItems] = useState<EstimationItem[]>([])
  const [discountType, setDiscountType] = useState<'None' | 'Percent' | 'Fixed'>('None')
  const [discountValue, setDiscountValue] = useState(0)
  const [notes, setNotes] = useState('')
  const [termsAndConditions, setTermsAndConditions] = useState('Payment due within 30 days of invoice.')
  const [productSearchOpen, setProductSearchOpen] = useState(false)
  const [createCustomerOpen, setCreateCustomerOpen] = useState(false)

  useEffect(() => { loadCustomers() }, [])

  const loadCustomers = async () => {
    try {
      const data = await customerService.getAll()
      setCustomers(data)
    } catch {
      toast.error('Failed to load customers')
    }
  }

  const handleProductSelected = (product: Product) => {
    if (items.find(i => i.product.id === product.id)) {
      toast.error('Product already added')
      return
    }
    setItems(prev => [...prev, { product, quantity: 1, unitPrice: 0, notes: '' }])
    setProductSearchOpen(false)
  }

  const updateItem = (index: number, field: keyof Omit<EstimationItem, 'product'>, value: string | number) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  // Calculations
  const subTotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  const discountAmount = discountType === 'Percent'
    ? Math.round(subTotal * discountValue / 100 * 100) / 100
    : discountType === 'Fixed'
      ? Math.min(discountValue, subTotal)
      : 0
  const totalAmount = subTotal - discountAmount

  const handleSubmit = async () => {
    if (!selectedCustomerId) { toast.error('Please select a customer'); return }
    if (items.length === 0) { toast.error('Please add at least one product'); return }
    if (items.some(i => i.quantity <= 0)) { toast.error('All quantities must be greater than 0'); return }
    if (items.some(i => i.unitPrice < 0)) { toast.error('Unit prices cannot be negative'); return }

    setIsSubmitting(true)
    try {
      const result = await estimationService.create({
        customerId: parseInt(selectedCustomerId),
        discountType: discountType === 'None' ? undefined : discountType,
        discountValue: discountType === 'None' ? 0 : discountValue,
        notes: notes || undefined,
        termsAndConditions: termsAndConditions || undefined,
        items: items.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          notes: item.notes || undefined,
        })),
      })
      toast.success(`Estimation ${result.estimateNo} created`)
      router.push(`/sales/estimations/${result.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create estimation')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/sales/estimations"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">New Estimation</h1>
          <p className="text-muted-foreground text-sm">Create a price quotation for a customer</p>
        </div>
      </div>

      {/* Customer */}
      <Card className="border-2 border-border">
        <CardHeader><CardTitle className="text-base">Customer</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Label htmlFor="customer">Select Customer</Label>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger id="customer" className="mt-1">
                  <SelectValue placeholder="Choose a customer..." />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.customerName} ({c.customerCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={() => setCreateCustomerOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> New Customer
            </Button>
          </div>
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
              <p className="text-sm">No products added yet</p>
              <Button variant="outline" className="mt-3" onClick={() => setProductSearchOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add First Product
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header row */}
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1 hidden sm:grid">
                <div className="col-span-4">Product</div>
                <div className="col-span-2 text-center">Qty</div>
                <div className="col-span-3 text-center">Unit Price (₹)</div>
                <div className="col-span-2 text-right">Total</div>
                <div className="col-span-1"></div>
              </div>
              {items.map((item, index) => (
                <div key={item.product.id} className="grid grid-cols-12 gap-2 items-start border rounded-lg p-3 sm:border-0 sm:rounded-none sm:p-0">
                  {/* Product info */}
                  <div className="col-span-12 sm:col-span-4">
                    <p className="font-medium text-sm">{item.product.partCode}</p>
                    <p className="text-xs text-muted-foreground">{item.product.modelName} · {item.product.rollerType}</p>
                  </div>
                  {/* Qty */}
                  <div className="col-span-4 sm:col-span-2">
                    <Label className="sm:hidden text-xs">Qty</Label>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={e => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="text-center"
                    />
                  </div>
                  {/* Unit Price */}
                  <div className="col-span-5 sm:col-span-3">
                    <Label className="sm:hidden text-xs">Unit Price</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.unitPrice}
                        onChange={e => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="pl-7 text-right"
                      />
                    </div>
                  </div>
                  {/* Total */}
                  <div className="col-span-12 sm:col-span-2 sm:text-right flex sm:block items-center justify-between">
                    <span className="sm:hidden text-xs text-muted-foreground">Total:</span>
                    <span className="font-semibold text-sm">
                      ₹{(item.quantity * item.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {/* Remove */}
                  <div className="col-span-3 sm:col-span-1 flex justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <Separator />

              {/* Add more */}
              <Button variant="ghost" size="sm" onClick={() => setProductSearchOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Another Product
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Discount + Summary */}
      <div className="grid sm:grid-cols-2 gap-6">
        {/* Discount */}
        <Card className="border-2 border-border">
          <CardHeader><CardTitle className="text-base">Discount</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Discount Type</Label>
              <Select value={discountType} onValueChange={(v) => setDiscountType(v as 'None' | 'Percent' | 'Fixed')}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="None">No Discount</SelectItem>
                  <SelectItem value="Percent">Percentage (%)</SelectItem>
                  <SelectItem value="Fixed">Fixed Amount (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {discountType !== 'None' && (
              <div>
                <Label>Discount Value {discountType === 'Percent' ? '(%)' : '(₹)'}</Label>
                <Input
                  type="number"
                  min={0}
                  max={discountType === 'Percent' ? 100 : undefined}
                  step={discountType === 'Percent' ? 0.01 : 1}
                  value={discountValue}
                  onChange={e => setDiscountValue(parseFloat(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
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
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>Total Amount</span>
                <span>₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <p className="text-xs text-muted-foreground pt-2">Valid for 21 days from creation</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes + T&C */}
      <Card className="border-2 border-border">
        <CardHeader><CardTitle className="text-base">Notes & Terms</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="notes">Internal Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Internal notes (not printed on quotation)..."
              className="mt-1"
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="terms">Terms & Conditions</Label>
            <Textarea
              id="terms"
              value={termsAndConditions}
              onChange={e => setTermsAndConditions(e.target.value)}
              placeholder="Terms and conditions for this quotation..."
              className="mt-1"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" asChild>
          <Link href="/sales/estimations">Cancel</Link>
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Estimation'}
        </Button>
      </div>

      {/* Dialogs */}
      <ProductSearchDialog
        open={productSearchOpen}
        onOpenChange={setProductSearchOpen}
        onSelectProduct={handleProductSelected}
      />
      <CreateCustomerDialog
        open={createCustomerOpen}
        onOpenChange={setCreateCustomerOpen}
        onSuccess={() => {
          customerService.getAll().then(data => {
            setCustomers(data)
            if (data.length > 0) setSelectedCustomerId(String(data[data.length - 1].id))
          })
          setCreateCustomerOpen(false)
        }}
      />
    </div>
  )
}
