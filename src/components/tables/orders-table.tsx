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
import { Progress } from '@/components/ui/progress'
import { getOrderProgress, getDelayDays } from '@/lib/mock-data/orders'

interface OrdersTableProps {
  orders: Order[]
  onDelete?: (order: Order) => void
  onEdit?: (orderId: string) => void
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'Completed':
      return 'default'
    case 'In Progress':
      return 'secondary'
    case 'Pending':
      return 'outline'
    default:
      return 'destructive'
  }
}

export function OrdersTable({ orders, onDelete, onEdit }: OrdersTableProps) {
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

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No orders found</p>
      </div>
    )
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
            <TableHead>Due Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
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
                    {(order.product?.numberOfTeeth ?? 0) > 0 && (
                      <span className="ml-1 text-xs text-muted-foreground">({order.product!.numberOfTeeth}T)</span>
                    )}
                  </div>
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
                  <Badge variant={getStatusVariant(order.status)}>
                    {order.status}
                  </Badge>
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
