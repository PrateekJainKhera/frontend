'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import {
  ChevronDown, ChevronRight, CheckCircle, Lock, Clock, RefreshCw, Layers, Truck, Play,
  ShieldCheck, FileUp, XCircle, Search, X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  productionService, ExecutionViewCategory, ExecutionViewRow,
} from '@/lib/api/production'
import { ospService } from '@/lib/api/osp'
import { schedulingPlannerService } from '@/lib/api/scheduling-planner'
import { vendorService, VendorResponse } from '@/lib/api/vendors'
import { qcService, QCPendingItem } from '@/lib/api/qc'

// ── Status helpers ────────────────────────────────────────────────────────────

const statusBadge = (status: string, isLocked: boolean) => {
  if (isLocked)
    return <Badge variant="outline" className="bg-gray-100 text-gray-500 border-gray-300 text-xs">Waiting</Badge>
  switch (status) {
    case 'Ready':
      return <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 text-xs">Ready</Badge>
    case 'InProgress':
      return <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300 text-xs">In Progress</Badge>
    case 'Paused':
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300 text-xs">Paused</Badge>
    case 'Completed':
      return <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 text-xs">Completed</Badge>
    default:
      return <Badge variant="outline" className="text-xs">{status}</Badge>
  }
}

// ── Per-row submission state ──────────────────────────────────────────────────

interface RowState {
  checked: boolean
  completedQty: string
  rejectedQty: string
  submitting: boolean
}

// ── Single-row Send to Vendor dialog ─────────────────────────────────────────

