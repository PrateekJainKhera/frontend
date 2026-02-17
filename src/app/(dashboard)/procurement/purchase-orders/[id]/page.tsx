"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Send, XCircle, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { purchaseOrderService, PurchaseOrderResponse } from '@/lib/api/purchase-orders'
import { toast } from 'sonner'
import { format } from 'date-fns'

const STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-700',
  Sent: 'bg-blue-100 text-blue-700',
  Cancelled: 'bg-red-100 text-red-700',
}

export default function PurchaseOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const poId = parseInt(id)

  const [po, setPO] = useState<PurchaseOrderResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [poId])

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await purchaseOrderService.getById(poId)
      setPO(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load PO')
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    setActionLoading(true)
    try {
      await purchaseOrderService.send(poId)
      toast.success('PO marked as Sent')
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send PO')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this Purchase Order?')) return
    setActionLoading(true)
    try {
      await purchaseOrderService.cancel(poId)
      toast.success('PO cancelled')
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel PO')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>
  if (!po) return <div className="p-8 text-center text-muted-foreground">PO not found</div>

  const totalAmount = po.items.reduce((sum, item) => sum + (item.totalCost ?? 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold">{po.poNumber}</h1>
            <Badge className={STATUS_COLORS[po.status] || 'bg-gray-100 text-gray-700'}>{po.status}</Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            Created on {format(new Date(po.createdAt), 'dd MMM yyyy')}
            {po.createdBy && ` by ${po.createdBy}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={`/procurement/purchase-orders/${poId}/print`}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/procurement/purchase-orders">← Back</Link>
          </Button>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Vendor Info */}
        <Card className="border-2 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Vendor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-semibold text-base">{po.vendorName}</p>
            <p className="text-muted-foreground">{po.vendorCode}</p>
          </CardContent>
        </Card>

        {/* PR Link */}
        <Card className="border-2 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Source</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {po.prNumber ? (
              <>
                <p className="text-muted-foreground">Purchase Request</p>
                <Link href={`/procurement/purchase-requests/${po.purchaseRequestId}`} className="text-blue-600 hover:underline font-medium">
                  {po.prNumber} →
                </Link>
              </>
            ) : (
              <p className="text-muted-foreground">Direct purchase order (no PR)</p>
            )}
            {po.expectedDeliveryDate && (
              <p className="text-muted-foreground mt-2">
                Expected delivery: <span className="text-foreground font-medium">{format(new Date(po.expectedDeliveryDate), 'dd MMM yyyy')}</span>
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {po.notes && (
        <Card className="border-2 border-border">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-muted-foreground mb-1">Notes</p>
            <p className="text-sm">{po.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Items Table */}
      <Card className="border-2 border-border">
        <CardHeader>
          <CardTitle>Items ({po.items.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {/* Mobile: card per item */}
          <div className="block md:hidden divide-y">
            {po.items.map((item, index) => (
              <div key={item.id} className="p-4 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{item.itemName}</p>
                    {item.itemCode && <p className="text-xs text-muted-foreground">{item.itemCode}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">#{index + 1}</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <span className="text-muted-foreground">Qty: <span className="text-foreground font-medium">{item.orderedQty} {item.unit}</span></span>
                  {item.unitCost != null && (
                    <span className="text-muted-foreground">Unit: <span className="text-foreground font-medium">₹{item.unitCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></span>
                  )}
                  {item.totalCost != null && (
                    <span className="text-muted-foreground">Total: <span className="text-foreground font-semibold">₹{item.totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></span>
                  )}
                </div>
              </div>
            ))}
            {totalAmount > 0 && (
              <div className="p-4 bg-muted flex justify-between items-center font-semibold text-sm">
                <span>Total Amount</span>
                <span>₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted border-b">
                  <th className="text-left p-3 font-semibold">#</th>
                  <th className="text-left p-3 font-semibold">Item</th>
                  <th className="text-left p-3 font-semibold">Type</th>
                  <th className="text-left p-3 font-semibold">Ordered Qty</th>
                  <th className="text-right p-3 font-semibold">Unit Cost</th>
                  <th className="text-right p-3 font-semibold">Total Cost</th>
                </tr>
              </thead>
              <tbody>
                {po.items.map((item, index) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-3 text-muted-foreground">{index + 1}</td>
                    <td className="p-3">
                      <p className="font-medium">{item.itemName}</p>
                      {item.itemCode && <p className="text-xs text-muted-foreground">{item.itemCode}</p>}
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-xs">
                        {item.itemType === 'RawMaterial' ? 'Raw Material' : 'Component'}
                      </Badge>
                    </td>
                    <td className="p-3">{item.orderedQty} {item.unit}</td>
                    <td className="p-3 text-right">
                      {item.unitCost != null ? `₹${item.unitCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                    </td>
                    <td className="p-3 text-right font-medium">
                      {item.totalCost != null ? `₹${item.totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              {totalAmount > 0 && (
                <tfoot>
                  <tr className="bg-muted font-semibold">
                    <td colSpan={5} className="p-3 text-right">Total Amount</td>
                    <td className="p-3 text-right">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-end">
        {po.status === 'Draft' && (
          <>
            <Button onClick={handleSend} disabled={actionLoading} className="bg-blue-600 hover:bg-blue-700">
              <Send className="mr-2 h-4 w-4" />
              {actionLoading ? 'Processing...' : 'Mark as Sent'}
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={actionLoading}>
              <XCircle className="mr-2 h-4 w-4" />
              Cancel PO
            </Button>
          </>
        )}
        {po.status === 'Sent' && (
          <Button variant="destructive" onClick={handleCancel} disabled={actionLoading}>
            <XCircle className="mr-2 h-4 w-4" />
            Cancel PO
          </Button>
        )}
      </div>
    </div>
  )
}
