'use client'

import { useEffect, useState, useCallback } from 'react'
import { issueWindowService } from '@/lib/api/issue-window'
import {
  IssueWindowRequisition,
  MaterialGroup,
  MaterialGroupCutItem,
  DraftSummary,
  DraftDetail,
  CuttingPlanOption,
  PlanCutItem,
} from '@/types/issue-window'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  ChevronRight,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Printer,
  ClipboardCheck,
  Package,
  Lightbulb,
  FileText,
  X,
  Trash2,
  Eye,
  PackageCheck,
  ClipboardList,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

type TabType = 'planning' | 'drafts' | 'issue-list'

// ── Helpers ─────────────────────────────────────────────────────────────────

function cutKey(item: MaterialGroupCutItem | PlanCutItem) {
  return `${item.requisitionItemId}_${item.cutIndex}`
}

function matKey(g: MaterialGroup) {
  return `${g.materialId ?? 0}_${g.grade ?? ''}_${g.diameterMM ?? 0}`
}

function mm(v: number) {
  return `${v.toFixed(0)}mm`
}

function RemainBadge({ rem }: { rem: number }) {
  if (rem < 0) return <span className="text-xs font-semibold text-red-600">Over {mm(Math.abs(rem))} ✗</span>
  if (rem < 300) return <span className="text-xs font-semibold text-orange-500">{mm(rem)} scrap</span>
  return <span className="text-xs font-semibold text-emerald-600">{mm(rem)} → stock</span>
}

// ── Plan Card ────────────────────────────────────────────────────────────────

