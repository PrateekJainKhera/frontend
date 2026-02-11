'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
  Wrench,
  RefreshCw,
  Mic,
  ArrowRight,
} from 'lucide-react'
import { jobCardService } from '@/lib/api/job-cards'
import { scheduleService } from '@/lib/api/schedules'
import { ScheduleMachineDialog } from '@/components/scheduling/schedule-machine-dialog'
import { OrderSchedulingTree, ProcessStepSchedulingItem } from '@/types/schedule'
import { toast } from 'sonner'
import { format } from 'date-fns'
import Link from 'next/link'

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
  const [selectedIsOsp, setSelectedIsOsp] = useState(false)
  const [selectedIsManual, setSelectedIsManual] = useState(false)
  const [selectedPrevEndTime, setSelectedPrevEndTime] = useState<string | null>(null)

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
    } catch {
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
      order.tree
        ? setOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, expanded: true } : o))
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

  const openScheduleDialog = (jobCardId: number, orderId: number, isOsp: boolean, isManual: boolean, prevEndTime: string | null) => {
    setSelectedJobCardId(jobCardId)
    setSelectedOrderId(orderId)
    setSelectedIsOsp(isOsp)
    setSelectedIsManual(isManual)
    setSelectedPrevEndTime(prevEndTime)
    setDialogOpen(true)
  }

  const handleScheduleSuccess = async () => {
    setDialogOpen(false)
    const orderId = selectedOrderId
    setSelectedJobCardId(null)
    setSelectedOrderId(null)
    if (orderId) {
      await loadOrderTree(orderId)  // silent per-order refresh — small row spinner only
    }
    toast.success('Machine assigned successfully!')
  }

  const filteredOrders = orders.filter(o =>
    o.orderNo.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const totalPendingSteps  = orders.reduce((s, o) => s + (o.tree?.pendingSteps  ?? 0), 0)
  const totalScheduledSteps = orders.reduce((s, o) => s + (o.tree?.scheduledSteps ?? 0), 0)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Loading scheduling queue...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* ── Search Bar (customer master style) ── */}
      <div className="flex items-center gap-2 bg-background border-2 border-border rounded-lg px-4 py-1 shadow-sm w-full max-w-2xl">
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <Input
          placeholder="Search by order number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-0 shadow-none focus-visible:ring-0 h-8 px-0 text-sm flex-1 placeholder:text-muted-foreground/40 focus:placeholder:text-transparent"
        />
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
          <Mic className="h-4 w-4 text-muted-foreground" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={loadOrders} title="Refresh">
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      {/* ── KPI Cards (customer master style) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardDescription>Orders Awaiting</CardDescription>
            <CardTitle className="text-2xl">{orders.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardDescription>Steps Pending</CardDescription>
            <CardTitle className="text-2xl text-orange-500">{totalPendingSteps}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardDescription>Steps Assigned</CardDescription>
            <CardTitle className="text-2xl text-green-600">{totalScheduledSteps}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardDescription>Completion</CardDescription>
            <CardTitle className="text-2xl">
              {totalPendingSteps + totalScheduledSteps > 0
                ? `${Math.round((totalScheduledSteps / (totalPendingSteps + totalScheduledSteps)) * 100)}%`
                : '—'}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* ── Orders List ── */}
      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
          <CheckCircle2 className="h-8 w-8 text-green-500" />
          <p className="text-sm font-medium">All caught up!</p>
          <p className="text-xs">No orders waiting for machine scheduling.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {filteredOrders.map(order => (
            <OrderCard
              key={order.orderId}
              order={order}
              expandedGroups={expandedGroups}
              onToggleOrder={() => toggleOrder(order.orderId)}
              onToggleGroup={toggleGroup}
              onAssignMachine={(jcId, isOsp, isManual, prevEndTime) => openScheduleDialog(jcId, order.orderId, isOsp, isManual, prevEndTime)}
            />
          ))}
        </div>
      )}

      {selectedJobCardId && (
        <ScheduleMachineDialog
          jobCardId={selectedJobCardId}
          isOsp={selectedIsOsp}
          isManual={selectedIsManual}
          minStartTime={selectedPrevEndTime}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSuccess={handleScheduleSuccess}
        />
      )}
    </div>
  )
}

// ─── Priority Badge ────────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: string }) {
  const p = priority?.toUpperCase()
  if (p === 'HIGH')
    return <Badge className="bg-red-100 text-red-700 border border-red-200 text-[10px] h-4 px-1.5">High</Badge>
  if (p === 'MEDIUM')
    return <Badge className="bg-amber-100 text-amber-700 border border-amber-200 text-[10px] h-4 px-1.5">Med</Badge>
  return <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] h-4 px-1.5">Low</Badge>
}

