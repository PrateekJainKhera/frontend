"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { History, Search, ArrowLeft } from "lucide-react"
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
        <Button variant="outline" asChild>
          <Link href="/inventory/reconcile"><ArrowLeft className="h-4 w-4 mr-1" /> Back to Reconcile</Link>
        </Button>
      </div>

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
