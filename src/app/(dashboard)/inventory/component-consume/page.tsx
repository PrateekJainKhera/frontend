"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PackageMinus, Search } from "lucide-react"
import { toast } from "sonner"
import { componentIssueService, ShopFloorComponentStock } from "@/lib/api/component-issues"
import { orderComponentService, ConsumeComponentItem } from "@/lib/api/order-components"
import { orderService, OrderLite } from "@/lib/api/orders"

export default function ComponentConsumePage() {
  const [floor, setFloor] = useState<ShopFloorComponentStock[]>([])
  const [orders, setOrders] = useState<OrderLite[]>([])
  const [qtyByComponent, setQtyByComponent] = useState<Record<number, number>>({})
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set())
  const [search, setSearch] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    // Floor stock loads first & independently so it always shows, even if orders are slow.
    try {
      setFloor(await componentIssueService.getShopFloorStock())
    } catch {
      toast.error("Failed to load shop-floor stock")
    }
    // Orders via the lightweight single-query endpoint (fast; picker only needs id/no/customer/date).
    try {
      setOrders(await orderService.getLite())
    } catch {
      toast.error("Failed to load orders")
    } finally {
      setLoading(false)
    }
  }

  const setComponentQty = (componentId: number, qty: number) =>
    setQtyByComponent(prev => ({ ...prev, [componentId]: qty }))

  const toggleOrder = (id: number) =>
    setSelectedOrders(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const fullRef = (o: OrderLite) => o.itemSequence ? `${o.orderNo}-${o.itemSequence}` : o.orderNo

  const filteredOrders = useMemo(() => {
    const q = search.toLowerCase()
    return orders.filter(o => {
      if (q && !(fullRef(o).toLowerCase().includes(q) ||
        (o.customerName ?? "").toLowerCase().includes(q) ||
        (o.machineModel ?? "").toLowerCase().includes(q) ||
        (o.rollerType ?? "").toLowerCase().includes(q) ||
        String(o.numberOfTeeth ?? "").includes(q))) return false
      if (dateFrom || dateTo) {
        const d = (o.orderDate ?? "").slice(0, 10)
        if (!d) return false
        if (dateFrom && d < dateFrom) return false
        if (dateTo && d > dateTo) return false
      }
      return true
    })
  }, [orders, search, dateFrom, dateTo])

  const selectAllShown = () =>
    setSelectedOrders(prev => { const n = new Set(prev); filteredOrders.forEach(o => n.add(o.orderItemId)); return n })
  const clearSelection = () => setSelectedOrders(new Set())

  const selectedComponents = floor.filter(f => (qtyByComponent[f.componentId] ?? 0) > 0)

  const handleConsume = async () => {
    if (selectedComponents.length === 0) { toast.error("Enter a quantity for at least one component"); return }
    if (selectedOrders.size === 0) { toast.error("Select at least one order"); return }

    // Cartesian: each selected sub-order × each component that has a quantity.
    const items: ConsumeComponentItem[] = []
    orders.filter(o => selectedOrders.has(o.orderItemId)).forEach(o => {
      selectedComponents.forEach(f => items.push({
        orderId: o.orderId,
        orderItemId: o.orderItemId,
        orderNo: fullRef(o),
        componentId: f.componentId,
        componentName: f.componentName,
        uom: f.uom,
        quantity: qtyByComponent[f.componentId],
      }))
    })

    setSubmitting(true)
    try {
      const results = await orderComponentService.consume({ consumedBy: "Stores", items })
      const ok = results.filter(r => r.success).length
      const fail = results.filter(r => !r.success)
      if (fail.length === 0) {
        toast.success(`Consumed ${ok} component-order assignment(s) from the shop floor`)
      } else {
        toast.warning(`${ok} consumed, ${fail.length} failed`, {
          description: fail.slice(0, 3).map(f => `${f.orderNo} · ${f.componentName}: ${f.message}`).join("\n"),
          duration: 8000,
        })
      }
      setQtyByComponent({}); setSelectedOrders(new Set())
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to consume")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <PackageMinus className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Consume Components (against Orders)</h1>
          <p className="text-sm text-muted-foreground">
            Assign shop-floor components (nuts, bolts, bearings, etc.) to one or more orders. Stock is deducted from the Shop Floor.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Components — all shop-floor components listed */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1 · Components on the shop floor ({selectedComponents.length} selected)</CardTitle>
            <CardDescription>Enter the quantity (per order) for each component you want to consume.</CardDescription>
          </CardHeader>
          <CardContent>
            {floor.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No components on the shop floor. Issue some via “Issue to Shop Floor” first.
              </p>
            ) : (
              <div className="max-h-[360px] overflow-y-auto space-y-1">
                {floor.map(f => {
                  const q = qtyByComponent[f.componentId] ?? 0
                  return (
                    <div key={f.componentId} className={`flex items-center gap-2 p-2 rounded ${q > 0 ? "bg-primary/5" : "hover:bg-muted/30"}`}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{f.componentName}</p>
                        {f.partNumber && <p className="text-xs text-muted-foreground">{f.partNumber}</p>}
                      </div>
                      <span className={`text-xs whitespace-nowrap ${f.availableQty <= 0 ? "text-destructive" : "text-muted-foreground"}`}>
                        {f.availableQty} {f.uom} avail
                      </span>
                      <Input type="number" min={0} className="w-24 h-8"
                        value={q || ""} placeholder="0"
                        onChange={(e) => setComponentQty(f.componentId, Number(e.target.value))} />
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">2 · Orders ({selectedOrders.size} selected)</CardTitle>
            <CardDescription>Select the orders these components are consumed against.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 border rounded-md px-3 py-1 mb-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search orders…" value={search} onChange={(e) => setSearch(e.target.value)}
                className="border-0 shadow-none focus-visible:ring-0 h-8 px-0" />
            </div>
            {/* Order-date filter */}
            <div className="flex flex-wrap items-end gap-2 mb-2">
              <div>
                <label className="text-xs text-muted-foreground">Order date from</label>
                <Input type="date" className="h-8 w-40" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">To</label>
                <Input type="date" className="h-8 w-40" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
              {(dateFrom || dateTo) && (
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setDateFrom(""); setDateTo("") }}>Clear dates</Button>
              )}
            </div>
            <div className="flex items-center justify-between mb-2 text-xs">
              <span className="text-muted-foreground">{filteredOrders.length} order(s)</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={selectAllShown} disabled={filteredOrders.length === 0}>Select all shown</Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearSelection} disabled={selectedOrders.size === 0}>Clear</Button>
              </div>
            </div>
            <div className="max-h-[320px] overflow-y-auto space-y-1">
              {loading ? <p className="text-sm text-muted-foreground py-4">Loading…</p> :
                filteredOrders.slice(0, 400).map(o => (
                  <label key={o.orderItemId} className="flex items-center gap-2 p-2 rounded hover:bg-muted/40 cursor-pointer text-sm">
                    <input type="checkbox" checked={selectedOrders.has(o.orderItemId)} onChange={() => toggleOrder(o.orderItemId)} />
                    <span className="font-mono font-medium whitespace-nowrap">{fullRef(o)}</span>
                    <span className="text-muted-foreground truncate">{o.customerName}</span>
                    <span className="text-muted-foreground ml-auto text-xs text-right whitespace-nowrap">
                      {[o.machineModel, o.rollerType, (o.numberOfTeeth ?? 0) > 0 ? `${o.numberOfTeeth}T` : null].filter(Boolean).join(' · ') || '—'}
                    </span>
                  </label>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button size="lg" onClick={handleConsume} disabled={submitting || selectedComponents.length === 0 || selectedOrders.size === 0}>
          {submitting ? "Consuming…" : `Consume against ${selectedOrders.size} order(s)`}
        </Button>
      </div>
    </div>
  )
}
