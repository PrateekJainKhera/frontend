'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
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
  Cpu,
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

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedJobCardId, setSelectedJobCardId] = useState<number | null>(null)
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)

  useEffect(() => { loadOrders() }, [])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const allJobCards = await jobCardService.getAll()
      const scheduled = allJobCards.filter(
        jc => jc.status === 'Scheduled' || jc.status === 'PLANNED'
      )
      const orderMap = new Map<number, { orderNo: string; priority: string }>()
      for (const jc of scheduled) {
        if (!orderMap.has(jc.orderId)) {
          orderMap.set(jc.orderId, {
            orderNo: jc.orderNo || `Order-${jc.orderId}`,
            priority: jc.priority,
          })
        }
      }
      setOrders(
        Array.from(orderMap.entries()).map(([orderId, info]) => ({
          orderId,
          orderNo: info.orderNo,
          priority: info.priority,
          tree: null,
          loading: false,
          expanded: false,
        }))
      )
    } catch (err) {
      toast.error('Failed to load scheduled orders')
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
      setExpandedGroups(prev =>
        new Set([...prev, ...tree.groups.map(g => `${orderId}-${g.groupName}`)])
      )
    } catch {
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
      order.tree ? setOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, expanded: true } : o))
                 : loadOrderTree(orderId)
    } else {
      setOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, expanded: false } : o))
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
      setOrders(prev => prev.map(o => o.orderId === selectedOrderId ? { ...o, tree: null } : o))
      await loadOrderTree(selectedOrderId)
    }
    toast.success('Machine assigned successfully!')
    setSelectedJobCardId(null)
    setSelectedOrderId(null)
    await loadOrders()
  }

  const filteredOrders = orders.filter(o =>
    o.orderNo.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const totalPendingSteps  = orders.reduce((s, o) => s + (o.tree?.pendingSteps  ?? 0), 0)
  const totalScheduledSteps = orders.reduce((s, o) => s + (o.tree?.scheduledSteps ?? 0), 0)
  const totalSteps = totalPendingSteps + totalScheduledSteps

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Loading scheduling queue...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold tracking-tight flex items-center gap-1.5">
            <Cpu className="h-5 w-5 text-primary hidden sm:block" />
            Machine Scheduling
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Assign machines to each process step for orders with issued materials
          </p>
        </div>
        <Button variant="outline" onClick={loadOrders} size="sm" className="self-start sm:self-auto gap-1.5 h-8 text-xs">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Orders Awaiting</p>
              <p className="text-2xl font-bold mt-0.5">{orders.length}</p>
              <p className="text-[10px] text-muted-foreground">Materials issued</p>
            </div>
            <div className="h-9 w-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <Package className="h-4 w-4 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Steps Pending</p>
              <p className="text-2xl font-bold text-orange-600 mt-0.5">{totalPendingSteps}</p>
              <p className="text-[10px] text-muted-foreground">Need assignment</p>
            </div>
            <div className="h-9 w-9 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1.5">
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Steps Assigned</p>
                <p className="text-2xl font-bold text-green-600 mt-0.5">{totalScheduledSteps}</p>
              </div>
              <div className="h-9 w-9 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
            </div>
            {totalSteps > 0 && (
              <>
                <Progress value={(totalScheduledSteps / totalSteps) * 100} className="h-1" />
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {Math.round((totalScheduledSteps / totalSteps) * 100)}% complete
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Search ── */}
      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search order no..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 h-8 text-sm"
        />
      </div>

      {/* ── Orders List ── */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-2">
            <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
            <p className="text-sm font-semibold">All caught up!</p>
            <p className="text-xs text-muted-foreground">No orders waiting for machine scheduling.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredOrders.map(order => (
            <OrderCard
              key={order.orderId}
              order={order}
              expandedGroups={expandedGroups}
              onToggleOrder={() => toggleOrder(order.orderId)}
              onToggleGroup={toggleGroup}
              onAssignMachine={(jcId) => openScheduleDialog(jcId, order.orderId)}
            />
          ))}
        </div>
      )}

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

// ─── Priority Badge ───────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: string }) {
  const p = priority?.toUpperCase()
  if (p === 'HIGH')
    return <Badge className="bg-red-100 text-red-700 border border-red-200 font-medium text-[10px] h-4 px-1.5">High</Badge>
  if (p === 'MEDIUM')
    return <Badge className="bg-amber-100 text-amber-700 border border-amber-200 font-medium text-[10px] h-4 px-1.5">Medium</Badge>
  return <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 font-medium text-[10px] h-4 px-1.5">Low</Badge>
}

// ─── Order Card ───────────────────────────────────────────────────────────────

interface OrderCardProps {
  order: OrderEntry
  expandedGroups: Set<string>
  onToggleOrder: () => void
  onToggleGroup: (key: string) => void
  onAssignMachine: (jobCardId: number) => void
}

