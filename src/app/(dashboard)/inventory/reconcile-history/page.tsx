"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { History, Search, ArrowLeft, Printer } from "lucide-react"
import { toast } from "sonner"
import { materialReconcileService, ReconcileLog } from "@/lib/api/material-reconcile"

const mm = (v?: number | null) => (v == null ? "—" : `${v} mm`)

export default function ReconcileHistoryPage() {
  const [logs, setLogs] = useState<ReconcileLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    materialReconcileService.getHistory()
      .then(setLogs)
      .catch(e => toast.error(e instanceof Error ? e.message : "Failed to load history"))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return logs
    return logs.filter(l =>
      (l.materialName ?? "").toLowerCase().includes(q) ||
      (l.materialCode ?? "").toLowerCase().includes(q) ||
      (l.pieceNo ?? "").toLowerCase().includes(q) ||
      (l.reason ?? "").toLowerCase().includes(q) ||
      (l.remarks ?? "").toLowerCase().includes(q) ||
      (l.performedBy ?? "").toLowerCase().includes(q))
  }, [logs, search])

  // Material-wise roll-up of what was reconciled: entries, total length & weight removed.
  const summary = useMemo(() => {
    const map = new Map<string, { code: string; name: string; entries: number; lengthMM: number; weightKG: number }>()
    for (const l of filtered) {
      const key = l.materialCode ?? l.materialName ?? String(l.materialId)
      const row = map.get(key) ?? { code: l.materialCode ?? "", name: l.materialName ?? "", entries: 0, lengthMM: 0, weightKG: 0 }
      row.entries += 1
      row.lengthMM += l.lengthRemovedMM ?? 0
      row.weightKG += l.weightRemovedKG ?? 0
      map.set(key, row)
    }
    return Array.from(map.values()).sort((a, b) => b.weightKG - a.weightKG)
  }, [filtered])

  const totals = useMemo(() => ({
    entries: filtered.length,
    lengthMM: summary.reduce((s, r) => s + r.lengthMM, 0),
    weightKG: summary.reduce((s, r) => s + r.weightKG, 0),
  }), [filtered, summary])

  const handlePrint = () => {
    const now = new Date().toLocaleString()
    const rows = summary.map(r => `
      <tr>
        <td>${r.name || "—"}<div class="sub">${r.code || ""}</div></td>
        <td class="num">${r.entries}</td>
        <td class="num">${r.lengthMM.toLocaleString()} mm</td>
        <td class="num">${r.weightKG.toFixed(2)} kg</td>
      </tr>`).join("")
    const detail = filtered.map(l => `
      <tr>
        <td>${l.createdAt ?? ""}</td>
        <td>${l.materialName ?? ""} <span class="sub">${l.materialCode ?? ""}</span></td>
        <td>${l.pieceNo ?? "—"}</td>
        <td>${l.actionType === "RemoveBar" ? "Bar removed" : "Length reduced"}</td>
        <td class="num">${l.lengthRemovedMM ?? 0} mm${l.weightRemovedKG ? " / " + l.weightRemovedKG.toFixed(2) + " kg" : ""}</td>
        <td>${l.reason ?? ""}</td>
        <td>${l.performedBy ?? "—"}</td>
      </tr>`).join("")
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Reconcile Report</title>
      <style>
        *{font-family:Arial,Helvetica,sans-serif}
        body{margin:24px;color:#111;font-size:12px}
        h1{font-size:18px;margin:0 0 2px} h2{font-size:14px;margin:22px 0 6px}
        .meta{color:#666;font-size:11px;margin-bottom:6px}
        table{border-collapse:collapse;width:100%}
        th,td{border:1px solid #ccc;padding:5px 8px;text-align:left;vertical-align:top}
        th{background:#f3f4f6;font-size:11px}
        .num{text-align:right;white-space:nowrap}
        .sub{color:#888;font-size:10px}
        tfoot td{font-weight:bold;background:#f9fafb}
        @media print{@page{margin:14mm}}
      </style></head><body>
      <h1>MultiHitech — Material Reconciliation Report</h1>
      <div class="meta">Generated ${now}${search ? ` · Filter: "${search}"` : ""} · ${totals.entries} record(s)</div>
      <h2>Material-wise Summary</h2>
      <table><thead><tr><th>Material</th><th class="num">Entries</th><th class="num">Total Length Removed</th><th class="num">Total Weight Removed</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td>TOTAL</td><td class="num">${totals.entries}</td><td class="num">${totals.lengthMM.toLocaleString()} mm</td><td class="num">${totals.weightKG.toFixed(2)} kg</td></tr></tfoot></table>
      <h2>Detail</h2>
      <table><thead><tr><th>Date</th><th>Material</th><th>Piece</th><th>Action</th><th class="num">Removed</th><th>Reason</th><th>By</th></tr></thead>
      <tbody>${detail}</tbody></table>
      <script>window.onload=function(){window.print()}</script>
      </body></html>`
    const w = window.open("", "_blank", "width=900,height=700")
    if (!w) { toast.error("Popup blocked — allow popups to print"); return }
    w.document.write(html); w.document.close()
  }

  const reasonBadge = (reason?: string | null) => {
    if (reason === "Correction") return <Badge variant="outline" className="border-amber-400 text-amber-700 bg-amber-50">Correction</Badge>
    if (reason === "Reconcile-Scrap") return <Badge variant="outline" className="border-red-400 text-red-700 bg-red-50">Reconcile → Scrap</Badge>
    return <Badge variant="outline" className="border-blue-400 text-blue-700 bg-blue-50">Reconcile</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <History className="h-7 w-7 text-primary" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Reconcile History</h1>
          <p className="text-sm text-muted-foreground">Every stock reconciliation — bars removed (correction) or lengths reduced (reconcile), with reason and who did it.</p>
        </div>
        <Button variant="outline" onClick={handlePrint} disabled={filtered.length === 0}>
          <Printer className="h-4 w-4 mr-1" /> Print
        </Button>
        <Button variant="outline" asChild>
          <Link href="/inventory/reconcile"><ArrowLeft className="h-4 w-4 mr-1" /> Back to Reconcile</Link>
        </Button>
      </div>

      {/* Material-wise summary — total qty & weight reconciled */}
      {!loading && summary.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Material-wise Summary</CardTitle>
            <CardDescription>Total reconciled quantity and weight per material.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Material</th>
                    <th className="py-2 px-4 font-medium text-right">Entries</th>
                    <th className="py-2 px-4 font-medium text-right">Total Length Removed</th>
                    <th className="py-2 pl-4 font-medium text-right">Total Weight Removed</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map(r => (
                    <tr key={r.code || r.name} className="border-b last:border-0">
                      <td className="py-2 pr-4">
                        <div className="font-medium">{r.name || "—"}</div>
                        <div className="text-xs text-muted-foreground">{r.code}</div>
                      </td>
                      <td className="py-2 px-4 text-right">{r.entries}</td>
                      <td className="py-2 px-4 text-right whitespace-nowrap">{r.lengthMM.toLocaleString()} mm</td>
                      <td className="py-2 pl-4 text-right font-medium whitespace-nowrap">{r.weightKG.toFixed(2)} kg</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t font-semibold">
                    <td className="py-2 pr-4">Total</td>
                    <td className="py-2 px-4 text-right">{totals.entries}</td>
                    <td className="py-2 px-4 text-right whitespace-nowrap">{totals.lengthMM.toLocaleString()} mm</td>
                    <td className="py-2 pl-4 text-right whitespace-nowrap">{totals.weightKG.toFixed(2)} kg</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Log ({filtered.length})</CardTitle>
              <CardDescription>Most recent first (last 500).</CardDescription>
            </div>
            <div className="flex items-center gap-2 border rounded-md px-3 py-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search material / piece / reason / user…" value={search} onChange={e => setSearch(e.target.value)}
                className="border-0 shadow-none focus-visible:ring-0 h-8 px-0 w-64" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-4">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No reconciliation records yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Date</th>
                    <th className="py-2 px-4 font-medium">Material</th>
                    <th className="py-2 px-4 font-medium">Piece</th>
                    <th className="py-2 px-4 font-medium">Action</th>
                    <th className="py-2 px-4 font-medium">Before → After</th>
                    <th className="py-2 px-4 font-medium text-right">Removed</th>
                    <th className="py-2 px-4 font-medium">Reason</th>
                    <th className="py-2 px-4 font-medium">Remarks</th>
                    <th className="py-2 pl-4 font-medium">By</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(l => (
                    <tr key={l.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 whitespace-nowrap text-muted-foreground">{l.createdAt}</td>
                      <td className="py-2 px-4">
                        <div className="font-medium">{l.materialName}</div>
                        <div className="text-xs text-muted-foreground">{l.materialCode}</div>
                      </td>
                      <td className="py-2 px-4 font-mono text-xs">{l.pieceNo ?? "—"}</td>
                      <td className="py-2 px-4">{l.actionType === "RemoveBar" ? "Bar removed" : "Length reduced"}</td>
                      <td className="py-2 px-4 whitespace-nowrap">{mm(l.lengthBeforeMM)} → {mm(l.lengthAfterMM)}</td>
                      <td className="py-2 px-4 text-right text-destructive font-medium whitespace-nowrap">
                        −{l.lengthRemovedMM ?? 0} mm{l.weightRemovedKG ? ` / ${l.weightRemovedKG.toFixed(2)} kg` : ""}
                      </td>
                      <td className="py-2 px-4">{reasonBadge(l.reason)}</td>
                      <td className="py-2 px-4 text-muted-foreground max-w-[220px] truncate" title={l.remarks ?? ""}>{l.remarks ?? "—"}</td>
                      <td className="py-2 pl-4">{l.performedBy ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
