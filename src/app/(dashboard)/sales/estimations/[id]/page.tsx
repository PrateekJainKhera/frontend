"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Printer, CheckCircle, XCircle, RotateCcw, ShoppingCart, Trash2, Send } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { estimationService } from '@/lib/api/estimations'
import { EstimationResponse } from '@/types/estimation'

const STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-700',
  Submitted: 'bg-blue-100 text-blue-700',
  Approved: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
  Cancelled: 'bg-gray-100 text-gray-500',
  Converted: 'bg-purple-100 text-purple-700',
}

export default function EstimationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = parseInt(params.id as string)
  const printRef = useRef<HTMLDivElement>(null)

  const [estimation, setEstimation] = useState<EstimationResponse | null>(null)
  const [loading, setLoading] = useState(true)

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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load estimation')
    } finally {
      setLoading(false)
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
      const updated = await estimationService.approve(estimation.id, { approvedBy: 'Admin' })
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
      const updated = await estimationService.reject(estimation.id, { rejectedBy: 'Admin', reason: rejectReason })
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

  const handlePrint = () => {
    window.print()
  }

  if (loading) return <div className="text-center py-12 text-muted-foreground">Loading...</div>
  if (!estimation) return <div className="text-center py-12 text-muted-foreground">Estimation not found</div>

  return (
    <>
      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white; }
          .print-container { padding: 0; }
        }
        @media screen {
          .print-only { display: none; }
        }
      `}</style>

      <div className="space-y-6">
        {/* Header - no-print */}
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
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              Customer: {estimation.customerName} &nbsp;·&nbsp; Created: {estimation.createdAt}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>

            {estimation.status === 'Draft' && (
              <>
                <Button variant="outline" size="sm" onClick={handleSubmit} disabled={isActing}>
                  <Send className="mr-2 h-4 w-4" /> Submit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive hover:bg-destructive hover:text-white"
                  onClick={handleDelete}
                  disabled={isActing}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </>
            )}

            {estimation.status === 'Submitted' && (
              <>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleApprove}
                  disabled={isActing}
                >
                  <CheckCircle className="mr-2 h-4 w-4" /> Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive"
                  onClick={() => setRejectDialogOpen(true)}
                  disabled={isActing}
                >
                  <XCircle className="mr-2 h-4 w-4" /> Reject
                </Button>
              </>
            )}

            {estimation.status === 'Approved' && (
              <>
                <Button size="sm" onClick={handleConvertToOrder} disabled={isActing}>
                  <ShoppingCart className="mr-2 h-4 w-4" /> Convert to Order
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <Link href={`/sales/estimations/${estimation.id}/revise`}>
                    <RotateCcw className="mr-2 h-4 w-4" /> Revise
                  </Link>
                </Button>
              </>
            )}

            {(estimation.status === 'Rejected' || estimation.status === 'Cancelled') && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/sales/estimations/${estimation.id}/revise`}>
                  <RotateCcw className="mr-2 h-4 w-4" /> Create Revision
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Printable Content */}
        <div ref={printRef} className="print-container">
          {/* Print header */}
          <div className="print-only mb-6 border-b-2 pb-4">
            <h1 className="text-3xl font-bold">QUOTATION</h1>
            <p className="text-muted-foreground">MultiHitech Engineering</p>
          </div>

          {/* Estimation Info */}
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
                    <tr className="border-t-2">
                      <td colSpan={4} className="py-3 text-right font-bold">Total Amount</td>
                      <td className="py-3 text-right font-bold text-lg">
                        ₹{estimation.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Estimation</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="reason">Reason for rejection</Label>
            <Textarea
              id="reason"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Provide reason for rejecting this estimation..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isActing || !rejectReason.trim()}
            >
              {isActing ? 'Rejecting...' : 'Reject Estimation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
