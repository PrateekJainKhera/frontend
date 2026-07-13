'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import {
  RefreshCw, CheckCircle, AlertTriangle, Truck, Search, RotateCcw, XCircle,
  Send, PackageCheck, Layers, ChevronRight,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { schedulingPlannerService } from '@/lib/api/scheduling-planner'

// ── Helpers ───────────────────────────────────────────────────────────────────

const today = () => new Date().toISOString().slice(0, 10)

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

const isOverdue = (e: OSPTrackingEntry) =>
  e.status === 'Sent' && new Date(e.expectedReturnDate) < new Date()

const orderLabel = (e: { orderNo?: string | null; orderId: number; itemSequence?: string | null }) =>
  `${e.orderNo ?? e.orderId}${e.itemSequence ? `-${e.itemSequence}` : ''}`

// ════════════════════════════════════════════════════════════════════════════
//  TAB 1 — READY TO SEND (process → order/child-part → vendor → send)
// ════════════════════════════════════════════════════════════════════════════

function ReadyToSendTab({
  jobCards, vendors, onSent,
}: {
  jobCards: OSPJobCardOption[]; vendors: VendorResponse[]; onSent: () => void
}) {
  const [process, setProcess] = useState('')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [search, setSearch] = useState('')
  const [vendorId, setVendorId] = useState('')
  const [sentDate, setSentDate] = useState(today())
  const [expectedReturn, setExpectedReturn] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  // Distinct processes (with counts) that have parts ready to send
  const processes = useMemo(() => {
    const m = new Map<string, number>()
    jobCards.forEach((j) => {
      const p = j.processName ?? 'Unknown'
      m.set(p, (m.get(p) ?? 0) + 1)
    })
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [jobCards])

  // Reset selection whenever the chosen process changes
  useEffect(() => { setSelected(new Set()); setSearch('') }, [process])

  // Rows for the selected process (+ optional search)
  const rows = useMemo(() => {
    const q = search.toLowerCase()
    return jobCards.filter((j) =>
      (j.processName ?? 'Unknown') === process &&
      (!q ||
        j.jobCardNo.toLowerCase().includes(q) ||
        (j.childPartName ?? '').toLowerCase().includes(q) ||
        orderLabel(j).toLowerCase().includes(q))
    )
  }, [jobCards, process, search])

  // Group rows by order
  const groups = useMemo(() => {
    const g = new Map<number, { orderNo: string; items: OSPJobCardOption[] }>()
    rows.forEach((r) => {
      if (!g.has(r.orderId)) g.set(r.orderId, { orderNo: r.orderNo ?? String(r.orderId), items: [] })
      g.get(r.orderId)!.items.push(r)
    })
    return Array.from(g.entries()).sort((a, b) => a[1].orderNo.localeCompare(b[1].orderNo))
  }, [rows])

  const toggle = (id: number) =>
    setSelected((prev) => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })

  const toggleOrder = (ids: number[], allSelected: boolean) =>
    setSelected((prev) => {
      const n = new Set(prev)
      if (allSelected) ids.forEach((i) => n.delete(i))
      else ids.forEach((i) => n.add(i))
      return n
    })

  const selectedCount = selected.size
  const selectedQty = useMemo(
    () => jobCards.filter((j) => selected.has(j.jobCardId)).reduce((s, j) => s + j.quantity, 0),
    [jobCards, selected]
  )

  function reset() {
    setSelected(new Set()); setVendorId(''); setSentDate(today())
    setExpectedReturn(''); setNotes('')
  }

  async function send() {
    if (selectedCount === 0) { toast.error('Select at least one part to send'); return }
    if (!vendorId) { toast.error('Select a vendor'); return }
    if (!sentDate || !expectedReturn) { toast.error('Enter sent & expected return dates'); return }
    if (new Date(expectedReturn) <= new Date(sentDate)) {
      toast.error('Expected return must be after the sent date'); return
    }
    setSaving(true)
    try {
      const ids = await ospService.batchCreate({
        jobCardIds: Array.from(selected),
        vendorId: Number(vendorId),
        sentDate,
        expectedReturnDate: expectedReturn,
        notes: notes || null,
        createdBy: 'Admin',
      })
      toast.success(`${ids.length} part(s) sent to vendor`)
      reset()
      onSent()
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  if (jobCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2 border-2 border-dashed rounded-lg">
        <PackageCheck className="h-8 w-8 opacity-30" />
        <p className="text-sm">No parts are currently ready for OSP.</p>
        <p className="text-xs">Parts appear here once their outsourced process is scheduled in production.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Step 1 — pick a process */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5" /> Step 1 · Select the outsource process
        </p>
        <div className="flex flex-wrap gap-2">
          {processes.map(([name, count]) => (
            <button
              key={name}
              onClick={() => setProcess(name)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                process === name
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-muted'
              }`}
            >
              {name}
              <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${
                process === name ? 'bg-primary-foreground/20' : 'bg-muted-foreground/15'
              }`}>{count}</span>
            </button>
          ))}
        </div>
      </div>

      {!process ? (
        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2 border-2 border-dashed rounded-lg">
          <ChevronRight className="h-6 w-6 opacity-30" />
          <p className="text-sm">Select a process above to see the orders ready to send.</p>
        </div>
      ) : (
        <>
          {/* Step 2 — pick orders / child parts */}
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" /> Step 2 · Select orders / parts for <strong className="text-foreground">{process}</strong>
            </p>
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search order / part..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-sm"
              />
            </div>
          </div>

          {rows.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground border rounded-lg">
              No parts match your search.
            </div>
          ) : (
            <div className="border rounded-lg divide-y">
              {groups.map(([orderId, { orderNo, items }]) => {
                const ids = items.map((i) => i.jobCardId)
                const allSelected = ids.every((i) => selected.has(i))
                const someSelected = ids.some((i) => selected.has(i))
                return (
                  <div key={orderId}>
                    {/* Order header — select whole order */}
                    <div className="flex items-center gap-2 bg-muted/40 px-3 py-2">
                      <Checkbox
                        checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                        onCheckedChange={() => toggleOrder(ids, allSelected)}
                      />
                      <span className="text-sm font-semibold">Order {orderNo}</span>
                      <span className="text-xs text-muted-foreground">
                        {items.length} part{items.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    {/* Child part rows */}
                    {items.map((it) => (
                      <label
                        key={it.jobCardId}
                        className="flex items-center gap-3 px-3 py-2 pl-8 hover:bg-muted/30 cursor-pointer text-sm"
                      >
                        <Checkbox
                          checked={selected.has(it.jobCardId)}
                          onCheckedChange={() => toggle(it.jobCardId)}
                        />
                        <span className="font-mono text-xs text-muted-foreground w-28 shrink-0">{it.jobCardNo}</span>
                        <span className="flex-1 min-w-0 truncate">{it.childPartName ?? '—'}</span>
                        {it.itemSequence && (
                          <span className="text-xs text-muted-foreground">Item {it.itemSequence}</span>
                        )}
                        <Badge variant="secondary" className="text-xs">Qty {it.quantity}</Badge>
                      </label>
                    ))}
                  </div>
                )
              })}
            </div>
          )}

          {/* Step 3 — vendor + dates + send (sticky footer bar) */}
          {selectedCount > 0 && (
            <div className="sticky bottom-0 z-10 rounded-lg border bg-background shadow-lg p-3 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Send className="h-3.5 w-3.5" /> Step 3 · Send to vendor
                </p>
                <span className="text-xs font-medium">
                  {selectedCount} part(s) · {selectedQty} pc selected
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="space-y-1.5 md:col-span-1">
                  <Label className="text-xs">Vendor <span className="text-red-500">*</span></Label>
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
                  <Label className="text-xs">Sent Date <span className="text-red-500">*</span></Label>
                  <Input type="date" value={sentDate} onChange={(e) => setSentDate(e.target.value)} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Expected Return <span className="text-red-500">*</span></Label>
                  <Input type="date" value={expectedReturn} onChange={(e) => setExpectedReturn(e.target.value)} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Notes</Label>
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)} className="h-9" placeholder="Optional" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={send} disabled={saving} className="gap-1.5">
                  {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send {selectedCount} part(s) to Vendor
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  Receive / Re-send / Full-rework dialogs (unchanged behaviour)
// ════════════════════════════════════════════════════════════════════════════

function ReceiveDialog({
  entry, onClose, onSaved,
}: { entry: OSPTrackingEntry | null; onClose: () => void; onSaved: () => void }) {
  const [date, setDate] = useState(today())
  const [receivedQty, setReceivedQty] = useState('')
  const [rejectedQty, setRejectedQty] = useState('0')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (entry) {
      setDate(today())
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

function ResendDialog({
  entry, onClose, onSaved, vendors,
}: { entry: OSPTrackingEntry | null; onClose: () => void; onSaved: () => void; vendors: VendorResponse[] }) {
  const [vendorId, setVendorId] = useState('')
  const [newSentDate, setNewSentDate] = useState(today())
  const [newExpectedReturn, setNewExpectedReturn] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (entry) {
      setVendorId(String(entry.vendorId))
      setNewSentDate(today())
      setNewExpectedReturn('')
      setNotes('')
    }
  }, [entry])

  if (!entry) return null

  async function save() {
    if (!entry) return
    if (!vendorId || !newSentDate || !newExpectedReturn) {
      toast.error('Fill all required fields'); return
    }
    setSaving(true)
    try {
      const newId = await ospService.resendToVendor(entry.id, {
        vendorId: Number(vendorId),
        newSentDate,
        newExpectedReturnDate: newExpectedReturn,
        notes: notes || null,
        updatedBy: 'Admin',
      })
      toast.success(`Re-sent to vendor — new OSP entry #${newId} created`)
      onSaved(); onClose()
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  return (
    <Dialog open={!!entry} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Re-send to Vendor</DialogTitle></DialogHeader>
        <div className="space-y-3 py-1">
          <div className="rounded-md bg-muted/50 p-3 text-sm space-y-0.5">
            <p><span className="font-medium">{entry.jobCardNo}</span> · {entry.processName}</p>
            <p className="text-muted-foreground">{entry.childPartName} · Current vendor: {entry.vendorName}</p>
            <p className="text-xs text-amber-600 font-medium mt-1">
              Current entry will be closed. A new OSP entry will be created.
            </p>
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
              <Label>New Sent Date <span className="text-red-500">*</span></Label>
              <Input type="date" value={newSentDate} onChange={(e) => setNewSentDate(e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label>Expected Return <span className="text-red-500">*</span></Label>
              <Input type="date" value={newExpectedReturn} onChange={(e) => setNewExpectedReturn(e.target.value)} className="h-9" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} className="h-9" placeholder="Reason for resend..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="gap-1 bg-amber-600 hover:bg-amber-700 text-white">
            {saving ? <RefreshCw className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
            Re-send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function FullReworkDialog({
  entry, onClose, onSaved,
}: { entry: OSPTrackingEntry | null; onClose: () => void; onSaved: () => void }) {
  const [rejectedQty, setRejectedQty] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (entry) {
      const remaining = entry.quantity - entry.receivedQty - entry.rejectedQty
      setRejectedQty(String(remaining))
      setReason('')
    }
  }, [entry])

  if (!entry) return null

  async function save() {
    if (!entry) return
    if (!reason.trim()) { toast.error('Reason is required'); return }
    const qty = Number(rejectedQty)
    if (!qty || qty <= 0) { toast.error('Enter rejected quantity'); return }

    setSaving(true)
    try {
      const newIds = await schedulingPlannerService.createFullRework(
        entry.jobCardId, qty, reason.trim(), 'Admin'
      )
      const remaining = entry.quantity - entry.receivedQty - entry.rejectedQty
      await ospService.markReceived(entry.id, {
        actualReturnDate: today(),
        receivedQty: 0,
        rejectedQty: remaining,
        notes: `Full rework: ${reason.trim()}`,
        updatedBy: 'Admin',
      })
      toast.success(`Full rework started — ${newIds.length} new job card(s) created. OSP entry closed.`)
      onSaved(); onClose()
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const remaining = entry.quantity - entry.receivedQty - entry.rejectedQty

  return (
    <Dialog open={!!entry} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle className="text-red-700">Report Rejection — Full Rework</DialogTitle></DialogHeader>
        <div className="space-y-3 py-1">
          <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm space-y-0.5">
            <p><span className="font-medium">{entry.jobCardNo}</span> · {entry.processName}</p>
            <p className="text-muted-foreground">{entry.childPartName} · {entry.vendorName}</p>
            <p className="text-xs text-red-700 font-medium mt-1">
              This will close the OSP entry and trigger a full rework — all job cards for this child part will be re-created from Step 1.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Rejected Qty <span className="text-red-500">*</span> <span className="text-xs text-muted-foreground">(max {remaining})</span></Label>
            <Input
              type="number" min={1} max={remaining}
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
              placeholder="e.g. Surface defect, dimension out of spec..."
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

// ════════════════════════════════════════════════════════════════════════════
//  TAB 2 — AT VENDOR / RECEIVE
// ════════════════════════════════════════════════════════════════════════════

function AtVendorTab({
  entries, vendors, onChanged,
}: { entries: OSPTrackingEntry[]; vendors: VendorResponse[]; onChanged: () => void }) {
  const [search, setSearch] = useState('')
  const [showReceived, setShowReceived] = useState(false)
  const [receiveEntry, setReceiveEntry] = useState<OSPTrackingEntry | null>(null)
  const [resendEntry, setResendEntry] = useState<OSPTrackingEntry | null>(null)
  const [reworkEntry, setReworkEntry] = useState<OSPTrackingEntry | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return entries.filter((e) => {
      if (!showReceived && e.status === 'Received') return false
      if (!q) return true
      return (
        e.jobCardNo.toLowerCase().includes(q) ||
        (e.childPartName ?? '').toLowerCase().includes(q) ||
        (e.processName ?? '').toLowerCase().includes(q) ||
        (e.vendorName ?? '').toLowerCase().includes(q) ||
        orderLabel(e).toLowerCase().includes(q)
      )
    })
  }, [entries, search, showReceived])

  const sentEntries = entries.filter((e) => e.status === 'Sent')

  if (sentEntries.length === 0 && !showReceived) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-end">
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <Checkbox checked={showReceived} onCheckedChange={(v) => setShowReceived(!!v)} />
            Show received history
          </label>
        </div>
        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2 border-2 border-dashed rounded-lg">
          <Truck className="h-8 w-8 opacity-30" />
          <p className="text-sm">Nothing is at a vendor right now.</p>
          <p className="text-xs">Send parts from the “Ready to Send” tab to track them here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search job card, part, vendor, order..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-8"
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer whitespace-nowrap">
          <Checkbox checked={showReceived} onCheckedChange={(v) => setShowReceived(!!v)} />
          Show received history
        </label>
      </div>

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
            {filtered.map((e) => {
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
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline"
                          className="h-7 text-xs gap-1 text-green-700 border-green-300 hover:bg-green-50"
                          onClick={() => setReceiveEntry(e)}>
                          <CheckCircle className="h-3 w-3" /> Receive
                        </Button>
                        <Button size="sm" variant="outline"
                          className="h-7 text-xs gap-1 text-amber-700 border-amber-300 hover:bg-amber-50"
                          onClick={() => setResendEntry(e)}>
                          <RotateCcw className="h-3 w-3" /> Re-send
                        </Button>
                        <Button size="sm" variant="outline"
                          className="h-7 text-xs gap-1 text-red-700 border-red-300 hover:bg-red-50"
                          onClick={() => setReworkEntry(e)}>
                          <XCircle className="h-3 w-3" /> Rejected
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={11} className="text-center text-sm text-muted-foreground py-8">
                  No entries match your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ReceiveDialog entry={receiveEntry} onClose={() => setReceiveEntry(null)} onSaved={onChanged} />
      <ResendDialog entry={resendEntry} onClose={() => setResendEntry(null)} onSaved={onChanged} vendors={vendors} />
      <FullReworkDialog entry={reworkEntry} onClose={() => setReworkEntry(null)} onSaved={onChanged} />
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ════════════════════════════════════════════════════════════════════════════

export default function OSPTrackingPage() {
  const [entries, setEntries] = useState<OSPTrackingEntry[]>([])
  const [jobCards, setJobCards] = useState<OSPJobCardOption[]>([])
  const [vendors, setVendors] = useState<VendorResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('send')

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
            Send outsourced parts to vendors and track their return
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
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

      {loading ? (
        <div className="flex items-center justify-center h-40 text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin mr-2" /> Loading...
        </div>
      ) : (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="send" className="gap-1.5">
              <Send className="h-4 w-4" /> Ready to Send
              {jobCards.length > 0 && (
                <span className="ml-1 rounded-full bg-primary/15 px-1.5 text-[10px] font-semibold">{jobCards.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="vendor" className="gap-1.5">
              <PackageCheck className="h-4 w-4" /> At Vendor / Receive
              {atVendor > 0 && (
                <span className="ml-1 rounded-full bg-orange-500/20 text-orange-700 px-1.5 text-[10px] font-semibold">{atVendor}</span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="send" className="mt-4">
            <ReadyToSendTab
              jobCards={jobCards}
              vendors={vendors}
              onSent={() => { load(); setTab('vendor') }}
            />
          </TabsContent>

          <TabsContent value="vendor" className="mt-4">
            <AtVendorTab entries={entries} vendors={vendors} onChanged={load} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
