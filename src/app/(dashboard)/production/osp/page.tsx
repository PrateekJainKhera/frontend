'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { RefreshCw, Plus, CheckCircle, AlertTriangle, Truck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { ospService, OSPTrackingEntry, OSPJobCardOption } from '@/lib/api/osp'
import { vendorService, VendorResponse } from '@/lib/api/vendors'

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

const isOverdue = (e: OSPTrackingEntry) =>
  e.status === 'Sent' && new Date(e.expectedReturnDate) < new Date()

const orderLabel = (e: { orderNo?: string | null; orderId: number; itemSequence?: string | null }) =>
  `${e.orderNo ?? e.orderId}${e.itemSequence ? `-${e.itemSequence}` : ''}`

// ── Log OSP Dialog ────────────────────────────────────────────────────────────

function LogDialog({
  open, onClose, onSaved, jobCards, vendors,
}: {
  open: boolean; onClose: () => void; onSaved: () => void
  jobCards: OSPJobCardOption[]; vendors: VendorResponse[]
}) {
  const [jcId, setJcId] = useState('')
  const [vendorId, setVendorId] = useState('')
  const [qty, setQty] = useState('')
  const [sentDate, setSentDate] = useState(new Date().toISOString().slice(0, 10))
  const [expectedReturn, setExpectedReturn] = useState('')
  const [notes, setNotes] = useState('')
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)

  const selectedJc = jobCards.find((j) => String(j.jobCardId) === jcId)
  useEffect(() => { if (selectedJc) setQty(String(selectedJc.quantity)) }, [selectedJc])

  const filtered = jobCards.filter((j) =>
    !search ||
    j.jobCardNo.toLowerCase().includes(search.toLowerCase()) ||
    (j.processName ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (j.childPartName ?? '').toLowerCase().includes(search.toLowerCase())
  )

  function reset() {
    setJcId(''); setVendorId(''); setQty(''); setSentDate(new Date().toISOString().slice(0, 10))
    setExpectedReturn(''); setNotes(''); setSearch('')
  }

  async function save() {
    if (!jcId || !vendorId || !qty || !sentDate || !expectedReturn) {
      toast.error('Fill all required fields'); return
    }
    setSaving(true)
    try {
      await ospService.create({
        jobCardId: Number(jcId), vendorId: Number(vendorId),
        quantity: Number(qty), sentDate, expectedReturnDate: expectedReturn,
        notes: notes || null, createdBy: 'Admin',
      })
      toast.success('OSP entry logged')
      reset(); onSaved(); onClose()
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose() } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Log OSP Entry</DialogTitle></DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label>Job Card <span className="text-red-500">*</span></Label>
            <Input placeholder="Search job card / process / part..." value={search}
              onChange={(e) => setSearch(e.target.value)} className="h-8 text-sm" />
            <Select value={jcId} onValueChange={setJcId}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Select job card" /></SelectTrigger>
              <SelectContent className="max-h-56">
                {filtered.length === 0 && <div className="px-3 py-2 text-sm text-muted-foreground">No results</div>}
                {filtered.map((j) => (
                  <SelectItem key={j.jobCardId} value={String(j.jobCardId)}>
                    <span className="font-mono font-medium">{j.jobCardNo}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {j.processName} · {j.childPartName} · {orderLabel(j)}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedJc && (
              <p className="text-xs text-muted-foreground">
                Process: <strong>{selectedJc.processName}</strong> · Part: <strong>{selectedJc.childPartName}</strong> · Qty: {selectedJc.quantity}
              </p>
            )}
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

          <div className="space-y-1.5">
            <Label>Quantity <span className="text-red-500">*</span></Label>
            <Input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} className="h-9" placeholder="0" />
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
          <Button variant="outline" onClick={() => { reset(); onClose() }} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="gap-1">
            {saving && <RefreshCw className="h-3 w-3 animate-spin" />} Log OSP
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Partial Receive Dialog ─────────────────────────────────────────────────────

function ReceiveDialog({
  entry, onClose, onSaved,
}: { entry: OSPTrackingEntry | null; onClose: () => void; onSaved: () => void }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [receivedQty, setReceivedQty] = useState('')
  const [rejectedQty, setRejectedQty] = useState('0')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (entry) {
      setDate(new Date().toISOString().slice(0, 10))
      const remaining = entry.quantity - entry.receivedQty - entry.rejectedQty
      setReceivedQty(String(remaining))
      setRejectedQty('0')
      setNotes('')
    }
  }, [entry])

  if (!entry) return null

  const alreadyProcessed = entry.receivedQty + entry.rejectedQty
  const remaining = entry.quantity - alreadyProcessed
  const newReceived = Number(receivedQty) || 0
  const newRejected = Number(rejectedQty) || 0
  const totalAfter = alreadyProcessed + newReceived + newRejected
  const willComplete = totalAfter >= entry.quantity
  const overLimit = totalAfter > entry.quantity

  async function save() {
    if (!entry) return
    if (!date) { toast.error('Select return date'); return }
    if (newReceived < 0 || newRejected < 0) { toast.error('Quantities cannot be negative'); return }
    if (newReceived + newRejected === 0) { toast.error('Enter at least 1 received or rejected'); return }
    if (overLimit) { toast.error(`Total (${totalAfter}) exceeds sent quantity (${entry.quantity})`); return }

    setSaving(true)
    try {
      const msg = await ospService.markReceived(entry.id, {
        actualReturnDate: date,
        receivedQty: newReceived,
        rejectedQty: newRejected,
        notes: notes || null,
        updatedBy: 'Admin',
      })
      toast.success(msg)
      onSaved(); onClose()
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  return (
    <Dialog open={!!entry} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Receive from Vendor</DialogTitle></DialogHeader>
        <div className="space-y-3 py-1">
          <div className="rounded-md bg-muted/50 p-3 text-sm space-y-0.5">
            <p><span className="font-medium">{entry.jobCardNo}</span> · {entry.processName}</p>
            <p className="text-muted-foreground">{entry.childPartName} · {entry.vendorName}</p>
            <p className="text-muted-foreground">
              Sent: <strong>{entry.quantity}</strong>
              {alreadyProcessed > 0 && (
                <span className="ml-2 text-orange-600 font-medium">
                  Previously: {entry.receivedQty} rcvd + {entry.rejectedQty} rej
                </span>
              )}
            </p>
            <p className="text-muted-foreground">
              Remaining: <strong className="text-foreground">{remaining}</strong>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Received Qty <span className="text-red-500">*</span></Label>
              <Input
                type="number" min={0} max={remaining}
                value={receivedQty}
                onChange={(e) => setReceivedQty(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Rejected Qty</Label>
              <Input
                type="number" min={0}
                value={rejectedQty}
                onChange={(e) => setRejectedQty(e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          {(newReceived + newRejected > 0) && (
            <div className={`text-xs rounded px-2 py-1.5 font-medium ${
              overLimit ? 'bg-red-50 text-red-700' :
              willComplete ? 'bg-green-50 text-green-700' :
              'bg-blue-50 text-blue-700'
            }`}>
              {overLimit
                ? `Exceeds sent quantity by ${totalAfter - entry.quantity}`
                : willComplete
                ? `Will fully close this OSP entry (job card auto-completed)`
                : `Partial receive — ${entry.quantity - totalAfter} still outstanding`
              }
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Actual Return Date <span className="text-red-500">*</span></Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9" />
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} className="h-9" placeholder="Condition, remarks..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button
            onClick={save}
            disabled={saving || overLimit}
            className={`gap-1 ${willComplete ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
          >
            {saving ? <RefreshCw className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
            {willComplete ? 'Fully Received' : 'Partial Receive'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function OSPTrackingPage() {
  const [entries, setEntries] = useState<OSPTrackingEntry[]>([])
  const [jobCards, setJobCards] = useState<OSPJobCardOption[]>([])
  const [vendors, setVendors] = useState<VendorResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [logOpen, setLogOpen] = useState(false)
  const [receiveEntry, setReceiveEntry] = useState<OSPTrackingEntry | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [e, jc, v] = await Promise.all([
        ospService.getAll(),
        ospService.getAvailableJobCards(),
        vendorService.getActive(),
      ])
      setEntries(e); setJobCards(jc); setVendors(v)
    } catch (e: any) { toast.error(e.message || 'Failed to load') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const atVendor = entries.filter((e) => e.status === 'Sent').length
  const overdue = entries.filter(isOverdue).length
  const received = entries.filter((e) => e.status === 'Received').length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">OSP Tracking</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Blackening · Heat Treatment · Anodising · SS Rough Turning
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setLogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Log OSP
          </Button>
        </div>
      </div>

      {/* Summary chips */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm">
          <Truck className="h-4 w-4 text-orange-500" />
          <span className="font-semibold">{atVendor}</span>
          <span className="text-muted-foreground">At Vendor</span>
        </div>
        {overdue > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="font-semibold text-red-700">{overdue}</span>
            <span className="text-red-600">Overdue</span>
          </div>
        )}
        <div className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="font-semibold">{received}</span>
          <span className="text-muted-foreground">Received</span>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-40 text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin mr-2" /> Loading...
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2 border-2 border-dashed rounded-lg">
          <Truck className="h-8 w-8 opacity-30" />
          <p className="text-sm">No OSP entries yet.</p>
          <p className="text-xs">Click "Log OSP" to track materials sent to vendors.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-xs">Job Card</TableHead>
                <TableHead className="text-xs">Order</TableHead>
                <TableHead className="text-xs">Child Part</TableHead>
                <TableHead className="text-xs">Process</TableHead>
                <TableHead className="text-xs">Vendor</TableHead>
                <TableHead className="text-xs text-center">Sent</TableHead>
                <TableHead className="text-xs text-center">Rcvd/Rej</TableHead>
                <TableHead className="text-xs">Sent Date</TableHead>
                <TableHead className="text-xs">Expected</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((e) => {
                const processed = e.receivedQty + e.rejectedQty
                const isPartial = e.status === 'Sent' && processed > 0
                return (
                  <TableRow key={e.id} className={e.status === 'Received' ? 'opacity-60' : isOverdue(e) ? 'bg-red-50/50' : ''}>
                    <TableCell className="font-mono text-xs font-medium">{e.jobCardNo}</TableCell>
                    <TableCell className="text-xs">{orderLabel(e)}</TableCell>
                    <TableCell className="text-xs">{e.childPartName ?? '—'}</TableCell>
                    <TableCell className="text-xs">{e.processName ?? '—'}</TableCell>
                    <TableCell className="text-xs font-medium">{e.vendorName ?? '—'}</TableCell>
                    <TableCell className="text-xs text-center">{e.quantity}</TableCell>
                    <TableCell className="text-xs text-center">
                      {processed > 0
                        ? <span className="text-orange-600 font-medium">{e.receivedQty}+{e.rejectedQty}</span>
                        : <span className="text-muted-foreground">—</span>
                      }
                    </TableCell>
                    <TableCell className="text-xs">{fmt(e.sentDate)}</TableCell>
                    <TableCell className="text-xs">
                      <span className={isOverdue(e) ? 'text-red-600 font-semibold' : ''}>{fmt(e.expectedReturnDate)}</span>
                    </TableCell>
                    <TableCell>
                      {e.status === 'Received'
                        ? <Badge className="bg-green-600 text-white text-xs">Received</Badge>
                        : isOverdue(e)
                        ? <Badge variant="destructive" className="text-xs gap-1"><AlertTriangle className="h-3 w-3" />Overdue</Badge>
                        : isPartial
                        ? <Badge className="bg-blue-500 text-white text-xs">Partial</Badge>
                        : <Badge className="bg-orange-500 text-white text-xs">Sent</Badge>
                      }
                    </TableCell>
                    <TableCell>
                      {e.status === 'Sent' && (
                        <Button size="sm" variant="outline"
                          className="h-7 text-xs gap-1 text-green-700 border-green-300 hover:bg-green-50"
                          onClick={() => setReceiveEntry(e)}>
                          <CheckCircle className="h-3 w-3" /> Receive
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <LogDialog open={logOpen} onClose={() => setLogOpen(false)} onSaved={load} jobCards={jobCards} vendors={vendors} />
      <ReceiveDialog entry={receiveEntry} onClose={() => setReceiveEntry(null)} onSaved={load} />
    </div>
  )
}
