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
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
  onFinalize: (issuedBy: string, receivedBy: string) => void
  finalizing: boolean
}) {
  const [issuedBy, setIssuedBy] = useState('')
  const [receivedBy, setReceivedBy] = useState('')

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Finalize & Issue Drafts</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-lg bg-muted p-3 text-sm">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Drafts to issue</span>
              <span className="font-semibold">{draftCount}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="issuedBy" className="text-xs">Issued By *</Label>
            <Input
              id="issuedBy"
              value={issuedBy}
              onChange={e => setIssuedBy(e.target.value)}
              placeholder="Name"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="receivedBy" className="text-xs">Received By *</Label>
            <Input
              id="receivedBy"
              value={receivedBy}
              onChange={e => setReceivedBy(e.target.value)}
              placeholder="Name"
              className="h-8 text-sm"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} size="sm">Cancel</Button>
          <Button
            onClick={() => onFinalize(issuedBy, receivedBy)}
            disabled={finalizing || !issuedBy || !receivedBy}
            size="sm"
          >
            {finalizing
              ? <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />Issuing…</>
              : <><ClipboardCheck className="h-3.5 w-3.5 mr-1" />Issue {draftCount} Draft{draftCount !== 1 ? 's' : ''}</>}
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
  onPrint: () => void
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
          <Button variant="outline" onClick={onPrint} className="gap-1.5">
            <Printer className="h-3.5 w-3.5" />
            Print Slip
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Print Slip ────────────────────────────────────────────────────────────────

