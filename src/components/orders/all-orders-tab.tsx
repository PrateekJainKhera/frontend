"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Order, OrderStatus, OrderSource, Priority, PlanningStatus, DrawingReviewStatus, SchedulingStrategy } from '@/types'
import { OrdersTable } from '@/components/tables/orders-table'
import { orderService, OrderResponse } from '@/lib/api/orders'
import { toast } from 'sonner'

export function AllOrdersTab() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    loadOrders()
  }, [])

  const expandOrder = (r: OrderResponse): Order[] => {
    const baseFields = {
      id: String(r.id),
      customerId: String(r.customerId),
      customer: r.customerName ? { customerName: r.customerName } as any : undefined,
      orderDate: new Date(r.orderDate),
      delayReason: r.delayReason as any || null,
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
    }

    // Multi-product order: expand into one row per item with -A/-B/-C suffix
    if (r.items && r.items.length > 0) {
      return r.items.map(item => ({
        ...baseFields,
        orderNo: `${r.orderNo}-${item.itemSequence}`,
        productId: String(item.productId),
        product: { partCode: item.partCode ?? '', modelName: item.productName ?? '', numberOfTeeth: item.numberOfTeeth ?? 0 } as any,
        quantity: item.quantity,
        originalQuantity: item.originalQuantity,
        qtyCompleted: item.qtyCompleted,
        qtyRejected: item.qtyRejected,
        qtyInProgress: item.qtyInProgress,
        qtyDispatched: item.qtyDispatched ?? 0,
        dueDate: new Date(item.dueDate),
        adjustedDueDate: item.adjustedDueDate ? new Date(item.adjustedDueDate) : null,
        status: item.status as OrderStatus,
        priority: item.priority as Priority,
        _itemId: item.id,
        _totalItems: r.items!.length,
      }))
    }

    // Single-product order
    return [{
      ...baseFields,
      orderNo: r.orderNo,
      productId: String(r.productId),
      product: { partCode: r.productCode ?? '', modelName: r.productName ?? '', numberOfTeeth: r.numberOfTeeth ?? 0 } as any,
      quantity: r.quantity,
      originalQuantity: r.originalQuantity,
      qtyCompleted: r.qtyCompleted,
      qtyRejected: r.qtyRejected,
      qtyInProgress: r.qtyInProgress,
      qtyDispatched: r.qtyDispatched ?? 0,
      dueDate: new Date(r.dueDate),
      adjustedDueDate: r.adjustedDueDate ? new Date(r.adjustedDueDate) : null,
      status: r.status as OrderStatus,
      priority: r.priority as Priority,
    }]
  }

  const loadOrders = async () => {
    setLoading(true)
    try {
      const data = await orderService.getAll()
      setOrders(data.flatMap(expandOrder))

    } catch (err) {
      console.error('Failed to load orders:', err)
    }
    setLoading(false)
  }

  const handleDelete = async (order: Order) => {
    const isMultiItemRow = !!order._itemId
    const msg = isMultiItemRow
      ? `Delete item ${order.orderNo}? This cannot be undone.`
      : `Delete order ${order.orderNo}? This cannot be undone.`
    if (!confirm(msg)) return
    try {
      if (isMultiItemRow) {
        await orderService.deleteOrderItem(Number(order.id), order._itemId!)
        toast.success(`Item ${order.orderNo} deleted`)
      } else {
        await orderService.delete(Number(order.id))
        toast.success('Order deleted')
      }
      loadOrders()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete')
    }
  }

  const handleEdit = (orderId: string) => {
    router.push(`/orders/${orderId}/edit`)
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer?.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.product?.modelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.product?.partCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.agentCustomer?.customerName.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesSource =
      sourceFilter === 'all' || order.orderSource === sourceFilter

    return matchesSearch && matchesSource
  })

  // Derive effective status from quantity fields (DB status may be stale)
  const getEffectiveStatus = (o: Order): string => {
    const dispatched = o.qtyDispatched ?? 0
    if (dispatched >= o.quantity && o.quantity > 0) return 'Completed'
    if (o.qtyCompleted >= o.quantity && o.quantity > 0) return 'Ready to Dispatch'
    if ((o.qtyInProgress ?? 0) > 0 || (o.qtyCompleted ?? 0) > 0) return 'In Progress'
    return o.status
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-4">
          <p className="text-sm text-muted-foreground">Total Orders</p>
          <p className="text-2xl font-bold">{orders.length}</p>
        </Card>
        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-4">
          <p className="text-sm text-muted-foreground">In Progress</p>
          <p className="text-2xl font-bold text-blue-600">
            {orders.filter((o) => getEffectiveStatus(o) === 'In Progress').length}
          </p>
        </Card>
        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-4">
          <p className="text-sm text-muted-foreground">Completed</p>
          <p className="text-2xl font-bold text-green-600">
            {orders.filter((o) => getEffectiveStatus(o) === 'Completed').length}
          </p>
        </Card>
        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-4">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-amber-600">
            {orders.filter((o) => getEffectiveStatus(o) === 'Pending').length}
          </p>
        </Card>
      </div>

      {/* Tabs + Search on same row — same format as /masters/products */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList className="grid max-w-xl grid-cols-4">
            <TabsTrigger value="all">All Orders</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="ready">Ready to Dispatch</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 flex-1 max-w-lg">
            <div className="flex items-center gap-2 bg-background border-2 border-border rounded-lg px-4 py-1 shadow-sm flex-1">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                placeholder="Search order, customer, product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-0 shadow-none focus-visible:ring-0 h-8 px-0 text-sm flex-1 placeholder:text-muted-foreground/40 focus:placeholder:text-transparent caret-foreground"
              />
            </div>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {Object.values(OrderSource).map((source) => (
                  <SelectItem key={source} value={source}>{source}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 mt-4">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : (
          <>
            <TabsContent value="all" className="mt-4">
              <OrdersTable orders={filteredOrders} onDelete={handleDelete} onEdit={handleEdit} />
            </TabsContent>

            <TabsContent value="pending" className="mt-4">
              <OrdersTable
                orders={filteredOrders.filter(o => getEffectiveStatus(o) === 'Pending')}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            </TabsContent>

            <TabsContent value="ready" className="mt-4">
              <OrdersTable
                orders={filteredOrders.filter(o => getEffectiveStatus(o) === 'Ready to Dispatch')}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            </TabsContent>

            <TabsContent value="completed" className="mt-4">
              <OrdersTable
                orders={filteredOrders.filter(o => getEffectiveStatus(o) === 'Completed')}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  )
}
