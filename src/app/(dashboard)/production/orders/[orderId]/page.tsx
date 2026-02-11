'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Loader2,
  Play,
  Pause,
  Square,
  RotateCcw,
  Wrench,
  Package,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

// ── Types matching the backend ProductionResponse DTOs ────────────────────────
interface ProductionStepItem {
  jobCardId: number
  jobCardNo: string
  stepNo: number | null
  processName: string | null
  processCode: string | null
  isOsp: boolean
  productionStatus: string   // Pending | Ready | InProgress | Paused | Completed
  actualStartTime: string | null
  actualEndTime: string | null
  quantity: number
  completedQty: number
  rejectedQty: number
  scheduledStartTime: string | null
  scheduledEndTime: string | null
  machineName: string | null
  machineCode: string | null
  estimatedDurationMinutes: number | null
}

interface ProductionChildPartGroup {
  childPartId: number | null
  childPartName: string
  totalSteps: number
  completedSteps: number
  isReadyForAssembly: boolean
  steps: ProductionStepItem[]
}

interface ProductionOrderDetail {
  orderId: number
  orderNo: string
  customerName: string | null
  productName: string | null
  priority: string
  dueDate: string | null
  totalSteps: number
  completedSteps: number
  inProgressSteps: number
  childParts: ProductionChildPartGroup[]
  assembly: ProductionStepItem | null
  canStartAssembly: boolean
}

// ── Status badge helper ───────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'Completed':
      return <Badge className="bg-green-100 text-green-800 border-green-300">Completed</Badge>
    case 'InProgress':
      return <Badge className="bg-blue-100 text-blue-800 border-blue-300">In Progress</Badge>
    case 'Paused':
      return <Badge className="bg-amber-100 text-amber-800 border-amber-300">Paused</Badge>
    case 'Ready':
      return <Badge className="bg-purple-100 text-purple-800 border-purple-300">Ready</Badge>
    default:
      return <Badge variant="outline" className="text-muted-foreground">Pending</Badge>
  }
}

