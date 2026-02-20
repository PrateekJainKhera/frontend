'use client'

import { useState, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CheckCircle2,
  Clock,
  Search,
  Factory,
  Loader2,
  ChevronDown,
  ChevronRight,
  Wrench,
  RefreshCw,
  ArrowRight,
  Calendar,
  LayersIcon,
  ListChecks,
  CheckSquare,
  Square,
  AlertTriangle,
  XCircle,
  Cpu,
  RotateCcw,
  RotateCw,
  MoveRight,
} from 'lucide-react'
import { schedulingPlannerService } from '@/lib/api/scheduling-planner'
import { shiftService } from '@/lib/api/shifts'
import { scheduleService } from '@/lib/api/schedules'
import { jobCardService } from '@/lib/api/job-cards'
import { ScheduleMachineDialog } from '@/components/scheduling/schedule-machine-dialog'
import {
  SchedulableOrderV2,
  ChildPartJobGroup,
  JobCardForScheduling,
  CategoryMachineSuggestion,
  BatchScheduleV2Result,
  CreateScheduleV2Request,
} from '@/types/scheduling-planner'
import {
  OrderSchedulingTree,
  ProcessStepSchedulingItem,
} from '@/types/schedule'
import { Shift } from '@/types/shift'
import { toast } from 'sonner'
import { format } from 'date-fns'
import Link from 'next/link'

// ─── Helpers ───────────────────────────────────────────────────────────────

function priorityBadge(priority: string) {
  const p = priority?.toUpperCase()
  if (p === 'HIGH' || p === 'CRITICAL')
    return <Badge className="bg-red-100 text-red-700 border border-red-200 text-[10px] h-4 px-1.5">High</Badge>
  if (p === 'MEDIUM')
    return <Badge className="bg-amber-100 text-amber-700 border border-amber-200 text-[10px] h-4 px-1.5">Med</Badge>
  return <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] h-4 px-1.5">Low</Badge>
}

