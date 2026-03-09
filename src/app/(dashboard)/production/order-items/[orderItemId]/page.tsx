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
  ShieldCheck,
  XCircle,
  FileUp,
  RefreshCw,
  Truck,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api/axios-config'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { qcService, OrderItemQCResponse } from '@/lib/api/qc'
import { vendorService, VendorResponse } from '@/lib/api/vendors'
import { ospService } from '@/lib/api/osp'

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
  assemblySteps: ProductionStepItem[]
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
function StepRow({ step, onAction, onSendToVendor }: {
  step: ProductionStepItem
  onAction: (jobCardId: number, action: string) => Promise<void>
  onSendToVendor?: (step: ProductionStepItem) => void
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
          step.isOsp ? (
            <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white h-7 px-2 text-xs" onClick={() => onSendToVendor?.(step)}>
              <Truck className="h-3 w-3 mr-1" /> Send to Vendor
            </Button>
          ) : (
            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-7 px-2 text-xs" onClick={() => doAction('start')}>
              <Play className="h-3 w-3 mr-1" /> Start
            </Button>
          )
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

// ── Send to Vendor (OSP) Dialog ───────────────────────────────────────────────
function SendToVendorDialog({
  step, vendors, onClose, onSent,
}: {
  step: ProductionStepItem | null
  vendors: VendorResponse[]
  onClose: () => void
  onSent: () => void
}) {
  const [vendorId, setVendorId] = useState('')
  const [sentDate, setSentDate] = useState(new Date().toISOString().slice(0, 10))
  const [expectedReturn, setExpectedReturn] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (step) { setVendorId(''); setSentDate(new Date().toISOString().slice(0, 10)); setExpectedReturn(''); setNotes('') }
  }, [step])

  async function save() {
    if (!step) return
    if (!vendorId || !sentDate || !expectedReturn) { toast.error('Fill all required fields'); return }
    setSaving(true)
    try {
      await ospService.create({
        jobCardId: step.jobCardId,
        vendorId: Number(vendorId),
        quantity: step.quantity,
        sentDate,
        expectedReturnDate: expectedReturn,
        notes: notes || null,
        createdBy: 'Admin',
      })
      toast.success(`${step.processName} sent to vendor`)
      onSent(); onClose()
    } catch (e: any) {
      toast.error(e.message || 'Failed to send to vendor')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={!!step} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-orange-600" /> Send to Vendor (OSP)
          </DialogTitle>
        </DialogHeader>
        {step && (
          <div className="space-y-3 py-1">
            <div className="rounded-md bg-muted/40 px-3 py-2 text-sm space-y-0.5">
              <div><span className="text-muted-foreground">Job Card: </span><strong className="font-mono text-xs">{step.jobCardNo}</strong></div>
              <div><span className="text-muted-foreground">Process: </span>{step.processName}</div>
              <div><span className="text-muted-foreground">Quantity: </span>{step.quantity} pcs</div>
            </div>
            <div className="space-y-1.5">
              <Label>Vendor <span className="text-red-500">*</span></Label>
              <Select value={vendorId} onValueChange={setVendorId}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select vendor" /></SelectTrigger>
                <SelectContent className="max-h-52">
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={String(v.id)}>
                      {v.vendorName}{v.city && <span className="ml-1 text-xs text-muted-foreground">· {v.city}</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Sent Date <span className="text-red-500">*</span></Label>
                <Input type="date" value={sentDate} onChange={(e) => setSentDate(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label>Expected Return <span className="text-red-500">*</span></Label>
                <Input type="date" value={expectedReturn} onChange={(e) => setExpectedReturn(e.target.value)} className="h-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} className="h-9" placeholder="Optional" />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="gap-1 bg-orange-600 hover:bg-orange-700 text-white">
            {saving ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Truck className="h-3 w-3" />}
            Send to Vendor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── QC Submit Dialog ──────────────────────────────────────────────────────────
function QCSubmitDialog({
  open, onClose, orderId, orderItemId, orderLabel, productName, onSubmitted,
}: {
  open: boolean
  onClose: () => void
  orderId: number
  orderItemId: number
  orderLabel: string
  productName: string
  onSubmitted: (rec: OrderItemQCResponse) => void
}) {
  const [qcStatus, setQcStatus] = useState<'Passed' | 'Failed'>('Passed')
  const [qcBy, setQcBy] = useState('')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) { setQcStatus('Passed'); setQcBy(''); setNotes(''); setFile(null) }
  }, [open])

  async function save() {
    if (!qcBy.trim()) { toast.error('Enter QC completed by name'); return }
    setSaving(true)
    try {
      const rec = await qcService.submitQC(orderItemId, orderId, qcStatus, qcBy.trim(), notes, file)
      toast.success(qcStatus === 'Passed' ? 'QC Passed — ready for dispatch' : 'QC marked as failed')
      onSubmitted(rec)
    } catch (e: any) {
      toast.error(e.message || 'Failed to submit QC')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            Quality Check — {orderLabel}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="rounded-md bg-muted/40 px-3 py-2 text-sm">
            <div><span className="text-muted-foreground">Product: </span>{productName}</div>
          </div>
          <div className="space-y-1.5">
            <Label>QC Result <span className="text-red-500">*</span></Label>
            <Select value={qcStatus} onValueChange={(v) => setQcStatus(v as 'Passed' | 'Failed')}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Passed">
                  <span className="flex items-center gap-2 text-green-700">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Passed
                  </span>
                </SelectItem>
                <SelectItem value="Failed">
                  <span className="flex items-center gap-2 text-red-700">
                    <XCircle className="h-3.5 w-3.5" /> Failed
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>QC Completed By <span className="text-red-500">*</span></Label>
            <Input value={qcBy} onChange={(e) => setQcBy(e.target.value)} placeholder="Inspector name" className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observations, defects, etc." className="resize-none h-20 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5"><FileUp className="h-3.5 w-3.5" />Certificate PDF (optional)</Label>
            <Input type="file" accept=".pdf,application/pdf" className="h-9 text-sm" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            {file && <p className="text-xs text-muted-foreground truncate">{file.name}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button
            onClick={save}
            disabled={saving || !qcBy.trim()}
            className={`gap-1 ${qcStatus === 'Passed' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
          >
            {saving ? <RefreshCw className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3 w-3" />}
            {qcStatus === 'Passed' ? 'Mark Passed' : 'Mark Failed'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function OrderItemProductionPage() {
  const params = useParams()
  const orderItemId = params.orderItemId as string

  const [order, setOrder] = useState<ProductionOrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [expandedParts, setExpandedParts] = useState<Set<string>>(new Set())
  const [assemblyExpanded, setAssemblyExpanded] = useState(false)
  const [qcRecord, setQcRecord] = useState<OrderItemQCResponse | null>(null)
  const [qcDialogOpen, setQcDialogOpen] = useState(false)
  const [vendors, setVendors] = useState<VendorResponse[]>([])
  const [ospStep, setOspStep] = useState<ProductionStepItem | null>(null)

  const loadOrder = useCallback(async (silent = false) => {
    if (!silent) { setLoading(true); setErrorMsg(null) }
    try {
      const res = await apiClient.get<{ success: boolean; data: ProductionOrderDetail; message?: string }>(
        `/production/order-items/${orderItemId}`
      )
      const data = res.data
      if (data.success) {
        setOrder(data.data)
        if (!silent) {
          setExpandedParts(new Set(data.data.childParts.map(cp =>
            String(cp.childPartId ?? cp.childPartName)
          )))
          setAssemblyExpanded(true)
        }
      } else {
        setErrorMsg(data.message ?? 'Failed to load order item')
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Failed to load order item'
      if (!silent) setErrorMsg(msg)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [orderItemId])

  useEffect(() => { loadOrder() }, [loadOrder])

  // Load QC status for this order item
  useEffect(() => {
    if (!orderItemId) return
    qcService.getByOrderItem(Number(orderItemId))
      .then(setQcRecord)
      .catch(() => {})
  }, [orderItemId])

  // Load vendors for OSP dialog
  useEffect(() => {
    vendorService.getAll().then(setVendors).catch(() => {})
  }, [])

  const handleAction = async (jobCardId: number, action: string) => {
    try {
      const res = await apiClient.post<{ success: boolean; message?: string }>(
        `/production/job-cards/${jobCardId}/action`,
        { action, completedQty: 0, rejectedQty: 0 }
      )
      if (res.data.success) {
        toast.success(res.data.message ?? `Action '${action}' successful`)
        loadOrder(true)
      } else {
        toast.error(res.data.message ?? 'Action failed')
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Network error')
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
    const isNotScheduled = errorMsg?.toLowerCase().includes('no job cards')
    return (
      <div className="p-6">
        <Link href="/production">
          <Button variant="ghost" size="sm"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
        </Link>
        <Card className="mt-4">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="font-medium">
              {isNotScheduled ? 'No job cards scheduled yet' : 'Order Item Not Found'}
            </p>
            {isNotScheduled && (
              <p className="text-sm text-muted-foreground mt-2">
                Go to <Link href="/scheduling" className="underline text-blue-600">Scheduling</Link> to assign machines to job cards first.
              </p>
            )}
            {errorMsg && !isNotScheduled && (
              <p className="text-xs text-muted-foreground mt-2">{errorMsg}</p>
            )}
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
                    <StepRow key={step.jobCardId} step={step} onAction={handleAction} onSendToVendor={(s) => setOspStep(s)} />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )
        })}
      </div>

      {/* Assembly */}
      {order.assemblySteps.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-medium text-sm text-muted-foreground px-1">Assembly</h2>
          <Collapsible open={assemblyExpanded} onOpenChange={setAssemblyExpanded}>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer">
                <div className="flex items-center gap-3">
                  {assemblyExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <span className="font-medium">Final Assembly</span>
                  <StatusBadge status={
                    order.assemblySteps.every(s => s.productionStatus === 'Completed') ? 'Completed'
                    : order.assemblySteps.some(s => s.productionStatus === 'InProgress') ? 'InProgress'
                    : order.assemblySteps.some(s => s.productionStatus === 'Paused') ? 'Paused'
                    : order.assemblySteps.some(s => s.productionStatus === 'Ready') ? 'Ready'
                    : 'Pending'
                  } />
                  {!order.canStartAssembly && order.assemblySteps[0]?.productionStatus === 'Pending' && (
                    <span className="text-xs text-amber-600">Waiting for all child parts</span>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {order.assemblySteps.filter(s => s.productionStatus === 'Completed').length}/{order.assemblySteps.length}
                </span>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="ml-7 mt-2 space-y-2 pb-2">
                {order.assemblySteps.map(step => (
                  <StepRow key={step.jobCardId} step={step} onAction={handleAction} onSendToVendor={(s) => setOspStep(s)} />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

      {/* QC Status */}
      {order.assemblySteps.length > 0 && (() => {
        const allAssemblyDone = order.assemblySteps.every(s => s.productionStatus === 'Completed')
        return (
        <div className="space-y-2">
          <h2 className="font-medium text-sm text-muted-foreground px-1 flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            Quality Control
          </h2>
          <div className={`flex items-center gap-3 p-4 rounded-lg border ${
            qcRecord?.qcStatus === 'Passed'
              ? 'bg-green-50 border-green-200'
              : qcRecord?.qcStatus === 'Failed'
              ? 'bg-red-50 border-red-200'
              : allAssemblyDone
              ? 'bg-amber-50 border-amber-200'
              : 'bg-card border-border'
          }`}>
            {!allAssemblyDone ? (
              <>
                <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground text-sm">Complete assembly first before QC can be submitted</span>
              </>
            ) : qcRecord?.qcStatus === 'Passed' ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-green-700 text-sm">QC Passed — Ready for Dispatch</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    By {qcRecord.qcCompletedBy ?? '—'}
                    {qcRecord.qcCompletedAt && ` · ${new Date(qcRecord.qcCompletedAt).toLocaleDateString()}`}
                  </p>
                  {qcRecord.notes && <p className="text-xs text-muted-foreground">{qcRecord.notes}</p>}
                </div>
                {qcRecord.certificatePath && (
                  <a href={qcRecord.certificatePath} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1 shrink-0">
                      <FileUp className="h-3 w-3" /> Certificate
                    </Button>
                  </a>
                )}
              </>
            ) : qcRecord?.qcStatus === 'Failed' ? (
              <>
                <XCircle className="h-5 w-5 text-red-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-red-700 text-sm">QC Failed</p>
                  {qcRecord.notes && <p className="text-xs text-muted-foreground">{qcRecord.notes}</p>}
                </div>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs gap-1 shrink-0"
                  onClick={() => setQcDialogOpen(true)}
                >
                  <ShieldCheck className="h-3.5 w-3.5" /> Re-submit QC
                </Button>
              </>
            ) : (
              <>
                <Clock className="h-5 w-5 text-amber-600 shrink-0" />
                <span className="font-medium text-amber-700 text-sm flex-1">Assembly complete — awaiting QC sign-off</span>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs gap-1 shrink-0"
                  onClick={() => setQcDialogOpen(true)}
                >
                  <ShieldCheck className="h-3.5 w-3.5" /> Submit QC
                </Button>
              </>
            )}
          </div>
        </div>
        )
      })()}

      {/* QC Submit Dialog */}
      <QCSubmitDialog
        open={qcDialogOpen}
        onClose={() => setQcDialogOpen(false)}
        orderId={order.orderId}
        orderItemId={Number(orderItemId)}
        orderLabel={order.orderNo}
        productName={order.productName ?? ''}
        onSubmitted={(rec) => { setQcRecord(rec); setQcDialogOpen(false) }}
      />

      {/* OSP Send to Vendor Dialog */}
      <SendToVendorDialog
        step={ospStep}
        vendors={vendors}
        onClose={() => setOspStep(null)}
        onSent={() => loadOrder(true)}
      />
    </div>
  )
}
