"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
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

export default function PurchaseOrdersPage() {
  const [pos, setPOs] = useState<PurchaseOrderResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('All')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await purchaseOrderService.getAll()
      setPOs(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load POs')
    } finally {
      setLoading(false)
    }
  }

  const statuses = ['All', 'Draft', 'Sent', 'Cancelled']

  const filtered = pos.filter(po =>
    statusFilter === 'All' || po.status === statusFilter
  )

  const counts = {
    All: pos.length,
    Draft: pos.filter(p => p.status === 'Draft').length,
    Sent: pos.filter(p => p.status === 'Sent').length,
    Cancelled: pos.filter(p => p.status === 'Cancelled').length,
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Purchase Orders</h1>
          <p className="text-muted-foreground text-sm mt-1">Orders sent to vendors for procurement</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statuses.map(s => (
          <Card
            key={s}
            className={`border-2 cursor-pointer transition-colors ${statusFilter === s ? 'border-primary' : 'border-border hover:border-primary/50'}`}
            onClick={() => setStatusFilter(s)}
          >
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{s}</p>
              <p className="text-2xl font-bold">{counts[s as keyof typeof counts] ?? 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card className="border-2 border-border">
        <CardHeader>
          <CardTitle>Purchase Orders ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No purchase orders found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr className="bg-muted border-b">
                    <th className="text-left p-3 font-semibold">PO Number</th>
                    <th className="text-left p-3 font-semibold">Vendor</th>
                    <th className="text-left p-3 font-semibold hidden md:table-cell">PR Number</th>
                    <th className="text-left p-3 font-semibold hidden sm:table-cell">Items</th>
                    <th className="text-left p-3 font-semibold hidden sm:table-cell">Total Amount</th>
                    <th className="text-left p-3 font-semibold">Status</th>
                    <th className="text-left p-3 font-semibold hidden md:table-cell">Created</th>
                    <th className="text-left p-3 font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(po => (
                    <tr key={po.id} className="border-b hover:bg-muted/30">
                      <td className="p-3 font-medium text-xs sm:text-sm">{po.poNumber}</td>
                      <td className="p-3">
                        <p className="font-medium">{po.vendorName}</p>
                        <p className="text-xs text-muted-foreground">{po.vendorCode}</p>
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        {po.prNumber ? (
                          <Link href={`/procurement/purchase-requests/${po.purchaseRequestId}`} className="text-blue-600 hover:underline">
                            {po.prNumber}
                          </Link>
                        ) : '—'}
                      </td>
                      <td className="p-3 hidden sm:table-cell">{po.items.length} item{po.items.length !== 1 ? 's' : ''}</td>
                      <td className="p-3 hidden sm:table-cell">
                        {po.totalAmount != null ? `₹${po.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td className="p-3">
                        <Badge className={STATUS_COLORS[po.status] || 'bg-gray-100 text-gray-700'}>
                          {po.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground hidden md:table-cell">
                        {format(new Date(po.createdAt), 'dd MMM yyyy')}
                      </td>
                      <td className="p-3">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/procurement/purchase-orders/${po.id}`}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