// ─── Order Card ────────────────────────────────────────────────────────────────

interface OrderCardProps {
  order: OrderEntry
  expandedGroups: Set<string>
  onToggleOrder: () => void
  onToggleGroup: (key: string) => void
  onAssignMachine: (jobCardId: number, isOsp: boolean, isManual: boolean, prevEndTime: string | null) => void
}


function OrderCard({ order, expandedGroups, onToggleOrder, onToggleGroup, onAssignMachine }: OrderCardProps) {
  const pending   = order.tree?.pendingSteps   ?? null
  const total     = order.tree?.totalSteps     ?? null
  const scheduled = order.tree?.scheduledSteps ?? null
  const done = pending === 0 && total !== null && total > 0

  // Assembly = creationType 'Assembly' OR name contains 'assembly' (e.g. "Final Assembly" is ChildPart in DB)
  const isAssembly = (g: { creationType: string; groupName: string }) =>
    g.creationType.toLowerCase() === 'assembly' ||
    g.groupName.toLowerCase().includes('assembly')

  // Sort: child parts first (by earliest jobCardId = planning creation order), assembly groups last
  const sortedGroups = order.tree
    ? [...order.tree.groups].sort((a, b) => {
        const aAsm = isAssembly(a)
        const bAsm = isAssembly(b)
        if (aAsm && !bAsm) return 1
        if (!aAsm && bAsm) return -1
        // Within same category: sort by min jobCardId ascending (first planned part shows first)
        const aMin = a.steps.length ? Math.min(...a.steps.map(s => s.jobCardId)) : 0
        const bMin = b.steps.length ? Math.min(...b.steps.map(s => s.jobCardId)) : 0
        return aMin - bMin
      })
    : []

  return (
    <div className={`rounded-lg border-2 bg-card overflow-hidden ${done ? 'border-green-300' : 'border-border'}`}>

      {/* Order row — click to expand */}
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none hover:bg-muted/40 transition-colors"
        onClick={onToggleOrder}
      >
        <span className="text-muted-foreground shrink-0">
          {order.loading
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : order.expanded
              ? <ChevronDown className="h-3.5 w-3.5" />
              : <ChevronRight className="h-3.5 w-3.5" />
          }
        </span>
        <span className="font-semibold text-sm flex-1 truncate">{order.orderNo}</span>
        <PriorityBadge priority={order.priority} />
        {total !== null && (
          <span className="text-xs text-muted-foreground tabular-nums shrink-0">{scheduled}/{total}</span>
        )}
        {/* Status badge — shows scheduling progress */}
        {done ? (
          <Badge className="bg-green-100 text-green-700 border border-green-200 text-[10px] h-4 px-1.5 gap-0.5 shrink-0">
            <CheckCircle2 className="h-2.5 w-2.5" /> All Scheduled
          </Badge>
        ) : pending !== null && pending > 0 ? (
          <Badge variant="outline" className="border-orange-300 text-orange-600 bg-orange-50 text-[10px] h-4 px-1.5 shrink-0">
            {pending} pending
          </Badge>
        ) : null}

        {/* Always-visible Send to Production button */}
        <Link
          href={`/production/orders/${order.orderId}`}
          onClick={e => e.stopPropagation()}
        >
          <Button
            size="sm"
            variant={done ? 'default' : 'outline'}
            className={`h-6 px-2 text-[11px] gap-1 shrink-0 ${done ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'border-blue-300 text-blue-600 hover:bg-blue-50'}`}
          >
            <ArrowRight className="h-3 w-3" />
            Production
          </Button>
        </Link>
      </div>

      {/* Expanded: child part groups */}
      {order.expanded && order.tree && (
        <div className="border-t">
          {sortedGroups.map((group) => {
            const key    = `${order.orderId}-${group.groupName}`
            const open   = expandedGroups.has(key)
            const isAsm  = group.creationType === 'Assembly'
            const grpDone = group.scheduledSteps === group.totalSteps

            return (
              <div key={key} className="border-b last:border-b-0">
                {/* Group row */}
                <div
                  className="flex items-center gap-2 px-5 py-1.5 cursor-pointer select-none hover:bg-muted/30 transition-colors"
                  onClick={() => onToggleGroup(key)}
                >
                  <span className="text-muted-foreground shrink-0">
                    {open
                      ? <ChevronDown className="h-3 w-3" />
                      : <ChevronRight className="h-3 w-3" />
                    }
                  </span>
                  <span className={`shrink-0 ${isAsm ? 'text-purple-500' : 'text-sky-500'}`}>
                    {isAsm ? <Wrench className="h-3.5 w-3.5" /> : <Factory className="h-3.5 w-3.5" />}
                  </span>
                  <span className="text-xs font-medium flex-1 truncate">{group.groupName}</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] h-4 px-1 shrink-0 ${isAsm ? 'border-purple-200 text-purple-600' : 'border-sky-200 text-sky-600'}`}
                  >
                    {isAsm ? 'Assembly' : 'Part'}
                  </Badge>
                  {grpDone
                    ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    : <span className="text-[10px] text-muted-foreground shrink-0">{group.scheduledSteps}/{group.totalSteps}</span>
                  }
                </div>

                {/* Steps */}
                {open && (
                  <div className="divide-y">
                    {(() => {
                      const sorted = [...group.steps].sort((a, b) => {
                        const aStep = a.stepNo ?? 999
                        const bStep = b.stepNo ?? 999
                        if (aStep !== bStep) return aStep - bStep
                        return a.jobCardId - b.jobCardId
                      })
                      return sorted.map((step, idx) => {
                        const prev = idx > 0 ? sorted[idx - 1] : null
                        const prevEndTime = prev?.scheduledEndTime ?? null
                        return (
                          <ProcessStepRow
                            key={step.jobCardId}
                            step={step}
                            prevEndTime={prevEndTime}
                            onAssignMachine={onAssignMachine}
                          />
                        )
                      })
                    })()}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Loading state */}
      {order.expanded && order.loading && (
        <div className="border-t p-4 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs">Loading process steps...</span>
        </div>
      )}
    </div>
  )
}

// ─── Process Step Row ──────────────────────────────────────────────────────────

function ProcessStepRow({ step, prevEndTime, onAssignMachine }: {
  step: ProcessStepSchedulingItem
  prevEndTime: string | null
  onAssignMachine: (id: number, isOsp: boolean, isManual: boolean, prevEndTime: string | null) => void
}) {
  const assigned = !!step.scheduleId

  return (
    <div className={`flex items-center gap-3 px-8 py-1.5 text-xs ${assigned ? 'bg-green-50/50' : 'hover:bg-muted/10'}`}>
      {/* Step number */}
      <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
        assigned ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'
      }`}>
        {step.stepNo ?? '?'}
      </div>

      {/* Process name */}
      <span className="font-medium flex-1 truncate">{step.processName || 'Unknown Process'}</span>
      {step.isOsp && (
        <Badge className="bg-orange-100 text-orange-700 border border-orange-200 text-[10px] h-4 px-1.5 shrink-0">OSP</Badge>
      )}
      {step.isManual && (
        <Badge className="bg-blue-100 text-blue-700 border border-blue-200 text-[10px] h-4 px-1.5 shrink-0">Manual</Badge>
      )}
      {step.processCode && (
        <Badge variant="outline" className="text-[10px] font-mono h-4 px-1 shrink-0">{step.processCode}</Badge>
      )}
      <span className="text-muted-foreground shrink-0">Qty: {step.quantity}</span>

      {/* Assignment status */}
      {assigned ? (
        <div className="flex items-center gap-1 text-green-700 shrink-0">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span className="font-medium truncate max-w-[120px]">
            {step.isOsp ? 'OSP Scheduled' : step.isManual ? 'Manual Scheduled' : step.assignedMachineName}
          </span>
          {step.scheduledStartTime && (
            <span className="text-muted-foreground text-[10px]">
              {format(new Date(step.scheduledStartTime), 'dd MMM HH:mm')}
            </span>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-1 text-orange-500 shrink-0">
          <Clock className="h-3.5 w-3.5" />
          <span className="text-[10px]">{step.isOsp ? 'Set Lead Time' : step.isManual ? 'Set Time' : 'Unassigned'}</span>
        </div>
      )}

      <Button
        size="sm"
        variant={assigned ? 'outline' : 'default'}
        onClick={(e) => { e.stopPropagation(); onAssignMachine(step.jobCardId, !!step.isOsp, !!step.isManual, prevEndTime) }}
        className="shrink-0 h-6 px-2 text-[11px] gap-1"
      >
        <Calendar className="h-3 w-3" />
        {assigned ? 'Change' : 'Assign'}
      </Button>
    </div>
  )
}
