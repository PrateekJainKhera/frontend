"use client"

import { useRouter } from 'next/navigation'
import { Order } from '@/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, Calendar, Pencil, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils/formatters'
import { ProductSpec } from '@/components/ui/product-spec'
import { Progress } from '@/components/ui/progress'
import { getOrderProgress, getDelayDays } from '@/lib/utils/order-helpers'
import { OrderColumnFilters } from '@/lib/api/orders'
import { X } from 'lucide-react'

interface OrdersTableProps {
  orders: Order[]
  onDelete?: (order: Order) => void
  onEdit?: (orderId: string) => void
  // When provided, a per-column filter row is shown under the header
  filters?: OrderColumnFilters
  onFilterChange?: (patch: Partial<OrderColumnFilters>) => void
  onClearFilters?: () => void
}

const filterInputClass =
  "w-full h-7 rounded border border-input bg-background px-2 text-xs font-normal placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"

const getEffectiveStatus = (order: Order): string => {
  const dispatched = order.qtyDispatched ?? 0
  if (dispatched >= order.quantity && order.quantity > 0) return 'Completed'
  if (order.qtyCompleted >= order.quantity && order.quantity > 0) return 'Ready to Dispatch'
  if ((order.qtyInProgress ?? 0) > 0 || (order.qtyCompleted ?? 0) > 0) return 'In Progress'
  return order.status
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'Completed':      return 'default'
    case 'Ready to Dispatch': return 'outline'
    case 'In Progress':   return 'secondary'
    case 'Pending':       return 'outline'
    default:              return 'outline'
  }
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'Completed':         return 'border-green-500 text-green-700 bg-green-50'
    case 'Ready to Dispatch': return 'border-blue-500 text-blue-700 bg-blue-50'
    case 'In Progress':       return 'border-yellow-500 text-yellow-700 bg-yellow-50'
    default:                  return ''
  }
}

export function OrdersTable({ orders, onDelete, onEdit, filters, onFilterChange, onClearFilters }: OrdersTableProps) {
  const router = useRouter()

  const handleViewOrder = (order: Order) => {
    // For expanded multi-item rows the orderNo ends in -A, -B, -C, etc.
    const match = order.orderNo.match(/-([A-Z])$/)
    if (match) {
      router.push(`/orders/${order.id}?item=${match[1]}`)
    } else {
      router.push(`/orders/${order.id}`)
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order No</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Order Date</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
          {onFilterChange && (
            <TableRow className="hover:bg-transparent border-b">
              <TableHead className="p-1 align-top">
                <input className={filterInputClass} placeholder="Filter…"
                  value={filters?.orderNo ?? ''} onChange={(e) => onFilterChange({ orderNo: e.target.value })} />
              </TableHead>
              <TableHead className="p-1 align-top">
                <input className={filterInputClass} placeholder="Filter…"
                  value={filters?.customer ?? ''} onChange={(e) => onFilterChange({ customer: e.target.value })} />
              </TableHead>
              <TableHead className="p-1 align-top" />
              <TableHead className="p-1 align-top">
                <input className={filterInputClass} placeholder="e.g. 110 / model"
                  value={filters?.product ?? ''} onChange={(e) => onFilterChange({ product: e.target.value })} />
              </TableHead>
              <TableHead className="p-1 align-top" />
              <TableHead className="p-1 align-top" />
              <TableHead className="p-1 align-top" />
              <TableHead className="p-1 align-top">
                <div className="flex flex-col gap-1">
                  <input type="date" title="Order date from" className={filterInputClass}
                    value={filters?.orderDateFrom ?? ''} onChange={(e) => onFilterChange({ orderDateFrom: e.target.value })} />
                  <input type="date" title="Order date to" className={filterInputClass}
                    value={filters?.orderDateTo ?? ''} onChange={(e) => onFilterChange({ orderDateTo: e.target.value })} />
                </div>
              </TableHead>
              <TableHead className="p-1 align-top" />
              <TableHead className="p-1 align-top text-right">
                {onClearFilters && (
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onClearFilters} title="Clear filters">
                    <X className="h-3 w-3 mr-1" /> Clear
                  </Button>
                )}
              </TableHead>
            </TableRow>
          )}
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">No orders found</TableCell>
            </TableRow>
          ) : orders.map((order) => {
            const progress = getOrderProgress(order)
            const delayDays = getDelayDays(order)

            return (
              <TableRow key={order.orderNo}>
                <TableCell className="font-mono font-semibold">
                  {order.orderNo}
                </TableCell>
                <TableCell className="max-w-50 truncate">
                  <div>
                    {order.customer?.customerName}
                    {order.orderSource === 'Through Agent' && order.agentCustomer && (
                      <div className="text-xs text-muted-foreground mt-1">
                        via {order.agentCustomer.customerName}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={order.orderSource === 'Direct' ? 'default' : 'secondary'} className="text-xs">
                    {order.orderSource}
                  </Badge>
                  {order.agentCommission && (
                    <div className="text-xs text-green-600 font-semibold mt-1">
                      ₹{order.agentCommission.toLocaleString()}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  <div className="font-medium">
                    {order.product?.modelName || order.product?.partCode || '—'}
                  </div>
                  <ProductSpec
                    rollerType={(order.product as any)?.rollerType}
                    numberOfTeeth={order.product?.numberOfTeeth}
                  />
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <span className="font-semibold">{order.qtyCompleted}</span>
                    <span className="text-muted-foreground">/{order.quantity}</span>
                  </div>
                  {order.qtyRejected > 0 && (
                    <div className="text-xs text-destructive">
                      Rejected: {order.qtyRejected}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="w-25">
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {Math.round(progress)}%
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  {(() => {
                    const s = getEffectiveStatus(order)
                    return (
                      <Badge variant={getStatusVariant(s)} className={getStatusClass(s)}>
                        {s}
                      </Badge>
                    )
                  })()}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">
                      {order.orderDate ? formatDate(order.orderDate) : '—'}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">
                      {formatDate(order.adjustedDueDate || order.dueDate)}
                    </span>
                  </div>
                  {delayDays > 0 && (
                    <div
                      className={`text-xs mt-1 ${
                        delayDays > 10 ? 'text-destructive' : 'text-amber-600'
                      }`}
                    >
                      Delayed: {delayDays} days
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleViewOrder(order)} title="View">
                      <Eye className="h-4 w-4" />
                    </Button>
                    {onEdit && (
                      <Button variant="ghost" size="icon" onClick={() => onEdit(order.id)} title="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button variant="ghost" size="icon" onClick={() => onDelete(order)} title="Delete" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