function PrintSlip({ drafts }: { drafts: DraftDetail[] }) {
  if (!drafts.length) return null
  return (
    <div className="print-slip">
      {drafts.map(draft => (
        <div key={draft.id} style={{ fontFamily: 'monospace', fontSize: '12px', padding: '20px', pageBreakAfter: 'always' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>MATERIAL ISSUE SLIP</h1>
              <p style={{ margin: '4px 0 0', color: '#666', fontSize: '11px' }}>Draft No: {draft.draftNo}</p>
            </div>
            <div style={{ textAlign: 'right', fontSize: '11px', color: '#666' }}>
              <p style={{ margin: 0 }}>Date: {new Date(draft.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              <p style={{ margin: '2px 0 0' }}>Status: {draft.status}</p>
            </div>
          </div>
          {draft.barAssignments.map(bar => (
            <div key={bar.id} style={{ marginBottom: '16px', border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ background: '#f0f0f0', padding: '6px 10px', borderBottom: '1px solid #ccc', display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <strong>{bar.materialName}{bar.grade ? ` · ${bar.grade}` : ''}{bar.diameterMM ? ` · ∅${bar.diameterMM}mm` : ''}</strong>
                <span>Bar: {bar.pieceNo} ({bar.pieceCurrentLengthMM}mm) → Cut: {bar.totalCutMM}mm · Left: {bar.remainingMM}mm{bar.willBeScrap ? ' (scrap)' : ' → stock'}</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: '#f8f8f8' }}>
                    {['S.No', 'Cut (mm)', 'Job Card / Part', 'Requisition'].map(h => (
                      <th key={h} style={{ border: '1px solid #ddd', padding: '4px 8px', textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bar.cuts.map((cut, i) => (
                    <tr key={cut.id}>
                      <td style={{ border: '1px solid #ddd', padding: '4px 8px' }}>{i + 1}</td>
                      <td style={{ border: '1px solid #ddd', padding: '4px 8px', fontWeight: 'bold' }}>{cut.cutLengthMM}</td>
                      <td style={{ border: '1px solid #ddd', padding: '4px 8px' }}>{cut.jobCardNo ?? cut.partName ?? '—'}</td>
                      <td style={{ border: '1px solid #ddd', padding: '4px 8px' }}>{cut.requisitionNo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
            <div>
              <div style={{ borderBottom: '1px solid #000', paddingBottom: '28px', marginBottom: '4px' }}>{draft.issuedBy ?? ''}</div>
              <div style={{ fontSize: '10px', color: '#666' }}>Issued By / Signature</div>
            </div>
            <div>
              <div style={{ borderBottom: '1px solid #000', paddingBottom: '28px', marginBottom: '4px' }}>{draft.receivedBy ?? ''}</div>
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
  const [requisitions, setRequisitions] = useState<IssueWindowRequisition[]>([])
  const [selectedReqIds, setSelectedReqIds] = useState<Set<number>>(new Set())
  const [loadingReqs, setLoadingReqs] = useState(true)

  const [materialGroups, setMaterialGroups] = useState<MaterialGroup[]>([])
  const [loadingGroups, setLoadingGroups] = useState(false)
  const [groupsLoaded, setGroupsLoaded] = useState(false)

  // cutKey → already assigned to a draft
  const [draftedCutKeys, setDraftedCutKeys] = useState<Set<string>>(new Set())
  // matKey → Set of selected cutKeys (for suggest)
  const [selectedCuts, setSelectedCuts] = useState<Map<string, Set<string>>>(new Map())

  // Suggest plan state
  const [suggestingGroupKey, setSuggestingGroupKey] = useState<string | null>(null)
  const [currentSuggestingGroup, setCurrentSuggestingGroup] = useState<MaterialGroup | null>(null)
  const [planOptions, setPlanOptions] = useState<CuttingPlanOption[]>([])
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)

  // Drafts
  const [allDrafts, setAllDrafts] = useState<DraftSummary[]>([])
  const [loadingDrafts, setLoadingDrafts] = useState(true)
  const [selectedDraftIds, setSelectedDraftIds] = useState<Set<number>>(new Set())
  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false)
  const [finalizing, setFinalizing] = useState(false)

  // Print slips
  const [printDrafts, setPrintDrafts] = useState<DraftDetail[]>([])

  // View draft modal
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

  useEffect(() => {
    issueWindowService.getApprovedRequisitions()
      .then(setRequisitions).finally(() => setLoadingReqs(false))
    issueWindowService.getDrafts()
      .then(setAllDrafts).finally(() => setLoadingDrafts(false))
  }, [])

  const toggleReq = (id: number) => {
    setSelectedReqIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
    // Reset right panel
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

      // Pre-populate draftedCutKeys from all pending drafts
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

    // Build the cut items to send
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

      // Unique requisition IDs from all cuts in plan
      const reqIds = [...new Set(plan.bars.flatMap(b => b.cuts.map(c => c.requisitionId).filter(Boolean) as number[]))]
      if (!reqIds.length) {
        // Fall back to all selected requisitions
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

      // Mark the cuts as drafted
      const newDrafted = new Set(draftedCutKeys)
      plan.bars.forEach(b => b.cuts.forEach(c => newDrafted.add(`${c.requisitionItemId}_${c.cutIndex}`)))
      setDraftedCutKeys(newDrafted)

      // Clear selection for this group
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

  const handleFinalize = async (issuedBy: string, receivedBy: string) => {
    const draftIds = [...selectedDraftIds]
    setFinalizing(true)
    setShowFinalizeDialog(false)
    try {
      const results = await issueWindowService.finalizeMultiple({ draftIds, issuedBy, receivedBy })
      const failed = results.filter(r => !r.success)
      if (!failed.length) {
        showToast('success', `${results.length} requisition(s) issued successfully`)
      } else {
        showToast('error', `${failed.length} failed: ${failed.map(r => r.message).join('; ')}`)
      }
      setSelectedDraftIds(new Set())
      await refreshDrafts()
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

  const priorityBadge = (p: string) => {
    const cls = p === 'High'
      ? 'bg-red-50 text-red-700 border-red-200'
      : p === 'Low'
      ? 'bg-green-50 text-green-700 border-green-200'
      : 'bg-blue-50 text-blue-700 border-blue-200'
    return <Badge className={`text-[10px] px-1 py-0 ${cls}`}>{p === 'Medium' ? 'Med' : p}</Badge>
  }

  const pendingDrafts = allDrafts.filter(d => d.status === 'Draft')
  const issuedDrafts = allDrafts.filter(d => d.status === 'Issued')

  // Check if all cuts across all groups are drafted
  const totalAvailableCuts = materialGroups.reduce((s, g) => s + g.cuts.filter(c => !draftedCutKeys.has(cutKey(c))).length, 0)

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
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-background shrink-0">
          <div>
            <h1 className="text-xl font-semibold">Material Issue Window</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select requisitions → tick cuts → suggest plan → save drafts → finalize & issue
            </p>
          </div>
        </div>

        {/* Main content */}
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
                requisitions.map(req => (
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

          {/* Right panel */}
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

                {/* Drafts section */}
                {(pendingDrafts.length > 0 || issuedDrafts.length > 0) && (
                  <div className="border rounded-xl overflow-hidden shadow-sm bg-white">
                    <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold text-sm">Cutting Drafts</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {allDrafts.length} total
                      </Badge>
                    </div>

                    <div className="divide-y">
                      {allDrafts.map(d => (
                        <div key={d.id} className={cn(
                          'flex items-center gap-3 px-4 py-2.5 text-xs',
                          d.status === 'Issued' && 'opacity-60'
                        )}>
                          {d.status === 'Draft' && (
                            <Checkbox
                              checked={selectedDraftIds.has(d.id)}
                              onCheckedChange={() => toggleDraftSelect(d.id)}
                              className="shrink-0"
                            />
                          )}
                          {d.status === 'Issued' && (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          )}
                          <span className="font-semibold">{d.draftNo}</span>
                          <span className="text-muted-foreground">{d.totalBars} bars · {d.totalCuts} cuts</span>
                          <Badge
                            variant={d.status === 'Issued' ? 'default' : 'outline'}
                            className={cn('text-[10px] px-1.5 py-0', d.status === 'Issued' && 'bg-emerald-600')}
                          >
                            {d.status}
                          </Badge>
                          <div className="ml-auto flex items-center gap-1">
                            <Button
                              variant="ghost" size="sm" className="h-6 px-2 text-[11px] gap-1"
                              disabled={loadingViewDraft}
                              onClick={async () => {
                                setLoadingViewDraft(true)
                                try {
                                  const detail = await issueWindowService.getDraftById(d.id)
                                  setViewingDraft(detail)
                                } catch { showToast('error', 'Failed to load draft') }
                                finally { setLoadingViewDraft(false) }
                              }}
                              title="View draft"
                            >
                              <FileText className="h-3 w-3" />
                              View
                            </Button>
                            <Button
                              variant="ghost" size="sm" className="h-6 px-1.5 text-[11px]"
                              onClick={async () => {
                                const detail = await issueWindowService.getDraftById(d.id)
                                setPrintDrafts([detail])
                                setTimeout(() => window.print(), 300)
                              }}
                              title="Print slip"
                            >
                              <Printer className="h-3 w-3" />
                            </Button>
                            {d.status === 'Draft' && (
                              <Button
                                variant="ghost" size="sm"
                                className="h-6 px-1.5 text-[11px] text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDeleteDraft(d.id)}
                                title="Delete draft"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Finalize bar */}
                    {pendingDrafts.length > 0 && (
                      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-muted/20 border-t">
                        <div className="flex items-center gap-2 text-xs">
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
                              : `Select drafts to finalize`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline" size="sm" className="h-7 text-xs gap-1"
                            disabled={selectedDraftIds.size === 0}
                            onClick={handlePrintSlips}
                          >
                            <Printer className="h-3 w-3" />
                            Print Slip{selectedDraftIds.size !== 1 ? 's' : ''}
                          </Button>
                          <Button
                            size="sm" className="h-7 text-xs gap-1"
                            disabled={selectedDraftIds.size === 0 || finalizing}
                            onClick={() => setShowFinalizeDialog(true)}
                          >
                            {finalizing
                              ? <><Loader2 className="h-3 w-3 animate-spin" />Issuing…</>
                              : <><ClipboardCheck className="h-3 w-3" />Finalize & Issue</>}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Empty draft state prompt */}
                {!loadingDrafts && allDrafts.length === 0 && totalAvailableCuts === 0 && (
                  <div className="text-center py-6 text-xs text-muted-foreground">
                    No drafts yet. Select cuts and suggest a plan to create one.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View draft modal */}
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

      {/* Plan modal */}
      <PlanModal
        open={showPlanModal}
        plans={planOptions}
        onClose={() => setShowPlanModal(false)}
        onUsePlan={handleUsePlan}
        saving={savingDraft}
      />

      {/* Finalize dialog */}
      <FinalizeDialog
        open={showFinalizeDialog}
        onClose={() => setShowFinalizeDialog(false)}
        draftCount={selectedDraftIds.size}
        onFinalize={handleFinalize}
        finalizing={finalizing}
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