function OrderCard({ order, expandedGroups, onToggleOrder, onToggleGroup, onAssignMachine }: OrderCardProps) {
  const pending   = order.tree?.pendingSteps   ?? null
  const total     = order.tree?.totalSteps     ?? null
  const scheduled = order.tree?.scheduledSteps ?? null
  const pct = total ? Math.round(((scheduled ?? 0) / total) * 100) : 0
  const done = pending === 0 && total !== null && total > 0

  return (
    <Card className={`overflow-hidden ${done ? 'border-green-200' : ''}`}>

      {/* Order header */}
      <div
        className="flex items-center justify-between px-3 py-2.5 cursor-pointer select-none hover:bg-muted/30 active:bg-muted/50 transition-colors gap-2"
        onClick={onToggleOrder}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="shrink-0">
            {order.loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            ) : order.expanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>
          <div className="h-7 w-7 rounded bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            <Package className="h-3.5 w-3.5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-sm leading-tight truncate">{order.orderNo}</span>
              <PriorityBadge priority={order.priority} />
            </div>
            <p className="text-[10px] text-muted-foreground">ID: {order.orderId}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {total !== null && (
            <div className="hidden sm:block w-20">
              <Progress value={pct} className="h-1" />
              <p className="text-[10px] text-muted-foreground text-right mt-0.5">{scheduled}/{total}</p>
            </div>
          )}
          {done ? (
            <Badge className="bg-green-100 text-green-700 border border-green-200 text-[10px] h-4 px-1.5 gap-0.5">
              <CheckCircle2 className="h-2.5 w-2.5" /> Done
            </Badge>
          ) : pending !== null && pending > 0 ? (
            <Badge variant="outline" className="border-orange-300 text-orange-600 bg-orange-50 text-[10px] h-4 px-1.5">
              {pending} pending
            </Badge>
          ) : null}
        </div>
      </div>

      {/* Mobile progress */}
      {total !== null && (
        <div className="sm:hidden px-3 pb-2 -mt-1">
          <Progress value={pct} className="h-1" />
          <p className="text-[10px] text-muted-foreground mt-0.5">{scheduled}/{total} steps assigned</p>
        </div>
      )}

      {/* Expanded tree */}
      {order.expanded && order.tree && (
        <div className="border-t bg-muted/5">
          {order.tree.groups.map((group) => {
            const key   = `${order.orderId}-${group.groupName}`
            const open  = expandedGroups.has(key)
            const isAsm = group.creationType === 'Assembly'
            const grpDone = group.scheduledSteps === group.totalSteps

            return (
              <div key={key} className="border-b last:border-b-0">
                {/* Group header */}
                <div
                  className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-muted/30 select-none transition-colors"
                  onClick={() => onToggleGroup(key)}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    {open
                      ? <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                      : <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    }
                    <div className={`h-5 w-5 rounded flex items-center justify-center shrink-0 ${isAsm ? 'bg-purple-50' : 'bg-sky-50'}`}>
                      {isAsm
                        ? <Wrench className="h-3 w-3 text-purple-600" />
                        : <Factory className="h-3 w-3 text-sky-600" />
                      }
                    </div>
                    <span className="font-medium text-xs truncate">{group.groupName}</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] h-4 px-1 shrink-0 ${isAsm ? 'border-purple-200 text-purple-600' : 'border-sky-200 text-sky-600'}`}
                    >
                      {isAsm ? 'Assembly' : 'Part'}
                    </Badge>
                  </div>
                  <div className="shrink-0 ml-2">
                    {grpDone
                      ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      : <span className="text-[10px] text-muted-foreground">{group.scheduledSteps}/{group.totalSteps}</span>
                    }
                  </div>
                </div>

                {/* Steps */}
                {open && (
                  <div className="divide-y divide-border/60">
                    {group.steps.map(step => (
                      <ProcessStepRow key={step.jobCardId} step={step} onAssignMachine={onAssignMachine} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Loading */}
      {order.expanded && order.loading && (
        <div className="border-t p-6 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs">Loading process steps...</span>
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
  const assigned = !!step.assignedMachineId

  return (
    <div className={`px-5 sm:px-7 py-2 transition-colors ${assigned ? 'bg-green-50/50' : 'hover:bg-muted/10'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">

        {/* Left: step circle + info */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
            assigned ? 'bg-green-100 text-green-700 ring-1 ring-green-200' : 'bg-muted text-muted-foreground'
          }`}>
            {step.stepNo ?? '?'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1">
              <span className="font-medium text-xs leading-tight">{step.processName || 'Unknown Process'}</span>
              {step.processCode && (
                <Badge variant="outline" className="text-[10px] font-mono h-4 px-1">{step.processCode}</Badge>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {step.jobCardNo} · Qty: <span className="font-medium">{step.quantity}</span>
            </p>
          </div>
        </div>

        {/* Right: machine + button */}
        <div className="flex items-center justify-between sm:justify-end gap-2 pl-8 sm:pl-0">
          {assigned ? (
            <div className="flex items-center gap-1.5 min-w-0">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-green-700 leading-tight truncate">{step.assignedMachineName}</p>
                <p className="text-[10px] font-mono text-muted-foreground">{step.assignedMachineCode}</p>
                {step.scheduledStartTime && (
                  <p className="text-[10px] text-muted-foreground">
                    {format(new Date(step.scheduledStartTime), 'dd MMM HH:mm')}
                    {step.scheduledEndTime && <> → {format(new Date(step.scheduledEndTime), 'HH:mm')}</>}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-orange-500">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span className="text-[10px] font-medium">Unassigned</span>
            </div>
          )}

          <Button
            size="sm"
            variant={assigned ? 'outline' : 'default'}
            onClick={(e) => { e.stopPropagation(); onAssignMachine(step.jobCardId) }}
            className="shrink-0 h-7 px-2.5 text-[11px] gap-1"
          >
            <Calendar className="h-3 w-3" />
            {assigned ? 'Change' : 'Assign'}
          </Button>
        </div>
      </div>
    </div>
  )
}