function PlanCard({
  plan, selected, onSelect,
}: {
  plan: CuttingPlanOption
  selected: boolean
  onSelect: () => void
}) {
  const planColors: Record<number, string> = {
    1: 'border-blue-300 bg-blue-50',
    2: 'border-violet-300 bg-violet-50',
    3: 'border-amber-300 bg-amber-50',
  }
  const selectedRing = 'ring-2 ring-offset-1'
  const ringColors: Record<number, string> = {
    1: 'ring-blue-500',
    2: 'ring-violet-500',
    3: 'ring-amber-500',
  }
  const btnColors: Record<number, string> = {
    1: 'bg-blue-600 hover:bg-blue-700',
    2: 'bg-violet-600 hover:bg-violet-700',
    3: 'bg-amber-600 hover:bg-amber-700',
  }

  return (
    <div className={cn(
      'rounded-xl border-2 flex flex-col h-full overflow-hidden transition-all cursor-pointer',
      planColors[plan.planIndex],
      selected && `${selectedRing} ${ringColors[plan.planIndex]}`
    )} onClick={onSelect}>
      {/* Card header */}
      <div className="px-3 py-2 border-b border-black/10 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-sm">{plan.planLabel}</span>
          {!plan.isComplete && (
            <span className="text-[10px] font-medium text-red-600 bg-red-100 px-1.5 py-0.5 rounded">Incomplete</span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">{plan.planDescription}</p>
      </div>

      {/* Stats — compact 2×2 grid */}
      <div className="px-3 py-1.5 grid grid-cols-4 gap-x-2 text-xs border-b border-black/10 shrink-0">
        <div>
          <div className="text-muted-foreground text-[10px]">Bars</div>
          <div className="font-bold">{plan.totalBars}</div>
        </div>
        <div>
          <div className="text-muted-foreground text-[10px]">Total cut</div>
          <div className="font-bold">{mm(plan.totalBarLengthUsedMM)}</div>
        </div>
        <div>
          <div className="text-muted-foreground text-[10px]">Scrap</div>
          <div className={cn('font-semibold', plan.totalScrapMM > 0 ? 'text-orange-600' : 'text-emerald-600')}>
            {mm(plan.totalScrapMM)}
          </div>
        </div>
        <div>
          <div className="text-muted-foreground text-[10px]">Stock</div>
          <div className={cn('font-semibold', plan.totalStockReturnMM > 0 ? 'text-emerald-600' : 'text-muted-foreground')}>
            {mm(plan.totalStockReturnMM)}
          </div>
        </div>
      </div>

      {/* Bar Breakdown label */}
      <div className="px-3 py-1 border-b border-black/10 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide shrink-0">
        Bar Breakdown
      </div>

      {/* Bar breakdown — fills remaining height, scrollable */}
      <div className="flex-1 overflow-y-auto px-2 py-1.5 space-y-1.5">
        {plan.bars.map((bar, bi) => (
          <div key={bi} className="rounded-md bg-white/70 border border-black/10 p-2">
            <div className="flex items-center justify-between text-[11px] font-semibold mb-0.5">
              <span>{bar.pieceNo}</span>
              <RemainBadge rem={bar.remainingMM} />
            </div>
            <div className="text-[10px] text-muted-foreground mb-1">
              {mm(bar.barLengthMM)} bar · cuts {mm(bar.totalCutMM)}
            </div>
            {bar.cuts.map((c, ci) => (
              <div key={ci} className="flex items-center gap-1.5 text-[10px] py-0.5 border-t border-black/5 first:border-0">
                <span className="font-mono font-semibold w-12 shrink-0">{mm(c.cutLengthMM)}</span>
                <span className="text-muted-foreground truncate flex-1">{c.jobCardNo ?? c.partName ?? '—'}</span>
                <span className="text-muted-foreground shrink-0 text-[9px]">{c.requisitionNo}</span>
              </div>
            ))}
          </div>
        ))}
        {plan.bars.length === 0 && (
          <div className="text-xs text-muted-foreground py-4 text-center">No bars assigned</div>
        )}
      </div>

      {/* Select button — pinned to bottom */}
      <div className="px-3 py-2 border-t border-black/10 shrink-0" onClick={e => e.stopPropagation()}>
        <button
          className={cn(
            'w-full py-1.5 rounded-lg text-xs font-semibold text-white transition-colors',
            btnColors[plan.planIndex],
            selected && 'opacity-80'
          )}
          onClick={onSelect}
        >
          {selected ? '✓ Selected' : 'Use This Plan'}
        </button>
      </div>
    </div>
  )
}

// ── Plan Modal ───────────────────────────────────────────────────────────────

function PlanModal({
  open, plans, onClose, onUsePlan, saving,
}: {
  open: boolean
  plans: CuttingPlanOption[]
  onClose: () => void
  onUsePlan: (plan: CuttingPlanOption) => void
  saving: boolean
}) {
  const [selected, setSelected] = useState<number | null>(null)

  useEffect(() => { if (open) setSelected(null) }, [open])

  const chosen = plans.find(p => p.planIndex === selected)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[90vw] h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-4 pt-3 pb-2 border-b">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            Cutting Plan Suggestions
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden px-4 py-3">
          {plans.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              No inventory pieces available for this material.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 h-full">
              {plans.map(plan => (
                <PlanCard
                  key={plan.planIndex}
                  plan={plan}
                  selected={selected === plan.planIndex}
                  onSelect={() => setSelected(plan.planIndex)}
                />
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="px-4 py-2 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!chosen || saving}
            onClick={() => chosen && onUsePlan(chosen)}
          >
            {saving
              ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Saving Draft…</>
              : <><FileText className="h-3.5 w-3.5 mr-1.5" />Save as Draft</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Material Group Card (checklist view) ──────────────────────────────────────

function MaterialGroupCard({
  group,
  draftedCutKeys,
  selectedCutKeys,
  onToggleCut,
  onSelectAll,
  onClearAll,
  onSuggest,
  suggesting,
}: {
  group: MaterialGroup
  draftedCutKeys: Set<string>
  selectedCutKeys: Set<string>
  onToggleCut: (key: string) => void
  onSelectAll: () => void
  onClearAll: () => void
  onSuggest: () => void
  suggesting: boolean
}) {
  const availableCuts = group.cuts.filter(c => !draftedCutKeys.has(cutKey(c)))
  const selectedCount = availableCuts.filter(c => selectedCutKeys.has(cutKey(c))).length
  const draftedCount = group.cuts.length - availableCuts.length

  return (
    <div className="border rounded-xl overflow-hidden shadow-sm bg-white">
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-semibold text-sm">{group.materialName}</span>
          {group.grade && <span className="text-xs text-muted-foreground">{group.grade}</span>}
          {group.diameterMM && <span className="text-xs text-muted-foreground">∅{group.diameterMM}mm</span>}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {mm(group.totalLengthNeededMM)} · {group.cuts.length} cuts
          </Badge>
          {draftedCount > 0 && (
            <Badge variant="default" className="text-xs bg-emerald-600">
              {draftedCount} drafted
            </Badge>
          )}
        </div>
      </div>

      {/* Cut list */}
      <div className="divide-y">
        {group.cuts.map(cut => {
          const ck = cutKey(cut)
          const isDrafted = draftedCutKeys.has(ck)
          const isSelected = selectedCutKeys.has(ck)

          return (
            <label
              key={ck}
              className={cn(
                'flex items-center gap-3 px-4 py-2 cursor-pointer select-none transition-colors text-sm',
                isDrafted
                  ? 'bg-emerald-50/60 text-muted-foreground cursor-default'
                  : isSelected
                  ? 'bg-blue-50'
                  : 'hover:bg-muted/30'
              )}
            >
              <Checkbox
                checked={isSelected || isDrafted}
                disabled={isDrafted}
                onCheckedChange={() => !isDrafted && onToggleCut(ck)}
                className="h-4 w-4 shrink-0"
              />
              <span className="font-mono font-semibold w-16 shrink-0 text-xs tabular-nums">
                {mm(cut.cutLengthMM)}
              </span>
              <span className="flex-1 min-w-0 truncate text-xs text-muted-foreground">
                {cut.jobCardNo ?? cut.partName ?? '—'}
              </span>
              <span className="text-[11px] text-muted-foreground shrink-0">
                {cut.requisitionNo}
              </span>
              {isDrafted && (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              )}
            </label>
          )
        })}
      </div>

      {/* Card footer */}
      {availableCuts.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-muted/20 border-t">
          <div className="flex items-center gap-3">
            <button
              className="text-xs text-primary hover:underline"
              onClick={onSelectAll}
            >
              Select all
            </button>
            <button
              className="text-xs text-muted-foreground hover:text-foreground hover:underline"
              onClick={onClearAll}
            >
              Clear
            </button>
            {selectedCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {selectedCount} of {availableCuts.length} selected
              </span>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1.5"
            disabled={selectedCount === 0 || suggesting}
            onClick={onSuggest}
          >
            {suggesting
              ? <><Loader2 className="h-3 w-3 animate-spin" />Suggesting…</>
              : <><Lightbulb className="h-3 w-3 text-amber-500" />Suggest Cutting Plan</>}
          </Button>
        </div>
      )}

      {availableCuts.length === 0 && group.cuts.length > 0 && (
        <div className="px-4 py-2.5 bg-emerald-50 border-t text-xs text-emerald-700 flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5" />
          All cuts in this group have been drafted
        </div>
      )}
    </div>
  )
}

// ── Finalize Dialog ───────────────────────────────────────────────────────────

function FinalizeDialog({
  open, onClose, draftCount, onFinalize, finalizing,
}: {
  open: boolean
  onClose: () => void
  draftCount: number
  onFinalize: () => void
  finalizing: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Finalize Drafts</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-lg bg-muted p-3 text-sm">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Drafts to finalize</span>
              <span className="font-semibold">{draftCount}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Finalizing locks these drafts and moves them to the <strong>Issue List</strong>.
            Materials remain reserved. Issuing (with issuer &amp; receiver names) happens from the Issue List.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} size="sm">Cancel</Button>
          <Button onClick={onFinalize} disabled={finalizing} size="sm">
            {finalizing
              ? <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />Finalizing…</>
              : <><ClipboardCheck className="h-3.5 w-3.5 mr-1" />Finalize {draftCount} Draft{draftCount !== 1 ? 's' : ''}</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Issue Dialog ──────────────────────────────────────────────────────────────

function IssueDialog({
  open, draft, onClose, onIssue, issuing,
}: {
  open: boolean
  draft: DraftSummary | null
  onClose: () => void
  onIssue: (issuedBy: string, receivedBy: string) => void
  issuing: boolean
}) {
  const [issuedBy, setIssuedBy] = useState('')
  const [receivedBy, setReceivedBy] = useState('')

  useEffect(() => {
    if (open) { setIssuedBy(''); setReceivedBy('') }
  }, [open])

  if (!draft) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Issue Materials — {draft.draftNo}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Bars</span>
              <span className="font-semibold">{draft.totalBars}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Cuts</span>
              <span className="font-semibold">{draft.totalCuts}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Requisitions</span>
              <span className="font-semibold">{draft.requisitionCount}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="issuedBy" className="text-xs">Issued By *</Label>
            <Input
              id="issuedBy"
              value={issuedBy}
              onChange={e => setIssuedBy(e.target.value)}
              placeholder="Issuer name"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="receivedBy" className="text-xs">Received By *</Label>
            <Input
              id="receivedBy"
              value={receivedBy}
              onChange={e => setReceivedBy(e.target.value)}
              placeholder="Receiver name"
              className="h-8 text-sm"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} size="sm">Cancel</Button>
          <Button
            onClick={() => onIssue(issuedBy, receivedBy)}
            disabled={issuing || !issuedBy.trim() || !receivedBy.trim()}
            size="sm"
          >
            {issuing
              ? <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />Issuing…</>
              : <><PackageCheck className="h-3.5 w-3.5 mr-1" />Issue Materials</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── View Draft Modal ──────────────────────────────────────────────────────────

function ViewDraftModal({
  open, draft, onClose, onPrint,
}: {
  open: boolean
  draft: DraftDetail | null
  onClose: () => void
  onPrint?: () => void
}) {
  if (!draft) return null
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[90vw] h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-4 pt-3 pb-2 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-blue-500" />
            {draft.draftNo}
            <Badge
              variant={draft.status === 'Issued' ? 'default' : 'outline'}
              className={cn('text-[10px] ml-1', draft.status === 'Issued' && 'bg-emerald-600')}
            >
              {draft.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {/* Meta info row */}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
            <span>Created: {new Date(draft.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            {draft.issuedAt && <span>Issued: {new Date(draft.issuedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>}
            {draft.issuedBy && <span>Issued By: <strong>{draft.issuedBy}</strong></span>}
            {draft.receivedBy && <span>Received By: <strong>{draft.receivedBy}</strong></span>}
            <span>{draft.barAssignments.length} bar{draft.barAssignments.length !== 1 ? 's' : ''}</span>
            <span>{draft.barAssignments.reduce((s, b) => s + b.cuts.length, 0)} cuts</span>
          </div>

          {/* Bar assignments */}
          {draft.barAssignments.map((bar, bi) => (
            <div key={bar.id} className="border rounded-lg overflow-hidden shadow-sm bg-white">
              {/* Bar header */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-b">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>Bar {bi + 1}: {bar.pieceNo}</span>
                  {bar.materialName && (
                    <span className="font-normal text-muted-foreground text-xs">
                      {bar.materialName}
                      {bar.grade ? ` · ${bar.grade}` : ''}
                      {bar.diameterMM ? ` · ∅${bar.diameterMM}mm` : ''}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-muted-foreground">{mm(bar.pieceCurrentLengthMM ?? 0)} bar</span>
                  <span className="text-muted-foreground">Cut: {mm(bar.totalCutMM ?? 0)}</span>
                  <RemainBadge rem={bar.remainingMM ?? 0} />
                  {bar.willBeScrap && (
                    <Badge variant="outline" className="text-[10px] text-orange-600 border-orange-300">Scrap</Badge>
                  )}
                </div>
              </div>

              {/* Cuts table */}
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/20 border-b">
                    <th className="text-left px-4 py-1.5 font-medium text-muted-foreground w-10">S.No</th>
                    <th className="text-left px-4 py-1.5 font-medium text-muted-foreground w-24">Cut</th>
                    <th className="text-left px-4 py-1.5 font-medium text-muted-foreground">Job Card / Part</th>
                    <th className="text-left px-4 py-1.5 font-medium text-muted-foreground">Requisition</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {bar.cuts.map((cut, ci) => (
                    <tr key={cut.id} className="hover:bg-muted/10">
                      <td className="px-4 py-1.5 text-muted-foreground">{ci + 1}</td>
                      <td className="px-4 py-1.5 font-mono font-semibold">{mm(cut.cutLengthMM)}</td>
                      <td className="px-4 py-1.5">{cut.jobCardNo ?? cut.partName ?? '—'}</td>
                      <td className="px-4 py-1.5 text-muted-foreground">{cut.requisitionNo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        <DialogFooter className="px-4 py-2 border-t shrink-0">
          <Button variant="outline" onClick={onClose}>Close</Button>
          {onPrint && (
            <Button variant="outline" onClick={onPrint} className="gap-1.5">
              <Printer className="h-3.5 w-3.5" />
              Print Slip
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Print Slip ────────────────────────────────────────────────────────────────

/** Extract "ORD-202602-0004-A" from "JC-ORD-202602-0004-A-CPT-SHAFT-..." */
function extractOrderItem(jobCardNo?: string): string {
  if (!jobCardNo) return '—'
  const withoutJC = jobCardNo.startsWith('JC-') ? jobCardNo.slice(3) : jobCardNo
  const parts = withoutJC.split('-')
  return parts.slice(0, 4).join('-') // e.g. "ORD-202602-0004-A"
}

function PrintSlip({ drafts }: { drafts: DraftDetail[] }) {
  if (!drafts.length) return null
  return (
    <div className="print-slip">
      {drafts.map(draft => (
        <div key={draft.id} style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', padding: '24px', pageBreakAfter: 'always' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>MATERIAL ISSUE SLIP</h1>
              <p style={{ margin: '4px 0 0', color: '#555', fontSize: '11px' }}>Draft No: <strong>{draft.draftNo}</strong></p>
            </div>
            <div style={{ textAlign: 'right', fontSize: '11px', color: '#555' }}>
              <p style={{ margin: 0 }}>Date: <strong>{new Date(draft.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></p>
              <p style={{ margin: '3px 0 0' }}>Status: {draft.status}</p>
            </div>
          </div>

          {/* Bar sections */}
          {draft.barAssignments.map((bar, bi) => {
            // Group by cutLengthMM — all same-length cuts merge into one row
            const groupMap = new Map<number, { count: number; orderItems: Set<string>; partNames: Set<string> }>()
            bar.cuts.forEach(cut => {
              const existing = groupMap.get(cut.cutLengthMM)
              const orderItem = extractOrderItem(cut.jobCardNo)
              if (existing) {
                existing.count++
                existing.orderItems.add(orderItem)
                if (cut.partName) existing.partNames.add(cut.partName)
              } else {
                groupMap.set(cut.cutLengthMM, {
                  count: 1,
                  orderItems: new Set([orderItem]),
                  partNames: new Set(cut.partName ? [cut.partName] : []),
                })
              }
            })
            // Sort longest first
            const rows = Array.from(groupMap.entries())
              .sort((a, b) => b[0] - a[0])
              .map(([cutLengthMM, g]) => ({ cutLengthMM, ...g }))

            return (
              <div key={bar.id} style={{ marginBottom: '18px', border: '1px solid #bbb', borderRadius: '4px', overflow: 'hidden' }}>
                {/* Bar header */}
                <div style={{ background: '#ececec', padding: '6px 10px', borderBottom: '1px solid #bbb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                  <strong style={{ fontSize: '12px' }}>
                    Bar {bi + 1}: {bar.pieceNo}
                    {bar.materialName ? `  ·  ${bar.materialName}` : ''}
                    {bar.grade ? ` · ${bar.grade}` : ''}
                    {bar.diameterMM ? ` · ∅${bar.diameterMM}mm` : ''}
                  </strong>
                  <span style={{ color: '#444' }}>
                    {bar.pieceCurrentLengthMM}mm bar → Cut: {bar.totalCutMM}mm · Left:{' '}
                    <strong style={{ color: bar.willBeScrap ? '#c00' : '#060' }}>
                      {bar.remainingMM}mm {bar.willBeScrap ? '(scrap)' : '→ stock'}
                    </strong>
                  </span>
                </div>

                {/* Grouped cuts table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                  <thead>
                    <tr style={{ background: '#f5f5f5' }}>
                      <th style={{ border: '1px solid #ddd', padding: '5px 8px', textAlign: 'left', width: '40px' }}>S.No</th>
                      <th style={{ border: '1px solid #ddd', padding: '5px 8px', textAlign: 'left', width: '130px' }}>Length × Pcs</th>
                      <th style={{ border: '1px solid #ddd', padding: '5px 8px', textAlign: 'left' }}>Order Item</th>
                      <th style={{ border: '1px solid #ddd', padding: '5px 8px', textAlign: 'left' }}>Child Part</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <td style={{ border: '1px solid #ddd', padding: '5px 8px', color: '#777' }}>{i + 1}</td>
                        <td style={{ border: '1px solid #ddd', padding: '5px 8px', fontWeight: 'bold', fontFamily: 'monospace', fontSize: '12px' }}>
                          {row.cutLengthMM}mm × {row.count}
                        </td>
                        <td style={{ border: '1px solid #ddd', padding: '5px 8px' }}>
                          {[...row.orderItems].join(', ')}
                        </td>
                        <td style={{ border: '1px solid #ddd', padding: '5px 8px' }}>
                          {[...row.partNames].join(', ') || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}

          {/* Signatures */}
          <div style={{ marginTop: '40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px' }}>
            <div>
              <div style={{ borderBottom: '1px solid #000', paddingBottom: '32px', marginBottom: '5px' }}>{draft.issuedBy ?? ''}</div>
              <div style={{ fontSize: '10px', color: '#666' }}>Issued By / Signature</div>
            </div>
            <div>
              <div style={{ borderBottom: '1px solid #000', paddingBottom: '32px', marginBottom: '5px' }}>{draft.receivedBy ?? ''}</div>
              <div style={{ fontSize: '10px', color: '#666' }}>Received By / Signature</div>
            </div>
          </div>

        </div>
      ))}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function MaterialIssuePage() {
  const [activeTab, setActiveTab] = useState<TabType>('planning')
  const [searchQuery, setSearchQuery] = useState('')

  // ── Planning tab state ──────────────────────────────────────────────────────
  const [requisitions, setRequisitions] = useState<IssueWindowRequisition[]>([])
  const [selectedReqIds, setSelectedReqIds] = useState<Set<number>>(new Set())
  const [loadingReqs, setLoadingReqs] = useState(true)

  const [materialGroups, setMaterialGroups] = useState<MaterialGroup[]>([])
  const [loadingGroups, setLoadingGroups] = useState(false)
  const [groupsLoaded, setGroupsLoaded] = useState(false)

  const [draftedCutKeys, setDraftedCutKeys] = useState<Set<string>>(new Set())
  const [selectedCuts, setSelectedCuts] = useState<Map<string, Set<string>>>(new Map())

  // Suggest plan state
  const [suggestingGroupKey, setSuggestingGroupKey] = useState<string | null>(null)
  const [currentSuggestingGroup, setCurrentSuggestingGroup] = useState<MaterialGroup | null>(null)
  const [planOptions, setPlanOptions] = useState<CuttingPlanOption[]>([])
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)

  // ── Drafts tab state ────────────────────────────────────────────────────────
  const [allDrafts, setAllDrafts] = useState<DraftSummary[]>([])
  const [loadingDrafts, setLoadingDrafts] = useState(true)
  const [selectedDraftIds, setSelectedDraftIds] = useState<Set<number>>(new Set())
  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false)
  const [finalizing, setFinalizing] = useState(false)

  // ── Issue List tab state ────────────────────────────────────────────────────
  const [issueDrafts, setIssueDrafts] = useState<DraftSummary[]>([])
  const [loadingIssueDrafts, setLoadingIssueDrafts] = useState(false)
  const [issuingDraft, setIssuingDraft] = useState<DraftSummary | null>(null)
  const [issuing, setIssuing] = useState(false)

  // ── Shared state ────────────────────────────────────────────────────────────
  const [printDrafts, setPrintDrafts] = useState<DraftDetail[]>([])
  const [viewingDraft, setViewingDraft] = useState<DraftDetail | null>(null)
  const [loadingViewDraft, setLoadingViewDraft] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 5000)
  }

  const refreshDrafts = useCallback(async () => {
    try {
      const d = await issueWindowService.getDrafts()
      setAllDrafts(d)
    } catch { /* silent */ }
  }, [])

  const loadIssueDrafts = useCallback(async () => {
    setLoadingIssueDrafts(true)
    try {
      const data = await issueWindowService.getFinalizedDrafts()
      setIssueDrafts(data)
    } catch {
      showToast('error', 'Failed to load issue list')
    } finally {
      setLoadingIssueDrafts(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    issueWindowService.getApprovedRequisitions()
      .then(setRequisitions).finally(() => setLoadingReqs(false))
    issueWindowService.getDrafts()
      .then(setAllDrafts).finally(() => setLoadingDrafts(false))
  }, [])

  // Load issue list when tab is activated
  useEffect(() => {
    if (activeTab === 'issue-list') {
      loadIssueDrafts()
    }
  }, [activeTab, loadIssueDrafts])

  const toggleReq = (id: number) => {
    setSelectedReqIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
    setGroupsLoaded(false)
    setMaterialGroups([])
    setSelectedCuts(new Map())
    setDraftedCutKeys(new Set())
  }

  const loadGroups = async () => {
    if (!selectedReqIds.size) return
    setLoadingGroups(true)
    try {
      const [groups, drafts] = await Promise.all([
        issueWindowService.getMaterialGroups([...selectedReqIds]),
        issueWindowService.getDrafts(),
      ])
      setMaterialGroups(groups)
      setAllDrafts(drafts)

      const pendingList = drafts.filter(d => d.status === 'Draft')
      if (pendingList.length > 0) {
        const details = await Promise.all(pendingList.map(d => issueWindowService.getDraftById(d.id)))
        const allKeys = new Set<string>()
        details.forEach(detail =>
          detail.barAssignments.forEach(bar =>
            bar.cuts.forEach(cut => allKeys.add(`${cut.requisitionItemId}_${cut.cutIndex}`))
          )
        )
        setDraftedCutKeys(allKeys)
      } else {
        setDraftedCutKeys(new Set())
      }

      const init = new Map<string, Set<string>>()
      groups.forEach(g => init.set(matKey(g), new Set()))
      setSelectedCuts(init)
      setGroupsLoaded(true)
    } catch { showToast('error', 'Failed to load material groups') }
    finally { setLoadingGroups(false) }
  }

  const toggleCut = (groupKey: string, ck: string) => {
    setSelectedCuts(prev => {
      const next = new Map(prev)
      const s = new Set(next.get(groupKey) ?? [])
      s.has(ck) ? s.delete(ck) : s.add(ck)
      next.set(groupKey, s)
      return next
    })
  }

  const selectAllInGroup = (group: MaterialGroup) => {
    const gk = matKey(group)
    setSelectedCuts(prev => {
      const next = new Map(prev)
      const available = group.cuts
        .filter(c => !draftedCutKeys.has(cutKey(c)))
        .map(c => cutKey(c))
      next.set(gk, new Set(available))
      return next
    })
  }

  const clearGroup = (groupKey: string) => {
    setSelectedCuts(prev => {
      const next = new Map(prev)
      next.set(groupKey, new Set())
      return next
    })
  }

  const handleSuggest = async (group: MaterialGroup) => {
    const gk = matKey(group)
    const selectedKeys = selectedCuts.get(gk) ?? new Set()
    if (!selectedKeys.size) return

    const cuts = group.cuts
      .filter(c => selectedKeys.has(cutKey(c)))
      .map(c => ({
        requisitionItemId: c.requisitionItemId,
        requisitionId: c.requisitionId,
        cutIndex: c.cutIndex,
        cutLengthMM: c.cutLengthMM,
        partName: c.partName,
        jobCardNo: c.jobCardNo,
        requisitionNo: c.requisitionNo,
        materialId: c.materialId,
      }))

    setSuggestingGroupKey(gk)
    setCurrentSuggestingGroup(group)
    try {
      const plans = await issueWindowService.suggestCuttingPlan({
        cuts,
        materialId: group.materialId,
        grade: group.grade,
        diameterMM: group.diameterMM,
      })
      setPlanOptions(plans)
      setShowPlanModal(true)
    } catch { showToast('error', 'Failed to generate cutting plans') }
    finally { setSuggestingGroupKey(null) }
  }

  const handleUsePlan = async (plan: CuttingPlanOption) => {
    if (!currentSuggestingGroup) return
    setSavingDraft(true)
    try {
      const group = currentSuggestingGroup

      const reqIds = [...new Set(plan.bars.flatMap(b => b.cuts.map(c => c.requisitionId).filter(Boolean) as number[]))]
      if (!reqIds.length) {
        reqIds.push(...selectedReqIds)
      }

      const barAssignments = plan.bars.map(bar => ({
        materialId: group.materialId,
        materialName: group.materialName,
        materialCode: group.materialCode,
        grade: group.grade,
        diameterMM: group.diameterMM,
        pieceId: bar.pieceId,
        pieceNo: bar.pieceNo,
        pieceCurrentLengthMM: bar.barLengthMM,
        cuts: bar.cuts.map(c => ({
          requisitionItemId: c.requisitionItemId,
          requisitionId: c.requisitionId,
          cutIndex: c.cutIndex,
          cutLengthMM: c.cutLengthMM,
          partName: c.partName,
          jobCardNo: c.jobCardNo,
          requisitionNo: c.requisitionNo,
          materialId: c.materialId,
        })),
      }))

      const saved = await issueWindowService.saveDraft({ requisitionIds: reqIds, barAssignments })

      const newDrafted = new Set(draftedCutKeys)
      plan.bars.forEach(b => b.cuts.forEach(c => newDrafted.add(`${c.requisitionItemId}_${c.cutIndex}`)))
      setDraftedCutKeys(newDrafted)

      clearGroup(matKey(group))

      showToast('success', `Draft ${saved.draftNo} saved (${plan.bars.length} bar${plan.bars.length !== 1 ? 's' : ''})`)
      setShowPlanModal(false)
      await refreshDrafts()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save draft'
      showToast('error', msg)
    } finally {
      setSavingDraft(false)
    }
  }

  const toggleDraftSelect = (id: number) => {
    setSelectedDraftIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleFinalize = async () => {
    const draftIds = [...selectedDraftIds]
    setFinalizing(true)
    setShowFinalizeDialog(false)
    try {
      await Promise.all(draftIds.map(id => issueWindowService.finalizeDraft(id)))
      showToast('success', `${draftIds.length} draft${draftIds.length !== 1 ? 's' : ''} finalized — moved to Issue List`)
      setSelectedDraftIds(new Set())
      await refreshDrafts()
      // Refresh issue list since finalized drafts appear there
      const issued = await issueWindowService.getFinalizedDrafts()
      setIssueDrafts(issued)
    } catch { showToast('error', 'Failed to finalize drafts') }
    finally { setFinalizing(false) }
  }

  const recomputeDraftedKeys = async () => {
    const drafts = await issueWindowService.getDrafts()
    setAllDrafts(drafts)
    const pendingList = drafts.filter(d => d.status === 'Draft')
    if (pendingList.length > 0) {
      const details = await Promise.all(pendingList.map(d => issueWindowService.getDraftById(d.id)))
      const allKeys = new Set<string>()
      details.forEach(detail =>
        detail.barAssignments.forEach(bar =>
          bar.cuts.forEach(cut => allKeys.add(`${cut.requisitionItemId}_${cut.cutIndex}`))
        )
      )
      setDraftedCutKeys(allKeys)
    } else {
      setDraftedCutKeys(new Set())
    }
  }

  const handleDeleteDraft = async (id: number) => {
    try {
      await issueWindowService.deleteDraft(id)
      setSelectedDraftIds(prev => { const next = new Set(prev); next.delete(id); return next })
      await recomputeDraftedKeys()
      showToast('success', 'Draft deleted — cuts are available for re-planning')
    } catch { showToast('error', 'Failed to delete draft') }
  }

  const handlePrintSlips = async () => {
    const ids = [...selectedDraftIds]
    if (!ids.length) return
    try {
      const details = await Promise.all(ids.map(id => issueWindowService.getDraftById(id)))
      setPrintDrafts(details)
      setTimeout(() => window.print(), 300)
    } catch { showToast('error', 'Failed to load drafts for printing') }
  }

  const handleViewDraft = async (id: number) => {
    setLoadingViewDraft(true)
    try {
      const detail = await issueWindowService.getDraftById(id)
      setViewingDraft(detail)
    } catch { showToast('error', 'Failed to load draft') }
    finally { setLoadingViewDraft(false) }
  }

  const handleIssue = async (issuedBy: string, receivedBy: string) => {
    if (!issuingDraft) return
    setIssuing(true)
    try {
      const results = await issueWindowService.issueDraft(issuingDraft.id, { issuedBy, receivedBy })
      const failed = results.filter(r => !r.success)
      if (!failed.length) {
        showToast('success', `${results.length} requisition(s) issued successfully`)
      } else {
        showToast('error', `${failed.length} failed: ${failed.map(r => r.message).join('; ')}`)
      }
      setIssuingDraft(null)
      const [drafts, issued] = await Promise.all([
        issueWindowService.getDrafts(),
        issueWindowService.getFinalizedDrafts(),
      ])
      setAllDrafts(drafts)
      setIssueDrafts(issued)
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Failed to issue materials')
    } finally {
      setIssuing(false)
    }
  }

  const priorityBadge = (p: string) => {
    const cls = p === 'High'
      ? 'bg-red-50 text-red-700 border-red-200'
      : p === 'Low'
      ? 'bg-green-50 text-green-700 border-green-200'
      : 'bg-blue-50 text-blue-700 border-blue-200'
    return <Badge className={`text-[10px] px-1 py-0 ${cls}`}>{p === 'Medium' ? 'Med' : p}</Badge>
  }

  const pendingDrafts = allDrafts.filter(d => d.status === 'Draft')
  const finalizedDrafts = allDrafts.filter(d => d.status === 'Finalized')
  const totalAvailableCuts = materialGroups.reduce((s, g) => s + g.cuts.filter(c => !draftedCutKeys.has(cutKey(c))).length, 0)

  const q = searchQuery.toLowerCase().trim()
  const filteredRequisitions = q ? requisitions.filter(r => r.requisitionNo.toLowerCase().includes(q)) : requisitions
  const filteredAllDrafts = q ? allDrafts.filter(d => d.draftNo.toLowerCase().includes(q)) : allDrafts
  const filteredIssueDrafts = q ? issueDrafts.filter(d => d.draftNo.toLowerCase().includes(q)) : issueDrafts

  const searchPlaceholders: Record<TabType, string> = {
    planning: 'Search requisitions…',
    drafts: 'Search drafts…',
    'issue-list': 'Search issue list…',
  }

  return (
    <>
      <PrintSlip drafts={printDrafts} />

      {toast && (
        <div className={cn(
          'fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium max-w-sm',
          toast.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        )}>
          {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
          <span className="flex-1">{toast.msg}</span>
          <button onClick={() => setToast(null)}><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      <div className="flex flex-col h-full">
        {/* Tab bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b bg-background shrink-0 gap-4">
          {/* Tabs — left */}
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {([
              { key: 'planning' as TabType, label: 'Cutting Planning', count: null },
              { key: 'drafts' as TabType, label: 'Cutting Drafts', count: pendingDrafts.length },
              { key: 'issue-list' as TabType, label: 'Issue List', count: finalizedDrafts.length + issueDrafts.length > 0 ? (activeTab === 'issue-list' ? issueDrafts.length : finalizedDrafts.length) : 0 },
            ]).map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => { setActiveTab(key); setSearchQuery('') }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
                  activeTab === key
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {label}
                {count !== null && count > 0 && (
                  <span className="text-[10px] font-semibold bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 leading-none">
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search — right */}
          <div className="relative w-56 shrink-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholders[activeTab]}
              className="h-8 pl-8 text-xs"
            />
          </div>
        </div>

        {/* ── Tab: Cutting Planning ──────────────────────────────────────────── */}
        {activeTab === 'planning' && (
          <div className="flex flex-1 overflow-hidden">
            {/* Left panel — requisition list */}
            <div className="w-64 shrink-0 flex flex-col border-r bg-background">
              <div className="px-4 py-3 border-b bg-muted/20">
                <h2 className="text-sm font-semibold">Requisitions</h2>
                <p className="text-[11px] text-muted-foreground">{selectedReqIds.size} selected</p>
              </div>
              <div className="flex-1 overflow-y-auto">
                {loadingReqs ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : requisitions.length === 0 ? (
                  <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                    No approved requisitions
                  </div>
                ) : (
                  filteredRequisitions.map(req => (
                    <label key={req.id} className={cn(
                      'flex items-start gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-muted/40 transition-colors border-b border-border/50 last:border-0',
                      selectedReqIds.has(req.id) && 'bg-blue-50'
                    )}>
                      <Checkbox
                        checked={selectedReqIds.has(req.id)}
                        onCheckedChange={() => toggleReq(req.id)}
                        className="mt-0.5 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 justify-between">
                          <span className="text-xs font-semibold truncate">{req.requisitionNo}</span>
                          {priorityBadge(req.priority)}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 flex gap-2">
                          {req.dueDate && <span>{new Date(req.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>}
                          <span>{req.itemCount} items</span>
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
              <div className="px-3 py-2.5 border-t bg-background">
                <Button
                  className="w-full"
                  size="sm"
                  disabled={selectedReqIds.size === 0 || loadingGroups}
                  onClick={loadGroups}
                >
                  {loadingGroups
                    ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Loading…</>
                    : <>Load Groups <ChevronRight className="h-3.5 w-3.5 ml-1" /></>}
                </Button>
              </div>
            </div>

            {/* Right panel — material groups */}
            <div className="flex-1 flex flex-col overflow-hidden bg-muted/5">
              {!groupsLoaded ? (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
                  <Package className="h-16 w-16 opacity-10" />
                  <div className="text-center">
                    <p className="text-sm font-medium">No groups loaded</p>
                    <p className="text-xs mt-1 text-muted-foreground">Select requisitions and click "Load Groups"</p>
                  </div>
                </div>
              ) : materialGroups.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">No raw material requirements found</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Instruction banner */}
                  {totalAvailableCuts > 0 && (
                    <div className="flex items-start gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5">
                      <Lightbulb className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                      <span>
                        Tick the cuts you want to plan, then click <strong>Suggest Cutting Plan</strong> per material group.
                        The system will show 3 optimized bar options. Pick the best plan to create a draft.
                      </span>
                    </div>
                  )}

                  {/* Material group cards */}
                  {materialGroups.map(group => {
                    const gk = matKey(group)
                    return (
                      <MaterialGroupCard
                        key={gk}
                        group={group}
                        draftedCutKeys={draftedCutKeys}
                        selectedCutKeys={selectedCuts.get(gk) ?? new Set()}
                        onToggleCut={ck => toggleCut(gk, ck)}
                        onSelectAll={() => selectAllInGroup(group)}
                        onClearAll={() => clearGroup(gk)}
                        onSuggest={() => handleSuggest(group)}
                        suggesting={suggestingGroupKey === gk}
                      />
                    )
                  })}

                  {totalAvailableCuts === 0 && allDrafts.length > 0 && (
                    <div className="text-center py-6 text-xs text-muted-foreground">
                      All cuts drafted. Switch to <strong>Cutting Drafts</strong> tab to finalize.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Tab: Cutting Drafts ───────────────────────────────────────────── */}
        {activeTab === 'drafts' && (
          <div className="flex-1 overflow-y-auto p-6">
            {loadingDrafts ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : allDrafts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
                <FileText className="h-10 w-10 opacity-30" />
                <p className="text-sm">No drafts yet.</p>
                <p className="text-xs">Go to Cutting Planning to create drafts from requisitions.</p>
              </div>
            ) : (
              <div className="max-w-4xl space-y-2">
                {/* Actions bar for Draft-status items */}
                {pendingDrafts.length > 0 && (
                  <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-muted/40 border mb-1">
                    <div className="flex items-center gap-2.5 text-xs">
                      <Checkbox
                        checked={selectedDraftIds.size === pendingDrafts.length && pendingDrafts.length > 0}
                        onCheckedChange={checked => {
                          if (checked) setSelectedDraftIds(new Set(pendingDrafts.map(d => d.id)))
                          else setSelectedDraftIds(new Set())
                        }}
                      />
                      <span className="text-muted-foreground">
                        {selectedDraftIds.size > 0
                          ? `${selectedDraftIds.size} draft${selectedDraftIds.size !== 1 ? 's' : ''} selected`
                          : `${pendingDrafts.length} pending draft${pendingDrafts.length !== 1 ? 's' : ''}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline" size="sm" className="h-7 text-xs gap-1.5"
                        disabled={selectedDraftIds.size === 0}
                        onClick={handlePrintSlips}
                      >
                        <Printer className="h-3 w-3" />
                        Print Slip{selectedDraftIds.size !== 1 ? 's' : ''}
                      </Button>
                      <Button
                        size="sm" className="h-7 text-xs gap-1.5"
                        disabled={selectedDraftIds.size === 0 || finalizing}
                        onClick={() => setShowFinalizeDialog(true)}
                      >
                        {finalizing
                          ? <><Loader2 className="h-3 w-3 animate-spin" />Finalizing…</>
                          : <><ClipboardCheck className="h-3 w-3" />Finalize Selected</>}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Draft rows */}
                {filteredAllDrafts.map(d => {
                  const isFinalized = d.status === 'Finalized'
                  const isDraft = d.status === 'Draft'
                  const isIssued = d.status === 'Issued'
                  return (
                    <div
                      key={d.id}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-lg border bg-background hover:bg-muted/20 transition-colors',
                        isIssued && 'opacity-60'
                      )}
                    >
                      {isDraft ? (
                        <Checkbox
                          checked={selectedDraftIds.has(d.id)}
                          onCheckedChange={() => toggleDraftSelect(d.id)}
                          className="shrink-0"
                        />
                      ) : isIssued ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : (
                        <div className="h-4 w-4 shrink-0" />
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold">{d.draftNo}</span>
                          {isDraft && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">Draft</Badge>
                          )}
                          {isFinalized && (
                            <span className="rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] px-2 py-0.5 font-medium">
                              Finalized → Issue List
                            </span>
                          )}
                          {isIssued && (
                            <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-emerald-600">Issued</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 flex gap-2">
                          <span>{d.totalBars} bar{d.totalBars !== 1 ? 's' : ''}</span>
                          <span>·</span>
                          <span>{d.totalCuts} cuts</span>
                          <span>·</span>
                          <span>{d.requisitionCount} requisition{d.requisitionCount !== 1 ? 's' : ''}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost" size="sm" className="h-7 text-xs gap-1.5"
                          disabled={loadingViewDraft}
                          onClick={() => handleViewDraft(d.id)}
                        >
                          <FileText className="h-3 w-3" />View
                        </Button>
                        <Button
                          variant="ghost" size="sm" className="h-7 w-7 p-0"
                          onClick={async () => {
                            const detail = await issueWindowService.getDraftById(d.id)
                            setPrintDrafts([detail])
                            setTimeout(() => window.print(), 300)
                          }}
                          title="Print slip"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </Button>
                        {isDraft && (
                          <Button
                            variant="ghost" size="sm"
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteDraft(d.id)}
                            title="Delete draft"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Issue List ───────────────────────────────────────────────── */}
        {activeTab === 'issue-list' && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4 max-w-4xl">
              <p className="text-xs text-muted-foreground">
                Finalized cutting drafts ready for physical material issue
              </p>
              <Button variant="outline" size="sm" onClick={loadIssueDrafts} disabled={loadingIssueDrafts}>
                {loadingIssueDrafts ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
              </Button>
            </div>

            {loadingIssueDrafts ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : issueDrafts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
                <ClipboardList className="h-10 w-10 opacity-30" />
                <p className="text-sm">No finalized drafts yet.</p>
                <p className="text-xs">Finalize drafts in Cutting Drafts tab to see them here.</p>
              </div>
            ) : (
              <div className="space-y-2 max-w-4xl">
                {filteredIssueDrafts.map(draft => (
                  <div
                    key={draft.id}
                    className="flex items-center gap-4 rounded-lg border bg-background px-4 py-3 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold">{draft.draftNo}</span>
                        <span className="rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] px-2 py-0.5 font-medium">
                          Finalized
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{draft.requisitionCount} requisition{draft.requisitionCount !== 1 ? 's' : ''}</span>
                        <span>·</span>
                        <span>{draft.totalBars} bar{draft.totalBars !== 1 ? 's' : ''}</span>
                        <span>·</span>
                        <span>{draft.totalCuts} cut{draft.totalCuts !== 1 ? 's' : ''}</span>
                        {draft.finalizedAt && (
                          <>
                            <span>·</span>
                            <span>Finalized {format(new Date(draft.finalizedAt), 'dd MMM HH:mm')}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1.5"
                        onClick={() => handleViewDraft(draft.id)}
                        disabled={loadingViewDraft}
                      >
                        <Eye className="h-3 w-3" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 text-xs gap-1.5"
                        onClick={() => setIssuingDraft(draft)}
                      >
                        <PackageCheck className="h-3 w-3" />
                        Issue
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <ViewDraftModal
        open={viewingDraft !== null}
        draft={viewingDraft}
        onClose={() => setViewingDraft(null)}
        onPrint={() => {
          if (!viewingDraft) return
          setPrintDrafts([viewingDraft])
          setTimeout(() => window.print(), 300)
        }}
      />

      <PlanModal
        open={showPlanModal}
        plans={planOptions}
        onClose={() => setShowPlanModal(false)}
        onUsePlan={handleUsePlan}
        saving={savingDraft}
      />

      <FinalizeDialog
        open={showFinalizeDialog}
        onClose={() => setShowFinalizeDialog(false)}
        draftCount={selectedDraftIds.size}
        onFinalize={handleFinalize}
        finalizing={finalizing}
      />

      <IssueDialog
        open={issuingDraft !== null}
        draft={issuingDraft}
        onClose={() => setIssuingDraft(null)}
        onIssue={handleIssue}
        issuing={issuing}
      />

      <style jsx global>{`
        .print-slip {
          position: fixed;
          top: 0;
          left: 0;
          visibility: hidden;
          pointer-events: none;
          z-index: -1;
        }
        @media print {
          body { visibility: hidden; }
          .print-slip {
            visibility: visible !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            min-height: 100vh !important;
            background: white !important;
            z-index: 9999 !important;
            pointer-events: auto;
          }
          .print-slip * { visibility: visible !important; }
        }
      `}</style>
    </>
  )
}
