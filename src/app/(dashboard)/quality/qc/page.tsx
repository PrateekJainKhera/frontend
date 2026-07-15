'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { ShieldCheck, RefreshCw, Search, CheckCircle, XCircle, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { qcService, QCPendingItem } from '@/lib/api/qc'
import { getCurrentUserName } from '@/lib/auth'

function spec(i: QCPendingItem) {
  return [i.machineModel, i.rollerType, i.numberOfTeeth ? `${i.numberOfTeeth}T` : null]
    .filter(Boolean).join(' · ')
}

function SubmitQCDialog({
  item, onClose, onSaved,
}: { item: QCPendingItem | null; onClose: () => void; onSaved: () => void }) {
  const [qcStatus, setQcStatus] = useState<'Passed' | 'Failed'>('Passed')
  const [qcBy, setQcBy] = useState('')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (item) { setQcStatus('Passed'); setQcBy(getCurrentUserName()); setNotes(''); setFile(null) }
  }, [item])

  if (!item) return null

  async function save() {
    if (!item) return
    if (!qcBy.trim()) { toast.error('Enter who performed the QC'); return }
    setSaving(true)
    try {
      await qcService.submitQC(item.orderItemId, item.orderId, qcStatus, qcBy.trim(), notes, file)
      toast.success(qcStatus === 'Passed'
        ? 'QC passed — item moves to Ready to Dispatch'
        : 'QC failed — sent for rework')
      onSaved(); onClose()
    } catch (e: any) { toast.error(e.message || 'QC submit failed') }
    finally { setSaving(false) }
  }

  return (
    <Dialog open={!!item} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Submit QC</DialogTitle></DialogHeader>
        <div className="space-y-3 py-1">
          <div className="rounded-md bg-muted/50 p-3 text-sm space-y-0.5">
            <p className="font-mono font-medium">{item.orderNo}-{item.itemSequence}</p>
            <p className="text-muted-foreground">{spec(item)} · {item.customerName} · Qty {item.quantity}</p>
            {item.qcStatus === 'Failed' && (
              <p className="text-red-600 text-xs font-medium">Previously failed — re-submitting</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Result</label>
            <Select value={qcStatus} onValueChange={(v) => setQcStatus(v as 'Passed' | 'Failed')}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Passed">Passed</SelectItem>
                <SelectItem value="Failed">Failed (send to rework)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">QC By</label>
            <Input value={qcBy} onChange={(e) => setQcBy(e.target.value)} className="h-9" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Notes</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} className="h-9" placeholder="Optional" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">QC Certificate (optional PDF)</label>
            <Input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => setFile(e.target.files?.[0] || null)} className="h-9" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button
            onClick={save}
            disabled={saving}
            className={`gap-1 ${qcStatus === 'Passed' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
          >
            {saving ? <RefreshCw className="h-3 w-3 animate-spin" /> : qcStatus === 'Passed' ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
            {qcStatus === 'Passed' ? 'Mark Passed' : 'Mark Failed'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function QualityQCPage() {
  const [items, setItems] = useState<QCPendingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogItem, setDialogItem] = useState<QCPendingItem | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try { setItems(await qcService.getPending()) }
    catch (e: any) { toast.error(e.message || 'Failed to load QC items') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const q = search.toLowerCase()
  const shown = items.filter((i) =>
    !q ||
    `${i.orderNo}-${i.itemSequence}`.toLowerCase().includes(q) ||
    (i.customerName || '').toLowerCase().includes(q) ||
    spec(i).toLowerCase().includes(q)
  )
  const failedCount = items.filter((i) => i.qcStatus === 'Failed').length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Quality Check (QC)</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Assembly complete — awaiting QC sign-off before dispatch</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <div className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm">
          <ShieldCheck className="h-4 w-4 text-blue-500" />
          <span className="font-semibold">{items.length}</span>
          <span className="text-muted-foreground">Awaiting QC</span>
        </div>
        {failedCount > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm">
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="font-semibold text-red-700">{failedCount}</span>
            <span className="text-red-600">Failed</span>
          </div>
        )}
        <div className="relative max-w-sm ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search order, part, customer…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 pl-8" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin mr-2" /> Loading…
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2 border-2 border-dashed rounded-lg">
          <ShieldCheck className="h-8 w-8 opacity-30" />
          <p className="text-sm">Nothing awaiting QC right now.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {shown.map((it) => {
            const isFailed = it.qcStatus === 'Failed'
            return (
              <div key={it.orderItemId} className="flex flex-wrap items-center gap-3 p-3 border rounded-lg hover:bg-muted/40">
                <div className="min-w-0">
                  <p className="font-mono font-semibold text-sm">{it.orderNo}-{it.itemSequence}</p>
                  <p className="text-xs text-muted-foreground">{spec(it)} · {it.customerName}</p>
                </div>
                <span className="text-sm">Qty <b>{it.quantity}</b></span>
                <div className="ml-auto flex items-center gap-2">
                  {isFailed
                    ? <Badge className="bg-red-100 text-red-700 border-red-200">Failed</Badge>
                    : <Badge className="bg-amber-100 text-amber-700 border-amber-200">Awaiting QC</Badge>}
                  <Button size="sm" onClick={() => setDialogItem(it)} className="gap-1.5">
                    <ShieldCheck className="h-4 w-4" />
                    {isFailed ? 'Re-submit QC' : 'Submit QC'}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <SubmitQCDialog item={dialogItem} onClose={() => setDialogItem(null)} onSaved={load} />
    </div>
  )
}
