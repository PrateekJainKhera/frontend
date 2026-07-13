"use client"
import { getCurrentUserName } from '@/lib/auth'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Printer, CheckCircle, XCircle, RotateCcw, ShoppingCart, Trash2, Send, Pencil, X, Plus, Search, History } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { estimationService } from '@/lib/api/estimations'
import { EstimationResponse, CreateEstimationRequest } from '@/types/estimation'
import { Product } from '@/types/product'
import { Customer } from '@/types/customer'
import { customerService } from '@/lib/api/customer'
import { ProductSearchDialog } from '@/components/dialogs/product-search-dialog'

const STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-700',
  Submitted: 'bg-blue-100 text-blue-700',
  Approved: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
  Cancelled: 'bg-gray-100 text-gray-500',
  Converted: 'bg-purple-100 text-purple-700',
}

interface EditItem {
  productId: number
  productName: string
  partCode: string
  quantity: number
  unitPrice: number
  notes: string
}

export default function EstimationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = parseInt(params.id as string)
  const printRef = useRef<HTMLDivElement>(null)

  const [estimation, setEstimation] = useState<EstimationResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [revisionHistory, setRevisionHistory] = useState<EstimationResponse[]>([])
  const [showHistory, setShowHistory] = useState(false)

  // Edit state
  const [editMode, setEditMode] = useState(false)
  const [editItems, setEditItems] = useState<EditItem[]>([])
  const [editCustomerId, setEditCustomerId] = useState('')
  const [editDiscountType, setEditDiscountType] = useState<'None' | 'Percent' | 'Fixed'>('None')
  const [editDiscountValue, setEditDiscountValue] = useState(0)
  const [editNotes, setEditNotes] = useState('')
  const [editTerms, setEditTerms] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [productSearchOpen, setProductSearchOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Dialog states
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [isActing, setIsActing] = useState(false)

  useEffect(() => { loadEstimation() }, [id])

  const loadEstimation = async () => {
    setLoading(true)
    try {
      const data = await estimationService.getById(id)
      setEstimation(data)
      const history = await estimationService.getRevisionHistory(id)
      setRevisionHistory(history)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load estimation')
    } finally {
      setLoading(false)
    }
  }

  const enterEditMode = async () => {
    if (!estimation) return
    if (!customers.length) {
      try {
        const data = await customerService.getAll()
        setCustomers(data)
      } catch { toast.error('Failed to load customers') }
    }
    setEditCustomerId(String(estimation.customerId))
    setEditItems(estimation.items.map(i => ({
      productId: i.productId,
      productName: i.productName || '',
      partCode: i.partCode || '',
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      notes: i.notes || '',
    })))
    setEditDiscountType((estimation.discountType as 'None' | 'Percent' | 'Fixed') || 'None')
    setEditDiscountValue(estimation.discountValue)
    setEditNotes(estimation.notes || '')
    setEditTerms(estimation.termsAndConditions || '')
    setEditMode(true)
  }

  const handleProductSelected = (product: Product) => {
    if (editItems.find(i => i.productId === product.id)) {
      toast.error('Product already added')
      return
    }
    setEditItems(prev => [...prev, {
      productId: product.id,
      productName: product.partCode,
      partCode: product.partCode,
      quantity: 1,
      unitPrice: 0,
      notes: ''
    }])
    setProductSearchOpen(false)
  }

  const updateEditItem = (index: number, field: keyof Omit<EditItem, 'productId' | 'productName' | 'partCode'>, value: string | number) => {
    setEditItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  const removeEditItem = (index: number) => {
    setEditItems(prev => prev.filter((_, i) => i !== index))
  }

  // Edit calculations
  const editSubTotal = editItems.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)
  const editDiscountAmount = editDiscountType === 'Percent'
    ? Math.round(editSubTotal * editDiscountValue / 100 * 100) / 100
    : editDiscountType === 'Fixed' ? Math.min(editDiscountValue, editSubTotal) : 0
  const editTaxable = editSubTotal - editDiscountAmount
  const editGST = estimation ? Math.round(editTaxable * estimation.gstRate / 100 * 100) / 100 : 0
  const editGrandTotal = editTaxable + editGST

  const handleSaveEdit = async () => {
    if (!estimation) return
    if (!editCustomerId) { toast.error('Please select a customer'); return }
    if (editItems.length === 0) { toast.error('Please add at least one product'); return }

    setIsSaving(true)
    try {
      const request: CreateEstimationRequest = {
        customerId: parseInt(editCustomerId),
        discountType: editDiscountType === 'None' ? undefined : editDiscountType,
        discountValue: editDiscountType === 'None' ? 0 : editDiscountValue,
        notes: editNotes || undefined,
        termsAndConditions: editTerms || undefined,
        items: editItems.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          notes: i.notes || undefined,
        })),
      }
      const updated = await estimationService.update(estimation.id, request)
      setEstimation(updated)
      setEditMode(false)
      if (updated.status === 'Draft' && estimation.status === 'Submitted') {
        toast.success('Estimation updated and reset to Draft — please re-submit')
      } else {
        toast.success('Estimation updated')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (!estimation) return
    setIsActing(true)
    try {
      const updated = await estimationService.submit(estimation.id)
      setEstimation(updated)
      toast.success('Estimation submitted for approval')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit')
    } finally {
      setIsActing(false)
    }
  }

  const handleApprove = async () => {
    if (!estimation) return
    setIsActing(true)
    try {
      const updated = await estimationService.approve(estimation.id, { approvedBy: getCurrentUserName() })
      setEstimation(updated)
      toast.success('Estimation approved')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to approve')
    } finally {
      setIsActing(false)
    }
  }

  const handleReject = async () => {
    if (!estimation || !rejectReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }
    setIsActing(true)
    try {
      const updated = await estimationService.reject(estimation.id, { rejectedBy: getCurrentUserName(), reason: rejectReason })
      setEstimation(updated)
      setRejectDialogOpen(false)
      toast.success('Estimation rejected')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reject')
    } finally {
      setIsActing(false)
    }
  }

  const handleConvertToOrder = async () => {
    if (!estimation) return
    if (!confirm('Convert this estimation to an order?')) return
    setIsActing(true)
    try {
      const updated = await estimationService.convertToOrder(estimation.id)
      setEstimation(updated)
      toast.success(`Order created! Estimation converted.`)
      if (updated.convertedOrderId) {
        router.push(`/orders/${updated.convertedOrderId}`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to convert')
    } finally {
      setIsActing(false)
    }
  }

  const handleDelete = async () => {
    if (!estimation) return
    if (!confirm('Delete this estimation? This cannot be undone.')) return
    setIsActing(true)
    try {
      await estimationService.delete(estimation.id)
      toast.success('Estimation deleted')
      router.push('/sales/estimations')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete')
      setIsActing(false)
    }
  }

  const canEdit = estimation?.status === 'Draft' || estimation?.status === 'Submitted'

  if (loading) return <div className="text-center py-12 text-muted-foreground">Loading...</div>
  if (!estimation) return <div className="text-center py-12 text-muted-foreground">Estimation not found</div>

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white; }
        }
        @media screen { .print-only { display: none; } }
      `}</style>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 no-print">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/sales/estimations"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold font-mono">{estimation.estimateNo}</h1>
              <Badge className={`${STATUS_COLORS[estimation.status] || 'bg-gray-100'}`}>
                {estimation.status}
              </Badge>
              {estimation.status === 'Submitted' && (
                <span className="text-xs text-amber-600 font-medium">⚠ Editing will reset to Draft</span>
              )}
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              Customer: {estimation.customerName} &nbsp;·&nbsp; Created: {estimation.createdAt}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
            {revisionHistory.length > 1 && (
              <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)}>
                <History className="mr-2 h-4 w-4" /> Revisions ({revisionHistory.length})
              </Button>
            )}

            {canEdit && !editMode && (
              <Button variant="outline" size="sm" onClick={enterEditMode}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </Button>
            )}
            {editMode && (
              <>
                <Button size="sm" onClick={handleSaveEdit} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setEditMode(false)}>
                  <X className="mr-2 h-4 w-4" /> Cancel
                </Button>
              </>
            )}

            {!editMode && estimation.status === 'Draft' && (
              <>
                <Button variant="outline" size="sm" onClick={handleSubmit} disabled={isActing}>
                  <Send className="mr-2 h-4 w-4" /> Submit
                </Button>
                <Button variant="outline" size="sm"
                  className="text-destructive border-destructive hover:bg-destructive hover:text-white"
                  onClick={handleDelete} disabled={isActing}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </>
            )}
            {!editMode && estimation.status === 'Submitted' && (
              <>
                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={handleApprove} disabled={isActing}>
                  <CheckCircle className="mr-2 h-4 w-4" /> Approve
                </Button>
                <Button variant="outline" size="sm" className="text-destructive border-destructive"
                  onClick={() => setRejectDialogOpen(true)} disabled={isActing}>
                  <XCircle className="mr-2 h-4 w-4" /> Reject
                </Button>
              </>
            )}
            {!editMode && estimation.status === 'Approved' && (
              <>
                <Button size="sm" onClick={handleConvertToOrder} disabled={isActing}>
                  <ShoppingCart className="mr-2 h-4 w-4" /> Convert to Order
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/sales/estimations/${estimation.id}/revise`}>
                    <RotateCcw className="mr-2 h-4 w-4" /> Revise
                  </Link>
                </Button>
              </>
            )}
            {!editMode && (estimation.status === 'Rejected' || estimation.status === 'Cancelled') && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/sales/estimations/${estimation.id}/revise`}>
                  <RotateCcw className="mr-2 h-4 w-4" /> Create Revision
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Revision History Panel */}
        {showHistory && revisionHistory.length > 1 && (
          <Card className="border-2 border-amber-200 bg-amber-50 no-print">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-amber-800">Revision History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {revisionHistory.map(rev => (
                  <Link key={rev.id} href={`/sales/estimations/${rev.id}`}>
                    <div className={`px-3 py-1.5 rounded border text-sm cursor-pointer transition-colors ${
                      rev.id === estimation.id
                        ? 'bg-amber-200 border-amber-400 font-semibold'
                        : 'bg-white border-amber-200 hover:border-amber-400'
                    }`}>
                      <span className="font-mono">{rev.estimateNo}</span>
                      <Badge className={`ml-2 text-xs ${STATUS_COLORS[rev.status] || ''}`}>{rev.status}</Badge>
                      <span className="ml-2 text-xs text-muted-foreground">{rev.createdAt}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Mode — Items Editor */}
        {editMode ? (
          <div className="space-y-4 no-print">
            {/* Customer */}
            <Card className="border-2 border-primary/30">
              <CardHeader><CardTitle className="text-base">Edit Customer</CardTitle></CardHeader>
              <CardContent>
                <Select value={editCustomerId} onValueChange={setEditCustomerId}>
                  <SelectTrigger><SelectValue placeholder="Choose a customer..." /></SelectTrigger>
                  <SelectContent>
                    {customers.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.customerName} ({c.customerCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Products */}
            <Card className="border-2 border-primary/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Edit Products</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setProductSearchOpen(true)}>
                    <Search className="mr-2 h-4 w-4" /> Add Product
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {editItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No products. Add one above.</p>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground hidden sm:grid">
                      <div className="col-span-4">Product</div>
                      <div className="col-span-2 text-center">Qty</div>
                      <div className="col-span-3 text-center">Unit Price (₹)</div>
                      <div className="col-span-2 text-right">Total</div>
                      <div className="col-span-1"></div>
                    </div>
                    {editItems.map((item, index) => (
                      <div key={item.productId} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-4">
                          <p className="font-medium text-sm">{item.partCode}</p>
                          <p className="text-xs text-muted-foreground">{item.productName}</p>
                        </div>
                        <div className="col-span-2">
                          <Input type="number" min={1} value={item.quantity}
                            onChange={e => updateEditItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="text-center h-8" />
                        </div>
                        <div className="col-span-3">
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                            <Input type="number" min={0} step={0.01} value={item.unitPrice}
                              onChange={e => updateEditItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="pl-6 text-right h-8" />
                          </div>
                        </div>
                        <div className="col-span-2 text-right text-sm font-semibold">
                          ₹{(item.quantity * item.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                            onClick={() => removeEditItem(index)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Discount + Summary */}
            <div className="grid sm:grid-cols-2 gap-4">
              <Card className="border-2 border-primary/30">
                <CardHeader><CardTitle className="text-base">Discount</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>Discount Type</Label>
                    <Select value={editDiscountType} onValueChange={v => setEditDiscountType(v as 'None' | 'Percent' | 'Fixed')}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="None">No Discount</SelectItem>
                        <SelectItem value="Percent">Percentage (%)</SelectItem>
                        <SelectItem value="Fixed">Fixed Amount (₹)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {editDiscountType !== 'None' && (
                    <div>
                      <Label>Discount Value</Label>
                      <Input type="number" min={0} value={editDiscountValue}
                        onChange={e => setEditDiscountValue(parseFloat(e.target.value) || 0)}
                        className="mt-1" />
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="border-2 border-primary/30">
                <CardHeader><CardTitle className="text-base">Summary Preview</CardTitle></CardHeader>
                <CardContent className="text-sm space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sub Total</span>
                    <span>₹{editSubTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {editDiscountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>- ₹{editDiscountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxable Amount</span>
                    <span>₹{editTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-blue-600">
                    <span>GST ({estimation.gstRate}%)</span>
                    <span>₹{editGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-base">
                    <span>Grand Total</span>
                    <span>₹{editGrandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Notes */}
            <Card className="border-2 border-primary/30">
              <CardHeader><CardTitle className="text-base">Notes & Terms</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Internal Notes</Label>
                  <Textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={2} className="mt-1" />
                </div>
                <div>
                  <Label>Terms & Conditions</Label>
                  <Textarea value={editTerms} onChange={e => setEditTerms(e.target.value)} rows={3} className="mt-1" />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* View Mode */
          <div ref={printRef} className="space-y-6 print-container">
            {/* Print header */}
            <div className="print-only mb-6 border-b-2 pb-4">
              <h1 className="text-3xl font-bold">QUOTATION</h1>
              <p className="text-muted-foreground">MultiHitech Engineering</p>
            </div>

            {/* Info cards */}
            <div className="grid sm:grid-cols-2 gap-6">
              <Card className="border-2 border-border">
                <CardHeader><CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Estimation Details</CardTitle></CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="grid grid-cols-2 gap-1">
                    <span className="text-muted-foreground">Est. No.</span>
                    <span className="font-mono font-semibold">{estimation.estimateNo}</span>
                    <span className="text-muted-foreground">Revision</span>
                    <span>R{estimation.revisionNumber}</span>
                    <span className="text-muted-foreground">Status</span>
                    <Badge className={`w-fit text-xs ${STATUS_COLORS[estimation.status] || ''}`}>{estimation.status}</Badge>
                    <span className="text-muted-foreground">Valid Until</span>
                    <span>{estimation.validUntil}</span>
                    <span className="text-muted-foreground">Created</span>
                    <span>{estimation.createdAt}</span>
                    {estimation.createdBy && (<><span className="text-muted-foreground">Created By</span><span>{estimation.createdBy}</span></>)}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-border">
                <CardHeader><CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Customer</CardTitle></CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p className="font-semibold text-base">{estimation.customerName}</p>
                  {estimation.status === 'Approved' && estimation.approvedBy && (
                    <p className="text-green-600 text-xs">Approved by {estimation.approvedBy} on {estimation.approvedAt}</p>
                  )}
                  {estimation.status === 'Rejected' && estimation.rejectedBy && (
                    <div>
                      <p className="text-red-600 text-xs">Rejected by {estimation.rejectedBy} on {estimation.rejectedAt}</p>
                      {estimation.rejectionReason && <p className="text-xs mt-1 text-muted-foreground">Reason: {estimation.rejectionReason}</p>}
                    </div>
                  )}
                  {estimation.status === 'Converted' && estimation.convertedOrderId && (
                    <Link href={`/orders/${estimation.convertedOrderId}`} className="text-purple-600 text-xs hover:underline no-print">
                      View converted order →
                    </Link>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Items Table */}
            <Card className="border-2 border-border">
              <CardHeader><CardTitle className="text-base">Items</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-left py-2 pr-3 font-medium">#</th>
                        <th className="text-left py-2 pr-3 font-medium">Product / Part Code</th>
                        <th className="text-center py-2 pr-3 font-medium w-20">Qty</th>
                        <th className="text-right py-2 pr-3 font-medium w-32">Unit Price</th>
                        <th className="text-right py-2 font-medium w-32">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {estimation.items.map((item, index) => (
                        <tr key={item.id} className="border-b last:border-0">
                          <td className="py-3 pr-3 text-muted-foreground">{index + 1}</td>
                          <td className="py-3 pr-3">
                            <p className="font-medium">{item.partCode || item.productName}</p>
                            {item.partCode && item.productName !== item.partCode && (
                              <p className="text-xs text-muted-foreground">{item.productName}</p>
                            )}
                            {item.notes && <p className="text-xs text-muted-foreground italic">{item.notes}</p>}
                          </td>
                          <td className="py-3 pr-3 text-center">{item.quantity}</td>
                          <td className="py-3 pr-3 text-right">₹{item.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="py-3 text-right font-medium">₹{item.totalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t">
                        <td colSpan={4} className="py-2 text-right text-muted-foreground text-sm">Sub Total</td>
                        <td className="py-2 text-right">₹{estimation.subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      {estimation.discountAmount > 0 && (
                        <tr>
                          <td colSpan={4} className="py-1 text-right text-green-600 text-sm">
                            Discount ({estimation.discountType === 'Percent' ? `${estimation.discountValue}%` : `₹${estimation.discountValue} fixed`})
                          </td>
                          <td className="py-1 text-right text-green-600">
                            - ₹{estimation.discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td colSpan={4} className="py-1 text-right text-muted-foreground text-sm">Taxable Amount</td>
                        <td className="py-1 text-right">₹{estimation.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr>
                        <td colSpan={4} className="py-1 text-right text-blue-600 text-sm">GST ({estimation.gstRate}%)</td>
                        <td className="py-1 text-right text-blue-600">₹{estimation.gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr className="border-t-2">
                        <td colSpan={4} className="py-3 text-right font-bold">Grand Total</td>
                        <td className="py-3 text-right font-bold text-lg">
                          ₹{estimation.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Notes & Terms */}
            {(estimation.notes || estimation.termsAndConditions) && (
              <div className="grid sm:grid-cols-2 gap-6">
                {estimation.notes && (
                  <Card className="border-2 border-border no-print">
                    <CardHeader><CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Internal Notes</CardTitle></CardHeader>
                    <CardContent><p className="text-sm text-muted-foreground">{estimation.notes}</p></CardContent>
                  </Card>
                )}
                {estimation.termsAndConditions && (
                  <Card className="border-2 border-border">
                    <CardHeader><CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Terms & Conditions</CardTitle></CardHeader>
                    <CardContent><p className="text-sm text-muted-foreground whitespace-pre-wrap">{estimation.termsAndConditions}</p></CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Print footer */}
            <div className="print-only mt-8 pt-4 border-t text-sm text-muted-foreground">
              <p>This is a computer generated quotation. Valid until {estimation.validUntil}.</p>
              <p className="mt-1">For queries, contact: MultiHitech Engineering</p>
            </div>
          </div>
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject Estimation</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="reason">Reason for rejection</Label>
            <Textarea id="reason" value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="Provide reason for rejecting this estimation..." rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={isActing || !rejectReason.trim()}>
              {isActing ? 'Rejecting...' : 'Reject Estimation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Search Dialog for edit mode */}
      <ProductSearchDialog
        open={productSearchOpen}
        onOpenChange={setProductSearchOpen}
        onSelectProduct={handleProductSelected}
      />
    </>
  )
}
