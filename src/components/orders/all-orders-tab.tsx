"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Filter, Truck, ChevronDown, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
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
  const [dispatchedOrderNos, setDispatchedOrderNos] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [showDispatched, setShowDispatched] = useState(false)

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

      // Track which expanded order rows are fully dispatched
      const dispatched = new Set<string>()
      data.forEach(r => {
        if (r.items && r.items.length > 0) {
          r.items.forEach(item => {
            if (item.qtyDispatched > 0 && item.qtyDispatched >= item.quantity) {
              dispatched.add(`${r.orderNo}-${item.itemSequence}`)
            }
          })
        } else {
          if (r.qtyDispatched > 0 && r.qtyDispatched >= r.quantity) {
            dispatched.add(r.orderNo)
          }
        }
      })
      setDispatchedOrderNos(dispatched)
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

    const matchesStatus =
      statusFilter === 'all' || order.status === statusFilter

    const matchesSource =
      sourceFilter === 'all' || order.orderSource === sourceFilter

    return matchesSearch && matchesStatus && matchesSource
  })

  const activeOrders = filteredOrders.filter(o => !dispatchedOrderNos.has(o.orderNo))
  const dispatchedOrders = filteredOrders.filter(o => dispatchedOrderNos.has(o.orderNo))

  // Derive effective status from quantity fields (DB status may be stale)
  const getEffectiveStatus = (o: Order): string => {
    if (o.qtyDispatched >= o.quantity && o.quantity > 0) return 'Completed'
    if (o.qtyCompleted >= o.quantity && o.quantity > 0) return 'Ready to Dispatch'
    if ((o.qtyInProgress ?? 0) > 0 || (o.qtyCompleted ?? 0) > 0) return 'In Progress'
    return o.status
  }

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order number, customer, or product name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-45">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.values(OrderStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-45">
                <SelectValue placeholder="Order source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {Object.values(OrderSource).map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

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

      {/* Active Orders Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : (
        <OrdersTable orders={activeOrders} onDelete={handleDelete} onEdit={handleEdit} />
      )}

      {/* Dispatched Orders — collapsible */}
      {!loading && dispatchedOrders.length > 0 && (
        <div>
          <button
            onClick={() => setShowDispatched(v => !v)}
            className="w-full flex items-center gap-2 px-4 py-3 rounded-lg border border-green-200 bg-green-50 text-green-800 text-sm font-medium hover:bg-green-100 transition-colors"
          >
            {showDispatched ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <Truck className="h-4 w-4" />
            Dispatched Orders ({dispatchedOrders.length})
          </button>
          {showDispatched && (
            <div className="mt-2">
              <OrdersTable orders={dispatchedOrders} onDelete={handleDelete} onEdit={handleEdit} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
