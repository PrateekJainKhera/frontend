"use client"

import { useEffect, useMemo, useState } from 'react'
import { Cog, RefreshCw, TrendingUp, Users, Pencil } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { SearchableSelect } from '@/components/ui/searchable-select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  misService, MachineModelsResponse, MachineModelDetail, MachineModelCustomerRow, MachineModelRow,
} from '@/lib/api/mis'
import { machineModelService } from '@/lib/api/machine-models'
import { MonthBarChart, MIS_BLUE, MIS_GREEN } from '@/components/mis/mis-shared'
import { formatDate } from '@/lib/utils/formatters'
import { toast } from 'sonner'

const spec = (r: { modelName: string; rollerType: string | null; numberOfTeeth: number | null }) =>
  [r.modelName, r.rollerType, (r.numberOfTeeth ?? 0) > 0 ? `${r.numberOfTeeth}T` : null].filter(Boolean).join(' · ')

export default function MachineModelsReportPage() {
  const [data, setData] = useState<MachineModelsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const [selectedModel, setSelectedModel] = useState('')
  const [detail, setDetail] = useState<MachineModelDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Drill-down: customers for a specific variant (or whole model)
  const [pickedVariant, setPickedVariant] = useState<MachineModelRow | null>(null)
  const [customers, setCustomers] = useState<MachineModelCustomerRow[]>([])
  const [custLoading, setCustLoading] = useState(false)

  // name → machine-model id, for the rename shortcut
  const [modelIdByName, setModelIdByName] = useState<Record<string, number>>({})

  // Rename dialog
  const [renameOpen, setRenameOpen] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [renaming, setRenaming] = useState(false)

  const load = () => {
    setLoading(true)
    misService.getMachineModels().then(setData).catch(() => setData(null)).finally(() => setLoading(false))
    machineModelService.getAll()
      .then(list => setModelIdByName(Object.fromEntries(list.map(m => [m.modelName, m.id]))))
      .catch(() => {})
  }
  useEffect(load, [])

  const canRename = !!detail && modelIdByName[detail.modelName] != null
  const openRename = () => { if (!detail) return; setRenameValue(detail.modelName); setRenameOpen(true) }
  const submitRename = async () => {
    if (!detail) return
    const id = modelIdByName[detail.modelName]
    const newName = renameValue.trim()
    if (!id) { toast.error('Machine model not found in master'); return }
    if (!newName) { toast.error('Name is required'); return }
    if (newName === detail.modelName) { setRenameOpen(false); return }
    setRenaming(true)
    try {
      await machineModelService.update(id, { id, modelName: newName, isActive: true })
      toast.success(`Renamed to "${newName}" — updated across all linked products & orders`, { duration: 6000 })
      setRenameOpen(false)
      setSelectedModel(newName)   // re-point selection to the new name
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to rename model')
    } finally {
      setRenaming(false)
    }
  }

  // Load model detail when a model is chosen
  useEffect(() => {
    if (!selectedModel) { setDetail(null); setPickedVariant(null); setCustomers([]); return }
    setDetailLoading(true); setPickedVariant(null); setCustomers([])
    misService.getMachineModelDetail(selectedModel)
      .then(setDetail).catch(() => setDetail(null)).finally(() => setDetailLoading(false))
  }, [selectedModel])

  // Load customers when a variant is picked (or whole model)
  const showCustomers = (variant: MachineModelRow | null) => {
    if (!detail) return
    setPickedVariant(variant)
    setCustLoading(true)
    misService.getMachineModelCustomers(detail.modelName, variant?.rollerType, variant?.numberOfTeeth)
      .then(setCustomers).catch(() => setCustomers([])).finally(() => setCustLoading(false))
  }

  const modelOptions = useMemo(
    () => (data?.models ?? []).map(m => ({ value: m.modelName, label: `${m.modelName}  (${m.orders} orders · ${m.totalQty} pcs)` })),
    [data]
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Cog className="h-7 w-7 text-primary" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Machine Model Report</h1>
          <p className="text-sm text-muted-foreground">Most-ordered machine models, and per-model sales &amp; customers. Sales = orders and pieces (no revenue data in the system).</p>
        </div>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={load}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></Button>
      </div>

      {/* Part 1 — Top 10 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top 10 Machine Models</CardTitle>
          <CardDescription>By number of orders received (most first)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
          ) : !data || data.top10.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No order data yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-3 font-medium w-8">#</th>
                    <th className="py-2 px-3 font-medium">Model</th>
                    <th className="py-2 px-3 font-medium">Roller Type</th>
                    <th className="py-2 px-3 font-medium text-right">Teeth</th>
                    <th className="py-2 px-3 font-medium text-right">Orders</th>
                    <th className="py-2 px-3 font-medium text-right">Qty (pcs)</th>
                    <th className="py-2 pl-3 font-medium">Last Order</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top10.map((r, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/40 cursor-pointer"
                      onClick={() => setSelectedModel(r.modelName)} title="View this model's detail">
                      <td className="py-2 pr-3 text-muted-foreground tabular-nums">{i + 1}</td>
                      <td className="py-2 px-3 font-semibold">{r.modelName}</td>
                      <td className="py-2 px-3">{r.rollerType ?? '—'}</td>
                      <td className="py-2 px-3 text-right tabular-nums">{(r.numberOfTeeth ?? 0) > 0 ? `${r.numberOfTeeth}T` : '—'}</td>
                      <td className="py-2 px-3 text-right font-semibold tabular-nums">{r.orders}</td>
                      <td className="py-2 px-3 text-right tabular-nums">{r.totalQty}</td>
                      <td className="py-2 pl-3 text-muted-foreground whitespace-nowrap">{r.lastOrderDate ? formatDate(r.lastOrderDate) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Part 2 — Search a machine model */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Machine Model Sales</CardTitle>
          <CardDescription>Search a model to see its roller/teeth variants and month-by-month orders</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-md">
            <SearchableSelect
              value={selectedModel}
              onChange={setSelectedModel}
              options={modelOptions}
              placeholder="Search machine model…"
              searchPlaceholder="Type model name…"
            />
          </div>

          {detailLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : detail && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline" className="text-sm">Model: <span className="font-semibold ml-1">{detail.modelName}</span></Badge>
                <Badge variant="secondary" className="text-sm">{detail.totalOrders} orders</Badge>
                <Badge variant="secondary" className="text-sm">{detail.totalQty} pcs</Badge>
                <Badge variant="secondary" className="text-sm">{detail.variants.length} roller/teeth variant(s)</Badge>
                <Button variant="outline" size="sm" className="h-7 gap-1.5 ml-auto" onClick={openRename} disabled={!canRename}
                  title={canRename ? 'Rename this machine model (updates everywhere)' : 'Model not found in master'}>
                  <Pencil className="h-3.5 w-3.5" /> Rename model
                </Button>
              </div>

              <MonthBarChart
                title="Orders per Month"
                description="Order items received for this model (last 24 months)"
                data={detail.monthly.map(m => ({ month: m.period, count: m.orders, qty: m.qty }))}
                color={MIS_BLUE} valueName="Orders"
              />

              {/* Yearly mini-summary */}
              {detail.yearly.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {detail.yearly.map(y => (
                    <span key={y.period} className="text-xs border rounded-md px-3 py-1.5">
                      <span className="font-semibold">{y.period}</span> · {y.orders} orders · {y.qty} pcs
                    </span>
                  ))}
                </div>
              )}

              {/* Variants — click to see customers */}
              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-1.5"><TrendingUp className="h-4 w-4" /> Roller / Teeth variants <span className="text-xs text-muted-foreground font-normal">(click a row to see its customers)</span></p>
                <div className="border rounded-lg divide-y">
                  <button
                    onClick={() => showCustomers(null)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-muted/40 ${pickedVariant === null && customers.length ? 'bg-blue-50' : ''}`}>
                    <span className="font-medium flex-1">All variants of {detail.modelName}</span>
                    <span className="text-muted-foreground text-xs">{detail.totalOrders} orders · {detail.totalQty} pcs</span>
                  </button>
                  {detail.variants.map((v, i) => (
                    <button key={i} onClick={() => showCustomers(v)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-muted/40 ${pickedVariant === v ? 'bg-blue-50' : ''}`}>
                      <span className="flex-1">{v.rollerType ?? '—'} · <span className="tabular-nums">{(v.numberOfTeeth ?? 0) > 0 ? `${v.numberOfTeeth}T` : '—'}</span></span>
                      <span className="text-muted-foreground text-xs">{v.orders} orders · {v.totalQty} pcs · last {v.lastOrderDate ? formatDate(v.lastOrderDate) : '—'}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Part 3 — customers drill-down */}
      {detail && (custLoading || customers.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Customers — {pickedVariant ? spec(pickedVariant) : `${detail.modelName} (all variants)`}
            </CardTitle>
            <CardDescription>Who bought it, and their last order date (most recent first)</CardDescription>
          </CardHeader>
          <CardContent>
            {custLoading ? (
              <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-3 font-medium">Customer</th>
                      <th className="py-2 px-3 font-medium text-right">Orders</th>
                      <th className="py-2 px-3 font-medium text-right">Qty (pcs)</th>
                      <th className="py-2 pl-3 font-medium">Last Order Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2 pr-3 font-medium">{c.customerName}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{c.orders}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{c.totalQty}</td>
                        <td className="py-2 pl-3 text-muted-foreground whitespace-nowrap">{c.lastOrderDate ? formatDate(c.lastOrderDate) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Rename machine model — cascades to all linked products & orders */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Machine Model</DialogTitle>
            <DialogDescription>
              The new name updates the model master and every product/order that uses it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-1">
            <Label>Model name</Label>
            <Input value={renameValue} onChange={e => setRenameValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submitRename() }} autoFocus />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)} disabled={renaming}>Cancel</Button>
            <Button onClick={submitRename} disabled={renaming || !renameValue.trim()}>
              {renaming ? 'Saving…' : 'Save & apply everywhere'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
