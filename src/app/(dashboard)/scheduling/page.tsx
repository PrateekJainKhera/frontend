'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  CheckCircle2,
  Clock,
  Search,
  Factory,
  Calendar,
  Loader2,
  ChevronDown,
  ChevronRight,
  Package,
  Wrench,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { jobCardService } from '@/lib/api/job-cards'
import { scheduleService } from '@/lib/api/schedules'
import { ScheduleMachineDialog } from '@/components/scheduling/schedule-machine-dialog'
import { OrderSchedulingTree, ProcessStepSchedulingItem } from '@/types/schedule'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface OrderEntry {
  orderId: number
  orderNo: string
  priority: string
  tree: OrderSchedulingTree | null
  loading: boolean
  expanded: boolean
}

export default function SchedulingDashboardPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [orders, setOrders] = useState<OrderEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedJobCardId, setSelectedJobCardId] = useState<number | null>(null)
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      setLoading(true)
      // Get all job cards with "Scheduled" status — these need machine assignment
      const allJobCards = await jobCardService.getAll()
      const scheduled = allJobCards.filter(jc =>
        jc.status === 'Scheduled' || jc.status === 'PLANNED'
      )

      // Deduplicate by orderId
      const orderMap = new Map<number, { orderNo: string; priority: string }>()
      for (const jc of scheduled) {
        if (!orderMap.has(jc.orderId)) {
          orderMap.set(jc.orderId, {
            orderNo: jc.orderNo || `Order-${jc.orderId}`,
            priority: jc.priority,
          })
        }
      }

      const entries: OrderEntry[] = Array.from(orderMap.entries()).map(([orderId, info]) => ({
        orderId,
        orderNo: info.orderNo,
        priority: info.priority,
        tree: null,
        loading: false,
        expanded: false,
      }))

      setOrders(entries)
    } catch (error) {
      toast.error('Failed to load scheduled orders')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const loadOrderTree = async (orderId: number) => {
    setOrders(prev =>
      prev.map(o => o.orderId === orderId ? { ...o, loading: true, expanded: true } : o)
    )
    try {
      const tree = await scheduleService.getOrderSchedulingTree(orderId)
      setOrders(prev =>
        prev.map(o => o.orderId === orderId ? { ...o, tree, loading: false } : o)
      )
      // Auto-expand all groups for this order
      const groupKeys = tree.groups.map(g => `${orderId}-${g.groupName}`)
      setExpandedGroups(prev => new Set([...prev, ...groupKeys]))
    } catch (error) {
      toast.error('Failed to load order details')
      setOrders(prev =>
        prev.map(o => o.orderId === orderId ? { ...o, loading: false, expanded: false } : o)
      )
    }
  }

  const toggleOrder = (orderId: number) => {
    const order = orders.find(o => o.orderId === orderId)
    if (!order) return

    if (!order.expanded) {
      // Expand: load tree if not loaded
      if (!order.tree) {
        loadOrderTree(orderId)
      } else {
        setOrders(prev =>
          prev.map(o => o.orderId === orderId ? { ...o, expanded: true } : o)
        )
      }
    } else {
      // Collapse
      setOrders(prev =>
        prev.map(o => o.orderId === orderId ? { ...o, expanded: false } : o)
      )
    }
  }

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const openScheduleDialog = (jobCardId: number, orderId: number) => {
    setSelectedJobCardId(jobCardId)
    setSelectedOrderId(orderId)
    setDialogOpen(true)
  }

  const handleScheduleSuccess = async () => {
    setDialogOpen(false)
    if (selectedOrderId) {
      // Reload that order's tree to show the new assignment
      setOrders(prev =>
        prev.map(o => o.orderId === selectedOrderId ? { ...o, tree: null } : o)
      )
      await loadOrderTree(selectedOrderId)
    }
    toast.success('Machine assigned successfully!')
    setSelectedJobCardId(null)
    setSelectedOrderId(null)
    // Also reload the order list (in case everything is now scheduled)
    await loadOrders()
  }

  const filteredOrders = orders.filter(o =>
    o.orderNo.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalPendingSteps = orders.reduce((sum, o) => sum + (o.tree?.pendingSteps ?? 0), 0)
  const totalScheduledSteps = orders.reduce((sum, o) => sum + (o.tree?.scheduledSteps ?? 0), 0)

  const getPriorityBadge = (priority: string) => {
    const p = priority?.toUpperCase()
    if (p === 'HIGH') return <Badge className="bg-red-100 text-red-700 border-red-300">High</Badge>
    if (p === 'MEDIUM') return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">Medium</Badge>
    return <Badge className="bg-green-100 text-green-700 border-green-300">Low</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Machine Scheduling</h1>
          <p className="text-sm text-muted-foreground">
            Assign machines to each process step for orders with issued materials
          </p>
        </div>
        <Button variant="outline" onClick={loadOrders} size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders Awaiting Scheduling</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-muted-foreground">Materials issued, machines not assigned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Steps Needing Machine</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{totalPendingSteps}</div>
            <p className="text-xs text-muted-foreground">Process steps without machine assignment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Steps Assigned</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalScheduledSteps}</div>
            <p className="text-xs text-muted-foreground">Process steps with machine assigned</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search orders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 max-w-sm"
        />
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
            <p className="text-lg font-semibold">All caught up!</p>
            <p className="text-sm text-muted-foreground">
              No orders are waiting for machine scheduling.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.orderId}
              order={order}
              expandedGroups={expandedGroups}
              onToggleOrder={() => toggleOrder(order.orderId)}
              onToggleGroup={toggleGroup}
              onAssignMachine={(jobCardId) => openScheduleDialog(jobCardId, order.orderId)}
              getPriorityBadge={getPriorityBadge}
            />
          ))}
        </div>
      )}

      {/* Machine Assignment Dialog */}
      {selectedJobCardId && (
        <ScheduleMachineDialog
          jobCardId={selectedJobCardId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSuccess={handleScheduleSuccess}
        />
      )}
    </div>
  )
}