function fmtMin(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

// ─── Step Indicator ────────────────────────────────────────────────────────

const STEPS = ['Select Orders', 'Select Job Cards', 'Date & Shift', 'Assign Machines', 'Done']

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 shrink-0">
      {STEPS.map((label, idx) => {
        const stepNo = idx + 1
        const done = stepNo < current
        const active = stepNo === current
        return (
          <div key={stepNo} className="flex items-center">
            <div className="flex items-center gap-1.5">
              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-colors ${
                done ? 'bg-green-500 text-white' : active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : stepNo}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
                {label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`w-6 h-px mx-2 ${done ? 'bg-green-400' : 'bg-border'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Step 1: Order Selection ───────────────────────────────────────────────

interface Step1Props {
  orders: SchedulableOrderV2[]
  selectedOrderIds: Set<number>
  onToggle: (id: number) => void
  loading: boolean
  loadingNext: boolean
  onRefresh: () => void
  onNext: () => void
}

function Step1({ orders, selectedOrderIds, onToggle, loading, loadingNext, onRefresh, onNext }: Step1Props) {
  const [search, setSearch] = useState('')
  const filtered = orders.filter(o =>
    o.orderNo.toLowerCase().includes(search.toLowerCase()) ||
    (o.customerName ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-3 border-b bg-muted/20 shrink-0 flex items-center gap-3">
        <div className="flex items-center gap-2 bg-background border rounded-lg px-3 py-1 flex-1 max-w-xs">
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <Input
            placeholder="Search orders…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 h-6 px-0 text-xs"
          />
        </div>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onRefresh} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
        </Button>
        <div className="ml-auto flex items-center gap-2">
          {selectedOrderIds.size > 0 && (
            <span className="text-xs text-muted-foreground">{selectedOrderIds.size} selected</span>
          )}
          <Button
            size="sm"
            disabled={selectedOrderIds.size === 0 || loadingNext}
            onClick={onNext}
            className="h-7 text-xs gap-1"
          >
            {loadingNext
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Loading…</>
              : <>View Job Cards <ArrowRight className="h-3.5 w-3.5" /></>
            }
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
            <p className="text-sm font-medium">No orders ready for scheduling</p>
            <p className="text-xs">Ensure material is issued first via the Stores module.</p>
          </div>
        ) : (
          filtered.map(order => {
            const selected = selectedOrderIds.has(order.orderId)
            return (
              <div
                key={order.orderId}
                onClick={() => onToggle(order.orderId)}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors ${
                  selected ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'hover:bg-muted/30 bg-card'
                }`}
              >
                {selected
                  ? <CheckSquare className="h-4 w-4 text-primary shrink-0" />
                  : <Square className="h-4 w-4 text-muted-foreground shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{order.orderNo}</span>
                    {priorityBadge(order.priority)}
                    {order.customerName && (
                      <span className="text-xs text-muted-foreground truncate">{order.customerName}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                    <span className="text-blue-600 font-medium">{order.materialIssuedCount} material issued</span>
                    <span>·</span>
                    <span className="text-orange-600 font-medium">{order.readyToScheduleCount} ready to schedule</span>
                    {order.alreadyScheduledCount > 0 && (
                      <>
                        <span>·</span>
                        <span className="text-green-600">{order.alreadyScheduledCount} already scheduled</span>
                      </>
                    )}
                    {order.dueDate && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Due {format(new Date(order.dueDate), 'dd MMM')}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ─── Step 2: Job Card Selection ────────────────────────────────────────────

interface Step2Props {
  jobGroups: ChildPartJobGroup[]
  selectedJcIds: Set<number>
  onToggleJc: (id: number) => void
  onToggleGroup: (group: ChildPartJobGroup, select: boolean) => void
  onBack: () => void
  onNext: () => void
}

function Step2({ jobGroups, selectedJcIds, onToggleJc, onToggleGroup, onBack, onNext }: Step2Props) {
  const [expandedParts, setExpandedParts] = useState<Set<string>>(
    new Set(jobGroups.map(g => g.childPartName))
  )

  const togglePart = (name: string) =>
    setExpandedParts(prev => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n })

  const totalSelectable = jobGroups.flatMap(g => g.jobCards.filter(jc => jc.materialIssued && !jc.isAlreadyScheduled)).length
  const totalSelected = selectedJcIds.size

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-3 border-b bg-muted/20 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={onBack}>
            <ChevronRight className="h-3 w-3 rotate-180" /> Back
          </Button>
          <span className="text-xs text-muted-foreground">
            <span className="font-medium">{totalSelected}</span> of{' '}
            <span className="font-medium">{totalSelectable}</span> job cards selected
          </span>
        </div>
        <Button
          size="sm"
          disabled={selectedJcIds.size === 0}
          onClick={onNext}
          className="h-7 text-xs gap-1"
        >
          Date & Shift <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {jobGroups.map(group => {
          const expanded = expandedParts.has(group.childPartName)
          const isAsm = group.creationType === 'Assembly'
          const selectable = group.jobCards.filter(jc => jc.materialIssued && !jc.isAlreadyScheduled)
          const allSelected = selectable.length > 0 && selectable.every(jc => selectedJcIds.has(jc.jobCardId))

          return (
            <div key={group.childPartName} className="rounded-lg border-2 bg-card overflow-hidden">
              <div
                className="flex items-center gap-2 px-4 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors select-none"
                onClick={() => togglePart(group.childPartName)}
              >
                <span className="text-muted-foreground shrink-0">
                  {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </span>
                <span className={isAsm ? 'text-purple-500' : 'text-sky-500'}>
                  {isAsm ? <Wrench className="h-3.5 w-3.5" /> : <Factory className="h-3.5 w-3.5" />}
                </span>
                <span className="font-semibold text-sm flex-1">{group.childPartName}</span>
                <Badge variant="outline" className={`text-[10px] h-4 px-1 ${isAsm ? 'border-purple-200 text-purple-600' : 'border-sky-200 text-sky-600'}`}>
                  {isAsm ? 'Assembly' : 'Part'}
                </Badge>
                <span className="text-xs text-muted-foreground">{group.jobCards.length} job cards</span>
                {selectable.length > 0 && (
                  <button
                    className="text-[10px] text-primary hover:underline ml-1"
                    onClick={e => { e.stopPropagation(); onToggleGroup(group, !allSelected) }}
                  >
                    {allSelected ? 'Deselect all' : 'Select all'}
                  </button>
                )}
              </div>

              {expanded && (
                <div className="border-t divide-y">
                  {group.jobCards.map(jc => {
                    const selectable = jc.materialIssued && !jc.isAlreadyScheduled
                    const selected = selectable && selectedJcIds.has(jc.jobCardId)

                    return (
                      <div
                        key={jc.jobCardId}
                        onClick={() => selectable && onToggleJc(jc.jobCardId)}
                        className={`flex items-center gap-3 px-5 py-2 text-xs transition-colors ${
                          !selectable ? 'opacity-40 cursor-default' :
                          selected ? 'bg-primary/5 cursor-pointer' : 'hover:bg-muted/30 cursor-pointer'
                        }`}
                      >
                        {jc.isAlreadyScheduled ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        ) : !jc.materialIssued ? (
                          <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        ) : selected ? (
                          <CheckSquare className="h-3.5 w-3.5 text-primary shrink-0" />
                        ) : (
                          <Square className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        )}
                        <span className="font-mono font-medium w-28 shrink-0">{jc.jobCardNo}</span>
                        <span className="text-muted-foreground w-20 shrink-0">{jc.orderNo}</span>
                        <span className="text-muted-foreground w-28 shrink-0 truncate">{jc.customerName || '—'}</span>
                        {jc.dueDate
                          ? <span className="text-muted-foreground w-16 shrink-0 text-[10px]">Due {format(new Date(jc.dueDate), 'dd MMM')}</span>
                          : <span className="w-16 shrink-0" />
                        }
                        <span className="text-muted-foreground flex-1 truncate text-[11px]">{jc.processName}</span>
                        {jc.isOsp && <Badge className="bg-orange-100 text-orange-700 border border-orange-200 text-[10px] h-4 px-1 shrink-0">OSP</Badge>}
                        {jc.isManual && <Badge className="bg-blue-100 text-blue-700 border border-blue-200 text-[10px] h-4 px-1 shrink-0">Manual</Badge>}
                        <span className="text-muted-foreground shrink-0">Qty {jc.quantity}</span>
                        <span className="text-muted-foreground shrink-0">{fmtMin(jc.estimatedDurationMinutes)}</span>
                        {jc.isAlreadyScheduled && (
                          <Badge className="bg-green-100 text-green-700 border border-green-200 text-[10px] h-4 px-1 shrink-0">Scheduled</Badge>
                        )}
                        {jc.materialIssued && !jc.isAlreadyScheduled && (
                          <Badge className="bg-blue-100 text-blue-700 border border-blue-200 text-[10px] h-4 px-1 shrink-0">Material ✓</Badge>
                        )}
                        {!jc.materialIssued && !jc.isAlreadyScheduled && (
                          <Badge variant="outline" className="text-[10px] h-4 px-1 border-orange-200 text-orange-600 shrink-0">⏳ Pending</Badge>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step 3: Date & Shift ──────────────────────────────────────────────────

interface Step3Props {
  targetDate: string
  onDateChange: (d: string) => void
  shifts: Shift[]
  selectedShiftId: number | null
  onShiftChange: (id: number) => void
  useOvertime: boolean
  onOvertimeChange: (v: boolean) => void
  onBack: () => void
  onNext: () => void
  loadingNext: boolean
  selectedJcCount: number
}

function Step3({ targetDate, onDateChange, shifts, selectedShiftId, onShiftChange, useOvertime, onOvertimeChange, onBack, onNext, loadingNext, selectedJcCount }: Step3Props) {
  const selectedShift = shifts.find(s => s.id === selectedShiftId)
  const effectiveHours = selectedShift
    ? (useOvertime ? selectedShift.regularHours + selectedShift.maxOvertimeHours : selectedShift.regularHours)
    : 0

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-3 border-b bg-muted/20 shrink-0">
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={onBack}>
          <ChevronRight className="h-3 w-3 rotate-180" /> Back
        </Button>
        <Button
          size="sm"
          disabled={!targetDate || !selectedShiftId || loadingNext}
          onClick={onNext}
          className="h-7 text-xs gap-1"
        >
          {loadingNext
            ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Loading…</>
            : <>Review Machines <ArrowRight className="h-3.5 w-3.5" /></>
          }
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-md mx-auto space-y-5">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-4">
              Scheduling <span className="font-semibold text-foreground">{selectedJcCount}</span> job card{selectedJcCount !== 1 ? 's' : ''}
            </p>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Production Date</Label>
                <Input
                  type="date"
                  value={targetDate}
                  onChange={e => onDateChange(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Shift</Label>
                {shifts.length === 0 ? (
                  <p className="text-xs text-orange-600">
                    No active shifts configured.{' '}
                    <Link href="/masters/shifts" className="underline">Add shifts →</Link>
                  </p>
                ) : (
                  <Select
                    value={selectedShiftId?.toString() ?? ''}
                    onValueChange={v => onShiftChange(parseInt(v))}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Select shift…" />
                    </SelectTrigger>
                    <SelectContent>
                      {shifts.map(s => (
                        <SelectItem key={s.id} value={s.id.toString()}>
                          {s.shiftName} ({s.startTime} – {s.endTime}, {s.regularHours}h)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {selectedShift && (
                <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
                  <div>
                    <p className="text-xs font-medium">Allow Overtime</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      +{selectedShift.maxOvertimeHours}h OT → <span className="font-semibold text-foreground">{effectiveHours}h total</span> available
                    </p>
                  </div>
                  <Switch checked={useOvertime} onCheckedChange={onOvertimeChange} />
                </div>
              )}
            </div>
          </div>

          {selectedShift && targetDate && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-700 space-y-1">
              <p className="font-medium">Summary</p>
              <p>Date: <span className="font-semibold">{format(new Date(targetDate + 'T00:00:00'), 'EEEE, dd MMM yyyy')}</span></p>
              <p>Shift: <span className="font-semibold">{selectedShift.shiftName}</span> ({selectedShift.startTime} – {selectedShift.endTime})</p>
              <p>Available capacity: <span className="font-semibold">{effectiveHours}h {useOvertime ? '(incl. OT)' : '(regular)'}</span></p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Step 4: Machine Assignment per Category ───────────────────────────────

interface Step4Props {
  suggestions: CategoryMachineSuggestion[]
  categoryMachineMap: Map<string, number | null>
  onSelectMachine: (categoryKey: string, machineId: number | null) => void
  shiftHours: number
  onBack: () => void
  onConfirm: () => void
  submitting: boolean
}

function Step4({ suggestions, categoryMachineMap, onSelectMachine, shiftHours, onBack, onConfirm, submitting }: Step4Props) {
  const totalMinutes = suggestions.reduce((s, c) => s + c.totalEstimatedMinutes, 0)
  const totalHours = totalMinutes / 60

  // Group by machine: calculate per-machine total
  const machineMinutes = new Map<number, number>()
  for (const cat of suggestions) {
    const machId = categoryMachineMap.get(cat.categoryKey)
    if (machId && !cat.isOsp && !cat.isManual) {
      machineMinutes.set(machId, (machineMinutes.get(machId) ?? 0) + cat.totalEstimatedMinutes)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-3 border-b bg-muted/20 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={onBack}>
            <ChevronRight className="h-3 w-3 rotate-180" /> Back
          </Button>
          <span className="text-xs text-muted-foreground">
            Total: <span className="font-semibold">{fmtMin(totalMinutes)}</span>
            {shiftHours > 0 && (
              <span className={totalHours > shiftHours ? ' text-red-600' : ' text-green-600'}>
                {' '}/ {shiftHours}h shift
              </span>
            )}
          </span>
        </div>
        <Button
          size="sm"
          disabled={submitting}
          onClick={onConfirm}
          className="h-7 text-xs gap-1 bg-green-600 hover:bg-green-700"
        >
          {submitting
            ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Scheduling…</>
            : <><CheckCircle2 className="h-3.5 w-3.5" />Confirm & Schedule</>
          }
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {suggestions.map(cat => {
          const selectedMachineId = categoryMachineMap.get(cat.categoryKey)
          const machineMinutesForCat = machineMinutes.get(selectedMachineId ?? 0) ?? cat.totalEstimatedMinutes
          const overCapacity = !cat.isOsp && !cat.isManual && machineMinutesForCat > shiftHours * 60

          return (
            <div key={cat.categoryKey} className={`rounded-lg border-2 bg-card overflow-hidden ${overCapacity ? 'border-red-200' : 'border-border'}`}>
              {/* Category header */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/20 border-b">
                <Cpu className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="font-semibold text-sm flex-1">{cat.processCategoryName}</span>
                {cat.isOsp && <Badge className="bg-orange-100 text-orange-700 border border-orange-200 text-[10px] h-4 px-1.5">OSP</Badge>}
                {cat.isManual && <Badge className="bg-blue-100 text-blue-700 border border-blue-200 text-[10px] h-4 px-1.5">Manual</Badge>}
                <span className="text-xs text-muted-foreground">{cat.totalJobCards} JC · {fmtMin(cat.totalEstimatedMinutes)}</span>
                {overCapacity && (
                  <div className="flex items-center gap-1 text-red-600 text-[10px]">
                    <AlertTriangle className="h-3 w-3" /> Over capacity
                  </div>
                )}
              </div>

              <div className="p-3">
                {cat.isOsp || cat.isManual ? (
                  <div className="text-xs text-muted-foreground px-1">
                    {cat.isOsp ? 'Outside Service Process — no machine required' : 'Manual process — no machine required'}
                  </div>
                ) : cat.suggestedMachines.length === 0 ? (
                  <div className="flex items-center gap-2 text-xs text-orange-600 px-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    No machines found for this category. Job cards will be scheduled without machine assignment.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {cat.suggestedMachines.map(m => {
                      const selected = m.machineId === selectedMachineId
                      const statusColor =
                        m.capacityStatus === 'Available' ? 'text-green-700 bg-green-50 border-green-200' :
                        m.capacityStatus === 'Moderate' ? 'text-amber-700 bg-amber-50 border-amber-200' :
                        'text-red-700 bg-red-50 border-red-200'
                      return (
                        <button
                          key={m.machineId}
                          onClick={() => onSelectMachine(cat.categoryKey, m.machineId)}
                          className={`w-full text-left rounded-lg border px-3 py-2 text-xs transition-colors ${
                            selected ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'border-border hover:bg-muted/40'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {selected ? <CheckSquare className="h-3.5 w-3.5 text-primary" /> : <Square className="h-3.5 w-3.5 text-muted-foreground" />}
                              <span className="font-semibold">{m.machineName}</span>
                            </div>
                            <span className={`rounded-full px-1.5 py-0.5 text-[10px] border ${statusColor}`}>
                              {m.capacityStatus}
                            </span>
                          </div>
                          <div className="text-muted-foreground mt-0.5 ml-5">
                            {m.scheduledHours}h / {m.dailyCapacityHours}h used · {m.utilizationPercent}%
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step 5: Results ───────────────────────────────────────────────────────

interface Step5Props {
  results: BatchScheduleV2Result[]
  onReset: () => void
}

function Step5({ results, onReset }: Step5Props) {
  const ok = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-3 border-b bg-muted/20 shrink-0">
        <div className="flex items-center gap-2">
          {failed.length === 0
            ? <CheckCircle2 className="h-4 w-4 text-green-500" />
            : <AlertTriangle className="h-4 w-4 text-amber-500" />
          }
          <span className="text-sm font-medium">
            {ok.length} scheduled{failed.length > 0 ? `, ${failed.length} failed` : ''}
          </span>
        </div>
        <Button size="sm" variant="outline" onClick={onReset} className="h-7 text-xs gap-1">
          <RotateCcw className="h-3.5 w-3.5" /> Schedule More
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1.5">
          {results.map(r => (
            <div
              key={r.jobCardId}
              className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 text-xs ${
                r.success ? 'bg-green-50/50 border-green-200' : 'bg-red-50/50 border-red-200'
              }`}
            >
              {r.success
                ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                : <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
              }
              <span className="font-mono font-medium w-28 shrink-0">{r.jobCardNo}</span>
              <span className="text-muted-foreground w-24 shrink-0">{r.orderNo}</span>
              {r.success ? (
                <>
                  <span className="text-green-700 font-medium">{r.machineName ?? 'OSP/Manual'}</span>
                  {r.scheduledStart && (
                    <span className="text-muted-foreground ml-auto">
                      {format(new Date(r.scheduledStart), 'dd MMM HH:mm')} → {r.scheduledEnd ? format(new Date(r.scheduledEnd), 'HH:mm') : ''}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-red-600 ml-2">{r.error}</span>
              )}
            </div>
          ))}
        </div>

        {ok.length > 0 && (
          <div className="mt-4 flex gap-2">
            <Link href="/production/job-cards">
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                <ArrowRight className="h-3.5 w-3.5" /> View in Production
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Batch Reschedule Dialog ────────────────────────────────────────────────

interface BatchRescheduleDialogProps {
  open: boolean
  scheduleIds: number[]
  shifts: Shift[]
  onClose: () => void
  onSuccess: () => void
}

const RESCHEDULE_REASONS = ['Machine Breakdown', 'Priority Change', 'Worker Absent', 'Material Delay', 'Other']

function BatchRescheduleDialog({ open, scheduleIds, shifts, onClose, onSuccess }: BatchRescheduleDialogProps) {
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0])
  const [shiftId, setShiftId] = useState<string>(shifts[0]?.id.toString() ?? '')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (shifts.length > 0 && !shiftId) setShiftId(shifts[0].id.toString())
  }, [shifts])

  const handleSubmit = async () => {
    if (!shiftId || !newDate || !reason) return
    setSubmitting(true)
    try {
      await schedulingPlannerService.batchReschedule({
        scheduleIds,
        shiftId: parseInt(shiftId),
        newDate,
        reason,
      })
      toast.success(`${scheduleIds.length} schedule(s) rescheduled`)
      onSuccess()
      onClose()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Reschedule failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">
            Reschedule {scheduleIds.length} Job Card{scheduleIds.length !== 1 ? 's' : ''}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label className="text-xs">New Date</Label>
            <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="h-8 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Shift</Label>
            <Select value={shiftId} onValueChange={setShiftId}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select shift…" /></SelectTrigger>
              <SelectContent>
                {shifts.map(s => (
                  <SelectItem key={s.id} value={s.id.toString()}>
                    {s.shiftName} ({s.startTime}–{s.endTime})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select reason…" /></SelectTrigger>
              <SelectContent>
                {RESCHEDULE_REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!newDate || !shiftId || !reason || submitting}
          >
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
            <MoveRight className="h-3.5 w-3.5 mr-1" />
            Reschedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Rework Tab ─────────────────────────────────────────────────────────────

function ReworkTab() {
  const [allJcs, setAllJcs] = useState<Array<{
    id: number; jobCardNo: string; orderNo: string; childPartName: string
    processName: string; quantity: number; status: string; priority: string
  }>>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [reworkJc, setReworkJc] = useState<{ id: number; jobCardNo: string; processName: string } | null>(null)
  const [reworkQty, setReworkQty] = useState(1)
  const [reworkNotes, setReworkNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    jobCardService.getAll()
      .then(jcs => {
        setAllJcs(jcs
          .filter(jc => jc.status !== 'Cancelled' && jc.status !== 'Pending')
          .map(jc => ({
            id: jc.id,
            jobCardNo: jc.jobCardNo,
            orderNo: jc.orderNo ?? '',
            childPartName: jc.childPartName ?? '',
            processName: jc.processName ?? '',
            quantity: jc.quantity,
            status: jc.status,
            priority: jc.priority,
          }))
        )
      })
      .catch(() => toast.error('Failed to load job cards'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = allJcs.filter(jc =>
    jc.jobCardNo.toLowerCase().includes(search.toLowerCase()) ||
    jc.orderNo.toLowerCase().includes(search.toLowerCase()) ||
    jc.childPartName.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = async () => {
    if (!reworkJc || reworkQty <= 0) return
    setSubmitting(true)
    try {
      const newId = await schedulingPlannerService.createRework(reworkJc.id, reworkQty, reworkNotes)
      toast.success(`Rework job card created (ID: ${newId})`)
      setReworkJc(null)
      setReworkQty(1)
      setReworkNotes('')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to create rework')
    } finally {
      setSubmitting(false)
    }
  }

  const statusColor = (s: string) => {
    if (s === 'Completed') return 'text-green-600'
    if (s === 'Scheduled' || s === 'InProgress') return 'text-blue-600'
    return 'text-muted-foreground'
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-background border rounded-lg px-3 py-1 flex-1 max-w-xs">
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <Input
            placeholder="Search job cards…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 h-6 px-0 text-xs"
          />
        </div>
        <span className="text-xs text-muted-foreground ml-auto">
          Select a job card to create a rework copy
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-1">
          {filtered.map(jc => (
            <div
              key={jc.id}
              className="flex items-center gap-3 rounded-lg border px-4 py-2.5 bg-card text-xs hover:bg-muted/30 transition-colors"
            >
              <span className="font-mono font-medium w-32 shrink-0">{jc.jobCardNo}</span>
              <span className="text-muted-foreground w-24 shrink-0">{jc.orderNo}</span>
              <span className="flex-1 truncate">{jc.childPartName || jc.processName}</span>
              <span className="text-muted-foreground shrink-0">Qty {jc.quantity}</span>
              <span className={`shrink-0 font-medium ${statusColor(jc.status)}`}>{jc.status}</span>
              <Button
                size="sm"
                variant="outline"
                className="h-6 px-2 text-[11px] gap-1 shrink-0"
                onClick={() => setReworkJc({ id: jc.id, jobCardNo: jc.jobCardNo, processName: jc.processName })}
              >
                <RotateCw className="h-3 w-3" /> Rework
              </Button>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="flex justify-center py-12 text-muted-foreground text-sm">No job cards found</div>
          )}
        </div>
      )}

      {/* Rework creation dialog */}
      <Dialog open={!!reworkJc} onOpenChange={v => !v && setReworkJc(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Create Rework Job Card</DialogTitle>
          </DialogHeader>
          {reworkJc && (
            <div className="space-y-3 py-1">
              <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs">
                <p className="font-medium">{reworkJc.jobCardNo}</p>
                <p className="text-muted-foreground mt-0.5">{reworkJc.processName}</p>
                <p className="text-muted-foreground mt-0.5">Will create: <span className="font-mono font-medium">{reworkJc.jobCardNo}-RW</span></p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Rejected Qty (pieces to rework)</Label>
                <Input
                  type="number"
                  min={1}
                  value={reworkQty}
                  onChange={e => setReworkQty(parseInt(e.target.value) || 1)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Notes (optional)</Label>
                <Textarea
                  value={reworkNotes}
                  onChange={e => setReworkNotes(e.target.value)}
                  placeholder="Reason for rework…"
                  className="text-xs min-h-[60px] resize-none"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setReworkJc(null)}>Cancel</Button>
            <Button size="sm" onClick={handleCreate} disabled={reworkQty <= 0 || submitting}>
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
              <RotateCw className="h-3.5 w-3.5 mr-1" /> Create Rework
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── View Scheduled Tab ────────────────────────────────────────────────────

interface OrderItemEntry {
  orderItemId: number | null
  orderId: number
  orderNo: string
  itemSequence: string | null
  priority: string
  tree: OrderSchedulingTree | null
  loading: boolean
  expanded: boolean
}

function ViewScheduledTab() {
  const [orders, setOrders] = useState<OrderItemEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedJobCardId, setSelectedJobCardId] = useState<number | null>(null)
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [selectedIsOsp, setSelectedIsOsp] = useState(false)
  const [selectedIsManual, setSelectedIsManual] = useState(false)
  const [selectedPrevEndTime, setSelectedPrevEndTime] = useState<string | null>(null)
  const [selectedExistingScheduleId, setSelectedExistingScheduleId] = useState<number | null>(null)
  // Batch reschedule
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<Set<number>>(new Set())
  const [batchRescheduleOpen, setBatchRescheduleOpen] = useState(false)
  const [shifts, setShifts] = useState<Shift[]>([])

  useEffect(() => {
    shiftService.getActive().then(setShifts).catch(() => {})
  }, [])

  const loadOrders = useCallback(async () => {
    setLoading(true)
    try {
      const allJcs = await jobCardService.getAll()
      const relevant = allJcs.filter(jc =>
        jc.status === 'Scheduled' || jc.status === 'PLANNED' || jc.status === 'Planned'
      )
      const map = new Map<string, { orderItemId: number | null; orderId: number; orderNo: string; itemSequence: string | null; priority: string }>()
      for (const jc of relevant) {
        const key = jc.orderItemId ? `item-${jc.orderItemId}` : `order-${jc.orderId}`
        if (!map.has(key)) {
          map.set(key, {
            orderItemId: jc.orderItemId || null,
            orderId: jc.orderId,
            orderNo: jc.orderNo + (jc.itemSequence ? `-${jc.itemSequence}` : ''),
            itemSequence: jc.itemSequence || null,
            priority: jc.priority,
          })
        }
      }
      setOrders(Array.from(map.values()).map(info => ({ ...info, tree: null, loading: false, expanded: false })))
    } catch {
      toast.error('Failed to load scheduled orders')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadOrders() }, [loadOrders])

  const loadTree = async (orderItemId: number | null, orderId: number) => {
    setOrders(prev => prev.map(o =>
      (o.orderItemId === orderItemId && o.orderId === orderId) ? { ...o, loading: true, expanded: true } : o
    ))
    try {
      const tree = orderItemId
        ? await scheduleService.getOrderItemSchedulingTree(orderItemId)
        : await scheduleService.getOrderSchedulingTree(orderId)
      setOrders(prev => prev.map(o =>
        (o.orderItemId === orderItemId && o.orderId === orderId) ? { ...o, tree, loading: false } : o
      ))
      setExpandedGroups(prev => new Set([...prev, ...tree.groups.map(g => `${orderId}-${g.groupName}`)]))
    } catch {
      toast.error('Failed to load order details')
      setOrders(prev => prev.map(o =>
        (o.orderItemId === orderItemId && o.orderId === orderId) ? { ...o, loading: false, expanded: false } : o
      ))
    }
  }

  const toggleOrder = (orderItemId: number | null, orderId: number) => {
    const order = orders.find(o => o.orderItemId === orderItemId && o.orderId === orderId)
    if (!order) return
    if (!order.expanded) {
      order.tree
        ? setOrders(prev => prev.map(o => (o.orderItemId === orderItemId && o.orderId === orderId) ? { ...o, expanded: true } : o))
        : loadTree(orderItemId, orderId)
    } else {
      setOrders(prev => prev.map(o => (o.orderItemId === orderItemId && o.orderId === orderId) ? { ...o, expanded: false } : o))
    }
  }

  const filtered = orders.filter(o => o.orderNo.toLowerCase().includes(search.toLowerCase()))
  const totalPending = orders.reduce((s, o) => s + (o.tree?.pendingSteps ?? 0), 0)
  const totalScheduled = orders.reduce((s, o) => s + (o.tree?.scheduledSteps ?? 0), 0)

  const toggleSchedule = (scheduleId: number) =>
    setSelectedScheduleIds(prev => { const n = new Set(prev); n.has(scheduleId) ? n.delete(scheduleId) : n.add(scheduleId); return n })

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-background border rounded-lg px-3 py-1 flex-1 max-w-xs">
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <Input
            placeholder="Search orders…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 h-6 px-0 text-xs"
          />
        </div>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={loadOrders} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
        </Button>
        {selectedScheduleIds.size > 0 && (
          <>
            <span className="text-xs text-muted-foreground">{selectedScheduleIds.size} selected</span>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1 border-amber-300 text-amber-700 hover:bg-amber-50"
              onClick={() => setBatchRescheduleOpen(true)}
            >
              <MoveRight className="h-3.5 w-3.5" /> Reschedule Selected
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-muted-foreground"
              onClick={() => setSelectedScheduleIds(new Set())}
            >
              Clear
            </Button>
          </>
        )}
        <div className="flex items-center gap-3 text-xs text-muted-foreground ml-auto">
          <span><span className="font-semibold text-orange-500">{totalPending}</span> pending</span>
          <span><span className="font-semibold text-green-600">{totalScheduled}</span> assigned</span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-muted-foreground gap-2">
          <CheckCircle2 className="h-8 w-8 text-green-500" />
          <p className="text-sm">No scheduled orders found.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map(order => (
            <OldOrderCard
              key={`${order.orderId}-${order.orderItemId ?? 'legacy'}`}
              order={order}
              expandedGroups={expandedGroups}
              selectedScheduleIds={selectedScheduleIds}
              onToggleSchedule={toggleSchedule}
              onToggleOrder={() => toggleOrder(order.orderItemId, order.orderId)}
              onToggleGroup={k => setExpandedGroups(prev => {
                const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n
              })}
              onAssignMachine={(jcId, isOsp, isManual, prevEnd, scheduleId) => {
                setSelectedJobCardId(jcId); setSelectedOrderId(order.orderId)
                setSelectedIsOsp(isOsp); setSelectedIsManual(isManual)
                setSelectedPrevEndTime(prevEnd); setSelectedExistingScheduleId(scheduleId)
                setDialogOpen(true)
              }}
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
          existingScheduleId={selectedExistingScheduleId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSuccess={async () => {
            setDialogOpen(false)
            const ord = orders.find(o => o.orderId === selectedOrderId)
            setSelectedJobCardId(null)
            setSelectedExistingScheduleId(null)
            if (selectedOrderId && ord) await loadTree(ord.orderItemId, selectedOrderId)
            toast.success(selectedExistingScheduleId ? 'Schedule updated successfully!' : 'Machine assigned successfully!')
          }}
        />
      )}

      <BatchRescheduleDialog
        open={batchRescheduleOpen}
        scheduleIds={Array.from(selectedScheduleIds)}
        shifts={shifts}
        onClose={() => setBatchRescheduleOpen(false)}
        onSuccess={() => {
          setSelectedScheduleIds(new Set())
          loadOrders()
        }}
      />
    </div>
  )
}

function OldOrderCard({ order, expandedGroups, selectedScheduleIds, onToggleSchedule, onToggleOrder, onToggleGroup, onAssignMachine }: {
  order: OrderItemEntry
  expandedGroups: Set<string>
  selectedScheduleIds: Set<number>
  onToggleSchedule: (scheduleId: number) => void
  onToggleOrder: () => void
  onToggleGroup: (k: string) => void
  onAssignMachine: (id: number, isOsp: boolean, isManual: boolean, prevEnd: string | null, scheduleId: number | null) => void
}) {
  const pending = order.tree?.pendingSteps ?? null
  const total = order.tree?.totalSteps ?? null
  const scheduled = order.tree?.scheduledSteps ?? null
  const done = pending === 0 && total !== null && total > 0

  const isAssembly = (g: { creationType: string; groupName: string }) =>
    g.creationType.toLowerCase() === 'assembly' || g.groupName.toLowerCase().includes('assembly')

  const sortedGroups = order.tree
    ? [...order.tree.groups].sort((a, b) => {
        const aA = isAssembly(a); const bA = isAssembly(b)
        if (aA && !bA) return 1; if (!aA && bA) return -1
        const aMin = a.steps.length ? Math.min(...a.steps.map(s => s.jobCardId)) : 0
        const bMin = b.steps.length ? Math.min(...b.steps.map(s => s.jobCardId)) : 0
        return aMin - bMin
      })
    : []

  return (
    <div className={`rounded-lg border-2 bg-card overflow-hidden ${done ? 'border-green-300' : 'border-border'}`}>
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none hover:bg-muted/40 transition-colors"
        onClick={onToggleOrder}
      >
        <span className="text-muted-foreground shrink-0">
          {order.loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : order.expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </span>
        <span className="font-semibold text-sm flex-1 truncate">{order.orderNo}</span>
        {priorityBadge(order.priority)}
        {total !== null && <span className="text-xs text-muted-foreground tabular-nums shrink-0">{scheduled}/{total}</span>}
        {done
          ? <Badge className="bg-green-100 text-green-700 border border-green-200 text-[10px] h-4 px-1.5 gap-0.5 shrink-0"><CheckCircle2 className="h-2.5 w-2.5" /> All Scheduled</Badge>
          : pending !== null && pending > 0
            ? <Badge variant="outline" className="border-orange-300 text-orange-600 bg-orange-50 text-[10px] h-4 px-1.5 shrink-0">{pending} pending</Badge>
            : null}
        <Link href={`/production/orders/${order.orderId}`} onClick={e => e.stopPropagation()}>
          <Button size="sm" variant={done ? 'default' : 'outline'}
            className={`h-6 px-2 text-[11px] gap-1 shrink-0 ${done ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'border-blue-300 text-blue-600 hover:bg-blue-50'}`}>
            <ArrowRight className="h-3 w-3" /> Production
          </Button>
        </Link>
      </div>

      {order.expanded && order.tree && (
        <div className="border-t">
          {sortedGroups.map(group => {
            const key = `${order.orderId}-${group.groupName}`
            const open = expandedGroups.has(key)
            const grpDone = group.scheduledSteps === group.totalSteps
            return (
              <div key={key} className="border-b last:border-b-0">
                <div
                  className="flex items-center gap-2 px-5 py-1.5 cursor-pointer select-none hover:bg-muted/30 transition-colors"
                  onClick={() => onToggleGroup(key)}
                >
                  <span className="text-muted-foreground shrink-0">{open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}</span>
                  <span className={group.creationType === 'Assembly' ? 'text-purple-500' : 'text-sky-500'}>
                    {group.creationType === 'Assembly' ? <Wrench className="h-3.5 w-3.5" /> : <Factory className="h-3.5 w-3.5" />}
                  </span>
                  <span className="text-xs font-medium flex-1 truncate">{group.groupName}</span>
                  <Badge variant="outline" className={`text-[10px] h-4 px-1 shrink-0 ${group.creationType === 'Assembly' ? 'border-purple-200 text-purple-600' : 'border-sky-200 text-sky-600'}`}>
                    {group.creationType === 'Assembly' ? 'Assembly' : 'Part'}
                  </Badge>
                  {grpDone
                    ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    : <span className="text-[10px] text-muted-foreground shrink-0">{group.scheduledSteps}/{group.totalSteps}</span>
                  }
                </div>
                {open && (
                  <div className="divide-y">
                    {[...group.steps].sort((a, b) => (a.stepNo ?? 999) - (b.stepNo ?? 999)).map((step, idx, arr) => (
                      <OldProcessStepRow
                        key={step.jobCardId}
                        step={step}
                        prevEndTime={idx > 0 ? arr[idx - 1].scheduledEndTime ?? null : null}
                        selectedScheduleIds={selectedScheduleIds}
                        onToggleSchedule={onToggleSchedule}
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

      {order.expanded && order.loading && (
        <div className="border-t p-4 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs">Loading process steps…</span>
        </div>
      )}
    </div>
  )
}

function OldProcessStepRow({ step, prevEndTime, selectedScheduleIds, onToggleSchedule, onAssignMachine }: {
  step: ProcessStepSchedulingItem
  prevEndTime: string | null
  selectedScheduleIds: Set<number>
  onToggleSchedule: (scheduleId: number) => void
  onAssignMachine: (id: number, isOsp: boolean, isManual: boolean, prevEndTime: string | null, scheduleId: number | null) => void
}) {
  const assigned = !!step.scheduleId
  const scheduleSelected = assigned && step.scheduleId != null && selectedScheduleIds.has(step.scheduleId)
  return (
    <div className={`flex items-center gap-3 px-8 py-1.5 text-xs ${scheduleSelected ? 'bg-amber-50/60' : assigned ? 'bg-green-50/50' : 'hover:bg-muted/10'}`}>
      {assigned && step.scheduleId != null ? (
        <button
          onClick={e => { e.stopPropagation(); onToggleSchedule(step.scheduleId!) }}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          {scheduleSelected
            ? <CheckSquare className="h-3.5 w-3.5 text-amber-600" />
            : <Square className="h-3.5 w-3.5" />
          }
        </button>
      ) : (
        <span className="h-3.5 w-3.5 shrink-0" />
      )}
      <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${assigned ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
        {step.stepNo ?? '?'}
      </div>
      <span className="font-medium flex-1 truncate">{step.processName || 'Unknown Process'}</span>
      {step.isOsp && <Badge className="bg-orange-100 text-orange-700 border border-orange-200 text-[10px] h-4 px-1.5 shrink-0">OSP</Badge>}
      {step.isManual && <Badge className="bg-blue-100 text-blue-700 border border-blue-200 text-[10px] h-4 px-1.5 shrink-0">Manual</Badge>}
      {step.processCode && <Badge variant="outline" className="text-[10px] font-mono h-4 px-1 shrink-0">{step.processCode}</Badge>}
      <span className="text-muted-foreground shrink-0">Qty: {step.quantity}</span>
      {assigned ? (
        <div className="flex items-center gap-1 text-green-700 shrink-0">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span className="font-medium truncate max-w-[120px]">
            {step.isOsp ? 'OSP Scheduled' : step.isManual ? 'Manual Scheduled' : step.assignedMachineName}
          </span>
          {step.scheduledStartTime && (
            <span className="text-muted-foreground text-[10px]">{format(new Date(step.scheduledStartTime), 'dd MMM HH:mm')}</span>
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
        onClick={e => { e.stopPropagation(); onAssignMachine(step.jobCardId, !!step.isOsp, !!step.isManual, prevEndTime, step.scheduleId ?? null) }}
        className="shrink-0 h-6 px-2 text-[11px] gap-1"
      >
        <Calendar className="h-3 w-3" />
        {assigned ? 'Change' : 'Assign'}
      </Button>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function SchedulingPage() {
  const [activeTab, setActiveTab] = useState<'batch' | 'view' | 'rework'>('batch')
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1)

  // Step 1
  const [orders, setOrders] = useState<SchedulableOrderV2[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<number>>(new Set())

  // Step 2
  const [jobGroups, setJobGroups] = useState<ChildPartJobGroup[]>([])
  const [loadingGroups, setLoadingGroups] = useState(false)
  const [selectedJcIds, setSelectedJcIds] = useState<Set<number>>(new Set())

  // Step 3
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [selectedShiftId, setSelectedShiftId] = useState<number | null>(null)
  const [useOvertime, setUseOvertime] = useState(false)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

  // Step 4
  const [categorySuggestions, setCategorySuggestions] = useState<CategoryMachineSuggestion[]>([])
  const [categoryMachineMap, setCategoryMachineMap] = useState<Map<string, number | null>>(new Map())

  // Step 5
  const [results, setResults] = useState<BatchScheduleV2Result[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Load orders on mount
  useEffect(() => { loadOrders() }, [])

  // Load active shifts once
  useEffect(() => {
    shiftService.getActive()
      .then(s => {
        setShifts(s)
        if (s.length > 0) setSelectedShiftId(s[0].id)
      })
      .catch(() => {})
  }, [])

  const loadOrders = async () => {
    setLoadingOrders(true)
    try {
      const data = await schedulingPlannerService.getSchedulableOrders()
      setOrders(data)
    } catch {
      toast.error('Failed to load orders')
    } finally {
      setLoadingOrders(false)
    }
  }

  const handleStep1Next = async () => {
    setLoadingGroups(true)
    try {
      const groups = await schedulingPlannerService.getJobCardsForOrders(Array.from(selectedOrderIds))
      setJobGroups(groups)
      // Auto-select all materialIssued & not yet scheduled
      const autoSelect = new Set<number>()
      groups.forEach(g =>
        g.jobCards.forEach(jc => {
          if (jc.materialIssued && !jc.isAlreadyScheduled) autoSelect.add(jc.jobCardId)
        })
      )
      setSelectedJcIds(autoSelect)
      setStep(2)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to load job cards')
    } finally {
      setLoadingGroups(false)
    }
  }

  const handleStep3Next = async () => {
    if (!selectedShiftId || !targetDate) return
    setLoadingSuggestions(true)
    try {
      const sugg = await schedulingPlannerService.getCategoryMachineSuggestions(
        Array.from(selectedJcIds), targetDate
      )
      setCategorySuggestions(sugg)
      // Auto-select best machine per category (first in list = lowest utilization)
      const map = new Map<string, number | null>()
      sugg.forEach(s => {
        if (s.isOsp || s.isManual) map.set(s.categoryKey, null)
        else map.set(s.categoryKey, s.suggestedMachines[0]?.machineId ?? null)
      })
      setCategoryMachineMap(map)
      setStep(4)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to load machine suggestions')
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const handleConfirm = async () => {
    const shift = shifts.find(s => s.id === selectedShiftId)
    if (!shift) return
    setSubmitting(true)
    try {
      const [shiftH, shiftM] = shift.startTime.split(':').map(Number)
      // Per-machine cursor map (machineId or 'OSP' or 'Manual')
      const cursors = new Map<string, number>()

      // Build a quick lookup for job card durations
      const jcDurations = new Map<number, { dur: number; category: CategoryMachineSuggestion }>()
      for (const cat of categorySuggestions) {
        for (const jcId of cat.jobCardIds) {
          if (!selectedJcIds.has(jcId)) continue
          let dur = 60
          for (const g of jobGroups) {
            const jc = g.jobCards.find(j => j.jobCardId === jcId)
            if (jc) { dur = jc.estimatedDurationMinutes; break }
          }
          jcDurations.set(jcId, { dur, category: cat })
        }
      }

      const schedules: CreateScheduleV2Request[] = []

      for (const cat of categorySuggestions) {
        const machineId = categoryMachineMap.get(cat.categoryKey) ?? null
        const cursorKey = cat.isOsp ? 'OSP' : cat.isManual ? 'Manual' : `M${machineId}`

        if (!cursors.has(cursorKey)) {
          const base = new Date(`${targetDate}T00:00:00`)
          base.setHours(shiftH, shiftM, 0, 0)
          cursors.set(cursorKey, base.getTime())
        }

        for (const jcId of cat.jobCardIds) {
          if (!selectedJcIds.has(jcId)) continue
          const dur = jcDurations.get(jcId)?.dur ?? 60
          const startMs = cursors.get(cursorKey)!
          const endMs = startMs + dur * 60 * 1000
          cursors.set(cursorKey, endMs)

          schedules.push({
            jobCardId: jcId,
            machineId,
            shiftId: selectedShiftId,
            shiftName: shift.shiftName,
            scheduledStartTime: new Date(startMs).toISOString(),
            scheduledEndTime: new Date(endMs).toISOString(),
            estimatedDurationMinutes: dur,
            isOsp: cat.isOsp,
            isManual: cat.isManual,
          })
        }
      }

      const res = await schedulingPlannerService.batchCreate(schedules)
      setResults(res)
      const failed = res.filter(r => !r.success)
      if (failed.length === 0) {
        toast.success(`${res.length} job card${res.length !== 1 ? 's' : ''} scheduled successfully`)
      } else {
        toast.error(`${failed.length} failed`)
      }
      setStep(5)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Scheduling failed')
    } finally {
      setSubmitting(false)
    }
  }

  const resetWizard = () => {
    setStep(1)
    setSelectedOrderIds(new Set())
    setJobGroups([])
    setSelectedJcIds(new Set())
    setCategorySuggestions([])
    setCategoryMachineMap(new Map())
    setResults([])
    loadOrders()
  }

  const selectedShift = shifts.find(s => s.id === selectedShiftId)
  const shiftHours = selectedShift
    ? (useOvertime ? selectedShift.regularHours + selectedShift.maxOvertimeHours : selectedShift.regularHours)
    : 8

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-background shrink-0 gap-4">
        <div>
          <h1 className="text-xl font-semibold">Scheduling</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Assign machines to job cards — material-issued orders only
          </p>
        </div>

        {activeTab === 'batch' && (
          <StepIndicator current={step} />
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1 shrink-0">
          <button
            onClick={() => setActiveTab('batch')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'batch' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayersIcon className="h-3.5 w-3.5" />
            Batch Schedule
          </button>
          <button
            onClick={() => setActiveTab('view')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'view' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ListChecks className="h-3.5 w-3.5" />
            View Scheduled
          </button>
          <button
            onClick={() => setActiveTab('rework')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'rework' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <RotateCw className="h-3.5 w-3.5" />
            Rework
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'batch' ? (
          step === 1 ? (
            <Step1
              orders={orders}
              selectedOrderIds={selectedOrderIds}
              onToggle={id => setSelectedOrderIds(prev => {
                const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n
              })}
              loading={loadingOrders}
              loadingNext={loadingGroups}
              onRefresh={loadOrders}
              onNext={handleStep1Next}
            />
          ) : step === 2 ? (
            <Step2
              jobGroups={jobGroups}
              selectedJcIds={selectedJcIds}
              onToggleJc={id => setSelectedJcIds(prev => {
                const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n
              })}
              onToggleGroup={(group, select) => {
                const selectable = group.jobCards
                  .filter((jc: JobCardForScheduling) => jc.materialIssued && !jc.isAlreadyScheduled)
                  .map((jc: JobCardForScheduling) => jc.jobCardId)
                setSelectedJcIds(prev => {
                  const n = new Set(prev)
                  if (select) selectable.forEach(id => n.add(id))
                  else selectable.forEach(id => n.delete(id))
                  return n
                })
              }}
              onBack={() => setStep(1)}
              onNext={() => setStep(3)}
            />
          ) : step === 3 ? (
            <Step3
              targetDate={targetDate}
              onDateChange={setTargetDate}
              shifts={shifts}
              selectedShiftId={selectedShiftId}
              onShiftChange={setSelectedShiftId}
              useOvertime={useOvertime}
              onOvertimeChange={setUseOvertime}
              onBack={() => setStep(2)}
              onNext={handleStep3Next}
              loadingNext={loadingSuggestions}
              selectedJcCount={selectedJcIds.size}
            />
          ) : step === 4 ? (
            <Step4
              suggestions={categorySuggestions}
              categoryMachineMap={categoryMachineMap}
              onSelectMachine={(key, machId) =>
                setCategoryMachineMap(prev => { const n = new Map(prev); n.set(key, machId); return n })
              }
              shiftHours={shiftHours}
              onBack={() => setStep(3)}
              onConfirm={handleConfirm}
              submitting={submitting}
            />
          ) : (
            <Step5 results={results} onReset={resetWizard} />
          )
        ) : activeTab === 'rework' ? (
          <div className="p-6 h-full overflow-y-auto">
            <ReworkTab />
          </div>
        ) : (
          <div className="p-6 h-full overflow-y-auto">
            <ViewScheduledTab />
          </div>
        )}
      </div>
    </div>
  )
}
