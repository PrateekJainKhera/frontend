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
import { Eye, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils/formatters'
import { Progress } from '@/components/ui/progress'
import { getOrderProgress, getDelayDays } from '@/lib/mock-data/orders'

interface OrdersTableProps {
  orders: Order[]
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

export function OrdersTable({ orders }: OrdersTableProps) {
  const router = useRouter()

  const handleViewOrder = (orderId: string) => {
    router.push(`/orders/${orderId}`)
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
            <TableHead>Part Code</TableHead>
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
              <TableRow key={order.id}>
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
                <TableCell className="font-mono text-sm">
                  {order.product?.partCode}
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
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleViewOrder(order.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
