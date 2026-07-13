'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import {
  RefreshCw, Search, History, ShoppingCart, Factory, Truck, CalendarClock,
  FileText, ChevronRight, User,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { orderService } from '@/lib/api/orders'
import { jobCardService } from '@/lib/api/job-cards'
import { ospService } from '@/lib/api/osp'
import { dispatchService } from '@/lib/api/dispatch'

// ── Event model ────────────────────────────────────────────────────────────────

type ModuleKey = 'Sales' | 'Planning' | 'Production' | 'Dispatch'

interface AuditEvent {
  at: string
  actor: string
  module: ModuleKey
  action: string
  ref?: string
}

const MODULE_META: Record<ModuleKey, { label: string; icon: any; color: string }> = {
  Sales:      { label: 'Sales & Orders', icon: ShoppingCart, color: 'text-blue-600 bg-blue-500/10' },
  Planning:   { label: 'Planning',       icon: CalendarClock, color: 'text-violet-600 bg-violet-500/10' },
  Production: { label: 'Production',      icon: Factory,       color: 'text-amber-600 bg-amber-500/10' },
  Dispatch:   { label: 'Dispatch',       icon: Truck,         color: 'text-emerald-600 bg-emerald-500/10' },
}

const fmt = (iso?: string | null) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
const sortDesc = (a: AuditEvent, b: AuditEvent) => new Date(b.at).getTime() - new Date(a.at).getTime()
const valid = (e: AuditEvent) => !isNaN(new Date(e.at).getTime())

// ── Compose events from existing data ───────────────────────────────────────────

function orderEvents(o: any): AuditEvent[] {
  const out: AuditEvent[] = []
  if (o.createdAt) out.push({ at: o.createdAt, actor: o.createdBy || '—', module: 'Sales', action: 'Order created', ref: o.orderNo })
  if (o.updatedAt && o.updatedAt !== o.createdAt)
    out.push({ at: o.updatedAt, actor: o.updatedBy || '—', module: 'Sales', action: `Order updated · status: ${o.status}`, ref: o.orderNo })
  return out
}

function ospEvents(o: any): AuditEvent[] {
  const out: AuditEvent[] = []
  const part = [o.childPartName, o.processName].filter(Boolean).join(' · ')
  out.push({
    at: o.createdAt || o.sentDate, actor: o.createdBy || '—', module: 'Production',
    action: `Sent to vendor${o.vendorName ? ` (${o.vendorName})` : ''}${part ? ` — ${part}` : ''}`, ref: o.orderNo || undefined,
  })
  if (o.status === 'Received' && o.actualReturnDate)
    out.push({
      at: o.actualReturnDate, actor: o.updatedBy || o.createdBy || '—', module: 'Production',
      action: `Received from vendor${o.vendorName ? ` (${o.vendorName})` : ''}${part ? ` — ${part}` : ''}`, ref: o.orderNo || undefined,
    })
  return out
}

function challanEvents(c: any): AuditEvent[] {
  return [{
    at: c.createdAt || c.challanDate, actor: c.createdBy || '—', module: 'Dispatch',
    action: `Dispatched — challan ${c.challanNo}`, ref: c.orderNo || undefined,
  }]
}

// ── Event row ────────────────────────────────────────────────────────────────

