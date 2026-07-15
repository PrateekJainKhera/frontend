"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Tabs } from '@/components/ui/tabs'
import { WORKFLOW_STAGES, stageSlug } from '@/lib/utils/workflow-stage'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Order, OrderStatus, OrderSource, Priority, PlanningStatus, DrawingReviewStatus, SchedulingStrategy } from '@/types'
import { OrdersTable } from '@/components/tables/orders-table'
import { orderService, OrderResponse, OrderSummary, OrderColumnFilters } from '@/lib/api/orders'
import { toast } from 'sonner'

const PAGE_SIZES = [10, 25, 50, 100]

// Map a UI tab to the backend status filter
// Tab value is already the API stage slug (see WORKFLOW_STAGES); 'all' clears the filter.
const tabToStatus = (tab: string): string => (tab === 'all' ? '' : tab)

export function AllOrdersTab() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [summary, setSummary] = useState<OrderSummary>({ total: 0, pending: 0, inProgress: 0, readyToDispatch: 0, completed: 0 })
  const [loading, setLoading] = useState(true)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')            // debounced value sent to server
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [colInput, setColInput] = useState<OrderColumnFilters>({})   // live per-column filter inputs
  const [colFilters, setColFilters] = useState<OrderColumnFilters>({}) // debounced value sent to server
  const [activeTab, setActiveTab] = useState('all')

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

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

    if (r.items && r.items.length > 0) {
      return r.items.map(item => ({
        ...baseFields,
        orderNo: `${r.orderNo}-${item.itemSequence}`,
        productId: String(item.productId),
        product: { partCode: item.partCode ?? '', modelName: item.productName ?? '', rollerType: item.rollerType ?? '', numberOfTeeth: item.numberOfTeeth ?? 0 } as any,
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
        workflowStage: r.workflowStage,
        _itemId: item.id,
        _totalItems: r.items!.length,
      }))
    }

    return [{
      ...baseFields,
      orderNo: r.orderNo,
      productId: String(r.productId),
      product: { partCode: r.productCode ?? '', modelName: r.productName ?? '', rollerType: r.rollerType ?? '', numberOfTeeth: r.numberOfTeeth ?? 0 } as any,
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
      workflowStage: r.workflowStage,
    }]
  }

  // Debounce the search box → server search, reset to page 1
  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 400)
    return () => clearTimeout(id)
  }, [searchInput])

  // Debounce the per-column filter row + source dropdown → server filters, reset to page 1
  useEffect(() => {
    const id = setTimeout(() => {
      setColFilters({ ...colInput, source: sourceFilter !== 'all' ? sourceFilter : undefined })
      setPage(1)
    }, 400)
    return () => clearTimeout(id)
  }, [colInput, sourceFilter])

  // Guards against out-of-order responses: two debounced effects (search + column
  // filters) can fire overlapping requests, and a slower earlier one could otherwise
  // overwrite the newest results. Only the latest request is allowed to apply.
  const reqSeq = useRef(0)
  const loadPage = useCallback(async () => {
    const mySeq = ++reqSeq.current
    setLoading(true)
    try {
      const res = await orderService.getPaged(page, pageSize, search, tabToStatus(activeTab), colFilters)
      if (mySeq !== reqSeq.current) return   // a newer request superseded this one
      setOrders(res.items.flatMap(expandOrder))
      setTotalCount(res.totalCount)
      setTotalPages(res.totalPages)
    } catch (err) {
      if (mySeq !== reqSeq.current) return
      toast.error(err instanceof Error ? err.message : 'Failed to load orders')
      setOrders([])
    } finally {
      if (mySeq === reqSeq.current) setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, search, activeTab, colFilters])

  const loadSummary = useCallback(async () => {
    setSummary(await orderService.getSummary())
  }, [])

  useEffect(() => { loadPage() }, [loadPage])
  useEffect(() => { loadSummary() }, [loadSummary])

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
      loadPage()
      loadSummary()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete')
    }
  }

  const handleEdit = (orderId: string) => {
    router.push(`/orders/${orderId}/edit`)
  }

  const changeTab = (tab: string) => {
    setActiveTab(tab)
    setPage(1)
  }

  const changePageSize = (size: string) => {
    setPageSize(Number(size))
    setPage(1)
  }

  const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeEnd = Math.min(page * pageSize, totalCount)

  return (
    <div className="space-y-6 pb-24">
      {/* Stats Cards — global counts from summary endpoint */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-4">
          <p className="text-sm text-muted-foreground">Total Orders</p>
          <p className="text-2xl font-bold">{summary.total}</p>
        </Card>
        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-4">
          <p className="text-sm text-muted-foreground">In Progress</p>
          <p className="text-2xl font-bold text-blue-600">{summary.inProgress}</p>
        </Card>
        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-4">
          <p className="text-sm text-muted-foreground">Ready to Dispatch</p>
          <p className="text-2xl font-bold text-indigo-600">{summary.readyToDispatch}</p>
        </Card>
        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-4">
          <p className="text-sm text-muted-foreground">Completed</p>
          <p className="text-2xl font-bold text-green-600">{summary.completed}</p>
        </Card>
        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-4">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-amber-600">{summary.pending}</p>
        </Card>
      </div>

      {/* Tabs + Search + filters */}
      <Tabs value={activeTab} onValueChange={changeTab} className="w-full">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Select value={activeTab} onValueChange={changeTab}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="All stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              {WORKFLOW_STAGES.map((s) => (
                <SelectItem key={s} value={stageSlug(s)}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 flex-1 max-w-lg">
            <div className="flex items-center gap-2 bg-background border-2 border-border rounded-lg px-4 py-1 shadow-sm flex-1">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                placeholder="Search order, customer, product..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
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
          <div className="mt-4 space-y-3">
            <OrdersTable
              orders={orders}
              onDelete={handleDelete}
              onEdit={handleEdit}
              filters={colInput}
              onFilterChange={(patch) => setColInput((prev) => ({ ...prev, ...patch }))}
              onClearFilters={() => { setColInput({}); setSourceFilter('all') }}
            />

            {/* Pagination footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Rows per page</span>
                <Select value={String(pageSize)} onValueChange={changePageSize}>
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZES.map(s => (
                      <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="ml-2">
                  {totalCount === 0 ? 'No orders' : `${rangeStart}–${rangeEnd} of ${totalCount} orders`}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>
                <span className="text-sm text-muted-foreground min-w-24 text-center">
                  Page {totalPages === 0 ? 0 : page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Tabs>
    </div>
  )
}