// ─── Order Card ──────────────────────────────────────────────────────────────

interface OrderCardProps {
  order: OrderEntry
  expandedGroups: Set<string>
  onToggleOrder: () => void
  onToggleGroup: (key: string) => void
  onAssignMachine: (jobCardId: number) => void
  getPriorityBadge: (priority: string) => React.ReactNode
}

function OrderCard({
  order,
  expandedGroups,
  onToggleOrder,
  onToggleGroup,
  onAssignMachine,
  getPriorityBadge,
}: OrderCardProps) {
  const pending = order.tree?.pendingSteps ?? null
  const total = order.tree?.totalSteps ?? null
  const scheduled = order.tree?.scheduledSteps ?? null

  return (
    <Card className="overflow-hidden">
      {/* Order Header — click to expand */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={onToggleOrder}
      >
        <div className="flex items-center gap-3">
          {order.loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : order.expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <Package className="h-5 w-5 text-blue-600" />
          <div>
            <span className="font-semibold text-base">{order.orderNo}</span>
            <span className="ml-3 text-sm text-muted-foreground">Order ID: {order.orderId}</span>
          </div>
          {getPriorityBadge(order.priority)}
        </div>

        <div className="flex items-center gap-4">
          {total !== null && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-green-600">{scheduled}</span>
              <span>/{total} steps assigned</span>
            </div>
          )}
          {pending !== null && pending > 0 && (
            <Badge variant="outline" className="border-orange-400 text-orange-600 bg-orange-50">
              {pending} pending
            </Badge>
          )}
          {pending === 0 && total !== null && (
            <Badge className="bg-green-100 text-green-700 border-green-300">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Fully Scheduled
            </Badge>
          )}
        </div>
      </div>

      {/* Expanded Tree */}
      {order.expanded && order.tree && (
        <div className="border-t">
          {order.tree.groups.map((group) => {
            const groupKey = `${order.orderId}-${group.groupName}`
            const isGroupExpanded = expandedGroups.has(groupKey)

            return (
              <div key={groupKey} className="border-b last:border-b-0">
                {/* Group Header */}
                <div
                  className="flex items-center justify-between px-6 py-3 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors"
                  onClick={() => onToggleGroup(groupKey)}
                >
                  <div className="flex items-center gap-2">
                    {isGroupExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    {group.creationType === 'Assembly' ? (
                      <Wrench className="h-4 w-4 text-purple-600" />
                    ) : (
                      <Factory className="h-4 w-4 text-blue-600" />
                    )}
                    <span className="font-medium text-sm">
                      {group.groupName}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {group.creationType === 'Assembly' ? 'Assembly' : 'Child Part'}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {group.scheduledSteps}/{group.totalSteps} steps scheduled
                  </div>
                </div>

                {/* Process Steps */}
                {isGroupExpanded && (
                  <div className="divide-y">
                    {group.steps.map((step) => (
                      <ProcessStepRow
                        key={step.jobCardId}
                        step={step}
                        onAssignMachine={onAssignMachine}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Loading state when expanding */}
      {order.expanded && order.loading && (
        <div className="border-t p-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </Card>
  )
}

// ─── Process Step Row ─────────────────────────────────────────────────────────

interface ProcessStepRowProps {
  step: ProcessStepSchedulingItem
  onAssignMachine: (jobCardId: number) => void
}

function ProcessStepRow({ step, onAssignMachine }: ProcessStepRowProps) {
  const isAssigned = !!step.assignedMachineId

  return (
    <div className={`flex items-center justify-between px-8 py-3 ${isAssigned ? 'bg-green-50/40' : 'bg-white hover:bg-muted/10'} transition-colors`}>
      <div className="flex items-center gap-4 flex-1">
        {/* Step Number */}
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
          {step.stepNo ?? '?'}
        </div>

        {/* Process Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{step.processName || 'Unknown Process'}</span>
            {step.processCode && (
              <Badge variant="outline" className="text-xs font-mono">{step.processCode}</Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {step.jobCardNo} · Qty: {step.quantity}
          </div>
        </div>

        {/* Machine Assignment */}
        <div className="flex items-center gap-3 shrink-0">
          {isAssigned ? (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              <div className="text-right">
                <div className="text-sm font-medium text-green-700">{step.assignedMachineName}</div>
                <div className="text-xs text-muted-foreground font-mono">{step.assignedMachineCode}</div>
                {step.scheduledStartTime && (
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(step.scheduledStartTime), 'MMM dd, HH:mm')}
                    {step.scheduledEndTime && ` → ${format(new Date(step.scheduledEndTime), 'HH:mm')}`}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-orange-500">
              <Clock className="h-4 w-4 shrink-0" />
              <span className="text-sm">No machine assigned</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="ml-4 shrink-0">
        <Button
          size="sm"
          variant={isAssigned ? 'outline' : 'default'}
          onClick={() => onAssignMachine(step.jobCardId)}
          className="gap-2"
        >
          <Calendar className="h-3 w-3" />
          {isAssigned ? 'Change' : 'Assign Machine'}
        </Button>
      </div>
    </div>
  )
}
