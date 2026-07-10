"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchableSelect } from "@/components/ui/searchable-select"
import Link from "next/link"
import { Scale, ChevronDown, ChevronRight, History } from "lucide-react"
import { toast } from "sonner"
import { materialService, MaterialResponse } from "@/lib/api/materials"
import { materialReconcileService, MaterialPiecesByLength } from "@/lib/api/material-reconcile"

const mm2m = (mm: number) => (mm / 1000).toFixed(2)

export default function StockReconcilePage() {
  const [materials, setMaterials] = useState<MaterialResponse[]>([])
  const [materialId, setMaterialId] = useState<string>("")
  const [data, setData] = useState<MaterialPiecesByLength | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [remarks, setRemarks] = useState("")
  const [removeCounts, setRemoveCounts] = useState<Record<string, string>>({}) // key = lengthMM
  const [lengthEdits, setLengthEdits] = useState<Record<number, string>>({})    // key = pieceId
  const [expanded, setExpanded] = useState<Set<number>>(new Set())              // expanded group indexes

  useEffect(() => { materialService.getAll().then(setMaterials).catch(() => {}) }, [])

  const loadPieces = async (id: string) => {
    setMaterialId(id)
    setData(null); setRemoveCounts({}); setLengthEdits({}); setExpanded(new Set())
    if (!id) return
    setLoading(true)
    try {
      setData(await materialReconcileService.getPieces(Number(id)))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load pieces")
    } finally {
      setLoading(false)
    }
  }

  const pieceCurrentLen = useMemo(() => {
    const m = new Map<number, number>()
    data?.groups.forEach(g => g.pieces.forEach(p => m.set(p.id, p.lengthMM)))
    return m
  }, [data])

  // Build the pending changes
  const removals = Object.entries(removeCounts)
    .map(([lengthMM, c]) => ({ lengthMM: Number(lengthMM), count: parseInt(c) || 0 }))
    .filter(r => r.count > 0)
  const lengthChanges = Object.entries(lengthEdits)
    .map(([pid, v]) => ({ pieceId: Number(pid), newLengthMM: Number(v) }))
    .filter(c => !isNaN(c.newLengthMM) && c.newLengthMM >= 0 && c.newLengthMM < (pieceCurrentLen.get(c.pieceId) ?? Infinity))
  const hasChanges = removals.length > 0 || lengthChanges.length > 0

  const handleReconcile = async () => {
    if (!data || !hasChanges) { toast.error("Nothing to reconcile — remove bars or reduce a length first"); return }
    if (!remarks.trim()) { toast.error("Reason is required"); return }
    if (!confirm(`Reconcile this material?\n• ${removals.reduce((s, r) => s + r.count, 0)} bar(s) removed (correction)\n• ${lengthChanges.length} bar length(s) reduced\nStock will be reduced and each change logged.`)) return
    setSubmitting(true)
    try {
      const res = await materialReconcileService.reconcile({
        materialId: Number(materialId),
        performedBy: "Admin",
        remarks: remarks || "Physical stock count",
        removals,
        lengthChanges,
      })
      toast.success(
        `Reconciled — ${res.barsRemoved} bar(s) removed, ${res.lengthsAdjusted} length(s) reduced` +
        (res.movedToScrap > 0 ? `, ${res.movedToScrap} moved to scrap` : ''),
        {
          description: `New total: ${mm2m(res.newTotalLengthMM)} m / ${res.newTotalWeightKG.toFixed(2)} kg`,
          duration: 6000,
        })
      setRemarks("")
      await loadPieces(materialId)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to reconcile")
    } finally {
      setSubmitting(false)
    }
  }

  const toggle = (i: number) => setExpanded(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Scale className="h-7 w-7 text-primary" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Stock Reconciliation (Raw Materials)</h1>
          <p className="text-sm text-muted-foreground">
            Search a material, see its bars grouped by length. Remove miscounted bars (correction) or reduce a bar&apos;s length (reconcile). Only available stock; every change is logged.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/inventory/reconcile-history"><History className="h-4 w-4 mr-1" /> History</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">1 · Select material</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
            <SearchableSelect
              value={materialId}
              onChange={loadPieces}
              options={materials.map(m => ({ value: String(m.id), label: `${m.materialName} (${m.materialCode})` }))}
              placeholder="Search material…"
              searchPlaceholder="Search by name / code…"
            />
          </div>
        </CardContent>
      </Card>

      {loading && <p className="text-sm text-muted-foreground">Loading pieces…</p>}

      {data && (
        <>
          {/* Totals */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4"><p className="text-sm text-muted-foreground">Total Pieces (bars)</p><p className="text-2xl font-bold">{data.totalPieces}</p></Card>
            <Card className="p-4"><p className="text-sm text-muted-foreground">Total Length</p><p className="text-2xl font-bold">{mm2m(data.totalLengthMM)} m</p><p className="text-xs text-muted-foreground">{data.totalLengthMM} mm</p></Card>
            <Card className="p-4"><p className="text-sm text-muted-foreground">Total Weight</p><p className="text-2xl font-bold">{data.totalWeightKG.toFixed(2)} kg</p></Card>
          </div>

          {/* Length groups */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">2 · Bars by length</CardTitle>
              <CardDescription>
                Enter how many bars to remove, or expand a group to reduce a specific bar&apos;s length.
                A bar reduced below <span className="font-semibold text-foreground">{data.minUsableLengthMM} mm</span> (min usable) is automatically moved to <span className="text-destructive font-semibold">Scrap</span>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.groups.length === 0 && <p className="text-sm text-muted-foreground">No available pieces for this material.</p>}
              {data.groups.map((g, i) => {
                const removeVal = removeCounts[String(g.lengthMM)] ?? ""
                return (
                  <div key={g.lengthMM} className="border rounded-lg">
                    <div className="flex flex-wrap items-center gap-3 p-3">
                      <button onClick={() => toggle(i)} className="text-muted-foreground">
                        {expanded.has(i) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                      <div className="flex-1 min-w-[180px]">
                        <span className="font-semibold">{mm2m(g.lengthMM)} m</span>
                        <span className="text-muted-foreground text-sm"> ({g.lengthMM} mm)</span>
                        <span className="ml-2 text-sm">× <span className="font-semibold">{g.count} bars</span></span>
                        <span className="ml-2 text-xs text-muted-foreground">{g.totalWeightKG.toFixed(2)} kg</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-muted-foreground">Remove bars:</label>
                        <Input type="number" min={0} max={g.count} className="w-20 h-8"
                          value={removeVal} placeholder="0"
                          onChange={e => setRemoveCounts(prev => ({ ...prev, [String(g.lengthMM)]: e.target.value }))} />
                        {(parseInt(removeVal) || 0) > g.count && <span className="text-xs text-destructive">max {g.count}</span>}
                      </div>
                    </div>
                    {expanded.has(i) && (
                      <div className="border-t px-3 py-2 space-y-1 bg-muted/20">
                        <p className="text-xs text-muted-foreground mb-1">Reduce a specific bar&apos;s length (e.g. it was cut shorter):</p>
                        {g.pieces.map(p => (
                          <div key={p.id} className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="font-mono w-24">{p.pieceNo}</span>
                            <span className="text-muted-foreground">{p.lengthMM} mm</span>
                            <span className="text-muted-foreground">→</span>
                            <Input type="number" min={0} className="w-28 h-7" placeholder="new mm"
                              value={lengthEdits[p.id] ?? ""}
                              onChange={e => setLengthEdits(prev => ({ ...prev, [p.id]: e.target.value }))} />
                            {lengthEdits[p.id] && Number(lengthEdits[p.id]) < p.lengthMM && (
                              <>
                                <span className="text-xs text-destructive">−{p.lengthMM - Number(lengthEdits[p.id])} mm</span>
                                {Number(lengthEdits[p.id]) < data.minUsableLengthMM &&
                                  <span className="text-xs font-semibold text-destructive">→ Scrap (&lt; {data.minUsableLengthMM}mm)</span>}
                              </>
                            )}
                            {lengthEdits[p.id] && Number(lengthEdits[p.id]) >= p.lengthMM &&
                              <span className="text-xs text-amber-600">must be less than {p.lengthMM}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex-1 min-w-[260px]">
              <label className="text-xs text-muted-foreground">Reason <span className="text-destructive">*</span></label>
              <Input placeholder="e.g. Monthly physical count (required)" value={remarks} onChange={e => setRemarks(e.target.value)}
                className={hasChanges && !remarks.trim() ? "border-destructive" : ""} />
            </div>
            <Button size="lg" onClick={handleReconcile} disabled={submitting || !hasChanges || !remarks.trim()}>
              {submitting ? "Reconciling…" : `Reconcile (${removals.reduce((s, r) => s + r.count, 0)} remove, ${lengthChanges.length} reduce)`}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
