'use client'

import { useEffect, useState } from 'react'
import { issueWindowService } from '@/lib/api/issue-window'
import { DraftSummary, DraftDetail, IssueDraftRequest } from '@/types/issue-window'
import { Button } from '@/components/ui/button'
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
  Loader2,
  CheckCircle2,
  AlertTriangle,
  X,
  Eye,
  PackageCheck,
  ClipboardList,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

// ── Issue Dialog ──────────────────────────────────────────────────────────────

function IssueDialog({
  open,
  draft,
  onClose,
  onIssue,
  issuing,
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
  open,
  draft,
  onClose,
}: {
  open: boolean
  draft: DraftDetail | null
  onClose: () => void
}) {
  if (!draft) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[90vw] h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-4 pt-3 pb-2 border-b shrink-0">
          <DialogTitle className="text-sm">
            {draft.draftNo} — Bar Assignments
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              ({draft.barAssignments.length} bar{draft.barAssignments.length !== 1 ? 's' : ''})
            </span>
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {draft.barAssignments.map(bar => (
            <div key={bar.id} className="border rounded-lg overflow-hidden text-xs">
              <div className="bg-muted/50 px-3 py-2 flex items-center justify-between">
                <span className="font-semibold">{bar.pieceNo ?? `Bar #${bar.id}`}</span>
                <span className="text-muted-foreground">
                  {bar.materialName} {bar.grade} ⌀{bar.diameterMM}mm — {bar.pieceCurrentLengthMM}mm
                  {bar.willBeScrap && <span className="ml-2 text-orange-600 font-medium">→ Scrap</span>}
                </span>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/20 text-muted-foreground">
                    <th className="text-left px-3 py-1.5 font-medium">Part / Job Card</th>
                    <th className="text-left px-3 py-1.5 font-medium">Requisition</th>
                    <th className="text-right px-3 py-1.5 font-medium">Length (mm)</th>
                  </tr>
                </thead>
                <tbody>
                  {bar.cuts.map(cut => (
                    <tr key={cut.id} className="border-t border-border/50">
                      <td className="px-3 py-1.5">{cut.jobCardNo ?? cut.partName ?? '—'}</td>
                      <td className="px-3 py-1.5 text-muted-foreground">{cut.requisitionNo ?? '—'}</td>
                      <td className="px-3 py-1.5 text-right font-mono">{cut.cutLengthMM}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-muted/10">
                    <td colSpan={2} className="px-3 py-1.5 text-muted-foreground">Remaining</td>
                    <td className={cn(
                      'px-3 py-1.5 text-right font-mono font-semibold',
                      bar.willBeScrap ? 'text-orange-600' : 'text-green-700'
                    )}>
                      {bar.remainingMM ?? 0} mm
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ))}
        </div>
        <DialogFooter className="px-4 py-2 border-t shrink-0">
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function IssueListPage() {
  const [drafts, setDrafts] = useState<DraftSummary[]>([])
  const [loading, setLoading] = useState(true)

  const [issuingDraft, setIssuingDraft] = useState<DraftSummary | null>(null)
  const [issuing, setIssuing] = useState(false)

  const [viewingDraft, setViewingDraft] = useState<DraftDetail | null>(null)
  const [loadingView, setLoadingView] = useState(false)

  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }

  const loadDrafts = async () => {
    setLoading(true)
    try {
      const data = await issueWindowService.getFinalizedDrafts()
      setDrafts(data)
    } catch {
      showToast('error', 'Failed to load issue list')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadDrafts() }, [])

  const handleViewDraft = async (id: number) => {
    setLoadingView(true)
    try {
      const detail = await issueWindowService.getDraftById(id)
      setViewingDraft(detail)
    } catch {
      showToast('error', 'Failed to load draft details')
    } finally {
      setLoadingView(false)
    }
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
      await loadDrafts()
    } catch (e: unknown) {
      showToast('error', e instanceof Error ? e.message : 'Failed to issue materials')
    } finally {
      setIssuing(false)
    }
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className={cn(
          'fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm shadow-lg',
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        )}>
          {toast.type === 'success'
            ? <CheckCircle2 className="h-4 w-4 shrink-0" />
            : <AlertTriangle className="h-4 w-4 shrink-0" />}
          <span className="flex-1">{toast.msg}</span>
          <button onClick={() => setToast(null)}><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-background shrink-0">
          <div>
            <h1 className="text-xl font-semibold">Issue List</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Finalized cutting drafts ready for physical material issue
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadDrafts} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : drafts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
              <ClipboardList className="h-10 w-10 opacity-30" />
              <p className="text-sm">No finalized drafts yet.</p>
              <p className="text-xs">Finalize drafts in Cutting Planning to see them here.</p>
            </div>
          ) : (
            <div className="space-y-2 max-w-4xl">
              {drafts.map(draft => (
                <div
                  key={draft.id}
                  className="flex items-center gap-4 rounded-lg border bg-background px-4 py-3 hover:bg-muted/20 transition-colors"
                >
                  {/* Draft info */}
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

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => handleViewDraft(draft.id)}
                      disabled={loadingView}
                    >
                      <Eye className="h-3 w-3" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 text-xs gap-1"
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
      </div>

      {/* Issue Dialog */}
      <IssueDialog
        open={issuingDraft !== null}
        draft={issuingDraft}
        onClose={() => setIssuingDraft(null)}
        onIssue={handleIssue}
        issuing={issuing}
      />

      {/* View Draft Modal */}
      <ViewDraftModal
        open={viewingDraft !== null}
        draft={viewingDraft}
        onClose={() => setViewingDraft(null)}
      />
    </>
  )
}
