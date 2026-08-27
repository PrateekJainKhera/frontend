"use client"

import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, AlertTriangle, CheckCircle2, Package, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { formatDate, formatDateTime } from '@/lib/utils/formatters'
import { stageMeta } from '@/lib/utils/workflow-stage'
import { cn } from '@/lib/utils/cn'
import { Order, OrderStatus, Priority, PlanningStatus, DrawingReviewStatus } from '@/types'
import { orderService, OrderResponse, OrderItemResponse } from '@/lib/api/orders'
import { productService } from '@/lib/api/products'
import { Product } from '@/types/product'

import { getDelayDays, getOrderProgress } from '@/lib/utils/order-helpers'
import { RescheduleOrderDialog } from '@/components/dialogs/reschedule-order-dialog'
import { format } from 'date-fns'

export default function OrderDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [order, setOrder] = useState<Order | null>(null)
  const [orderResponse, setOrderResponse] = useState<OrderResponse | null>(null)
  const [activeProduct, setActiveProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false)

  // Which item sequence is selected (e.g. 'A', 'B', or null for legacy single)
  const itemParam = searchParams.get('item')

  useEffect(() => {
    loadOrder()
  }, [params.id])

  // When item param or order changes, load the right product
  useEffect(() => {
    if (!orderResponse) return
    loadActiveProduct(orderResponse)
  }, [itemParam, orderResponse])

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
    qtyDispatched: r.qtyDispatched ?? 0,
    orderDate: new Date(r.orderDate),
    dueDate: new Date(r.dueDate),
    adjustedDueDate: r.adjustedDueDate ? new Date(r.adjustedDueDate) : null,
    delayReason: r.delayReason as any || null,
    status: r.status as OrderStatus,
    priority: r.priority as Priority,
    workflowStage: r.workflowStage,
    planningStatus: r.planningStatus as PlanningStatus,
    drawingReviewStatus: r.drawingReviewStatus as DrawingReviewStatus,
    orderSource: r.orderSource as any,
    canReschedule: r.planningStatus !== 'Released',
    createdAt: new Date(r.createdAt),
    updatedAt: r.updatedAt ? new Date(r.updatedAt) : new Date(),
    createdBy: r.createdBy || '',
  })

  const loadOrder = async () => {
    setLoading(true)
    try {
      const data = await orderService.getById(Number(params.id))
      setOrderResponse(data)
      setOrder(mapToOrder(data))
    } catch (err) {
      console.error('Failed to load order:', err)
      setOrder(null)
    }
    setLoading(false)
  }

  const loadActiveProduct = async (data: OrderResponse) => {
    try {
      const isMulti = data.items && data.items.length > 0
      let productId: number

      if (isMulti) {
        // Find item by sequence param, default to first item
        const seq = itemParam || data.items![0].itemSequence
        const item = data.items!.find(i => i.itemSequence === seq) ?? data.items![0]
        productId = item.productId
      } else {
        productId = data.productId
      }

      const product = await productService.getById(productId)
      setActiveProduct(product)
    } catch {
      setActiveProduct(null)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete order ${orderResponse?.orderNo}? This cannot be undone.`)) return
    setDeleting(true)
    try {
      await orderService.delete(Number(params.id))
      router.push('/orders')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete order')
      setDeleting(false)
    }
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

  if (!order || !orderResponse) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Order not found</p>
        <Button asChild className="mt-4">
          <Link href="/orders">Back to Orders</Link>
        </Button>
      </div>
    )
  }

  const isMultiItem = !!(orderResponse.items && orderResponse.items.length > 0)
  const hasMultipleItems = !!(orderResponse.items && orderResponse.items.length > 1)
  const activeSeq = itemParam || (isMultiItem ? orderResponse.items![0].itemSequence : null)

  // Active item for quantities / dates / status
  const activeItem: OrderItemResponse | null = isMultiItem
    ? (orderResponse.items!.find(i => i.itemSequence === activeSeq) ?? orderResponse.items![0])
    : null

  // Quantities to show (item-specific for multi, root for legacy)
  const qty = activeItem ?? {
    quantity: orderResponse.quantity,
    originalQuantity: orderResponse.originalQuantity,
    qtyCompleted: orderResponse.qtyCompleted,
    qtyRejected: orderResponse.qtyRejected,
    qtyInProgress: orderResponse.qtyInProgress,
    status: orderResponse.status,
    priority: orderResponse.priority,
    dueDate: orderResponse.dueDate,
    adjustedDueDate: orderResponse.adjustedDueDate,
  }

  const qtyProgress = qty.quantity > 0 ? Math.round((qty.qtyCompleted / qty.quantity) * 100) : 0

  const delayDays = getDelayDays(order)

  // Display order number (show -A suffix for multi-item)
  const displayOrderNo = isMultiItem && activeSeq
    ? `${orderResponse.orderNo}-${activeSeq}`
    : orderResponse.orderNo

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/orders">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-primary">{displayOrderNo}</h1>
            {(() => {
              const meta = stageMeta(order.workflowStage || qty.status)
              return <Badge variant="outline" className={cn('font-medium', meta.className)}>{meta.label}</Badge>
            })()}
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
          <Button variant="outline" asChild>
            <Link href={`/orders/${params.id}/edit`}>Edit Order</Link>
          </Button>
        </div>
      </div>

      {/* Item selector — only for multi-item orders */}
      {isMultiItem && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Item:</span>
          {orderResponse.items!.map(item => (
            <button
              key={item.itemSequence}
              onClick={() => router.push(`/orders/${params.id}?item=${item.itemSequence}`)}
              className={`px-3 py-1 rounded-full text-sm font-mono font-semibold border transition-colors ${
                activeSeq === item.itemSequence
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border hover:border-primary hover:text-primary'
              }`}
            >
              {item.itemSequence}
              {item.partCode && <span className="ml-1 font-normal text-xs opacity-70">{item.partCode}</span>}
            </button>
          ))}
        </div>
      )}

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

          {/* Product Information — original format */}
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeProduct ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Part Code</p>
                    <p className="font-mono font-bold text-lg">{activeProduct.partCode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Model</p>
                    <p className="font-semibold">{activeProduct.modelName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Roller Type</p>
                    <p className="font-semibold">{activeProduct.rollerType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Dimensions</p>
                    <p className="font-semibold">
                      ⌀{activeProduct.diameter} × {activeProduct.length}mm
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Number of Teeth</p>
                    <p className="font-semibold">
                      {activeProduct.numberOfTeeth > 0 ? `${activeProduct.numberOfTeeth}T` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Material Grade</p>
                    <p className="font-semibold">{activeProduct.materialGrade}</p>
                  </div>
                  {activeProduct.surfaceFinish && (
                    <div>
                      <p className="text-sm text-muted-foreground">Surface Finish</p>
                      <p className="font-semibold">{activeProduct.surfaceFinish}</p>
                    </div>
                  )}
                  {activeProduct.hardness && (
                    <div>
                      <p className="text-sm text-muted-foreground">Hardness</p>
                      <p className="font-semibold">{activeProduct.hardness}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Drawing No</p>
                    <p className="font-mono text-sm">{activeProduct.drawingNo || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Drawing Review</p>
                    <p className="font-semibold">{activeProduct.drawingReviewStatus}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-5 w-40" />
                </div>
              )}
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
                    {qty.qtyCompleted} / {qty.quantity} pcs
                  </p>
                </div>
                <Progress value={qtyProgress} className="h-3" />
                <p className="text-xs text-muted-foreground mt-1">
                  {qtyProgress}% Complete
                </p>
              </div>

              {qty.qtyRejected > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{qty.qtyRejected} units rejected</strong>
                    <br />
                    Original quantity adjusted from {qty.originalQuantity} to {qty.quantity} pcs
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Process Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Process Timeline</CardTitle>
              <CardDescription>Production history and checkpoints</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
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
                <span className="font-bold">{qty.originalQuantity}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-900">Completed</span>
                </div>
                <span className="font-bold text-green-900">{qty.qtyCompleted}</span>
              </div>
              {qty.qtyRejected > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-900">Rejected</span>
                  </div>
                  <span className="font-bold text-red-900">{qty.qtyRejected}</span>
                </div>
              )}
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-900">Pending</span>
                </div>
                <span className="font-bold text-blue-900">{qty.qtyInProgress}</span>
              </div>
            </CardContent>
          </Card>

          {/* Drawing Review Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Drawing Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeProduct ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge variant={
                      activeProduct.drawingReviewStatus === 'Approved' ? 'default' :
                      activeProduct.drawingReviewStatus === 'RevisionRequired' ? 'destructive' : 'secondary'
                    }>
                      {activeProduct.drawingReviewStatus}
                    </Badge>
                  </div>
                  {activeProduct.drawingReviewedBy && (
                    <p className="text-xs text-muted-foreground">
                      Reviewed by: {activeProduct.drawingReviewedBy}
                    </p>
                  )}
                  <Button asChild variant="outline" className="w-full mt-2">
                    <Link href={`/drawing-review/products/${activeProduct.id}`}>
                      Go to Drawing Review
                    </Link>
                  </Button>
                </>
              ) : (
                <Skeleton className="h-8 w-full" />
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
                <span className="text-muted-foreground">Due Date:</span>
                <span className="font-semibold">{formatDate(qty.dueDate)}</span>
              </div>
              {qty.adjustedDueDate && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Adjusted Due:</span>
                  <span className="font-semibold text-amber-600">
                    {formatDate(qty.adjustedDueDate)}
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
                <Badge variant={qty.priority === 'Urgent' ? 'destructive' : 'outline'}>
                  {qty.priority}
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
              {hasMultipleItems ? (
                <>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/orders/${params.id}/edit`}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete an Item
                    </Link>
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Open Edit Order to remove individual items
                  </p>
                </>
              ) : (
                <>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleDelete}
                    disabled={deleting || order.status === 'In Progress' || order.status === 'Completed'}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {deleting ? 'Deleting...' : 'Delete Order'}
                  </Button>
                  {(order.status === 'In Progress' || order.status === 'Completed') && (
                    <p className="text-xs text-muted-foreground text-center">
                      Cannot delete — production has started
                    </p>
                  )}
                </>
              )}
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
