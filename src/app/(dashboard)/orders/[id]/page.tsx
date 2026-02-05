"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, AlertTriangle, CheckCircle2, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { formatDate, formatDateTime } from '@/lib/utils/formatters'
import { Order, OrderStatus, Priority, PlanningStatus, DrawingReviewStatus, OrderSource, SchedulingStrategy } from '@/types'
import { orderService, OrderResponse } from '@/lib/api/orders'
import { productService } from '@/lib/api/products'
import { customerService } from '@/lib/api/customer'
import { getDelayDays, getOrderProgress } from '@/lib/mock-data/orders'
import { RescheduleOrderDialog } from '@/components/dialogs/reschedule-order-dialog'
import { format } from 'date-fns'

export default function OrderDetailPage() {
  const params = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false)

  useEffect(() => {
    loadOrder()
  }, [params.id])

  const mapToOrder = (r: OrderResponse): Order => ({
    id: String(r.id),
    orderNo: r.orderNo,
    customerId: String(r.customerId),
    customer: r.customerName ? { customerName: r.customerName } as any : undefined,
    productId: String(r.productId),
    product: r.productCode ? { partCode: r.productCode, modelName: r.productName } as any : undefined,
    quantity: r.quantity,
    originalQuantity: r.originalQuantity,
    qtyCompleted: r.qtyCompleted,
    qtyRejected: r.qtyRejected,
    qtyInProgress: r.qtyInProgress,
    orderDate: new Date(r.orderDate),
    dueDate: new Date(r.dueDate),
    adjustedDueDate: r.adjustedDueDate ? new Date(r.adjustedDueDate) : null,
    delayReason: r.delayReason as any || null,
    status: r.status as OrderStatus,
    priority: r.priority as Priority,
    planningStatus: r.planningStatus as PlanningStatus,
    drawingReviewStatus: r.drawingReviewStatus as DrawingReviewStatus,
    orderSource: r.orderSource as OrderSource,
    agentCustomerId: r.agentCustomerId ? String(r.agentCustomerId) : undefined,
    agentCommission: r.agentCommission ? Number(r.agentCommission) : undefined,
    schedulingStrategy: r.schedulingStrategy as SchedulingStrategy,
    canReschedule: r.planningStatus !== 'Released',
    createdAt: new Date(r.createdAt),
    updatedAt: r.updatedAt ? new Date(r.updatedAt) : new Date(),
    createdBy: r.createdBy || '',
  })

  const loadOrder = async () => {
    setLoading(true)
    try {
      const data = await orderService.getById(Number(params.id))
      const mapped = mapToOrder(data)

      // Load full product details
      try {
        const product = await productService.getById(data.productId)
        mapped.product = product as any
      } catch {}

      // Load agent customer if order is through agent
      if (data.agentCustomerId) {
        try {
          const agent = await customerService.getById(data.agentCustomerId)
          mapped.agentCustomer = agent as any
        } catch {}
      }

      setOrder(mapped)

    } catch (err) {
      console.error('Failed to load order:', err)
      setOrder(null)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Order not found</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/orders">Back to Orders</Link>
        </Button>
      </div>
    )
  }

  const progress = getOrderProgress(order)
  const delayDays = getDelayDays(order)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/orders">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-primary">{order.orderNo}</h1>
            <Badge variant={
              order.status === 'Completed' ? 'default' :
              order.status === 'In Progress' ? 'secondary' :
              'outline'
            }>
              {order.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">{order.customer?.customerName}</p>
        </div>
        <div className="flex gap-2">
          {order.canReschedule && order.status !== 'Completed' && (
            <Button onClick={() => setRescheduleDialogOpen(true)}>
              <Calendar className="mr-2 h-4 w-4" />
              Reschedule
            </Button>
          )}
          <Button variant="outline">Edit Order</Button>
        </div>
      </div>

      {/* Reschedule Warning */}
      {!order.canReschedule && order.status !== 'Completed' && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This order cannot be rescheduled - production has started (job cards active)
          </AlertDescription>
        </Alert>
      )}

      {/* Delay Alert */}
      {delayDays > 5 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This order is delayed by {delayDays} days
            {order.delayReason && ` due to: ${order.delayReason}`}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Information */}
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Part Code</p>
                  <p className="font-mono font-bold text-lg">{order.product?.partCode}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Model</p>
                  <p className="font-semibold">{order.product?.modelName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Roller Type</p>
                  <p className="font-semibold">{order.product?.rollerType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dimensions</p>
                  <p className="font-semibold">
                    ⌀{order.product?.diameter} × {order.product?.length}mm
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Material Grade</p>
                  <p className="font-semibold">{order.product?.materialGrade}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Drawing No</p>
                  <p className="font-mono text-sm">{order.product?.drawingNo}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle>Current Production Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Current Process</p>
                  <p className="font-bold text-blue-900">
                    {order.currentProcess || 'Not Started'}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Machine</p>
                  <p className="font-bold text-green-900">
                    {order.currentMachine || '-'}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Operator</p>
                  <p className="font-bold text-purple-900">
                    {order.currentOperator || '-'}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold">Production Progress</p>
                  <p className="text-sm text-muted-foreground">
                    {order.qtyCompleted} / {order.quantity} pcs
                  </p>
                </div>
                <Progress value={progress} className="h-3" />
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round(progress)}% Complete
                </p>
              </div>

              {order.qtyRejected > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{order.qtyRejected} units rejected</strong>
                    <br />
                    Original quantity adjusted from {order.originalQuantity} to {order.quantity} pcs
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Process History (Placeholder) */}
          <Card>
            <CardHeader>
              <CardTitle>Process Timeline</CardTitle>
              <CardDescription>Production history and checkpoints</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Timeline would go here - using placeholder for now */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    </div>
                    <div className="w-0.5 h-12 bg-muted"></div>
                  </div>
                  <div className="flex-1 pb-8">
                    <p className="font-semibold">Order Created</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(order.createdAt)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      By {order.createdBy}
                    </p>
                  </div>
                </div>

                {order.currentProcess && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center animate-pulse">
                        <Clock className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{order.currentProcess}</p>
                      <p className="text-sm text-muted-foreground">In Progress</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {order.currentMachine} • {order.currentOperator}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quantity Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quantity Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Total Ordered</span>
                </div>
                <span className="font-bold">{order.originalQuantity}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-900">Completed</span>
                </div>
                <span className="font-bold text-green-900">{order.qtyCompleted}</span>
              </div>
              {order.qtyRejected > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-900">Rejected</span>
                  </div>
                  <span className="font-bold text-red-900">{order.qtyRejected}</span>
                </div>
              )}
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-900">Pending</span>
                </div>
                <span className="font-bold text-blue-900">{order.qtyInProgress}</span>
              </div>
            </CardContent>
          </Card>

          {/* Order Source & Agent */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Source</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Source:</span>
                <Badge variant={order.orderSource === 'Direct' ? 'default' : 'secondary'}>
                  {order.orderSource}
                </Badge>
              </div>
              {order.orderSource === 'Through Agent' && order.agentCustomer && (
                <>
                  <Separator />
                  <div>
                    <p className="text-muted-foreground mb-1">Agent:</p>
                    <p className="font-semibold">{order.agentCustomer.customerName}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {order.agentCustomer.contactPerson}
                    </p>
                  </div>
                  {order.agentCommission && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Commission</p>
                      <p className="text-lg font-bold text-green-700">
                        ₹{order.agentCommission.toLocaleString('en-IN')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Agent/Distributor
                      </p>
                    </div>
                  )}
                </>
              )}
              {order.schedulingStrategy && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Scheduling:</span>
                    <Badge variant="outline" className="text-xs">
                      {order.schedulingStrategy}
                    </Badge>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Drawing Review Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Drawing Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge variant={
                  order.drawingReviewStatus === 'Approved' ? 'default' :
                  order.drawingReviewStatus === 'Needs Revision' ? 'destructive' : 'secondary'
                }>
                  {order.drawingReviewStatus}
                </Badge>
              </div>
              {order.drawingReviewStatus !== 'Approved' && (
                <Button asChild variant="outline" className="w-full mt-2">
                  <Link href={`/drawing-review/review/${order.id}`}>
                    Go to Drawing Review
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Order Date:</span>
                <span className="font-semibold">{formatDate(order.orderDate)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Original Due:</span>
                <span className="font-semibold">{formatDate(order.dueDate)}</span>
              </div>
              {order.adjustedDueDate && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Adjusted Due:</span>
                  <span className="font-semibold text-amber-600">
                    {formatDate(order.adjustedDueDate)}
                  </span>
                </div>
              )}
              {order.rescheduleHistory && order.rescheduleHistory.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-muted-foreground mb-2">Reschedule History:</p>
                    <div className="space-y-2">
                      {order.rescheduleHistory.map((history) => (
                        <div key={history.id} className="p-2 bg-amber-50 rounded text-xs">
                          <p className="font-semibold text-amber-900">{history.reason}</p>
                          <p className="text-amber-700 mt-1">
                            {format(new Date(history.oldDueDate), 'PP')} → {format(new Date(history.newDueDate), 'PP')}
                          </p>
                          <p className="text-amber-600 mt-1">
                            By {history.rescheduledByName} on {format(new Date(history.rescheduledAt), 'PP')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Priority:</span>
                <Badge variant={order.priority === 'Urgent' ? 'destructive' : 'outline'}>
                  {order.priority}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full">
                <Calendar className="mr-2 h-4 w-4" />
                Extend Due Date
              </Button>
              <Button variant="outline" className="w-full">
                View Process Flow
              </Button>
              <Button variant="outline" className="w-full">
                Download Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reschedule Dialog */}
      {order && (
        <RescheduleOrderDialog
          order={order}
          open={rescheduleDialogOpen}
          onOpenChange={setRescheduleDialogOpen}
          onSuccess={loadOrder}
        />
      )}

    </div>
  )
}
