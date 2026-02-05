'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FileText, CheckCircle2, Clock, AlertTriangle, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { orderService, OrderResponse } from '@/lib/api/orders'
import { formatDate } from '@/lib/utils/formatters'

export default function DrawingReviewDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<OrderResponse[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await orderService.getAll()
      setOrders(data)
    } catch (err) {
      console.error('Failed to load orders:', err)
    }
    setLoading(false)
  }

  // Filter orders by drawing review status
  const pendingReviewOrders = orders.filter(order =>
    order.drawingReviewStatus === 'Pending' &&
    (order.status === 'Pending' || order.status === 'In Progress')
  )

  const inReviewOrders = orders.filter(order =>
    order.drawingReviewStatus === 'In Review'
  )

  const needsRevisionOrders = orders.filter(order =>
    order.drawingReviewStatus === 'Needs Revision'
  )

  const approvedOrders = orders.filter(order =>
    order.drawingReviewStatus === 'Approved'
  )

  // Stats
  const stats = {
    totalPending: pendingReviewOrders.length,
    inReview: inReviewOrders.length,
    needsRevision: needsRevisionOrders.length,
    approved: approvedOrders.length
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Badge variant="outline" className="border-gray-500 text-gray-700">Pending</Badge>
      case 'In Review':
        return <Badge variant="outline" className="border-blue-500 text-blue-700">In Review</Badge>
      case 'Approved':
        return <Badge variant="outline" className="border-green-500 text-green-700">Approved</Badge>
      case 'Needs Revision':
        return <Badge variant="outline" className="border-orange-500 text-orange-700">Needs Revision</Badge>
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <AlertTriangle className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPending}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Review</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inReview}</div>
            <p className="text-xs text-muted-foreground">Currently reviewing</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Revision</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.needsRevision}</div>
            <p className="text-xs text-muted-foreground">Requires changes</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">Ready for planning</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Review Orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Orders Pending Drawing Review</CardTitle>
              <CardDescription>
                New orders awaiting drawing review and template linkage
              </CardDescription>
            </div>
            <Badge variant="outline">
              {pendingReviewOrders.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {pendingReviewOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-600" />
              <p>All orders have been reviewed!</p>
              <p className="text-sm mt-1">No orders awaiting drawing review</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingReviewOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold">{order.orderNo}</p>
                      <Badge variant={order.priority === 'Urgent' ? 'destructive' : 'outline'}>
                        {order.priority}
                      </Badge>
                      {getStatusBadge(order.drawingReviewStatus)}
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Customer:</span>
                        <span className="ml-2">{order.customerName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Product:</span>
                        <span className="ml-2">{order.productName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Quantity:</span>
                        <span className="ml-2">{order.quantity} pcs</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Due Date:</span>
                        <span className="ml-2">{formatDate(order.dueDate)}</span>
                      </div>
                    </div>
                  </div>
                  <Link href={`/drawing-review/review/${order.id}`}>
                    <Button>
                      <Eye className="mr-2 h-4 w-4" />
                      Review Drawing
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* In Review Orders */}
      {inReviewOrders.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Orders In Review</CardTitle>
                <CardDescription>
                  Currently being reviewed by engineering team
                </CardDescription>
              </div>
              <Badge variant="outline">
                {inReviewOrders.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inReviewOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold">{order.orderNo}</p>
                      <Badge variant={order.priority === 'Urgent' ? 'destructive' : 'outline'}>
                        {order.priority}
                      </Badge>
                      {getStatusBadge(order.drawingReviewStatus)}
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Customer:</span>
                        <span className="ml-2">{order.customerName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Product:</span>
                        <span className="ml-2">{order.productName}</span>
                      </div>
                      {order.drawingReviewNotes && (
                        <div className="col-span-3">
                          <span className="text-muted-foreground">Notes:</span>
                          <span className="ml-2 text-xs">{order.drawingReviewNotes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Link href={`/drawing-review/review/${order.id}`}>
                    <Button variant="outline">
                      <Eye className="mr-2 h-4 w-4" />
                      Continue Review
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Needs Revision Orders */}
      {needsRevisionOrders.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Orders Needing Revision</CardTitle>
                <CardDescription>
                  Drawings require modifications before approval
                </CardDescription>
              </div>
              <Badge variant="destructive">
                {needsRevisionOrders.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {needsRevisionOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold">{order.orderNo}</p>
                      <Badge variant={order.priority === 'Urgent' ? 'destructive' : 'outline'}>
                        {order.priority}
                      </Badge>
                      {getStatusBadge(order.drawingReviewStatus)}
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Customer:</span>
                        <span className="ml-2">{order.customerName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Product:</span>
                        <span className="ml-2">{order.productName}</span>
                      </div>
                      {order.drawingReviewNotes && (
                        <div className="col-span-3">
                          <span className="text-muted-foreground">Revision Notes:</span>
                          <span className="ml-2 text-xs text-orange-700">{order.drawingReviewNotes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Link href={`/drawing-review/review/${order.id}`}>
                    <Button variant="outline">
                      View Details
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recently Approved Orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recently Approved Orders</CardTitle>
              <CardDescription>
                Drawings approved and ready for planning
              </CardDescription>
            </div>
            <Badge variant="outline">
              {approvedOrders.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {approvedOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3" />
              <p>No approved orders yet</p>
              <p className="text-sm mt-1">Review and approve orders above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {approvedOrders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold">{order.orderNo}</p>
                      <Badge variant="outline">{order.customerName}</Badge>
                      {getStatusBadge(order.drawingReviewStatus)}
                      {order.linkedProductTemplateId && (
                        <Badge variant="secondary" className="text-xs">
                          Template Linked
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Product:</span>
                        <span className="ml-2">{order.productName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Reviewed By:</span>
                        <span className="ml-2">{order.drawingReviewedBy || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/drawing-review/review/${order.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                    <Link href={`/orders/${order.id}`}>
                      <Button variant="outline" size="sm">
                        View Order
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