function EventRow({ e }: { e: AuditEvent }) {
  const meta = MODULE_META[e.module]
  const Icon = meta.icon
  return (
    <div className="flex gap-3 py-3">
      <div className={`h-8 w-8 rounded-full grid place-items-center shrink-0 ${meta.color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-snug">{e.action}</p>
        <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground mt-0.5">
          <span className="inline-flex items-center gap-1"><User className="h-3 w-3" />{e.actor}</span>
          <span>·</span>
          <span>{fmt(e.at)}</span>
          {e.ref && (<><span>·</span><span className="font-mono">{e.ref}</span></>)}
          <Badge variant="secondary" className="ml-1 text-[10px]">{meta.label}</Badge>
        </div>
      </div>
    </div>
  )
}

// ── Order Trail tab ──────────────────────────────────────────────────────────

function OrderTrailTab() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<any | null>(null)
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(false)

  // Debounced order search
  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const paged = await orderService.getPaged(1, 8, query.trim())
        setResults(paged.items || [])
      } catch { /* ignore */ }
      finally { setSearching(false) }
    }, 350)
    return () => clearTimeout(t)
  }, [query])

  const loadTrail = useCallback(async (order: any) => {
    setSelected(order); setResults([]); setQuery(''); setLoading(true)
    try {
      const [full, jobCards, allOsp, allChallans] = await Promise.all([
        orderService.getById(order.id).catch(() => order),
        jobCardService.getByOrderId(order.id).catch(() => []),
        ospService.getAll().catch(() => []),
        dispatchService.getAllChallans().catch(() => []),
      ])
      const ev: AuditEvent[] = [...orderEvents(full)]
      // Job cards generated — grouped by actor + minute
      const groups = new Map<string, { at: string; actor: string; count: number }>()
      ;(jobCards as any[]).forEach((jc) => {
        const key = `${jc.createdBy || '—'}|${(jc.createdAt || '').slice(0, 16)}`
        const g = groups.get(key) || { at: jc.createdAt, actor: jc.createdBy || '—', count: 0 }
        g.count++; groups.set(key, g)
      })
      groups.forEach((g) => ev.push({ at: g.at, actor: g.actor, module: 'Planning', action: `${g.count} job card(s) generated` }))
      ;(allOsp as any[]).filter((o) => o.orderId === order.id).forEach((o) => ev.push(...ospEvents(o)))
      ;(allChallans as any[]).filter((c) => c.orderId === order.id).forEach((c) => ev.push(...challanEvents(c)))
      setEvents(ev.filter(valid).sort(sortDesc))
    } catch (e: any) {
      toast.error('Failed to load order trail')
    } finally { setLoading(false) }
  }, [])

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search an order by number or customer…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-9 pl-8"
        />
        {(results.length > 0 || searching) && (
          <div className="absolute z-20 mt-1 w-full rounded-lg border bg-popover shadow-lg overflow-hidden">
            {searching && <div className="px-3 py-2 text-sm text-muted-foreground">Searching…</div>}
            {results.map((o) => (
              <button
                key={o.id}
                onClick={() => loadTrail(o)}
                className="w-full text-left px-3 py-2 hover:bg-muted/60 flex items-center justify-between"
              >
                <span className="text-sm"><span className="font-mono font-medium">{o.orderNo}</span>
                  <span className="text-muted-foreground ml-2">{o.customerName}</span></span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </div>

      {!selected ? (
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2 border-2 border-dashed rounded-lg">
          <FileText className="h-8 w-8 opacity-30" />
          <p className="text-sm">Search and pick an order to see its full audit trail.</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <div>
              <p className="font-semibold text-sm font-mono">{selected.orderNo}</p>
              <p className="text-xs text-muted-foreground">{selected.customerName}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => loadTrail(selected)} className="gap-1.5">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
          <div className="px-4 divide-y">
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
                <RefreshCw className="h-4 w-4 animate-spin" /> Loading trail…
              </div>
            ) : events.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-8">No recorded events for this order.</div>
            ) : (
              events.map((e, i) => <EventRow key={i} e={e} />)
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Recent Activity (module-wise) tab ────────────────────────────────────────

function RecentActivityTab() {
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<ModuleKey | 'All'>('All')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [orders, osp, challans] = await Promise.all([
        orderService.getPaged(1, 25).catch(() => ({ items: [] as any[] })),
        ospService.getAll().catch(() => [] as any[]),
        dispatchService.getAllChallans().catch(() => [] as any[]),
      ])
      const ev: AuditEvent[] = []
      ;(orders.items || []).forEach((o: any) => ev.push(...orderEvents(o)))
      ;(osp as any[]).forEach((o) => ev.push(...ospEvents(o)))
      ;(challans as any[]).forEach((c) => ev.push(...challanEvents(c)))
      setEvents(ev.filter(valid).sort(sortDesc).slice(0, 80))
    } catch { toast.error('Failed to load activity') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: events.length }
    events.forEach((e) => { c[e.module] = (c[e.module] || 0) + 1 })
    return c
  }, [events])

  const shown = filter === 'All' ? events : events.filter((e) => e.module === filter)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex flex-wrap gap-2">
          {(['All', 'Sales', 'Planning', 'Production', 'Dispatch'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setFilter(m)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === m ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'
              }`}
            >
              {m === 'All' ? 'All modules' : MODULE_META[m].label}
              <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${filter === m ? 'bg-primary-foreground/20' : 'bg-muted-foreground/15'}`}>
                {counts[m] || 0}
              </span>
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-1.5">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <div className="border rounded-lg px-4 divide-y min-h-[200px]">
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-10 justify-center">
            <RefreshCw className="h-4 w-4 animate-spin" /> Loading activity…
          </div>
        ) : shown.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-10">No activity to show.</div>
        ) : (
          shown.map((e, i) => <EventRow key={i} e={e} />)
        )}
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AuditPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold flex items-center gap-2"><History className="h-5 w-5" /> Audit Log</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Who did what, across modules and per order</p>
      </div>
      <Tabs defaultValue="order">
        <TabsList>
          <TabsTrigger value="order" className="gap-1.5"><FileText className="h-4 w-4" /> Order Trail</TabsTrigger>
          <TabsTrigger value="recent" className="gap-1.5"><History className="h-4 w-4" /> Recent Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="order" className="mt-4"><OrderTrailTab /></TabsContent>
        <TabsContent value="recent" className="mt-4"><RecentActivityTab /></TabsContent>
      </Tabs>
    </div>
  )
}
