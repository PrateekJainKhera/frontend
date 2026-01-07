"use client"

import { useState, useEffect } from 'react'
import { RefreshCw, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { mockOrders, getDelayDays, getOrderProgress } from '@/lib/mock-data'
import { simulateApiCall } from '@/lib/utils/mock-api'
import { Order, OrderStatus } from '@/types'
import { formatDate } from '@/lib/utils/formatters'
import Link from 'next/link'

export default function LiveTrackingPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    setLoading(true)
    // Only show active orders in live tracking
    const data = await simulateApiCall(
      mockOrders.filter((o) => o.status === OrderStatus.IN_PROGRESS),
      800
    )
    setOrders(data)
    setLoading(false)
    setLastRefresh(new Date())
  }

  const getDelayBadge = (delayDays: number) => {
    if (delayDays === 0) {
      return (
        <Badge variant="outline" className="gap-1">
          <CheckCircle2 className="h-3 w-3 text-green-600" />
          On Time
        </Badge>
      )
    } else if (delayDays <= 5) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3 text-amber-600" />
          {delayDays} days delay
        </Badge>
      )
    } else {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          {delayDays} days delay
        </Badge>
      )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="sr-only">Live Order Tracking</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <Button onClick={loadOrders} variant="outline" size="icon">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Orders</CardDescription>
            <CardTitle className="text-3xl">{orders.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>On Time</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {orders.filter((o) => getDelayDays(o) === 0).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Delayed (10+ days)</CardDescription>
            <CardTitle className="text-3xl text-destructive">
              {orders.filter((o) => getDelayDays(o) > 10).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Live Status Cards */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <Card className="p-12 text-center">
          <CardDescription>No active orders in production</CardDescription>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const progress = getOrderProgress(order)
            const delayDays = getDelayDays(order)

            return (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">
                        {order.orderNo}
                      </CardTitle>
                      {getDelayBadge(delayDays)}
                    </div>
                    <Badge variant="secondary">In Progress</Badge>
                  </div>
                  <CardDescription>
                    {order.customer?.name} • {order.product?.partCode}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">
                        Current Process
                      </p>
                      <p className="font-semibold">
                        {order.currentProcess || 'Pending'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Machine</p>
                      <p className="font-semibold">
                        {order.currentMachine || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Operator</p>
                      <p className="font-semibold">
                        {order.currentOperator || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Due Date</p>
                      <p className="font-semibold">
                        {formatDate(order.adjustedDueDate || order.dueDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Progress</p>
                      <div className="flex items-center gap-2">
                        <Progress value={progress} className="h-2 flex-1" />
                        <span className="text-xs font-semibold">
                          {order.qtyCompleted}/{order.quantity}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Delay Warning */}
                  {delayDays > 5 && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Order delayed by {delayDays} days
                        {order.delayReason && ` • Reason: ${order.delayReason}`}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
                <CardFooter className="bg-muted/50 pt-3">
                  <Button variant="link" asChild className="px-0">
                    <Link href={`/orders/${order.id}`}>
                      View Details →
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
