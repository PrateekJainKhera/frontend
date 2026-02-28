'use client'

import { useEffect, useState } from 'react'
import { grnService, GRNResponse } from '@/lib/api/grn'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'

export default function GRNApprovalsPage() {
  const [grns, setGrns] = useState<GRNResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [actionGrnId, setActionGrnId] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [acting, setActing] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await grnService.getPendingApproval()
      setGrns(data)
    } catch {
      toast.error('Failed to load pending GRNs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

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
      setActionGrnId(null)
      setActionType(null)
      setNotes('')
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

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : grns.length === 0 ? (
        <div className="border rounded-lg p-12 text-center text-muted-foreground">
          <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-green-500" />
          <p className="font-medium">No GRNs pending approval</p>
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
                <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Pending Approval
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => setExpandedId(expandedId === grn.id ? null : grn.id)}>
                  {expandedId === grn.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>

              {/* Expanded detail */}
              {expandedId === grn.id && (
                <div className="border-t bg-muted/30 p-4 space-y-4">
                  {/* Lines with variance */}
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
                        {grn.lines.map((line, i) => (
                          <tr key={i} className={line.lengthVariancePct && line.lengthVariancePct > 5 ? 'bg-red-50' : ''}>
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
                    <p className="text-xs text-muted-foreground">Load GRN details to see line variance</p>
                  )}

                  {/* Action panel */}
                  {actionGrnId === grn.id ? (
                    <div className="space-y-3 border rounded p-3 bg-white">
                      <p className="text-sm font-medium">{actionType === 'approve' ? 'Approve GRN' : 'Reject GRN'}</p>
                      <div>
                        <label className="text-xs text-muted-foreground">{actionType === 'reject' ? 'Rejection reason *' : 'Notes (optional)'}</label>
                        <textarea
                          className="w-full border rounded p-2 text-sm mt-1"
                          rows={2}
                          value={notes}
                          onChange={e => setNotes(e.target.value)}
                          placeholder={actionType === 'reject' ? 'Enter reason for rejection...' : 'Enter notes (optional)...'}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleAction} disabled={acting}
                          className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}>
                          {acting ? 'Processing...' : actionType === 'approve' ? 'Confirm Approve' : 'Confirm Reject'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setActionGrnId(null); setActionType(null); setNotes('') }}>
                          Cancel
                        </Button>
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
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
