"use client"

import { useState, useEffect } from 'react'
import { Search, Filter } from 'lucide-react'
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

export function AllOrdersTab() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')

  useEffect(() => {
    loadOrders()
  }, [])

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

  const loadOrders = async () => {
    setLoading(true)
    try {
      const data = await orderService.getAll()
      setOrders(data.map(mapToOrder))
    } catch (err) {
      console.error('Failed to load orders:', err)
    }
    setLoading(false)
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer?.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.product?.partCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.agentCustomer?.customerName.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      statusFilter === 'all' || order.status === statusFilter

    const matchesSource =
      sourceFilter === 'all' || order.orderSource === sourceFilter

    return matchesSearch && matchesStatus && matchesSource
  })

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order number, customer, or part code..."
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
            {orders.filter((o) => o.status === OrderStatus.IN_PROGRESS).length}
          </p>
        </Card>
        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-4">
          <p className="text-sm text-muted-foreground">Completed</p>
          <p className="text-2xl font-bold text-green-600">
            {orders.filter((o) => o.status === OrderStatus.COMPLETED).length}
          </p>
        </Card>
        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-4">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-amber-600">
            {orders.filter((o) => o.status === OrderStatus.PENDING).length}
          </p>
        </Card>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : (
        <OrdersTable orders={filteredOrders} />
      )}
    </div>
  )
}
