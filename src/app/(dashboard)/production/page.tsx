'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  CheckCircle2,
  Clock,
  PackageCheck,
  Search,
  FileText,
  Eye,
  User,
  Package,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { productionService, ProductionOrderSummary } from '@/lib/api/production'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export default function ProductionDashboardPage() {
  const [orders, setOrders] = useState<ProductionOrderSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('active')

  const load = async () => {
    setLoading(true)
    try {
      const data = await productionService.getOrderItems()
      setOrders(data)
    } catch (err) {
      console.error('Failed to load production orders:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const stats = {
    totalOrders: orders.length,
    inProgress: orders.filter(o => o.productionStatus === 'InProgress').length,
    completed: orders.filter(o => o.productionStatus === 'Completed').length,
    totalSteps: orders.reduce((sum, o) => sum + o.totalSteps, 0),
    completedSteps: orders.reduce((sum, o) => sum + o.completedSteps, 0),
  }

  const filtered = orders.filter(o => {
    const q = searchQuery.toLowerCase()
    return (
      o.orderNo.toLowerCase().includes(q) ||
      (o.customerName ?? '').toLowerCase().includes(q) ||
      (o.productName ?? '').toLowerCase().includes(q)
    )
  })

  const activeOrders = filtered.filter(o => !(o.qtyDispatched > 0 && o.qtyDispatched >= o.quantity))
  const dispatchedOrders = filtered.filter(o => o.qtyDispatched > 0 && o.qtyDispatched >= o.quantity)

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <p className="text-sm font-medium">Total Orders</p>
            <FileText className="h-4 w-4 text-gray-600" />
          </div>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">Active production orders</p>
          </CardContent>
        </Card>

        <Card>
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <p className="text-sm font-medium">In Progress</p>
            <Clock className="h-4 w-4 text-blue-600" />
          </div>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">Orders with active work</p>
          </CardContent>
        </Card>

        <Card>
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <p className="text-sm font-medium">Completed</p>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </div>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Finished orders</p>
          </CardContent>
        </Card>

        <Card>
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <p className="text-sm font-medium">Total Progress</p>
            <PackageCheck className="h-4 w-4 text-purple-600" />
          </div>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalSteps > 0 ? Math.round((stats.completedSteps / stats.totalSteps) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.completedSteps} / {stats.totalSteps} steps
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs + Search on same row */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList className="grid max-w-md grid-cols-2">
            <TabsTrigger value="active">Active Orders</TabsTrigger>
            <TabsTrigger value="dispatched">Dispatched Orders</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 bg-background border-2 border-border rounded-lg px-4 py-1 shadow-sm flex-1 max-w-md">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              placeholder="Search orders, customers, products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 shadow-none focus-visible:ring-0 h-8 px-0 text-sm flex-1 placeholder:text-muted-foreground/40 focus:placeholder:text-transparent caret-foreground"
            />
          </div>
        </div>

        {/* Active Orders Tab */}
        <TabsContent value="active" className="mt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order No</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Child Parts</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scheduling</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : activeOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-6">
                      No active orders
                    </TableCell>
                  </TableRow>
                ) : (
                  activeOrders.map((order) => (
                    <OrderRow
                      key={order.orderItemId ?? order.orderId}
                      order={order}
                      onRefresh={load}
                      showScheduling
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Dispatched Orders Tab */}
        <TabsContent value="dispatched" className="mt-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order No</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Child Parts</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : dispatchedOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                      No dispatched orders
                    </TableCell>
                  </TableRow>
                ) : (
                  dispatchedOrders.map((order) => (
                    <OrderRow
                      key={order.orderItemId ?? order.orderId}
                      order={order}
                      onRefresh={load}
                      showScheduling={false}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function OrderRow({
  order,
  onRefresh,
  showScheduling,
}: {
  order: ProductionOrderSummary
  onRefresh: () => void
  showScheduling: boolean
}) {
  const [completing, setCompleting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const progress = order.totalSteps > 0
    ? Math.round((order.completedSteps / order.totalSteps) * 100)
    : 0
  const isComplete = order.productionStatus === 'Completed'
  const hasInProgress = order.productionStatus === 'InProgress'
  const detailUrl = order.orderItemId
    ? `/production/order-items/${order.orderItemId}`
    : `/production/orders/${order.orderId}`

  const scheduled = order.machineScheduledSteps
  const pending = order.totalSteps - scheduled
  const canCompleteAll = !isComplete && pending === 0 && order.totalSteps > 0 && !!order.orderItemId

  const handleCompleteAll = async () => {
    setCompleting(true)
    try {
      await productionService.completeAll(order.orderItemId!)
      toast.success(`${order.orderNo} — all processes completed. Ready for QC.`)
      onRefresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to complete all')
    } finally {
      setCompleting(false)
      setConfirmOpen(false)
    }
  }

  return (
    <TableRow>
      <TableCell className="font-medium">
        <Link href={detailUrl} className="hover:underline text-blue-600">
          {order.orderNo}
        </Link>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <p className="font-medium">{order.customerName ?? '—'}</p>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <p className="font-medium">{order.productName ?? '—'}</p>
        </div>
      </TableCell>
      <TableCell>
        <div>
          <p className="font-medium">{order.totalChildParts} Parts</p>
          <p className="text-xs text-muted-foreground">
            {order.completedChildParts}/{order.totalChildParts} ready for assembly
          </p>
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1 min-w-[200px]">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {order.completedSteps} / {order.totalSteps} steps
            </span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </TableCell>
      <TableCell>
        {isComplete ? (
          <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        ) : hasInProgress ? (
          <Badge variant="outline" className="border-blue-500 text-blue-700 bg-blue-50">
            <Clock className="mr-1 h-3 w-3" />
            In Progress
          </Badge>
        ) : (
          <Badge variant="outline" className="border-gray-500 text-gray-700 bg-gray-50">
            Pending
          </Badge>
        )}
      </TableCell>
      {showScheduling && (
        <TableCell>
          <div className="text-sm space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
              <span className="text-green-700 font-medium">{scheduled} / {order.totalSteps} Scheduled</span>
            </div>
            {pending > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-gray-300" />
                <span className="text-muted-foreground">{pending} Remaining</span>
              </div>
            )}
          </div>
        </TableCell>
      )}
      <TableCell className="text-right">
        <TooltipProvider delayDuration={200}>
          <div className="flex items-center justify-end gap-1">
            {canCompleteAll && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 border-green-500 text-green-700 hover:bg-green-50"
                      onClick={() => setConfirmOpen(true)}
                      disabled={completing}
                    >
                      {completing
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <CheckCircle2 className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Complete All Processes</TooltipContent>
                </Tooltip>
                <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Complete All Processes</DialogTitle>
                      <DialogDescription>
                        Force-complete all <strong>{order.totalSteps}</strong> processes for order <strong>{order.orderNo}</strong>?
                        This will mark all job cards as done and send the order to QC.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={completing}>
                        Cancel
                      </Button>
                      <Button
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={handleCompleteAll}
                        disabled={completing}
                      >
                        {completing
                          ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Completing...</>
                          : 'Confirm'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={detailUrl}>
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>View Workflow</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </TableCell>
    </TableRow>
  )
}