function LogToOSPDialog({
  row, vendors, onClose, onLogged,
}: {
  row: ExecutionViewRow | null
  vendors: VendorResponse[]
  onClose: () => void
  onLogged: () => void
}) {
  const [vendorId, setVendorId] = useState('')
  const [sentDate, setSentDate] = useState(new Date().toISOString().slice(0, 10))
  const [expectedReturn, setExpectedReturn] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (row) {
      setVendorId(''); setSentDate(new Date().toISOString().slice(0, 10))
      setExpectedReturn(''); setNotes('')
    }
  }, [row])

  async function save() {
    if (!row) return
    if (!vendorId || !sentDate || !expectedReturn) { toast.error('Fill all required fields'); return }
    setSaving(true)
    try {
      await ospService.create({
        jobCardId: row.jobCardId, vendorId: Number(vendorId),
        quantity: row.quantity, sentDate,
        expectedReturnDate: expectedReturn,
        notes: notes || null, createdBy: 'Admin',
      })
      toast.success(`${row.jobCardNo} sent to vendor`)
      onLogged(); onClose()
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  return (
    <Dialog open={!!row} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Send to Vendor (OSP)</DialogTitle></DialogHeader>
        {row && (
          <div className="space-y-3 py-1">
            <div className="rounded-md bg-muted/40 px-3 py-2 text-sm space-y-0.5">
              <div><span className="text-muted-foreground">Job Card: </span><strong className="font-mono">{row.jobCardNo}</strong></div>
              <div><span className="text-muted-foreground">Process: </span>{row.processName}</div>
              <div><span className="text-muted-foreground">Part: </span>{row.childPartName}</div>
              <div><span className="text-muted-foreground">Order: </span>{row.orderNo}</div>
              <div><span className="text-muted-foreground">Quantity: </span>{row.quantity} pcs</div>
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

// ── Batch Send to Vendor dialog ───────────────────────────────────────────────

function BatchOSPDialog({
  jobCards, vendors, onClose, onSent,
}: {
  jobCards: ExecutionViewRow[]
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
    setVendorId(''); setSentDate(new Date().toISOString().slice(0, 10))
    setExpectedReturn(''); setNotes('')
  }, [jobCards.length])

  const open = jobCards.length > 0

  async function save() {
    if (!vendorId || !sentDate || !expectedReturn) { toast.error('Fill all required fields'); return }
    setSaving(true)
    try {
      const ids = await ospService.batchCreate({
        jobCardIds: jobCards.map((j) => j.jobCardId),
        vendorId: Number(vendorId),
        sentDate,
        expectedReturnDate: expectedReturn,
        notes: notes || null,
        createdBy: 'Admin',
      })
      toast.success(`${ids.length} job card(s) sent to vendor`)
      onSent(); onClose()
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Batch Send to Vendor ({jobCards.length} job cards)</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          {/* Summary of selected job cards */}
          <div className="rounded-md border max-h-36 overflow-y-auto">
            {jobCards.map((jc) => (
              <div key={jc.jobCardId} className="flex items-center gap-2 px-3 py-1.5 border-b last:border-b-0 text-sm">
                <span className="font-mono font-medium text-xs">{jc.jobCardNo}</span>
                <span className="text-muted-foreground text-xs">·</span>
                <span className="text-xs text-muted-foreground">{jc.processName}</span>
                <span className="text-muted-foreground text-xs">·</span>
                <span className="text-xs">{jc.childPartName}</span>
                <span className="ml-auto text-xs text-muted-foreground">{jc.quantity} pcs</span>
              </div>
            ))}
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
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="gap-1 bg-orange-600 hover:bg-orange-700 text-white">
            {saving ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Truck className="h-3 w-3" />}
            Send {jobCards.length} to Vendor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Single job card row ───────────────────────────────────────────────────────

function JobCardRow({
  row, state, ospChecked,
  onToggle, onOspToggle,
  onQtyChange, onSubmit, onStart, onLogOSP, onReportRejection,
}: {
  row: ExecutionViewRow
  state: RowState
  ospChecked: boolean
  onToggle: () => void
  onOspToggle: () => void
  onQtyChange: (field: 'completedQty' | 'rejectedQty', value: string) => void
  onSubmit: () => void
  onStart: () => void
  onLogOSP: () => void
  onReportRejection: () => void
}) {
  const isDone = row.productionStatus === 'Completed'
  const isLocked = row.isLocked
  const isOsp = row.isOsp
  const atVendor = isOsp && row.ospStatus === 'Sent'

  const bgClass = isDone
    ? 'bg-green-50 border-green-200'
    : isLocked
    ? 'bg-gray-50 border-gray-200 opacity-60'
    : atVendor
    ? 'bg-orange-50 border-orange-200'
    : isOsp && ospChecked
    ? 'bg-amber-100 border-amber-400'
    : isOsp
    ? 'bg-amber-50 border-amber-200 hover:border-amber-400'
    : state.checked
    ? 'bg-blue-50 border-blue-300'
    : 'bg-background border-border hover:border-muted-foreground/30'

  return (
    <div className={`rounded-lg border px-4 py-3 transition-colors ${bgClass}`}>
      <div className="flex items-center gap-3 flex-wrap">

        {/* Checkbox: OSP rows get their own checkbox (for batch send); in-house rows get in-house checkbox */}
        {isOsp && !isDone && !isLocked && !atVendor ? (
          <Checkbox
            checked={ospChecked}
            onCheckedChange={onOspToggle}
            className="shrink-0 border-amber-500 data-[state=checked]:bg-amber-500"
          />
        ) : !isOsp ? (
          <Checkbox
            checked={state.checked || isDone}
            disabled={isLocked || isDone}
            onCheckedChange={onToggle}
            className="shrink-0"
          />
        ) : (
          // OSP at-vendor or completed — no checkbox, just spacer
          <div className="w-4 shrink-0" />
        )}

        {/* Order number + product spec */}
        <span className="w-44 shrink-0">
          <span className="font-mono text-sm font-semibold block">{row.orderNo}</span>
          {(row.machineModel || row.rollerType || (row.numberOfTeeth ?? 0) > 0) && (
            <span className="text-xs text-muted-foreground">
              {[row.machineModel, row.rollerType, (row.numberOfTeeth ?? 0) > 0 ? `${row.numberOfTeeth}T` : null].filter(Boolean).join(' · ')}
            </span>
          )}
        </span>

        {/* Qty */}
        <span className="text-sm text-muted-foreground">
          Qty: <span className="font-medium text-foreground">{row.quantity}</span>
        </span>

        {/* Status */}
        {atVendor
          ? <Badge className="bg-orange-500 text-white text-xs gap-1"><Truck className="h-3 w-3" />At Vendor</Badge>
          : statusBadge(row.productionStatus, isLocked)
        }

        {/* OSP label */}
        {isOsp && !isDone && (
          <Badge variant="outline" className="text-xs border-amber-400 text-amber-700">OSP</Badge>
        )}

        {/* Rework label */}
        {row.isRework && (
          <Badge variant="outline" className="text-xs border-purple-400 text-purple-700 bg-purple-50">RW</Badge>
        )}

        {/* Machine (in-house only) */}
        {!isOsp && row.machineName && (
          <span className="text-xs text-muted-foreground border border-dashed border-border rounded px-2 py-0.5">
            {row.machineName}
          </span>
        )}

        {/* Waiting for */}
        {isLocked && row.waitingFor && (
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Lock className="h-3 w-3" />
            Waiting: {row.waitingFor}
          </span>
        )}

        {/* Completed summary */}
        {isDone && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-green-700 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Done: {row.completedQty} pcs
              {row.rejectedQty > 0 && ` · Rejected: ${row.rejectedQty}`}
            </span>
            {!isOsp && (
              <Button
                size="sm" variant="outline"
                className="h-6 text-xs gap-1 border-red-300 text-red-700 hover:bg-red-50"
                onClick={onReportRejection}
              >
                <XCircle className="h-3 w-3" /> Report Rejection
              </Button>
            )}
          </div>
        )}

        {/* OSP action: single Send to Vendor (when not batch-selected) */}
        {isOsp && !isDone && !isLocked && !atVendor && !ospChecked && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1 ml-auto border-orange-400 text-orange-700 hover:bg-orange-50"
            onClick={onLogOSP}
          >
            <Truck className="h-3 w-3" />
            Send to Vendor
          </Button>
        )}

        {/* Start button for Ready in-house rows */}
        {!isOsp && !isLocked && !isDone && row.productionStatus === 'Ready' && !state.checked && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1 ml-auto border-blue-500 text-blue-700 hover:bg-blue-50"
            disabled={state.submitting}
            onClick={onStart}
          >
            {state.submitting
              ? <RefreshCw className="h-3 w-3 animate-spin" />
              : <Play className="h-3 w-3" />}
            Start
          </Button>
        )}
      </div>

      {/* Expanded qty entry (in-house only): shown when checked OR already InProgress */}
      {!isOsp && (state.checked || row.productionStatus === 'InProgress') && !isDone && !isLocked && (
        <div className="mt-3 flex items-end gap-4 flex-wrap border-t border-blue-200 pt-3">
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Completed Qty</Label>
            <Input
              type="number" min={0} max={row.quantity}
              value={state.completedQty}
              onChange={(e) => onQtyChange('completedQty', e.target.value)}
              className="h-8 w-24 text-sm" placeholder="0"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Rejected Qty</Label>
            <Input
              type="number" min={0} max={row.quantity}
              value={state.rejectedQty}
              onChange={(e) => onQtyChange('rejectedQty', e.target.value)}
              className="h-8 w-24 text-sm" placeholder="0"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm" className="h-8 bg-green-600 hover:bg-green-700 text-white"
              disabled={state.submitting || (!state.completedQty && !state.rejectedQty)}
              onClick={onSubmit}
            >
              {state.submitting
                ? <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                : <CheckCircle className="h-3 w-3 mr-1" />}
              Complete
            </Button>
            <Button size="sm" variant="ghost" className="h-8" onClick={onToggle} disabled={state.submitting}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Report Rejection / Full Rework Dialog ─────────────────────────────────────

function ReportRejectionDialog({
  row, onClose, onSaved,
}: { row: ExecutionViewRow | null; onClose: () => void; onSaved: () => void }) {
  const [rejectedQty, setRejectedQty] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (row) {
      setRejectedQty(String(row.rejectedQty > 0 ? row.rejectedQty : row.quantity))
      setReason('')
    }
  }, [row])

  if (!row) return null

  async function save() {
    if (!row) return
    if (!reason.trim()) { toast.error('Reason is required'); return }
    const qty = Number(rejectedQty)
    if (!qty || qty <= 0) { toast.error('Enter rejected quantity'); return }

    setSaving(true)
    try {
      const newIds = await schedulingPlannerService.createFullRework(
        row.jobCardId, qty, reason.trim(), 'Admin'
      )
      toast.success(`Full rework started — ${newIds.length} new job card(s) created`)
      onSaved(); onClose()
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  return (
    <Dialog open={!!row} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle className="text-red-700">Report Rejection — Full Rework</DialogTitle></DialogHeader>
        <div className="space-y-3 py-1">
          <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm space-y-0.5">
            <p><span className="font-medium">{row.jobCardNo ?? row.orderNo}</span> · {row.processName}</p>
            <p className="text-muted-foreground">{row.childPartName}</p>
            <p className="text-xs text-red-700 font-medium mt-1">
              All job cards for this child part will be re-created from Step 1. A new rework cycle begins.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Rejected Qty <span className="text-red-500">*</span></Label>
            <Input
              type="number" min={1} max={row.quantity}
              value={rejectedQty}
              onChange={(e) => setRejectedQty(e.target.value)}
              className="h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Reason for Rejection <span className="text-red-500">*</span></Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-9"
              placeholder="e.g. Dimension out of tolerance, surface defect..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving || !reason.trim()} className="gap-1 bg-red-600 hover:bg-red-700 text-white">
            {saving ? <RefreshCw className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
            Confirm Full Rework
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── QC Submit Dialog ──────────────────────────────────────────────────────────

function SubmitQCDialog({
  item, onClose, onSubmitted,
}: {
  item: QCPendingItem | null
  onClose: () => void
  onSubmitted: () => void
}) {
  const [qcStatus, setQcStatus] = useState<'Passed' | 'Failed'>('Passed')
  const [qcBy, setQcBy] = useState('')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (item) {
      setQcStatus('Passed'); setQcBy(''); setNotes(''); setFile(null)
    }
  }, [item])

  async function save() {
    if (!item) return
    if (!qcBy.trim()) { toast.error('Enter QC completed by name'); return }
    setSaving(true)
    try {
      await qcService.submitQC(item.orderItemId, item.orderId, qcStatus, qcBy.trim(), notes, file)
      toast.success(qcStatus === 'Passed'
        ? `QC Passed — ${item.orderNo}-${item.itemSequence} is ready for dispatch`
        : `QC Failed — ${item.orderNo}-${item.itemSequence} marked as failed`)
      onSubmitted()
      onClose()
    } catch (e: any) {
      toast.error(e.message || 'Failed to submit QC')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={!!item} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            Quality Check (QC)
          </DialogTitle>
        </DialogHeader>

        {item && (
          <div className="space-y-4 py-1">
            {/* Order info */}
            <div className="rounded-md bg-muted/40 px-3 py-2 text-sm space-y-0.5">
              <div><span className="text-muted-foreground">Order: </span><strong className="font-mono">{item.orderNo}-{item.itemSequence}</strong></div>
              <div><span className="text-muted-foreground">Product: </span>{item.productName}</div>
              <div><span className="text-muted-foreground">Customer: </span>{item.customerName}</div>
              <div><span className="text-muted-foreground">Qty: </span>{item.quantity} pcs</div>
              {item.qcStatus === 'Failed' && (
                <div className="flex items-center gap-1 text-red-600 mt-1">
                  <XCircle className="h-3 w-3" />
                  <span className="text-xs">Previous QC: Failed — re-submitting</span>
                </div>
              )}
            </div>

            {/* QC Result */}
            <div className="space-y-1.5">
              <Label>QC Result <span className="text-red-500">*</span></Label>
              <Select value={qcStatus} onValueChange={(v) => setQcStatus(v as 'Passed' | 'Failed')}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Passed">
                    <span className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="h-3.5 w-3.5" /> Passed
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

            {/* QC By */}
            <div className="space-y-1.5">
              <Label>QC Completed By <span className="text-red-500">*</span></Label>
              <Input
                value={qcBy}
                onChange={(e) => setQcBy(e.target.value)}
                placeholder="Inspector name"
                className="h-9"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observations, defects found, etc."
                className="resize-none h-20 text-sm"
              />
            </div>

            {/* Certificate PDF */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <FileUp className="h-3.5 w-3.5" />
                QC Certificate (PDF) — optional
              </Label>
              <Input
                type="file"
                accept=".pdf,application/pdf"
                className="h-9 text-sm"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {file && (
                <p className="text-xs text-muted-foreground truncate">{file.name}</p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button
            onClick={save}
            disabled={saving || !qcBy.trim()}
            className={`gap-1 ${qcStatus === 'Passed'
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-red-600 hover:bg-red-700 text-white'}`}
          >
            {saving
              ? <RefreshCw className="h-3 w-3 animate-spin" />
              : <ShieldCheck className="h-3 w-3" />}
            {qcStatus === 'Passed' ? 'Mark Passed' : 'Mark Failed'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── QC Section (bottom of execution page) ────────────────────────────────────

function QCSection({ onRefreshExecution }: { onRefreshExecution: () => void }) {
  const [items, setItems] = useState<QCPendingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(true)
  const [dialogItem, setDialogItem] = useState<QCPendingItem | null>(null)

  const loadQC = useCallback(async () => {
    setLoading(true)
    try {
      const data = await qcService.getPending()
      setItems(data)
      if (data.length > 0) setExpanded(true)
    } catch {
      // silent — QC section is non-critical
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadQC() }, [loadQC])

  if (!loading && items.length === 0) return null  // hide section when nothing pending

  const failedCount = items.filter((i) => i.qcStatus === 'Failed').length

  return (
    <div className="border-2 border-blue-200 rounded-lg overflow-hidden">
      {/* Section header */}
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left bg-blue-50 hover:bg-blue-100 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3">
          {expanded ? <ChevronDown className="h-4 w-4 text-blue-600" /> : <ChevronRight className="h-4 w-4 text-blue-600" />}
          <ShieldCheck className="h-4 w-4 text-blue-600" />
          <span className="font-semibold text-base text-blue-900">Quality Check (QC)</span>
          <Badge className="bg-blue-600 text-white text-xs">{items.length} pending</Badge>
          {failedCount > 0 && (
            <Badge className="bg-red-500 text-white text-xs">{failedCount} failed</Badge>
          )}
        </div>
        <span className="text-xs text-blue-700">Assembly complete — awaiting QC sign-off before dispatch</span>
      </button>

      {expanded && (
        <div className="px-5 py-4 space-y-2 bg-background">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
              <RefreshCw className="h-4 w-4 animate-spin" /> Loading...
            </div>
          ) : (
            items.map((item) => {
              const isFailed = item.qcStatus === 'Failed'
              return (
                <div
                  key={item.orderItemId}
                  className={`rounded-lg border px-4 py-3 flex items-center gap-4 flex-wrap transition-colors ${
                    isFailed ? 'bg-red-50 border-red-200' : 'bg-background border-border'
                  }`}
                >
                  <span className="font-mono text-sm font-semibold w-36 shrink-0">
                    {item.orderNo}-{item.itemSequence}
                  </span>

                  <span className="text-sm text-muted-foreground flex-1 min-w-0 truncate">
                    {item.productName}
                    {item.customerName && <span className="text-xs ml-1">· {item.customerName}</span>}
                  </span>

                  <span className="text-sm text-muted-foreground shrink-0">Qty: {item.quantity}</span>

                  {isFailed ? (
                    <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 text-xs shrink-0">
                      <XCircle className="h-3 w-3 mr-1" />QC Failed
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300 text-xs shrink-0">
                      Awaiting QC
                    </Badge>
                  )}

                  <Button
                    size="sm"
                    className="h-7 text-xs gap-1 ml-auto bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                    onClick={() => setDialogItem(item)}
                  >
                    <ShieldCheck className="h-3 w-3" />
                    {isFailed ? 'Re-submit QC' : 'Submit QC'}
                  </Button>
                </div>
              )
            })
          )}
        </div>
      )}

      <SubmitQCDialog
        item={dialogItem}
        onClose={() => setDialogItem(null)}
        onSubmitted={() => { loadQC(); onRefreshExecution() }}
      />
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ProductionExecutionPage() {
  const [categories, setCategories] = useState<ExecutionViewCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [rowStates, setRowStates] = useState<Record<number, RowState>>({})
  const [submittingCategory, setSubmittingCategory] = useState<string | null>(null)
  // Single OSP dialog
  const [ospDialogRow, setOspDialogRow] = useState<ExecutionViewRow | null>(null)
  // Batch OSP state
  const [ospChecked, setOspChecked] = useState<Record<number, boolean>>({})
  const [batchOspRows, setBatchOspRows] = useState<ExecutionViewRow[]>([])
  const [vendors, setVendors] = useState<VendorResponse[]>([])
  // Rework dialog
  const [reworkRow, setReworkRow] = useState<ExecutionViewRow | null>(null)

  // ── Filter state ──────────────────────────────────────────────────────────
  const [searchText, setSearchText] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterChildPart, setFilterChildPart] = useState('')
  const [filterProcess, setFilterProcess] = useState('')
  const [filterOrder, setFilterOrder] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await productionService.getExecutionView()
      setCategories(data)

      const toExpand = new Set<string>()
      data.forEach((cat) => {
        if (cat.readyJobs > 0 || cat.inProgressJobs > 0) toExpand.add(cat.categoryName)
      })
      setExpandedCategories(toExpand)

      setRowStates((prev) => {
        const next = { ...prev }
        data.forEach((cat) =>
          cat.childParts.forEach((cp) =>
            cp.jobCards.forEach((jc) => {
              if (!next[jc.jobCardId]) {
                next[jc.jobCardId] = {
                  checked: false,
                  completedQty: String(jc.quantity),
                  rejectedQty: '0',
                  submitting: false,
                }
              }
            })
          )
        )
        return next
      })
    } catch {
      toast.error('Failed to load execution view')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    vendorService.getAll().then(setVendors).catch(() => {})
  }, [])

  useEffect(() => { load() }, [load])

  // ── Derived filter options (from full dataset) ────────────────────────────
  const uniqueChildParts = useMemo(
    () => [...new Set(categories.flatMap((c) => c.childParts.map((cp) => cp.childPartName)))].sort(),
    [categories]
  )
  const uniqueProcesses = useMemo(
    () => [...new Set(categories.flatMap((c) => c.childParts.flatMap((cp) => cp.jobCards.map((jc) => jc.processName).filter((p): p is string => !!p))))].sort(),
    [categories]
  )
  const uniqueOrders = useMemo(
    () => [...new Set(categories.flatMap((c) => c.childParts.flatMap((cp) => cp.jobCards.map((jc) => jc.orderNo))))].sort(),
    [categories]
  )

  const hasFilters = !!(searchText.trim() || filterCategory || filterChildPart || filterProcess || filterOrder)

  const filteredCategories = useMemo(() => {
    if (!hasFilters) return categories
    const q = searchText.toLowerCase().trim()
    return categories
      .filter((cat) => !filterCategory || cat.categoryName === filterCategory)
      .map((cat) => ({
        ...cat,
        childParts: cat.childParts
          .filter((cp) => !filterChildPart || cp.childPartName === filterChildPart)
          .map((cp) => ({
            ...cp,
            jobCards: cp.jobCards.filter((jc) => {
              if (filterProcess && jc.processName !== filterProcess) return false
              if (filterOrder && jc.orderNo !== filterOrder) return false
              if (q && ![jc.orderNo, jc.childPartName, jc.processName].some((s) => s?.toLowerCase().includes(q))) return false
              return true
            }),
          }))
          .filter((cp) => cp.jobCards.length > 0),
      }))
      .filter((cat) => cat.childParts.length > 0)
  }, [categories, hasFilters, searchText, filterCategory, filterChildPart, filterProcess, filterOrder])

  // Auto-expand matching categories when filters are active
  useEffect(() => {
    if (!hasFilters) return
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      filteredCategories.forEach((cat) => next.add(cat.categoryName))
      return next
    })
  }, [filteredCategories]) // filteredCategories changes whenever filters change

  const clearFilters = () => {
    setSearchText(''); setFilterCategory(''); setFilterChildPart('')
    setFilterProcess(''); setFilterOrder('')
  }

  const toggleCategory = (name: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  const toggleRow = (jobCardId: number) => {
    setRowStates((prev) => ({
      ...prev,
      [jobCardId]: { ...prev[jobCardId], checked: !prev[jobCardId]?.checked },
    }))
  }

  const toggleOspRow = (jobCardId: number) => {
    setOspChecked((prev) => ({ ...prev, [jobCardId]: !prev[jobCardId] }))
  }

  const changeQty = (jobCardId: number, field: 'completedQty' | 'rejectedQty', value: string) => {
    setRowStates((prev) => ({
      ...prev,
      [jobCardId]: { ...prev[jobCardId], [field]: value },
    }))
  }

  // ── In-house select all ───────────────────────────────────────────────────

  const getSelectableInCategory = (cat: ExecutionViewCategory) =>
    cat.childParts.flatMap((cp) =>
      cp.jobCards.filter((jc) =>
        jc.productionStatus !== 'Completed' && !jc.isLocked && !jc.isOsp
      )
    )

  const selectAllInCategory = (cat: ExecutionViewCategory) => {
    const selectable = getSelectableInCategory(cat)
    const allChecked = selectable.every((jc) => rowStates[jc.jobCardId]?.checked)
    setRowStates((prev) => {
      const next = { ...prev }
      selectable.forEach((jc) => {
        next[jc.jobCardId] = { ...next[jc.jobCardId], checked: !allChecked }
      })
      return next
    })
  }

  // ── OSP select all ────────────────────────────────────────────────────────

  const getOspSelectableInCategory = (cat: ExecutionViewCategory) =>
    cat.childParts.flatMap((cp) =>
      cp.jobCards.filter((jc) =>
        jc.isOsp && jc.productionStatus !== 'Completed' && !jc.isLocked && jc.ospStatus !== 'Sent'
      )
    )

  const selectAllOspInCategory = (cat: ExecutionViewCategory) => {
    const selectable = getOspSelectableInCategory(cat)
    const allChecked = selectable.every((jc) => ospChecked[jc.jobCardId])
    setOspChecked((prev) => {
      const next = { ...prev }
      selectable.forEach((jc) => { next[jc.jobCardId] = !allChecked })
      return next
    })
  }

  const openBatchOspDialog = (cat: ExecutionViewCategory) => {
    const selected = getOspSelectableInCategory(cat).filter((jc) => ospChecked[jc.jobCardId])
    if (selected.length === 0) return
    setBatchOspRows(selected)
  }

  // ── Submit in-house ───────────────────────────────────────────────────────

  const submitAllInCategory = async (cat: ExecutionViewCategory) => {
    const snapshot = rowStates
    const toSubmit = cat.childParts
      .flatMap((cp) => cp.jobCards)
      .filter((jc) =>
        snapshot[jc.jobCardId]?.checked &&
        jc.productionStatus !== 'Completed' &&
        !jc.isLocked && !jc.isOsp
      )
    if (toSubmit.length === 0) return

    setSubmittingCategory(cat.categoryName)
    setRowStates((prev) => {
      const next = { ...prev }
      toSubmit.forEach((jc) => { next[jc.jobCardId] = { ...next[jc.jobCardId], submitting: true } })
      return next
    })

    let successCount = 0, failCount = 0
    for (const row of toSubmit) {
      const st = snapshot[row.jobCardId]
      const completed = parseInt(st?.completedQty ?? '0') || 0
      const rejected = parseInt(st?.rejectedQty ?? '0') || 0
      if (completed + rejected === 0 || completed + rejected > row.quantity) { failCount++; continue }
      try {
        await productionService.jobCardAction(row.jobCardId, 'direct-complete', completed, rejected)
        successCount++
      } catch { failCount++ }
    }

    setSubmittingCategory(null)
    if (successCount > 0) toast.success(`${successCount} job card(s) marked complete`)
    if (failCount > 0) toast.error(`${failCount} job card(s) failed — check quantities`)
    await load()
  }

  const startRow = async (row: ExecutionViewRow) => {
    setRowStates((prev) => ({
      ...prev,
      [row.jobCardId]: { ...prev[row.jobCardId], submitting: true },
    }))
    try {
      await productionService.jobCardAction(row.jobCardId, 'start')
      toast.success(`${row.orderNo} — ${row.childPartName} started`)
      await load()
    } catch (err: any) {
      toast.error(err.message || 'Failed to start')
      setRowStates((prev) => ({
        ...prev,
        [row.jobCardId]: { ...prev[row.jobCardId], submitting: false },
      }))
    }
  }

  const submitRow = async (row: ExecutionViewRow) => {
    const state = rowStates[row.jobCardId]
    const completed = parseInt(state.completedQty) || 0
    const rejected = parseInt(state.rejectedQty) || 0

    if (completed + rejected === 0) { toast.error('Enter at least completed or rejected quantity'); return }
    if (completed + rejected > row.quantity) {
      toast.error(`Total (${completed + rejected}) cannot exceed quantity (${row.quantity})`); return
    }

    setRowStates((prev) => ({
      ...prev,
      [row.jobCardId]: { ...prev[row.jobCardId], submitting: true },
    }))

    try {
      await productionService.jobCardAction(row.jobCardId, 'direct-complete', completed, rejected)
      toast.success(`${row.orderNo} — ${row.childPartName} completed`)
      await load()
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit')
      setRowStates((prev) => ({
        ...prev,
        [row.jobCardId]: { ...prev[row.jobCardId], submitting: false },
      }))
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <RefreshCw className="h-5 w-5 animate-spin mr-2" />
        Loading execution view...
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-2">
        <Layers className="h-10 w-10 opacity-30" />
        <p className="text-sm">No scheduled job cards found.</p>
        <p className="text-xs">Schedule job cards first to see them here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Production Execution</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Process-wise view of all scheduled job cards
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-2">
        {/* Search — always full width */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search order, part, process..."
            className="pl-8 h-9"
          />
        </div>

        {/* Dropdowns: 2-col grid on mobile → flex row on sm+ */}
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <Select value={filterCategory || 'all'} onValueChange={(v) => setFilterCategory(v === 'all' ? '' : v)}>
            <SelectTrigger className="h-9 w-full sm:w-44">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.categoryName} value={cat.categoryName}>{cat.categoryName}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterChildPart || 'all'} onValueChange={(v) => setFilterChildPart(v === 'all' ? '' : v)}>
            <SelectTrigger className="h-9 w-full sm:w-44">
              <SelectValue placeholder="All Parts" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectItem value="all">All Parts</SelectItem>
              {uniqueChildParts.map((part) => (
                <SelectItem key={part} value={part}>{part}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterProcess || 'all'} onValueChange={(v) => setFilterProcess(v === 'all' ? '' : v)}>
            <SelectTrigger className="h-9 w-full sm:w-44">
              <SelectValue placeholder="All Processes" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectItem value="all">All Processes</SelectItem>
              {uniqueProcesses.map((proc) => (
                <SelectItem key={proc} value={proc}>{proc}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterOrder || 'all'} onValueChange={(v) => setFilterOrder(v === 'all' ? '' : v)}>
            <SelectTrigger className="h-9 w-full sm:w-36">
              <SelectValue placeholder="All Orders" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectItem value="all">All Orders</SelectItem>
              {uniqueOrders.map((ord) => (
                <SelectItem key={ord} value={ord}>{ord}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button
              variant="ghost" size="sm"
              className="h-9 col-span-2 sm:col-span-1 text-muted-foreground gap-1.5 border border-dashed border-border"
              onClick={clearFilters}
            >
              <X className="h-3.5 w-3.5" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* No results when filters active */}
      {filteredCategories.length === 0 && hasFilters && (
        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2 border-2 border-dashed border-border rounded-lg">
          <Search className="h-8 w-8 opacity-30" />
          <p className="text-sm">No job cards match current filters.</p>
          <Button variant="ghost" size="sm" onClick={clearFilters}>Clear filters</Button>
        </div>
      )}

      {/* Category sections */}
      {filteredCategories.map((cat) => {
        const isExpanded = expandedCategories.has(cat.categoryName)
        const allDone = cat.completedJobs === cat.totalJobs

        return (
          <div key={cat.categoryName} className="border-2 border-border rounded-lg overflow-hidden">
            {/* Category header */}
            <button
              className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors ${
                allDone
                  ? 'bg-green-50 hover:bg-green-100'
                  : cat.inProgressJobs > 0
                  ? 'bg-orange-50 hover:bg-orange-100'
                  : cat.readyJobs > 0
                  ? 'bg-blue-50 hover:bg-blue-100'
                  : 'bg-muted/40 hover:bg-muted/60'
              }`}
              onClick={() => toggleCategory(cat.categoryName)}
            >
              <div className="flex items-center gap-3">
                {isExpanded
                  ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                <span className="font-semibold text-base">{cat.categoryName}</span>
                {cat.categoryCode && (
                  <span className="text-xs text-muted-foreground font-mono">({cat.categoryCode})</span>
                )}
              </div>

              <div className="flex items-center gap-3 text-sm">
                {cat.inProgressJobs > 0 && (
                  <span className="flex items-center gap-1 text-orange-700">
                    <Clock className="h-3 w-3" />{cat.inProgressJobs} in progress
                  </span>
                )}
                {cat.readyJobs > 0 && (
                  <span className="text-blue-700 font-medium">{cat.readyJobs} ready</span>
                )}
                <span className="text-muted-foreground">{cat.completedJobs}/{cat.totalJobs} done</span>
                {allDone && <CheckCircle className="h-4 w-4 text-green-600" />}
              </div>
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div className="px-5 py-4 space-y-4 bg-background">

                {/* In-house select-all toolbar */}
                {(() => {
                  const selectable = getSelectableInCategory(cat)
                  if (selectable.length === 0) return null
                  const selectedCount = selectable.filter((jc) => rowStates[jc.jobCardId]?.checked).length
                  const allChecked = selectedCount === selectable.length
                  const isSubmitting = submittingCategory === cat.categoryName
                  return (
                    <div className="flex items-center justify-between border-b pb-3">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <Checkbox
                          checked={allChecked ? true : selectedCount > 0 ? 'indeterminate' : false}
                          onCheckedChange={() => selectAllInCategory(cat)}
                          disabled={isSubmitting}
                        />
                        <span className="text-sm text-muted-foreground">
                          {allChecked ? 'Deselect All' : 'Select All'}
                          <span className="ml-1 text-xs">({selectable.length} available)</span>
                        </span>
                      </label>
                      {selectedCount > 0 && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white gap-1 h-8"
                          disabled={isSubmitting}
                          onClick={() => submitAllInCategory(cat)}
                        >
                          {isSubmitting
                            ? <RefreshCw className="h-3 w-3 animate-spin" />
                            : <CheckCircle className="h-3 w-3" />}
                          Submit Selected ({selectedCount})
                        </Button>
                      )}
                    </div>
                  )
                })()}

                {/* OSP select-all toolbar */}
                {(() => {
                  const ospSelectable = getOspSelectableInCategory(cat)
                  if (ospSelectable.length === 0) return null
                  const ospSelectedCount = ospSelectable.filter((jc) => ospChecked[jc.jobCardId]).length
                  const allOspChecked = ospSelectedCount === ospSelectable.length
                  return (
                    <div className="flex items-center justify-between border border-amber-200 rounded-md bg-amber-50/60 px-3 py-2">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <Checkbox
                          checked={allOspChecked ? true : ospSelectedCount > 0 ? 'indeterminate' : false}
                          onCheckedChange={() => selectAllOspInCategory(cat)}
                          className="border-amber-500 data-[state=checked]:bg-amber-500"
                        />
                        <span className="text-sm text-amber-800">
                          OSP: {allOspChecked ? 'Deselect All' : 'Select All'}
                          <span className="ml-1 text-xs">({ospSelectable.length} ready to send)</span>
                        </span>
                      </label>
                      {ospSelectedCount > 0 && (
                        <Button
                          size="sm"
                          className="bg-orange-600 hover:bg-orange-700 text-white gap-1 h-8"
                          onClick={() => openBatchOspDialog(cat)}
                        >
                          <Truck className="h-3 w-3" />
                          Batch Send ({ospSelectedCount})
                        </Button>
                      )}
                    </div>
                  )
                })()}

                {/* Child parts + job cards */}
                <div className="space-y-6">
                  {cat.childParts.map((cp) => (
                    <div key={cp.childPartName}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-semibold text-foreground">{cp.childPartName}</span>
                        {cp.isReadyForAssembly && (
                          <Badge className="bg-green-600 text-white text-xs px-2 py-0">Ready for Assembly</Badge>
                        )}
                      </div>

                      <div className="space-y-2 pl-2">
                        {cp.jobCards.map((row) => (
                          <JobCardRow
                            key={row.jobCardId}
                            row={row}
                            state={rowStates[row.jobCardId] || {
                              checked: false,
                              completedQty: String(row.quantity),
                              rejectedQty: '0',
                              submitting: false,
                            }}
                            ospChecked={!!ospChecked[row.jobCardId]}
                            onToggle={() => toggleRow(row.jobCardId)}
                            onOspToggle={() => toggleOspRow(row.jobCardId)}
                            onQtyChange={(field, value) => changeQty(row.jobCardId, field, value)}
                            onSubmit={() => submitRow(row)}
                            onStart={() => startRow(row)}
                            onLogOSP={() => setOspDialogRow(row)}
                            onReportRejection={() => setReworkRow(row)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Single OSP send dialog */}
      <LogToOSPDialog
        row={ospDialogRow}
        vendors={vendors}
        onClose={() => setOspDialogRow(null)}
        onLogged={load}
      />

      {/* Batch OSP send dialog */}
      <BatchOSPDialog
        jobCards={batchOspRows}
        vendors={vendors}
        onClose={() => setBatchOspRows([])}
        onSent={() => {
          // Clear osp selections for sent rows
          setOspChecked((prev) => {
            const next = { ...prev }
            batchOspRows.forEach((r) => { delete next[r.jobCardId] })
            return next
          })
          load()
        }}
      />

      {/* Report Rejection / Full Rework dialog */}
      <ReportRejectionDialog row={reworkRow} onClose={() => setReworkRow(null)} onSaved={load} />

      {/* QC Section — shown at bottom when assembly-complete items need sign-off */}
      <QCSection onRefreshExecution={load} />
    </div>
  )
}
