'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Package, Truck, CheckCircle2, AlertTriangle, RefreshCw, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { getCurrentUserName } from '@/lib/auth'
import { dispatchService } from '@/lib/api/dispatch'
import { ReadyToDispatchItem, DeliveryChallanApi, ConsolidatedChallanItem } from '@/types/dispatch'
import { formatDate } from '@/lib/utils/formatters'

export default function DispatchDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [readyItems, setReadyItems] = useState<ReadyToDispatchItem[]>([])
  const [challans, setChallans] = useState<DeliveryChallanApi[]>([])
  const [activeTab, setActiveTab] = useState('ready')
  const [searchQuery, setSearchQuery] = useState('')

  // Dialog state
  const [viewChallan, setViewChallan] = useState<DeliveryChallanApi | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [ready, challanList] = await Promise.all([
      dispatchService.getReadyToDispatch(),
      dispatchService.getAllChallans(),
    ])
    setReadyItems(ready)
    setChallans(challanList)
    setLoading(false)
  }

  const dispatchedChallans = challans.filter(c => c.status === 'Dispatched')

  const filteredChallans = useMemo(() => {
    const q = searchQuery.toLowerCase()
    if (!q) return dispatchedChallans
    return dispatchedChallans.filter(c =>
      c.challanNo.toLowerCase().includes(q) ||
      c.orderNo.toLowerCase().includes(q) ||
      (c.customerName ?? '').toLowerCase().includes(q) ||
      (c.productName ?? '').toLowerCase().includes(q) ||
      (c.invoiceNo ?? '').toLowerCase().includes(q)
    )
  }, [dispatchedChallans, searchQuery])

  const stats = {
    readyCount: readyItems.length,
    totalPendingQty: readyItems.reduce((s, i) => s + i.qtyPendingDispatch, 0),
    dispatched: dispatchedChallans.length,
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <p className="text-sm font-medium">Ready to Dispatch</p>
            <Package className="h-4 w-4 text-blue-600" />
          </div>
          <CardContent>
            <div className="text-2xl font-bold">{stats.readyCount}</div>
            <p className="text-xs text-muted-foreground">Order items with completed qty</p>
          </CardContent>
        </Card>
        <Card>
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <p className="text-sm font-medium">Pending Qty</p>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </div>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPendingQty}</div>
            <p className="text-xs text-muted-foreground">Units awaiting dispatch</p>
          </CardContent>
        </Card>
        <Card>
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <p className="text-sm font-medium">Dispatched Challans</p>
            <Truck className="h-4 w-4 text-green-600" />
          </div>
          <CardContent>
            <div className="text-2xl font-bold">{stats.dispatched}</div>
            <p className="text-xs text-muted-foreground">Total challans created</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs + Search */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList className="grid max-w-md grid-cols-2">
            <TabsTrigger value="ready">Ready to Dispatch</TabsTrigger>
            <TabsTrigger value="challans">Dispatched Challans</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 bg-background border-2 border-border rounded-lg px-4 py-1 shadow-sm flex-1 max-w-md">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              placeholder={activeTab === 'challans' ? 'Search challan, order, customer...' : 'Search dispatched challans...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              disabled={activeTab !== 'challans'}
              className="border-0 shadow-none focus-visible:ring-0 h-8 px-0 text-sm flex-1 placeholder:text-muted-foreground/40 focus:placeholder:text-transparent caret-foreground disabled:opacity-50"
            />
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={loadData} title="Refresh">
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>

        {/* Ready to Dispatch Tab — single multiselect flow (customer → orders → challan) */}
        <TabsContent value="ready" className="mt-4">
          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : readyItems.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground border rounded-lg">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
              <p className="font-medium">All dispatched!</p>
              <p className="text-sm">No items waiting for dispatch</p>
            </div>
          ) : (
            <ConsolidatedDispatchPanel readyItems={readyItems} onDone={loadData} />
          )}
        </TabsContent>

        {/* Dispatched Challans Tab */}
        <TabsContent value="challans" className="mt-4">
          {dispatchedChallans.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground border rounded-lg">
              <Truck className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
              <p className="font-medium">No challans yet</p>
              <p className="text-sm">Dispatched challans will appear here</p>
            </div>
          ) : filteredChallans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm border rounded-lg">
              No challans match your search.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredChallans.map((challan) => (
                <div
                  key={challan.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-semibold">{challan.challanNo}</p>
                      <Badge variant="outline" className="border-green-500 text-green-700 text-xs">Dispatched</Badge>
                      {challan.isConsolidated && (
                        <Badge variant="outline" className="border-blue-500 text-blue-700 text-xs">Consolidated</Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-muted-foreground">
                      <div>
                        <span className="block text-xs font-medium text-foreground">Order</span>
                        {challan.orderNo}
                      </div>
                      <div>
                        <span className="block text-xs font-medium text-foreground">Customer</span>
                        {challan.customerName ?? '—'}
                      </div>
                      <div>
                        <span className="block text-xs font-medium text-foreground">Product</span>
                        {challan.productName ?? '—'}
                      </div>
                      <div>
                        <span className="block text-xs font-medium text-foreground">Qty Dispatched</span>
                        {challan.quantityDispatched}
                      </div>
                      {challan.invoiceNo && (
                        <div>
                          <span className="block text-xs font-medium text-foreground">Invoice</span>
                          {challan.invoiceNo}
                        </div>
                      )}
                      <div>
                        <span className="block text-xs font-medium text-foreground">Date</span>
                        {formatDate(challan.challanDate)}
                      </div>
                    </div>
                  </div>
                  {challan.isConsolidated && (
                    <Button variant="outline" size="sm" className="ml-4 shrink-0" onClick={() => setViewChallan(challan)}>
                      View items
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ChallanItemsDialog challan={viewChallan} onClose={() => setViewChallan(null)} />
    </div>
  )
}

// ── Consolidated dispatch — the single flow: customer → orders → challan ──────
function ConsolidatedDispatchPanel({
  readyItems, onDone,
}: {
  readyItems: ReadyToDispatchItem[]
  onDone: () => void
}) {
  const [customerId, setCustomerId] = useState('')
  const [picked, setPicked] = useState<Record<number, number>>({}) // orderItemId -> qty
  const [dispatchDate, setDispatchDate] = useState('')
  const [invoiceNo, setInvoiceNo] = useState('')
  const [invoiceDate, setInvoiceDate] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [transportMode, setTransportMode] = useState('')
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [remarks, setRemarks] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // Default dispatch date to today on mount.
  useEffect(() => {
    setDispatchDate(new Date().toISOString().split('T')[0])
  }, [])

  // Distinct customers that actually have ready items — with pending counts,
  // so the picker itself shows where the pending work is.
  const customers = useMemo(() => {
    const map = new Map<number, { name: string; items: number; pcs: number }>()
    readyItems.forEach(i => {
      if (!i.customerId) return
      const e = map.get(i.customerId) ?? { name: i.customerName ?? `Customer ${i.customerId}`, items: 0, pcs: 0 }
      e.items += 1
      e.pcs += i.qtyPendingDispatch
      map.set(i.customerId, e)
    })
    return Array.from(map.entries())
      .sort((a, b) => b[1].items - a[1].items)
      .map(([id, e]) => ({ value: String(id), label: `${e.name}  (${e.items} items · ${e.pcs} pcs)` }))
  }, [readyItems])

  const customerItems = useMemo(
    () => readyItems.filter(i => String(i.customerId) === customerId),
    [readyItems, customerId]
  )

  // Group the client's ready items by Order, so a whole order can be selected at once.
  const orderGroups = useMemo(() => {
    const map = new Map<string, { orderNo: string; items: ReadyToDispatchItem[] }>()
    customerItems.forEach(i => {
      const g = map.get(i.orderNo) ?? { orderNo: i.orderNo, items: [] }
      g.items.push(i)
      map.set(i.orderNo, g)
    })
    return Array.from(map.values())
  }, [customerItems])

  const toggle = (item: ReadyToDispatchItem) => {
    setPicked(prev => {
      const next = { ...prev }
      if (next[item.orderItemId] != null) delete next[item.orderItemId]
      else next[item.orderItemId] = item.qtyPendingDispatch
      return next
    })
  }

  // Select / clear every item of one order in a single click.
  const toggleOrder = (items: ReadyToDispatchItem[]) => {
    const allSelected = items.every(i => picked[i.orderItemId] != null)
    setPicked(prev => {
      const next = { ...prev }
      for (const i of items) {
        if (allSelected) delete next[i.orderItemId]
        else next[i.orderItemId] = i.qtyPendingDispatch
      }
      return next
    })
  }

  const setQty = (orderItemId: number, v: string) =>
    setPicked(prev => ({ ...prev, [orderItemId]: Math.max(0, parseInt(v) || 0) }))

  const selectedLines = Object.entries(picked).filter(([, q]) => q > 0)
  const totalQty = selectedLines.reduce((s, [, q]) => s + q, 0)

  // Live validation: any picked line whose qty exceeds its pending amount
  const pendingByItem = useMemo(() => {
    const m = new Map<number, number>()
    readyItems.forEach(i => m.set(i.orderItemId, i.qtyPendingDispatch))
    return m
  }, [readyItems])
  const invalidCount = selectedLines.filter(([oid, q]) => q > (pendingByItem.get(Number(oid)) ?? 0)).length

  // Read-only overview of ALL pending items, grouped by customer
  const [showAllPending, setShowAllPending] = useState(false)
  const allPendingByCustomer = useMemo(() => {
    const map = new Map<string, ReadyToDispatchItem[]>()
    readyItems.forEach(i => {
      const key = i.customerName ?? `Customer ${i.customerId}`
      const list = map.get(key) ?? []
      list.push(i)
      map.set(key, list)
    })
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length)
  }, [readyItems])

  const submit = async () => {
    if (!customerId) { setError('Select a client'); return }
    if (selectedLines.length === 0) { setError('Select at least one item'); return }
    // qty bounds
    for (const [oid, q] of selectedLines) {
      const it = customerItems.find(i => i.orderItemId === Number(oid))
      if (it && q > it.qtyPendingDispatch) {
        setError(`${it.orderNo}-${it.itemSequence}: max ${it.qtyPendingDispatch}`); return
      }
    }
    setSubmitting(true); setError('')
    const res = await dispatchService.consolidatedDispatch(
      {
        customerId: Number(customerId),
        dispatchDate,
        items: selectedLines.map(([oid, q]) => ({ orderItemId: Number(oid), qtyToDispatch: q })),
        invoiceNo: invoiceNo || undefined,
        invoiceDate: invoiceDate || undefined,
        deliveryAddress: deliveryAddress || undefined,
        transportMode: transportMode || undefined,
        vehicleNumber: vehicleNumber || undefined,
        remarks: remarks || undefined,
        createdBy: getCurrentUserName(),
      },
      file ?? undefined
    )
    setSubmitting(false)
    if (res.success) {
      // Reset selection for the next challan and refresh the ready list.
      setCustomerId(''); setPicked({}); setInvoiceNo(''); setInvoiceDate('')
      setDeliveryAddress(''); setTransportMode(''); setVehicleNumber(''); setRemarks('')
      setFile(null)
      onDone()
    } else {
      setError(res.message)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Create Dispatch Challan</h3>
            <p className="text-sm text-muted-foreground">Pick a client, select whole orders or individual items, enter the bill details, and generate one challan.</p>
          </div>

          {/* 1. Client search (labels show pending items · pcs per client) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Client <span className="text-destructive">*</span></Label>
              <button
                type="button"
                onClick={() => setShowAllPending(v => !v)}
                className="text-xs text-primary hover:underline"
              >
                {showAllPending ? 'Hide pending overview' : `View all pending items (${readyItems.length})`}
              </button>
            </div>
            <SearchableSelect
              value={customerId}
              onChange={(v) => { setCustomerId(v); setPicked({}) }}
              options={customers}
              placeholder="Search client…"
              searchPlaceholder="Search by name…"
            />
          </div>

          {/* Read-only overview of everything pending, grouped by customer */}
          {showAllPending && (
            <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
              {allPendingByCustomer.map(([customer, items]) => (
                <div key={customer} className="p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-semibold text-sm">{customer}</span>
                    <span className="text-xs text-muted-foreground">
                      {items.length} item{items.length !== 1 ? 's' : ''} · {items.reduce((s, i) => s + i.qtyPendingDispatch, 0)} pcs
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {items.map(i => (
                      <div key={i.orderItemId} className="flex items-center gap-3 text-xs text-muted-foreground pl-2">
                        <span className="font-mono text-foreground w-44 shrink-0">{i.orderNo}-{i.itemSequence}</span>
                        <span className="flex-1 min-w-0 truncate">
                          {[i.machineModel, i.rollerType, (i.numberOfTeeth ?? 0) > 0 ? `${i.numberOfTeeth}T` : null].filter(Boolean).join(' · ') || i.productName || '—'}
                        </span>
                        <span className="shrink-0">Pending: <span className="font-semibold text-orange-600">{i.qtyPendingDispatch}</span></span>
                        {i.dueDate && <span className="shrink-0">Due {formatDate(i.dueDate)}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 2. That client's ready items — grouped by Order */}
          {customerId && (
            <div className="space-y-3">
              {orderGroups.length === 0 && <p className="text-sm text-muted-foreground p-3 border rounded-lg">No ready items for this client.</p>}
              {orderGroups.map(group => {
                const allSelected = group.items.every(i => picked[i.orderItemId] != null)
                const someSelected = group.items.some(i => picked[i.orderItemId] != null)
                return (
                  <div key={group.orderNo} className="border rounded-lg overflow-hidden">
                    {/* Order header — select whole order */}
                    <div className="flex items-center gap-3 px-3 py-2 bg-muted/50 border-b">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={el => { if (el) el.indeterminate = someSelected && !allSelected }}
                        onChange={() => toggleOrder(group.items)}
                        className="h-4 w-4"
                      />
                      <span className="font-semibold text-sm">{group.orderNo}</span>
                      <span className="text-xs text-muted-foreground">({group.items.length} item{group.items.length !== 1 ? 's' : ''})</span>
                      <button
                        type="button"
                        onClick={() => toggleOrder(group.items)}
                        className="ml-auto text-xs text-primary hover:underline"
                      >
                        {allSelected ? 'Clear order' : 'Select whole order'}
                      </button>
                    </div>
                    {/* Items of this order */}
                    <div className="divide-y">
                      {group.items.map(item => {
                        const checked = picked[item.orderItemId] != null
                        return (
                          <div key={item.orderItemId} className={`flex items-center gap-3 px-3 py-2 pl-8 ${checked ? 'bg-blue-50' : ''}`}>
                            <input type="checkbox" checked={checked} onChange={() => toggle(item)} className="h-4 w-4" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">-{item.itemSequence}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {[item.machineModel, item.rollerType, (item.numberOfTeeth ?? 0) > 0 ? `${item.numberOfTeeth}T` : null].filter(Boolean).join(' · ') || item.productName || item.partCode || '—'}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground shrink-0">Pending: <span className="font-semibold text-orange-600">{item.qtyPendingDispatch}</span></div>
                            {checked && (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <Input
                                  type="number" min={1} max={item.qtyPendingDispatch}
                                  value={picked[item.orderItemId]}
                                  onChange={e => setQty(item.orderItemId, e.target.value)}
                                  className={`w-20 h-8 ${picked[item.orderItemId] > item.qtyPendingDispatch ? 'border-destructive focus-visible:ring-destructive text-destructive' : ''}`}
                                />
                                {picked[item.orderItemId] > item.qtyPendingDispatch && (
                                  <span className="text-xs text-destructive font-medium">max {item.qtyPendingDispatch}</span>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* 3. Shared bill / transport */}
          {selectedLines.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Dispatch Date</Label>
                <Input type="date" value={dispatchDate} onChange={e => setDispatchDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Invoice No</Label>
                <Input value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} placeholder="e.g. INV-2026-114" />
              </div>
              <div className="space-y-1.5">
                <Label>Invoice Date</Label>
                <Input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Transport Mode</Label>
                <Input value={transportMode} onChange={e => setTransportMode(e.target.value)} placeholder="Road / Courier…" />
              </div>
              <div className="space-y-1.5">
                <Label>Vehicle No</Label>
                <Input value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Invoice PDF</Label>
                <Input ref={fileRef} type="file" accept="application/pdf,image/*" onChange={e => setFile(e.target.files?.[0] ?? null)} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Delivery Address</Label>
                <Textarea value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} rows={2} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Remarks</Label>
                <Input value={remarks} onChange={e => setRemarks(e.target.value)} />
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          {/* Actions — sticky so it stays visible while scrolling long order lists */}
          <div className="sticky bottom-0 z-10 -mx-6 -mb-6 px-6 py-3 bg-background/95 backdrop-blur border-t rounded-b-xl flex items-center gap-3">
            <div className="mr-auto text-sm text-muted-foreground">
              {invalidCount > 0
                ? <span className="text-destructive font-medium">{invalidCount} line(s) exceed the pending quantity — fix the red inputs</span>
                : selectedLines.length > 0
                ? <span><span className="font-semibold text-foreground">{selectedLines.length}</span> item(s) · <span className="font-semibold text-foreground">{totalQty}</span> pcs selected</span>
                : <span>Select a client and their items to generate a challan</span>}
            </div>
            <Button
              size="lg"
              onClick={submit}
              disabled={submitting || selectedLines.length === 0 || !customerId || invalidCount > 0}
              className="gap-2"
            >
              <Truck className="h-4 w-4" />
              {submitting ? 'Generating…' : 'Generate Challan'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── View the line items of a (consolidated) challan ───────────────────────────
function ChallanItemsDialog({ challan, onClose }: { challan: DeliveryChallanApi | null; onClose: () => void }) {
  const [items, setItems] = useState<ConsolidatedChallanItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (challan) {
      setLoading(true)
      dispatchService.getChallanItems(challan.id).then(setItems).finally(() => setLoading(false))
    } else {
      setItems([])
    }
  }, [challan])

  // Open a clean printable challan sheet in a new window
  const printChallan = () => {
    if (!challan) return
    const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const spec = (it: ConsolidatedChallanItem) =>
      [it.machineModel, it.rollerType, (it.numberOfTeeth ?? 0) > 0 ? `${it.numberOfTeeth}T` : null].filter(Boolean).join(' · ') || it.productName || '—'
    const rows = items.map((it, i) => `
      <tr>
        <td>${i + 1}</td>
        <td class="mono">${esc(it.orderNo)}-${esc(it.itemSequence)}</td>
        <td>${esc(spec(it))}</td>
        <td>${esc(it.productCode ?? '')}</td>
        <td class="num">${it.quantity} ${esc(it.uom ?? 'pcs')}</td>
      </tr>`).join('')
    const totalQty = items.reduce((s, it) => s + it.quantity, 0)
    const html = `<!doctype html><html><head><title>${esc(challan.challanNo)}</title><style>
      * { box-sizing: border-box; font-family: Arial, sans-serif; }
      body { margin: 24px; color: #111; }
      .head { text-align: center; border-bottom: 2px solid #111; padding-bottom: 8px; }
      .head h1 { margin: 0; font-size: 22px; letter-spacing: 1px; }
      .head p { margin: 2px 0 0; font-size: 13px; }
      .meta { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 6px 24px; margin: 14px 0; font-size: 13px; }
      .meta div { min-width: 220px; }
      .meta b { display: inline-block; min-width: 110px; }
      table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 13px; }
      th, td { border: 1px solid #444; padding: 6px 8px; text-align: left; }
      th { background: #eee; }
      .num { text-align: right; }
      .mono { font-family: Consolas, monospace; }
      tfoot td { font-weight: bold; }
      .signs { display: flex; justify-content: space-between; margin-top: 60px; font-size: 13px; }
      .signs span { border-top: 1px solid #111; padding-top: 4px; min-width: 180px; text-align: center; }
      @media print { body { margin: 10mm; } }
    </style></head><body>
      <div class="head">
        <h1>MULTI HITECH</h1>
        <p>DELIVERY CHALLAN${challan.isConsolidated ? ' (CONSOLIDATED)' : ''}</p>
      </div>
      <div class="meta">
        <div><b>Challan No:</b> ${esc(challan.challanNo)}</div>
        <div><b>Challan Date:</b> ${formatDate(challan.challanDate)}</div>
        <div><b>Customer:</b> ${esc(challan.customerName ?? '—')}</div>
        <div><b>Invoice No:</b> ${esc(challan.invoiceNo ?? '—')}</div>
        <div><b>Invoice Date:</b> ${challan.invoiceDate ? formatDate(challan.invoiceDate) : '—'}</div>
        <div><b>Transport:</b> ${esc(challan.transportMode ?? '—')}</div>
        <div><b>Vehicle No:</b> ${esc(challan.vehicleNumber ?? '—')}</div>
        <div><b>Delivery Address:</b> ${esc(challan.deliveryAddress ?? '—')}</div>
      </div>
      <table>
        <thead><tr><th>#</th><th>Order</th><th>Item (Model · Roller · Teeth)</th><th>Part Code</th><th class="num">Qty</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr><td colspan="4">Total</td><td class="num">${totalQty} pcs</td></tr></tfoot>
      </table>
      ${challan.remarks ? `<p style="font-size:13px"><b>Remarks:</b> ${esc(challan.remarks)}</p>` : ''}
      <div class="signs">
        <span>Prepared By</span>
        <span>Driver / Transporter</span>
        <span>Received By (Customer)</span>
      </div>
      <script>window.onload = () => window.print()</script>
    </body></html>`
    const w = window.open('', '_blank', 'width=900,height=700')
    if (!w) return
    w.document.write(html)
    w.document.close()
  }

  return (
    <Dialog open={!!challan} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3 pr-6">
            <div>
              <DialogTitle>{challan?.challanNo}</DialogTitle>
              <DialogDescription>
                {challan?.customerName} · {challan?.invoiceNo ? `Invoice ${challan.invoiceNo}` : 'No invoice'} · {challan?.quantityDispatched} pcs
              </DialogDescription>
            </div>
            <Button variant="outline" size="sm" onClick={printChallan} disabled={loading || items.length === 0} className="shrink-0">
              Print Challan
            </Button>
          </div>
        </DialogHeader>
        {loading ? (
          <p className="text-sm text-muted-foreground py-4">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No line items (this is a single-item challan).</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Order</th>
                  <th className="py-2 px-3 font-medium">Spec</th>
                  <th className="py-2 px-3 font-medium text-right">Qty</th>
                </tr>
              </thead>
              <tbody>
                {items.map(it => (
                  <tr key={it.id} className="border-b last:border-0">
                    <td className="py-2 pr-3 font-mono">{it.orderNo}-{it.itemSequence}</td>
                    <td className="py-2 px-3 text-muted-foreground">
                      {[it.machineModel, it.rollerType, (it.numberOfTeeth ?? 0) > 0 ? `${it.numberOfTeeth}T` : null].filter(Boolean).join(' · ') || it.productName || '—'}
                    </td>
                    <td className="py-2 px-3 text-right font-semibold">{it.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
