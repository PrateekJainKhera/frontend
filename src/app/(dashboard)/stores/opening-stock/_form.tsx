"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Save, CheckCircle, Package, Layers, Check, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { openingStockService } from '@/lib/api/opening-stock'
import { CreateOpeningStockRequest, OpeningStockDetail } from '@/types/opening-stock'
import { materialService, MaterialResponse } from '@/lib/api/materials'
import { componentService, ComponentResponse } from '@/lib/api/components'
import { warehouseService, WarehouseResponse } from '@/lib/api/warehouses'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface Props { id?: number }

// ── UI-only state types (same shape as GRN dialog) ────────────────────────────

interface PieceBatch {
  id: string
  lengthM: number   // length in meters
  quantity: number
}

interface RMLine {
  id: string
  materialId: string
  materialName: string
  grade: string
  materialType: 'rod' | 'pipe'
  diameter: number
  outerDiameter: number
  innerDiameter: number
  materialDensity: number
  totalWeightKG: number
  calculatedLengthM: number   // meters
  weightPerMeterKG: number
  warehouseId: string
  unitCost: number
  batches: PieceBatch[]
}

interface CompLine {
  id: string
  componentId: string
  componentName: string
  partNumber: string
  uom: string
  quantity: number
  unitCost: number
  remarks: string
  warehouseId: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function newRM(): RMLine {
  return {
    id: `rm-${Date.now()}-${Math.random()}`,
    materialId: '', materialName: '', grade: '',
    materialType: 'rod', diameter: 0, outerDiameter: 0, innerDiameter: 0,
    materialDensity: 7.85, totalWeightKG: 0, calculatedLengthM: 0,
    weightPerMeterKG: 0, warehouseId: '', unitCost: 0, batches: [],
  }
}

function newComp(): CompLine {
  return {
    id: `comp-${Date.now()}-${Math.random()}`,
    componentId: '', componentName: '', partNumber: '',
    uom: 'PCS', quantity: 0, unitCost: 0, remarks: '', warehouseId: '',
  }
}

function calcLength(line: RMLine): { lengthM: number; wpm: number } {
  const { materialType, diameter, outerDiameter, innerDiameter, totalWeightKG, materialDensity } = line
  if (totalWeightKG <= 0 || materialDensity <= 0) return { lengthM: 0, wpm: 0 }
  let area = 0
  if (materialType === 'rod') {
    if (diameter <= 0) return { lengthM: 0, wpm: 0 }
    const d = diameter / 10
    area = (Math.PI / 4) * d * d
  } else {
    if (outerDiameter <= 0) return { lengthM: 0, wpm: 0 }
    const od = outerDiameter / 10, id = innerDiameter / 10
    area = (Math.PI / 4) * (od * od - id * id)
  }
  const wpm = (area * materialDensity * 100) / 1000
  return wpm > 0 ? { lengthM: totalWeightKG / wpm, wpm } : { lengthM: 0, wpm: 0 }
}

function totalBatchLength(batches: PieceBatch[]) {
  return batches.reduce((s, b) => s + b.lengthM * b.quantity, 0)
}

function totalBatchPieces(batches: PieceBatch[]) {
  return batches.reduce((s, b) => s + b.quantity, 0)
}

// ── Main component ────────────────────────────────────────────────────────────

export default function OpeningStockForm({ id }: Props) {
  const router = useRouter()
  const isNew = !id

  const [entry, setEntry] = useState<OpeningStockDetail | null>(null)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const [entryDate, setEntryDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [remarks, setRemarks] = useState('')
  const [activeTab, setActiveTab] = useState<'rm' | 'comp'>('rm')

  const [rmLines, setRmLines] = useState<RMLine[]>([newRM()])
  const [compLines, setCompLines] = useState<CompLine[]>([newComp()])

  const [materials, setMaterials] = useState<MaterialResponse[]>([])
  const [components, setComponents] = useState<ComponentResponse[]>([])
  const [warehouses, setWarehouses] = useState<WarehouseResponse[]>([])
  const [openCombobox, setOpenCombobox] = useState<string | null>(null)
  const [openCompCombo, setOpenCompCombo] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      materialService.getAll(),
      componentService.getAll(),
      warehouseService.getAll(),
    ]).then(([mats, comps, whs]) => {
      setMaterials(mats)
      setComponents(comps)
      setWarehouses(whs.filter(w => w.isActive))
    }).catch(() => toast.error('Failed to load master data'))
  }, [])

  // Load existing entry for edit
  useEffect(() => {
    if (!id) return
    setLoading(true)
    openingStockService.getById(id)
      .then(data => {
        setEntry(data)
        setEntryDate(data.entryDate.split('T')[0])
        setRemarks(data.remarks ?? '')

        // Rebuild RM lines — group items by materialId + grade + diameter
        const rmItems = data.items.filter(i => i.itemType === 'RawMaterial')
        if (rmItems.length > 0) {
          const lines: RMLine[] = rmItems.map(item => {
            const calc = { lengthM: 0, wpm: 0 }
            return {
              id: `rm-${item.id}`,
              materialId: item.materialId?.toString() ?? '',
              materialName: item.materialName ?? '',
              grade: item.grade ?? '',
              materialType: ((item.materialType ?? '').toLowerCase() === 'pipe' ? 'pipe' : 'rod') as 'rod' | 'pipe',
              diameter: item.diameter ?? 0,
              outerDiameter: item.outerDiameter ?? item.diameter ?? 0,
              innerDiameter: item.innerDiameter ?? 0,
              materialDensity: item.materialDensity ?? 7.85,
              totalWeightKG: item.totalWeightKG ?? 0,
              calculatedLengthM: (item.calculatedLengthMM ?? 0) / 1000,
              weightPerMeterKG: item.weightPerMeterKG ?? calc.wpm,
              warehouseId: item.warehouseId?.toString() ?? '',
              unitCost: item.unitCost ?? 0,
              batches: item.numberOfPieces && item.lengthPerPieceMM
                ? [{ id: `batch-${item.id}`, lengthM: item.lengthPerPieceMM / 1000, quantity: item.numberOfPieces }]
                : [],
            }
          })
          setRmLines(lines)
        }

        const compItems = data.items.filter(i => i.itemType === 'Component')
        if (compItems.length > 0) {
          setCompLines(compItems.map(item => ({
            id: `comp-${item.id}`,
            componentId: item.componentId?.toString() ?? '',
            componentName: item.componentName ?? '',
            partNumber: item.partNumber ?? '',
            uom: item.uom ?? 'PCS',
            quantity: item.quantity ?? 0,
            unitCost: item.unitCost ?? 0,
            remarks: item.remarks ?? '',
            warehouseId: item.warehouseId?.toString() ?? '',
          })))
        }
      })
      .catch(() => toast.error('Failed to load entry'))
      .finally(() => setLoading(false))
  }, [id])

  const isReadonly = entry?.status === 'Confirmed'

  // ── RM helpers ─────────────────────────────────────────────────────────────

  const updateRM = (lineId: string, patch: Partial<RMLine>) => {
    setRmLines(prev => prev.map(l => {
      if (l.id !== lineId) return l
      const updated = { ...l, ...patch }
      const { lengthM, wpm } = calcLength(updated)
      return { ...updated, calculatedLengthM: lengthM, weightPerMeterKG: wpm }
    }))
  }

  const selectMaterial = (lineId: string, mat: MaterialResponse) => {
    const shape = (mat.shape ?? '').toLowerCase()
    const mtype: 'rod' | 'pipe' = shape === 'pipe' ? 'pipe' : 'rod'
    const patch: Partial<RMLine> = {
      materialId: mat.id.toString(),
      materialName: mat.materialName,
      grade: mat.grade,
      materialType: mtype,
      diameter: mat.diameter ?? 0,
      outerDiameter: mat.diameter ?? 0,
      innerDiameter: mat.innerDiameter ?? 0,
      materialDensity: mat.density > 0 ? mat.density : 7.85,
    }
    updateRM(lineId, patch)
    setOpenCombobox(null)
  }

  const addBatch = (lineId: string) =>
    setRmLines(prev => prev.map(l => l.id === lineId
      ? { ...l, batches: [...l.batches, { id: `b-${Date.now()}`, lengthM: 0, quantity: 1 }] }
      : l))

  const removeBatch = (lineId: string, batchId: string) =>
    setRmLines(prev => prev.map(l => l.id === lineId
      ? { ...l, batches: l.batches.filter(b => b.id !== batchId) }
      : l))

  const updateBatch = (lineId: string, batchId: string, field: 'lengthM' | 'quantity', val: number) =>
    setRmLines(prev => prev.map(l => l.id === lineId
      ? { ...l, batches: l.batches.map(b => b.id === batchId ? { ...b, [field]: val } : b) }
      : l))

  // ── Comp helpers ───────────────────────────────────────────────────────────

  const updateComp = (lineId: string, patch: Partial<CompLine>) =>
    setCompLines(prev => prev.map(l => l.id === lineId ? { ...l, ...patch } : l))

  const selectComponent = (lineId: string, comp: ComponentResponse) => {
    updateComp(lineId, {
      componentId: comp.id.toString(),
      componentName: comp.componentName,
      partNumber: comp.partNumber,
      uom: comp.unit,
    })
    setOpenCompCombo(null)
  }

  // ── Build request ──────────────────────────────────────────────────────────

  const buildRequest = (): CreateOpeningStockRequest => {
    const items: CreateOpeningStockRequest['items'] = []
    let seq = 0

    for (const line of rmLines) {
      if (!line.materialId) continue
      if (line.batches.length === 0) {
        // No batches — one item with all pieces at average length
        seq++
        items.push({
          sequenceNo: seq,
          itemType: 'RawMaterial',
          materialId: parseInt(line.materialId),
          materialName: line.materialName,
          grade: line.grade,
          materialType: line.materialType === 'rod' ? 'Rod' : 'Pipe',
          diameter: line.materialType === 'rod' ? line.diameter : undefined,
          outerDiameter: line.materialType === 'pipe' ? line.outerDiameter : undefined,
          innerDiameter: line.materialType === 'pipe' ? line.innerDiameter : undefined,
          materialDensity: line.materialDensity,
          totalWeightKG: line.totalWeightKG,
          numberOfPieces: 1,
          lengthPerPieceMM: line.calculatedLengthM * 1000,
          warehouseId: line.warehouseId ? parseInt(line.warehouseId) : undefined,
          unitCost: line.unitCost || undefined,
        })
      } else {
        // One item per batch
        const totalBatchLen = line.batches.reduce((s, b) => s + b.lengthM * b.quantity, 0)
        for (const batch of line.batches) {
          seq++
          const batchLengthM = batch.lengthM * batch.quantity
          const batchWeight = totalBatchLen > 0
            ? (batchLengthM / totalBatchLen) * line.totalWeightKG
            : line.totalWeightKG / line.batches.length
          items.push({
            sequenceNo: seq,
            itemType: 'RawMaterial',
            materialId: parseInt(line.materialId),
            materialName: line.materialName,
            grade: line.grade,
            materialType: line.materialType === 'rod' ? 'Rod' : 'Pipe',
            diameter: line.materialType === 'rod' ? line.diameter : undefined,
            outerDiameter: line.materialType === 'pipe' ? line.outerDiameter : undefined,
            innerDiameter: line.materialType === 'pipe' ? line.innerDiameter : undefined,
            materialDensity: line.materialDensity,
            totalWeightKG: batchWeight,
            numberOfPieces: batch.quantity,
            lengthPerPieceMM: batch.lengthM * 1000,
            warehouseId: line.warehouseId ? parseInt(line.warehouseId) : undefined,
            unitCost: line.unitCost || undefined,
          })
        }
      }
    }

    for (const comp of compLines) {
      if (!comp.componentId) continue
      seq++
      items.push({
        sequenceNo: seq,
        itemType: 'Component',
        componentId: parseInt(comp.componentId),
        componentName: comp.componentName,
        partNumber: comp.partNumber,
        quantity: comp.quantity,
        uom: comp.uom,
        unitCost: comp.unitCost || undefined,
        remarks: comp.remarks || undefined,
        warehouseId: comp.warehouseId ? parseInt(comp.warehouseId) : undefined,
      })
    }

    return { entryDate, remarks: remarks || undefined, items }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (isNew) {
        const result = await openingStockService.create(buildRequest())
        toast.success(`Draft ${result.entryNo} saved`)
        router.push(`/stores/opening-stock/${result.id}`)
      } else {
        await openingStockService.update(id!, buildRequest())
        toast.success('Draft updated')
        const data = await openingStockService.getById(id!)
        setEntry(data)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleConfirm = async () => {
    if (!id) return
    if (!confirm('Confirm this entry? This will add all items to inventory and cannot be undone.')) return
    setConfirming(true)
    try {
      await openingStockService.confirm(id, {})
      toast.success('Opening stock confirmed — inventory updated')
      router.push('/stores/opening-stock')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to confirm')
    } finally {
      setConfirming(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading…</div>

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/stores/opening-stock')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isNew ? 'New Opening Stock Entry' : entry?.entryNo ?? 'Opening Stock Entry'}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {isNew ? 'Add existing inventory without a purchase order'
                : `Created ${format(new Date(entry!.createdAt), 'dd MMM yyyy')}`}
            </p>
          </div>
        </div>
        {entry && (
          <Badge className={entry.status === 'Confirmed'
            ? 'bg-green-100 text-green-700 border-green-200'
            : 'bg-yellow-100 text-yellow-700 border-yellow-200'}>
            {entry.status}
          </Badge>
        )}
      </div>

      {/* Entry header fields */}
      <Card className="border-2 border-border">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Entry Date</Label>
              <Input type="date" value={entryDate}
                onChange={e => setEntryDate(e.target.value)} disabled={isReadonly} />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs text-muted-foreground mb-1 block">Remarks (optional)</Label>
              <Input placeholder="e.g. Initial stock take Feb 2026" value={remarks}
                onChange={e => setRemarks(e.target.value)} disabled={isReadonly} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        {(['rm', 'comp'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab
              ? 'bg-background shadow text-foreground'
              : 'text-muted-foreground hover:text-foreground'}`}>
            {tab === 'rm' ? <Package className="h-4 w-4" /> : <Layers className="h-4 w-4" />}
            {tab === 'rm' ? 'Raw Materials' : 'Components'}
            <span className="text-xs bg-muted-foreground/20 rounded-full px-1.5 py-0.5">
              {tab === 'rm' ? rmLines.filter(l => l.materialId).length : compLines.filter(l => l.componentId).length}
            </span>
          </button>
        ))}
      </div>

      {/* ── RAW MATERIALS ──────────────────────────────────────────────────────── */}
      {activeTab === 'rm' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Raw Materials</h3>
            {!isReadonly && (
              <Button variant="outline" size="sm" onClick={() => setRmLines(p => [...p, newRM()])}>
                <Plus className="mr-1.5 h-4 w-4" /> Add Material
              </Button>
            )}
          </div>

          {rmLines.map((line, lineIdx) => {
            const batLen = totalBatchLength(line.batches)
            const batPcs = totalBatchPieces(line.batches)
            const lenMatch = line.batches.length > 0 && Math.abs(batLen - line.calculatedLengthM) < 0.05

            return (
              <Card key={line.id} className="border-2 border-border">
                <CardContent className="p-5 space-y-5">
                  {/* Card header */}
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">Material #{lineIdx + 1}</Badge>
                    {!isReadonly && rmLines.length > 1 && (
                      <Button variant="ghost" size="sm"
                        onClick={() => setRmLines(p => p.filter(l => l.id !== line.id))}
                        className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Row 1: Material + Weight + Warehouse */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Material combobox */}
                    <div className="space-y-2">
                      <Label>Select Material *</Label>
                      {isReadonly ? (
                        <div className="py-1">
                          <p className="font-medium">{line.materialName}</p>
                          <p className="text-xs text-muted-foreground">{line.grade} · {line.materialType === 'rod' ? 'Rod' : 'Pipe'} · ∅{line.diameter}mm</p>
                        </div>
                      ) : (
                        <Popover open={openCombobox === line.id} onOpenChange={o => setOpenCombobox(o ? line.id : null)}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox"
                              className="w-full justify-between font-normal"
                              aria-expanded={openCombobox === line.id}>
                              {line.materialName || 'Choose material…'}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[400px] p-0">
                            <Command>
                              <CommandInput placeholder="Search material…" />
                              <CommandList>
                                <CommandEmpty>No material found.</CommandEmpty>
                                <CommandGroup>
                                  {materials.map(mat => (
                                    <CommandItem key={mat.id}
                                      value={`${mat.materialName} ${mat.grade} ${mat.diameter}`}
                                      onSelect={() => selectMaterial(line.id, mat)}>
                                      <Check className={cn('mr-2 h-4 w-4', line.materialId === mat.id.toString() ? 'opacity-100' : 'opacity-0')} />
                                      <div>
                                        <p className="font-medium">{mat.materialName}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {mat.grade} | {mat.shape || mat.materialType} | ∅{mat.diameter}mm
                                        </p>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>

                    {/* Total weight */}
                    <div className="space-y-2">
                      <Label>Total Weight (kg) *</Label>
                      <Input type="number" step="0.01" min={0}
                        placeholder="Enter total weight"
                        value={line.totalWeightKG || ''}
                        onChange={e => updateRM(line.id, { totalWeightKG: parseFloat(e.target.value) || 0 })}
                        disabled={isReadonly} />
                    </div>

                    {/* Warehouse */}
                    <div className="space-y-2">
                      <Label>Warehouse / Rack</Label>
                      {isReadonly ? (
                        <p className="py-1 text-sm">{warehouses.find(w => w.id.toString() === line.warehouseId)?.name ?? '—'}</p>
                      ) : (
                        <Select value={line.warehouseId} onValueChange={v => updateRM(line.id, { warehouseId: v })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select warehouse…" />
                          </SelectTrigger>
                          <SelectContent>
                            {warehouses.filter(w => w.materialType !== 'Component').map(wh => (
                              <SelectItem key={wh.id} value={wh.id.toString()}>
                                {wh.name} — {wh.rack}/{wh.rackNo}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Weight-to-Length Calculator */}
                  <div className="bg-muted/50 rounded-lg border p-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded bg-blue-600 flex items-center justify-center text-white text-xs">⚖</div>
                      <span className="font-semibold text-sm">Weight → Length Calculator</span>
                    </div>

                    {/* Material Type — auto-filled from master, read-only */}
                    <div className="space-y-2">
                      <Label className="text-xs">Material Type</Label>
                      {line.materialId ? (
                        <div className="flex items-center gap-2 h-9">
                          <Badge variant="outline" className="text-sm px-3 py-1">
                            {line.materialType === 'pipe' ? 'Pipe (Hollow)' : 'Rod (Solid)'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">Auto-set from master</span>
                        </div>
                      ) : (
                        <div className="h-9 flex items-center">
                          <span className="text-sm text-muted-foreground">Select material above to auto-set</span>
                        </div>
                      )}
                    </div>

                    {/* Dimensions — all auto-filled from master, read-only */}
                    {line.materialId ? (
                      <div className="grid grid-cols-3 gap-4">
                        {line.materialType === 'rod' ? (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Diameter</p>
                            <p className="font-semibold">{line.diameter} mm</p>
                          </div>
                        ) : (
                          <>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">OD</p>
                              <p className="font-semibold">{line.outerDiameter} mm</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">ID</p>
                              <p className="font-semibold">{line.innerDiameter} mm</p>
                            </div>
                          </>
                        )}
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Density</p>
                          <p className="font-semibold">{line.materialDensity} g/cm³</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Select material above — dimensions will appear here.</p>
                    )}

                    {/* Calculated results */}
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                      <div>
                        <p className="text-xs text-muted-foreground">Weight per Meter</p>
                        <p className="text-lg font-semibold">
                          {line.weightPerMeterKG > 0 ? `${line.weightPerMeterKG.toFixed(3)} kg/m` : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total Length</p>
                        <p className="text-lg font-semibold text-blue-600">
                          {line.calculatedLengthM > 0 ? `${line.calculatedLengthM.toFixed(2)} m` : '0.00 m'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Piece Breakdown */}
                  {line.calculatedLengthM > 0 && (
                    <div className="space-y-3 border-t pt-4">
                      <div className="flex items-center justify-between">
                        <Label>Piece Breakdown ({line.materialType === 'rod' ? 'Rods' : 'Pipes'})</Label>
                        {!isReadonly && (
                          <Button type="button" variant="outline" size="sm" onClick={() => addBatch(line.id)}>
                            <Plus className="mr-1.5 h-3 w-3" /> Add Batch
                          </Button>
                        )}
                      </div>

                      {line.batches.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-2">
                          Click "Add Batch" to specify piece lengths. Example: 6m × 5 pieces = 30m
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {line.batches.map((batch, bi) => (
                            <div key={batch.id} className="flex items-center gap-3">
                              <span className="text-sm text-muted-foreground w-16 shrink-0">Batch {bi + 1}:</span>
                              <Input type="number" step="0.1" min={0}
                                placeholder="Length (m)"
                                value={batch.lengthM || ''}
                                onChange={e => updateBatch(line.id, batch.id, 'lengthM', parseFloat(e.target.value) || 0)}
                                disabled={isReadonly}
                                className="w-28" />
                              <span className="text-sm text-muted-foreground">m ×</span>
                              <Input type="number" min={1} step={1}
                                placeholder="Qty"
                                value={batch.quantity || ''}
                                onChange={e => updateBatch(line.id, batch.id, 'quantity', parseInt(e.target.value) || 1)}
                                disabled={isReadonly}
                                className="w-20" />
                              <span className="text-sm text-muted-foreground">pcs</span>
                              <span className={`text-sm font-semibold w-24 ${batch.lengthM > 0 ? 'text-blue-600' : 'text-muted-foreground'}`}>
                                = {(batch.lengthM * batch.quantity).toFixed(2)}m
                              </span>
                              {!isReadonly && (
                                <Button variant="ghost" size="sm"
                                  onClick={() => removeBatch(line.id, batch.id)}
                                  className="text-destructive hover:text-destructive p-1 h-7 w-7">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          ))}

                          {/* Totals */}
                          <div className="pt-2 border-t space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="font-medium">Total Pieces:</span>
                              <span className="font-semibold">{batPcs} pcs</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Total Length:</span>
                              <span className={`font-semibold ${lenMatch ? 'text-green-600' : 'text-amber-600'}`}>
                                {batLen.toFixed(2)} m
                                {lenMatch ? ' ✓' : ''}
                              </span>
                            </div>
                          </div>

                          {/* Mismatch warning */}
                          {line.batches.length > 0 && !lenMatch && (
                            <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-sm space-y-1">
                              <p className="font-semibold text-amber-800">⚠ Length mismatch</p>
                              <p className="text-amber-700">
                                Your batches total <strong>{batLen.toFixed(2)} m</strong> but the weight-calculated
                                length is <strong>{line.calculatedLengthM.toFixed(2)} m</strong>{' '}
                                (difference: {Math.abs(batLen - line.calculatedLengthM).toFixed(2)} m).
                              </p>
                              <p className="text-amber-700">
                                The <strong>{line.totalWeightKG} kg</strong> will be distributed proportionally
                                across your actual batch lengths — total weight in inventory will still
                                be exactly <strong>{line.totalWeightKG} kg</strong>.
                              </p>
                              <p className="text-amber-600 text-xs">
                                Tip: adjust your batch lengths to add up to{' '}
                                <strong>{line.calculatedLengthM.toFixed(2)} m</strong> to eliminate this warning.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Unit Cost */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t pt-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Unit Cost (₹/kg, optional)</Label>
                      <Input type="number" step="0.01" min={0}
                        value={line.unitCost || ''}
                        onChange={e => updateRM(line.id, { unitCost: parseFloat(e.target.value) || 0 })}
                        disabled={isReadonly} placeholder="0.00" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {!isReadonly && (
            <button onClick={() => setRmLines(p => [...p, newRM()])}
              className="w-full border-2 border-dashed border-border rounded-lg py-4 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2">
              <Plus className="h-4 w-4" /> Add Another Material
            </button>
          )}
        </div>
      )}

      {/* ── COMPONENTS ────────────────────────────────────────────────────────── */}
      {activeTab === 'comp' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Components</h3>
            {!isReadonly && (
              <Button variant="outline" size="sm" onClick={() => setCompLines(p => [...p, newComp()])}>
                <Plus className="mr-1.5 h-4 w-4" /> Add Component
              </Button>
            )}
          </div>

          {compLines.map((line, idx) => (
            <Card key={line.id} className="border-2 border-border">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Component #{idx + 1}</Badge>
                  {!isReadonly && compLines.length > 1 && (
                    <Button variant="ghost" size="sm"
                      onClick={() => setCompLines(p => p.filter(l => l.id !== line.id))}
                      className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {/* Component combobox */}
                  <div className="space-y-2">
                    <Label>Select Component *</Label>
                    {isReadonly ? (
                      <div className="py-1">
                        <p className="font-medium">{line.componentName}</p>
                        <p className="text-xs text-muted-foreground">{line.partNumber} · {line.uom}</p>
                      </div>
                    ) : (
                      <Popover open={openCompCombo === line.id} onOpenChange={o => setOpenCompCombo(o ? line.id : null)}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                            {line.componentName || 'Choose component…'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0">
                          <Command>
                            <CommandInput placeholder="Search component…" />
                            <CommandList>
                              <CommandEmpty>No component found.</CommandEmpty>
                              <CommandGroup>
                                {components.map(comp => (
                                  <CommandItem key={comp.id}
                                    value={`${comp.componentName} ${comp.partNumber}`}
                                    onSelect={() => selectComponent(line.id, comp)}>
                                    <Check className={cn('mr-2 h-4 w-4', line.componentId === comp.id.toString() ? 'opacity-100' : 'opacity-0')} />
                                    <div>
                                      <p className="font-medium">{comp.componentName}</p>
                                      <p className="text-xs text-muted-foreground">{comp.partNumber} · {comp.unit}</p>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    )}
                    {line.componentId && (
                      <div className="flex gap-2 flex-wrap mt-1">
                        <Badge variant="outline" className="text-xs">{line.partNumber}</Badge>
                        <Badge variant="outline" className="text-xs">{line.uom}</Badge>
                      </div>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="space-y-2">
                    <Label>Quantity ({line.uom}) *</Label>
                    <Input type="number" min={0} step="1"
                      placeholder="0"
                      value={line.quantity || ''}
                      onChange={e => updateComp(line.id, { quantity: parseFloat(e.target.value) || 0 })}
                      disabled={isReadonly} />
                  </div>

                  {/* Unit cost */}
                  <div className="space-y-2">
                    <Label>Unit Cost (₹, optional)</Label>
                    <Input type="number" min={0} step="0.01"
                      placeholder="0.00"
                      value={line.unitCost || ''}
                      onChange={e => updateComp(line.id, { unitCost: parseFloat(e.target.value) || 0 })}
                      disabled={isReadonly} />
                  </div>

                  {/* Warehouse */}
                  <div className="space-y-2">
                    <Label>Warehouse / Rack</Label>
                    {isReadonly ? (
                      <p className="py-1 text-sm">{warehouses.find(w => w.id.toString() === line.warehouseId)?.name ?? '—'}</p>
                    ) : (
                      <Select value={line.warehouseId} onValueChange={v => updateComp(line.id, { warehouseId: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select warehouse…" />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses.filter(w => w.materialType === 'Component').map(wh => (
                            <SelectItem key={wh.id} value={wh.id.toString()}>
                              {wh.name} — {wh.rack}/{wh.rackNo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Remarks (optional)</Label>
                  <Input placeholder="Any notes…" value={line.remarks}
                    onChange={e => updateComp(line.id, { remarks: e.target.value })}
                    disabled={isReadonly} />
                </div>
              </CardContent>
            </Card>
          ))}

          {!isReadonly && (
            <button onClick={() => setCompLines(p => [...p, newComp()])}
              className="w-full border-2 border-dashed border-border rounded-lg py-4 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2">
              <Plus className="h-4 w-4" /> Add Another Component
            </button>
          )}
        </div>
      )}

      {/* Confirmed banner */}
      {entry?.status === 'Confirmed' && (
        <Card className="border-2 border-green-200 bg-green-50">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
            <div>
              <p className="font-semibold text-green-800">Stock Added to Inventory</p>
              <p className="text-sm text-green-700">
                {entry.totalPieces} raw material piece(s) and {entry.totalComponents} component line(s) added.
                {entry.confirmedAt && ` Confirmed on ${format(new Date(entry.confirmedAt), 'dd MMM yyyy')}.`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sticky action bar */}
      {!isReadonly && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg py-3 px-6 flex justify-end gap-3 z-40">
          <Button variant="outline" onClick={() => router.push('/stores/opening-stock')}>Cancel</Button>
          <Button variant="outline" onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving…' : 'Save Draft'}
          </Button>
          {!isNew && entry?.status === 'Draft' && (
            <Button onClick={handleConfirm} disabled={confirming}
              className="bg-green-600 hover:bg-green-700 text-white">
              <CheckCircle className="mr-2 h-4 w-4" />
              {confirming ? 'Confirming…' : 'Confirm & Add to Stock'}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
