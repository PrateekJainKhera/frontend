"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Recycle, ArrowLeft, IndianRupee, Weight, Boxes, Printer } from "lucide-react"
import { toast } from "sonner"
import { scrapSalesService, ScrapOverview, ScrapMaterialSummary } from "@/lib/api/scrap-sales"
import { getCurrentUserName } from "@/lib/auth"

const kg = (v: number) => `${(v ?? 0).toFixed(2)} kg`
const inr = (v: number) => `₹${(v ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const today = () => new Date().toISOString().split("T")[0]

export default function WastagePage() {
  const [data, setData] = useState<ScrapOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Sell dialog
  const [open, setOpen] = useState(false)
  const [material, setMaterial] = useState<ScrapMaterialSummary | null>(null)
  const [weight, setWeight] = useState("")
  const [rate, setRate] = useState("")
  const [buyer, setBuyer] = useState("")
  const [saleDate, setSaleDate] = useState(today())
  const [remarks, setRemarks] = useState("")

  const load = () => {
    setLoading(true)
    scrapSalesService.getOverview()
      .then(setData)
      .catch(e => toast.error(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const amount = useMemo(() => {
    const w = parseFloat(weight), r = parseFloat(rate)
    return isNaN(w) || isNaN(r) ? 0 : w * r
  }, [weight, rate])

  const openSell = (m: ScrapMaterialSummary | null) => {
    setMaterial(m)
    setWeight(m && m.remainingWeightKG > 0 ? m.remainingWeightKG.toFixed(2) : "")
    setRate(""); setBuyer(""); setSaleDate(today()); setRemarks("")
    setOpen(true)
  }

  const submit = async () => {
    const w = parseFloat(weight), r = parseFloat(rate)
    if (!buyer.trim()) return toast.error("Buyer name is required")
    if (isNaN(w) || w <= 0) return toast.error("Enter weight in kg")
    if (isNaN(r) || r < 0) return toast.error("Enter a valid rate")
    setSaving(true)
    try {
      await scrapSalesService.create({
        materialId: material?.materialId ?? null,
        materialCode: material?.materialCode ?? null,
        materialName: material?.materialName ?? null,
        weightKG: w,
        ratePerKG: r,
        buyerName: buyer.trim(),
        saleDate,
        remarks: remarks.trim() || undefined,
        createdBy: getCurrentUserName(),
      })
      toast.success("Scrap sale recorded")
      setOpen(false)
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to record sale")
    } finally {
      setSaving(false)
    }
  }

  const handlePrint = () => {
    if (!data) return
    const rows = data.materials.map(m => `<tr>
      <td>${m.materialName ?? "—"}<div class="sub">${m.materialCode ?? ""}</div></td>
      <td class="num">${m.wastagePieces}</td>
      <td class="num">${m.wastageWeightKG.toFixed(2)} kg</td>
      <td class="num">${m.soldWeightKG.toFixed(2)} kg</td>
      <td class="num">${m.remainingWeightKG.toFixed(2)} kg</td></tr>`).join("")
    const sales = data.sales.map(s => `<tr>
      <td>${s.saleDate?.split("T")[0] ?? ""}</td>
      <td>${s.materialName ?? "—"}</td>
      <td>${s.buyerName}</td>
      <td class="num">${s.weightKG.toFixed(2)} kg</td>
      <td class="num">₹${s.ratePerKG.toFixed(2)}</td>
      <td class="num">₹${s.totalAmount.toFixed(2)}</td></tr>`).join("")
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Scrap / Wastage Report</title>
      <style>*{font-family:Arial,sans-serif}body{margin:24px;color:#111;font-size:12px}
      h1{font-size:18px;margin:0} h2{font-size:14px;margin:20px 0 6px}
      table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:5px 8px;text-align:left}
      th{background:#f3f4f6}.num{text-align:right;white-space:nowrap}.sub{color:#888;font-size:10px}</style></head><body>
      <h1>MultiHitech — Scrap / Wastage Report</h1>
      <div style="color:#666;font-size:11px">Generated ${new Date().toLocaleString()}</div>
      <h2>Material-wise Wastage</h2>
      <table><thead><tr><th>Material</th><th class="num">Pieces</th><th class="num">Wastage</th><th class="num">Sold</th><th class="num">Remaining</th></tr></thead><tbody>${rows}</tbody></table>
      <h2>Scrap Sales</h2>
      <table><thead><tr><th>Date</th><th>Material</th><th>Buyer</th><th class="num">Weight</th><th class="num">Rate</th><th class="num">Amount</th></tr></thead><tbody>${sales}</tbody></table>
      <script>window.onload=function(){window.print()}</script></body></html>`
    const w = window.open("", "_blank", "width=900,height=700")
    if (!w) return toast.error("Popup blocked — allow popups to print")
    w.document.write(html); w.document.close()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Recycle className="h-7 w-7 text-primary" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Wastage &amp; Scrap Sales</h1>
          <p className="text-sm text-muted-foreground">Off-cuts that went to wastage, by material and weight — and scrap sold to the kabadi.</p>
        </div>
        <Button variant="outline" onClick={handlePrint} disabled={!data}>
          <Printer className="h-4 w-4 mr-1" /> Print
        </Button>
        <Button onClick={() => openSell(null)}>
          <IndianRupee className="h-4 w-4 mr-1" /> Record Scrap Sale
        </Button>
        <Button variant="outline" asChild>
          <Link href="/inventory/material-pieces"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <Weight className="h-8 w-8 text-amber-500" />
            <div><div className="text-2xl font-bold">{kg(data?.totalWastageWeightKG ?? 0)}</div>
              <div className="text-xs text-muted-foreground">Total wastage weight</div></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <Boxes className="h-8 w-8 text-blue-500" />
            <div><div className="text-2xl font-bold">{kg(data?.totalSoldWeightKG ?? 0)}</div>
              <div className="text-xs text-muted-foreground">Total scrap sold</div></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <IndianRupee className="h-8 w-8 text-green-600" />
            <div><div className="text-2xl font-bold">{inr(data?.totalSaleAmount ?? 0)}</div>
              <div className="text-xs text-muted-foreground">Total sale value</div></div>
          </CardContent>
        </Card>
      </div>

      {/* Material-wise wastage */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Material-wise Wastage</CardTitle>
          <CardDescription>Pieces marked as wastage, grouped by material — with what&apos;s sold and what remains.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground py-4">Loading…</p>
          : !data || data.materials.length === 0 ? <p className="text-sm text-muted-foreground py-4">No wastage recorded yet.</p>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Material</th>
                    <th className="py-2 px-4 font-medium text-right">Wastage Pieces</th>
                    <th className="py-2 px-4 font-medium text-right">Wastage Weight</th>
                    <th className="py-2 px-4 font-medium text-right">Sold</th>
                    <th className="py-2 px-4 font-medium text-right">Remaining</th>
                    <th className="py-2 pl-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.materials.map(m => (
                    <tr key={`${m.materialId}-${m.materialCode}`} className="border-b last:border-0">
                      <td className="py-2 pr-4">
                        <div className="font-medium">{m.materialName ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{m.materialCode}</div>
                      </td>
                      <td className="py-2 px-4 text-right">{m.wastagePieces}</td>
                      <td className="py-2 px-4 text-right whitespace-nowrap">{kg(m.wastageWeightKG)}</td>
                      <td className="py-2 px-4 text-right whitespace-nowrap text-muted-foreground">{kg(m.soldWeightKG)}</td>
                      <td className="py-2 px-4 text-right whitespace-nowrap">
                        {m.remainingWeightKG > 0
                          ? <Badge variant="outline" className="border-amber-400 text-amber-700 bg-amber-50">{kg(m.remainingWeightKG)}</Badge>
                          : <span className="text-muted-foreground">{kg(0)}</span>}
                      </td>
                      <td className="py-2 pl-4 text-right">
                        <Button size="sm" variant="outline" onClick={() => openSell(m)}>Sell</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sales history */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Scrap Sales History</CardTitle>
          <CardDescription>Every scrap sale to the kabadi.</CardDescription>
        </CardHeader>
        <CardContent>
          {!data || data.sales.length === 0 ? <p className="text-sm text-muted-foreground py-4">No scrap sales recorded yet.</p>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Date</th>
                    <th className="py-2 px-4 font-medium">Material</th>
                    <th className="py-2 px-4 font-medium">Buyer (Kabadi)</th>
                    <th className="py-2 px-4 font-medium text-right">Weight</th>
                    <th className="py-2 px-4 font-medium text-right">Rate/kg</th>
                    <th className="py-2 px-4 font-medium text-right">Amount</th>
                    <th className="py-2 px-4 font-medium">Remarks</th>
                    <th className="py-2 pl-4 font-medium">By</th>
                  </tr>
                </thead>
                <tbody>
                  {data.sales.map(s => (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 whitespace-nowrap">{s.saleDate?.split("T")[0]}</td>
                      <td className="py-2 px-4">{s.materialName ?? "—"}<div className="text-xs text-muted-foreground">{s.materialCode}</div></td>
                      <td className="py-2 px-4">{s.buyerName}</td>
                      <td className="py-2 px-4 text-right whitespace-nowrap">{kg(s.weightKG)}</td>
                      <td className="py-2 px-4 text-right whitespace-nowrap">{inr(s.ratePerKG)}</td>
                      <td className="py-2 px-4 text-right whitespace-nowrap font-medium">{inr(s.totalAmount)}</td>
                      <td className="py-2 px-4 text-muted-foreground max-w-[200px] truncate" title={s.remarks ?? ""}>{s.remarks ?? "—"}</td>
                      <td className="py-2 pl-4">{s.createdBy ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sell dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Record Scrap Sale</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Material</Label>
              <div className="mt-1 text-sm rounded-md border px-3 py-2 bg-muted/40">
                {material ? `${material.materialName ?? ""}${material.materialCode ? ` (${material.materialCode})` : ""}` : "Not linked (manual entry)"}
                {material && material.remainingWeightKG > 0 &&
                  <span className="text-muted-foreground"> · {kg(material.remainingWeightKG)} available</span>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="w">Weight sold (kg) *</Label>
                <Input id="w" type="number" min="0" step="0.01" value={weight} onChange={e => setWeight(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="r">Rate (₹/kg) *</Label>
                <Input id="r" type="number" min="0" step="0.01" value={rate} onChange={e => setRate(e.target.value)} className="mt-1" />
              </div>
            </div>
            <div className="rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm flex items-center justify-between">
              <span className="text-green-800">Total amount</span>
              <span className="font-bold text-green-800">{inr(amount)}</span>
            </div>
            <div>
              <Label htmlFor="b">Buyer / Kabadi name *</Label>
              <Input id="b" value={buyer} onChange={e => setBuyer(e.target.value)} placeholder="e.g. Sharma Scrap Traders" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="d">Sale date</Label>
              <Input id="d" type="date" value={saleDate} onChange={e => setSaleDate(e.target.value)} className="mt-1 max-w-[200px]" />
            </div>
            <div>
              <Label htmlFor="rm">Remarks</Label>
              <Textarea id="rm" value={remarks} onChange={e => setRemarks(e.target.value)} rows={2} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={submit} disabled={saving}>{saving ? "Saving…" : "Record Sale"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
