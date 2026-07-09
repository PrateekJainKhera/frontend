'use client'

import { useEffect, useState, useCallback } from 'react'
import { grnService, GRNResponse } from '@/lib/api/grn'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { GRNEntryDialog } from '@/components/forms/grn-entry-dialog'

type Tab = 'pending' | 'rejected'

export default function GRNApprovalsPage() {
  const [tab, setTab] = useState<Tab>('pending')
  const [grns, setGrns] = useState<GRNResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  // approve / reject
  const [actionGrnId, setActionGrnId] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [acting, setActing] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null)

  // edit & re-submit (rejected) — opens the full GRN Entry form
  const [editGrn, setEditGrn] = useState<GRNResponse | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = tab === 'pending'
        ? await grnService.getPendingApproval()
        : await grnService.getRejected()
      setGrns(data)
    } catch {
      toast.error(`Failed to load ${tab} GRNs`)
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => { load() }, [load])

  const changeTab = (t: Tab) => {
    setTab(t)
    setExpandedId(null)
    setActionGrnId(null)
  }

  const handleAction = async () => {
    if (!actionGrnId || !actionType) return
    setActing(true)
    try {
      if (actionType === 'approve') {
        await grnService.approve(actionGrnId, 'Admin', notes || undefined)
        toast.success('GRN approved — material pieces added to inventory')
      } else {
        if (!notes.trim()) { toast.error('Rejection reason is required'); setActing(false); return }
        await grnService.reject(actionGrnId, 'Admin', notes)
        toast.success('GRN rejected')
      }
      setActionGrnId(null); setActionType(null); setNotes('')
      await load()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setActing(false)
    }
  }


  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">GRN Approval</h1>
        <p className="text-muted-foreground text-sm">GRNs with &gt;5% weight variance require admin approval before material is added to inventory</p>
      </div>

      {/* Tabs */}
      <div className="inline-flex rounded-lg bg-muted p-1">
        <button
          onClick={() => changeTab('pending')}
          className={`px-4 py-1.5 text-sm rounded-md transition-colors ${tab === 'pending' ? 'bg-background shadow font-medium' : 'text-muted-foreground'}`}
        >
          Pending Approval
        </button>
        <button
          onClick={() => changeTab('rejected')}
          className={`px-4 py-1.5 text-sm rounded-md transition-colors ${tab === 'rejected' ? 'bg-background shadow font-medium' : 'text-muted-foreground'}`}
        >
          Rejected
        </button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : grns.length === 0 ? (
        <div className="border rounded-lg p-12 text-center text-muted-foreground">
          {tab === 'pending' ? (
            <><CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-green-500" /><p className="font-medium">No GRNs pending approval</p></>
          ) : (
            <><XCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" /><p className="font-medium">No rejected GRNs</p></>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {grns.map(grn => (
            <div key={grn.id} className="border rounded-lg overflow-hidden">
              {/* Row */}
              <div className="flex items-center gap-4 p-4">
                <div className="flex-1 grid grid-cols-5 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">GRN No</p>
                    <p className="font-semibold">{grn.grnNo}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p>{new Date(grn.grnDate).toLocaleDateString('en-GB')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Supplier</p>
                    <p>{grn.supplierName ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Invoice</p>
                    <p>{grn.invoiceNo ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pieces</p>
                    <p>{grn.totalPieces} pcs / {grn.totalWeight?.toFixed(2)} kg</p>
                  </div>
                </div>
                {tab === 'pending' ? (
                  <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50">
                    <AlertTriangle className="h-3 w-3 mr-1" /> Pending Approval
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50">
                    <XCircle className="h-3 w-3 mr-1" /> Rejected
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={() => setExpandedId(expandedId === grn.id ? null : grn.id)}>
                  {expandedId === grn.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>

              {/* Expanded detail */}
              {expandedId === grn.id && (
                <div className="border-t bg-muted/30 p-4 space-y-4">
                  {/* Rejection reason (rejected tab) */}
                  {tab === 'rejected' && grn.rejectionNotes && (
                    <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm">
                      <p className="font-medium text-red-700">Rejection reason</p>
                      <p className="text-red-800 mt-0.5">{grn.rejectionNotes}</p>
                      <p className="text-xs text-red-600 mt-1">
                        by {grn.rejectedBy ?? '—'}{grn.rejectedAt ? ` · ${new Date(grn.rejectedAt).toLocaleString('en-GB')}` : ''}
                      </p>
                    </div>
                  )}

                  {/* Lines */}
                  {grn.lines && grn.lines.length > 0 ? (
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-muted text-left text-xs">
                          <th className="p-2 border">Material</th>
                          <th className="p-2 border">Pcs</th>
                          <th className="p-2 border">Actual Weight</th>
                          <th className="p-2 border">Wt. Variance</th>
                          <th className="p-2 border">Length/pc</th>
                        </tr>
                      </thead>
                      <tbody>
                        {grn.lines.map((line) => (
                          <tr key={line.id} className={line.lengthVariancePct && line.lengthVariancePct > 5 ? 'bg-red-50' : ''}>
                            <td className="p-2 border">{line.materialName} {line.grade ? `· ${line.grade}` : ''}</td>
                            <td className="p-2 border">{line.numberOfPieces}</td>
                            <td className="p-2 border font-medium">{line.totalWeightKG.toFixed(2)} kg</td>
                            <td className="p-2 border">
                              {line.lengthVariancePct != null ? (
                                <span className={`font-semibold ${line.lengthVariancePct > 5 ? 'text-red-600' : 'text-yellow-600'}`}>
                                  {line.lengthVariancePct.toFixed(1)}%
                                </span>
                              ) : '—'}
                            </td>
                            <td className="p-2 border">{line.lengthPerPieceMM ? `${(line.lengthPerPieceMM / 1000).toFixed(3)} m` : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-xs text-muted-foreground">No line details available.</p>
                  )}

                  {/* Actions */}
                  {tab === 'pending' ? (
                    actionGrnId === grn.id ? (
                      <div className="space-y-3 border rounded p-3 bg-white">
                        <p className="text-sm font-medium">{actionType === 'approve' ? 'Approve GRN' : 'Reject GRN'}</p>
                        <div>
                          <label className="text-xs text-muted-foreground">{actionType === 'reject' ? 'Rejection reason *' : 'Notes (optional)'}</label>
                          <textarea className="w-full border rounded p-2 text-sm mt-1" rows={2} value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder={actionType === 'reject' ? 'Enter reason for rejection...' : 'Enter notes (optional)...'} />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleAction} disabled={acting}
                            className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}>
                            {acting ? 'Processing...' : actionType === 'approve' ? 'Confirm Approve' : 'Confirm Reject'}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setActionGrnId(null); setActionType(null); setNotes('') }}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700"
                          onClick={() => { setActionGrnId(grn.id); setActionType('approve'); setNotes('') }}>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50"
                          onClick={() => { setActionGrnId(grn.id); setActionType('reject'); setNotes('') }}>
                          <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                        </Button>
                      </div>
                    )
                  ) : (
                    // Rejected tab actions
                    <Button size="sm" variant="outline" className="text-blue-600 border-blue-300 hover:bg-blue-50" onClick={() => setEditGrn(grn)}>
                      <RotateCcw className="h-3.5 w-3.5 mr-1" /> Edit &amp; Re-submit
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit & Re-submit — full GRN entry form pre-filled with the rejected GRN */}
      <GRNEntryDialog
        open={!!editGrn}
        editGrn={editGrn}
        onOpenChange={(o) => { if (!o) setEditGrn(null) }}
        onSuccess={() => { setEditGrn(null); load() }}
      />
    </div>
  )
}