// ── Single step row with action buttons ──────────────────────────────────────
function StepRow({ step, onAction }: {
  step: ProductionStepItem
  onAction: (jobCardId: number, action: string) => Promise<void>
}) {
  const [busy, setBusy] = useState(false)

  const doAction = async (action: string) => {
    setBusy(true)
    await onAction(step.jobCardId, action)
    setBusy(false)
  }

  return (
    <div className="flex items-start justify-between gap-4 p-3 rounded-lg border bg-background">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {/* Step number circle */}
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
          {step.stepNo ?? '?'}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{step.processName ?? step.processCode ?? 'Unknown Process'}</span>
            {step.isOsp && (
              <Badge variant="outline" className="border-orange-400 text-orange-600 text-xs">OSP</Badge>
            )}
            <StatusBadge status={step.productionStatus} />
          </div>
          <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
            {step.machineName && step.machineName !== 'Manual Process' && (
              <span className="flex items-center gap-1">
                <Wrench className="h-3 w-3" />
                {step.machineName}
              </span>
            )}
            {step.machineName === 'Manual Process' && (
              <span className="flex items-center gap-1 text-blue-600">
                <Wrench className="h-3 w-3" />
                Manual
              </span>
            )}
            {step.estimatedDurationMinutes && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {step.estimatedDurationMinutes} min
              </span>
            )}
            {step.completedQty > 0 && (
              <span className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                {step.completedQty}/{step.quantity} pcs
              </span>
            )}
            {step.actualStartTime && (
              <span>Started {new Date(step.actualStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            )}
            {step.actualEndTime && (
              <span>Done {new Date(step.actualEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex-shrink-0">
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : step.productionStatus === 'Ready' ? (
          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-7 px-2 text-xs" onClick={() => doAction('start')}>
            <Play className="h-3 w-3 mr-1" /> Start
          </Button>
        ) : step.productionStatus === 'InProgress' ? (
          <div className="flex gap-1">
            <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => doAction('pause')}>
              <Pause className="h-3 w-3 mr-1" /> Pause
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white h-7 px-2 text-xs" onClick={() => doAction('complete')}>
              <Square className="h-3 w-3 mr-1" /> Complete
            </Button>
          </div>
        ) : step.productionStatus === 'Paused' ? (
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => doAction('resume')}>
            <RotateCcw className="h-3 w-3 mr-1" /> Resume
          </Button>
        ) : step.productionStatus === 'Completed' ? (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        ) : null}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function OrderProductionPage() {
  const params = useParams()
  const orderId = params.orderId as string

  const [order, setOrder] = useState<ProductionOrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedParts, setExpandedParts] = useState<Set<string>>(new Set())
  const [assemblyExpanded, setAssemblyExpanded] = useState(false)

  const loadOrder = useCallback((silent = false) => {
    if (!silent) setLoading(true)
    fetch(`http://localhost:5217/api/production/orders/${orderId}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          const detail: ProductionOrderDetail = data.data
          setOrder(detail)
          // Only reset expanded state on initial load
          if (!silent) {
            setExpandedParts(new Set(detail.childParts.map(cp =>
              String(cp.childPartId ?? cp.childPartName)
            )))
            setAssemblyExpanded(true)
          }
        }
      })
      .catch(console.error)
      .finally(() => { if (!silent) setLoading(false) })
  }, [orderId])

  useEffect(() => { loadOrder() }, [loadOrder])

  const handleAction = async (jobCardId: number, action: string) => {
    try {
      const res = await fetch(`http://localhost:5217/api/production/job-cards/${jobCardId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, completedQty: 0, rejectedQty: 0 }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message ?? `Action '${action}' successful`)
        loadOrder(true)   // silent refresh — no spinner, expanded state preserved
      } else {
        toast.error(data.message ?? 'Action failed')
      }
    } catch {
      toast.error('Network error')
    }
  }

  const togglePart = (key: string) => {
    setExpandedParts(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="p-6">
        <Link href="/production">
          <Button variant="ghost" size="sm"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
        </Link>
        <Card className="mt-4">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="font-medium">Order Not Found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const progress = order.totalSteps > 0
    ? Math.round((order.completedSteps / order.totalSteps) * 100)
    : 0

  return (
    <div className="px-6 pb-6 space-y-4 max-w-5xl">
      {/* Back Button */}
      <Link href="/production">
        <Button variant="ghost" size="sm"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Button>
      </Link>

      {/* Order Summary */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{order.orderNo}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {order.customerName ?? '—'} • {order.productName ?? '—'}
              </p>
            </div>
            <Badge variant={progress === 100 ? 'default' : 'secondary'} className="text-lg px-3">
              {progress}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>{order.completedSteps} / {order.totalSteps} steps completed</span>
            <span>{order.childParts.length} child parts</span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Child Parts */}
      <div className="space-y-2">
        <h2 className="font-medium text-sm text-muted-foreground px-1">Child Parts</h2>

        {[...order.childParts]
          .sort((a, b) => {
            // Push any group whose name contains "assembly" to the end
            const aAsm = a.childPartName.toLowerCase().includes('assembly')
            const bAsm = b.childPartName.toLowerCase().includes('assembly')
            if (aAsm && !bAsm) return 1
            if (!aAsm && bAsm) return -1
            return a.childPartName.localeCompare(b.childPartName)
          })
          .map((cp) => {
          const key = String(cp.childPartId ?? cp.childPartName)
          const isExpanded = expandedParts.has(key)
          const cpProgress = cp.totalSteps > 0 ? Math.round((cp.completedSteps / cp.totalSteps) * 100) : 0

          return (
            <Collapsible key={key} open={isExpanded} onOpenChange={() => togglePart(key)}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <span className="font-medium">{cp.childPartName}</span>
                    {cp.isReadyForAssembly ? (
                      <Badge className="bg-green-100 text-green-800 border-green-300">Ready for Assembly</Badge>
                    ) : cp.completedSteps > 0 ? (
                      <Badge variant="secondary">In Progress</Badge>
                    ) : (
                      <Badge variant="outline">Pending</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{cp.completedSteps}/{cp.totalSteps}</span>
                    <span className="text-sm font-medium w-10 text-right">{cpProgress}%</span>
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="ml-7 mt-2 space-y-2 pb-2">
                  {cp.steps.map(step => (
                    <StepRow key={step.jobCardId} step={step} onAction={handleAction} />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )
        })}
      </div>

      {/* Assembly */}
      {order.assembly && (
        <div className="space-y-2">
          <h2 className="font-medium text-sm text-muted-foreground px-1">Assembly</h2>
          <Collapsible open={assemblyExpanded} onOpenChange={setAssemblyExpanded}>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer">
                <div className="flex items-center gap-3">
                  {assemblyExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <span className="font-medium">Final Assembly</span>
                  <StatusBadge status={order.assembly.productionStatus} />
                  {!order.canStartAssembly && order.assembly.productionStatus === 'Pending' && (
                    <span className="text-xs text-amber-600">Waiting for all child parts</span>
                  )}
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="ml-7 mt-2 pb-2">
                <StepRow step={order.assembly} onAction={handleAction} />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

      {/* QC Status */}
      <div className="space-y-2">
        <h2 className="font-medium text-sm text-muted-foreground px-1">Quality Control</h2>
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
          {progress === 100 && order.assembly?.productionStatus === 'Completed' ? (
            <>
              <Clock className="h-5 w-5 text-amber-600" />
              <span className="font-medium text-amber-700">Awaiting QC inspection</span>
            </>
          ) : progress < 100 ? (
            <>
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              <span className="text-muted-foreground">Complete all processes first</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-700">Ready for dispatch</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
