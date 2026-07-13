"use client"
import { getCurrentUserName } from '@/lib/auth'

import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, Warehouse, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  warehouseService,
  WarehouseResponse,
  LowStockAlertResponse,
  CreateWarehouseRequest,
  UpdateWarehouseRequest,
} from '@/lib/api/warehouses'

const MATERIAL_TYPES = [
  { value: 'RawMaterial', label: 'Raw Material' },
  { value: 'Component',   label: 'Component' },
]

const materialTypeLabel = (type: string) =>
  MATERIAL_TYPES.find(t => t.value === type)?.label ?? type

const materialTypeBadge = (type: string): 'default' | 'secondary' =>
  type === 'RawMaterial' ? 'default' : 'secondary'

const emptyForm = (): CreateWarehouseRequest => ({
  name: '',
  rack: '',
  rackNo: '',
  materialType: 'RawMaterial',
  minStockPieces: 0,
  minStockLengthMM: 0,
  createdBy: getCurrentUserName(),
})

export default function WarehousesPage() {
  const [warehouses, setWarehouses]               = useState<WarehouseResponse[]>([])
  const [lowStockAlerts, setLowStockAlerts]       = useState<LowStockAlertResponse[]>([])
  const [alertsExpanded, setAlertsExpanded]       = useState(true)
  const [loading, setLoading]                     = useState(true)
  const [searchQuery, setSearchQuery]             = useState('')
  const [filterType, setFilterType]               = useState<string>('all')
  const [dialogOpen, setDialogOpen]               = useState(false)
  const [editing, setEditing]                     = useState<WarehouseResponse | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen]   = useState(false)
  const [toDelete, setToDelete]                   = useState<WarehouseResponse | null>(null)
  const [formData, setFormData]                   = useState<CreateWarehouseRequest>(emptyForm())
  const [isActiveEdit, setIsActiveEdit]           = useState(true)
  const [saving, setSaving]                       = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const [ws, alerts] = await Promise.all([
        warehouseService.getAll(),
        warehouseService.getLowStockStatus(),
      ])
      setWarehouses(ws)
      setLowStockAlerts(alerts)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load warehouses')
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditing(null)
    setFormData(emptyForm())
    setIsActiveEdit(true)
    setDialogOpen(true)
  }

  const openEdit = (w: WarehouseResponse) => {
    setEditing(w)
    setFormData({
      name: w.name,
      rack: w.rack,
      rackNo: w.rackNo,
      materialType: w.materialType,
      minStockPieces: w.minStockPieces,
      minStockLengthMM: w.minStockLengthMM,
      createdBy: getCurrentUserName(),
    })
    setIsActiveEdit(w.isActive)
    setDialogOpen(true)
  }

  const openDelete = (w: WarehouseResponse) => {
    setToDelete(w)
    setDeleteDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        const req: UpdateWarehouseRequest = {
          id: editing.id,
          name: formData.name,
          rack: formData.rack,
          rackNo: formData.rackNo,
          materialType: formData.materialType,
          minStockPieces: formData.minStockPieces,
          minStockLengthMM: formData.minStockLengthMM,
          isActive: isActiveEdit,
          updatedBy: getCurrentUserName(),
        }
        await warehouseService.update(editing.id, req)
        toast.success('Warehouse updated successfully')
      } else {
        await warehouseService.create(formData)
        toast.success('Warehouse created successfully')
      }
      setDialogOpen(false)
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save warehouse')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!toDelete) return
    try {
      await warehouseService.delete(toDelete.id)
      toast.success('Warehouse deleted successfully')
      setDeleteDialogOpen(false)
      setToDelete(null)
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete warehouse')
    }
  }

  const filtered = warehouses.filter(w => {
    const matchSearch =
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.rack.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.rackNo.toLowerCase().includes(searchQuery.toLowerCase())
    const matchType = filterType === 'all' || w.materialType === filterType
    return matchSearch && matchType
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Warehouse className="h-7 w-7 text-muted-foreground" />
          <h1 className="text-3xl font-bold">Warehouses</h1>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Warehouse
        </Button>
      </div>

      {/* Low Stock Alert Banner */}
      {lowStockAlerts.filter(a => a.isAlert).length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <button
            className="w-full flex items-center justify-between px-4 py-3 text-left"
            onClick={() => setAlertsExpanded(prev => !prev)}
          >
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>
                Low Stock Warning — {lowStockAlerts.filter(a => a.isAlert).length} rack(s) below minimum threshold
              </span>
            </div>
            {alertsExpanded
              ? <ChevronUp className="h-4 w-4 text-amber-600" />
              : <ChevronDown className="h-4 w-4 text-amber-600" />
            }
          </button>

          {alertsExpanded && (
            <div className="px-4 pb-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-amber-700 dark:text-amber-400 border-b border-amber-200 dark:border-amber-800">
                      <th className="text-left pb-2 pr-4 font-medium">Warehouse</th>
                      <th className="text-left pb-2 pr-4 font-medium">Rack</th>
                      <th className="text-right pb-2 pr-4 font-medium">Pieces</th>
                      <th className="text-right pb-2 pr-4 font-medium">Min Pieces</th>
                      <th className="text-right pb-2 pr-4 font-medium">Length (m)</th>
                      <th className="text-right pb-2 font-medium">Min Length (m)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockAlerts.filter(a => a.isAlert).map(a => (
                      <tr key={a.warehouseId} className="border-b border-amber-100 dark:border-amber-900/50 last:border-0">
                        <td className="py-1.5 pr-4 text-foreground">{a.warehouseName}</td>
                        <td className="py-1.5 pr-4 text-muted-foreground font-mono text-xs">{a.rack} {a.rackNo}</td>
                        <td className={`py-1.5 pr-4 text-right font-mono ${a.piecesAlert ? 'text-red-600 font-bold' : 'text-foreground'}`}>
                          {a.currentPieces}
                        </td>
                        <td className="py-1.5 pr-4 text-right font-mono text-muted-foreground">{a.minStockPieces}</td>
                        <td className={`py-1.5 pr-4 text-right font-mono ${a.lengthAlert ? 'text-red-600 font-bold' : 'text-foreground'}`}>
                          {(a.currentLengthMM / 1000).toFixed(2)}
                        </td>
                        <td className="py-1.5 text-right font-mono text-muted-foreground">
                          {(a.minStockLengthMM / 1000).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-2xl">{warehouses.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {warehouses.filter(w => w.isActive).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Raw Material</CardDescription>
            <CardTitle className="text-2xl text-blue-600">
              {warehouses.filter(w => w.materialType === 'RawMaterial').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Low Stock Racks</CardDescription>
            <CardTitle className={`text-2xl ${lowStockAlerts.filter(a => a.isAlert).length > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              {lowStockAlerts.filter(a => a.isAlert).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                placeholder="Search by name, rack..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="RawMaterial">Raw Material</SelectItem>
                <SelectItem value="Component">Component</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Rack</TableHead>
                  <TableHead>Rack No</TableHead>
                  <TableHead>Material Type</TableHead>
                  <TableHead className="text-right">Min Pieces</TableHead>
                  <TableHead className="text-right">Min Length (m)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                      No warehouses found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(w => (
                    <TableRow key={w.id}>
                      <TableCell className="font-medium">{w.name}</TableCell>
                      <TableCell>{w.rack}</TableCell>
                      <TableCell className="font-mono text-sm">{w.rackNo}</TableCell>
                      <TableCell>
                        <Badge variant={materialTypeBadge(w.materialType)}>
                          {materialTypeLabel(w.materialType)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">{w.minStockPieces}</TableCell>
                      <TableCell className="text-right font-mono">
                        {(w.minStockLengthMM / 1000).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={w.isActive ? 'default' : 'destructive'}>
                          {w.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(w)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openDelete(w)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Warehouse' : 'Add Warehouse'}</DialogTitle>
              <DialogDescription>
                {editing ? 'Update the warehouse/rack details.' : 'Add a new warehouse rack location.'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Name */}
              <div className="grid gap-1.5">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Main Warehouse, Store Room A"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              {/* Rack + Rack No */}
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="rack">Rack *</Label>
                  <Input
                    id="rack"
                    placeholder="e.g., Rack A"
                    value={formData.rack}
                    onChange={e => setFormData({ ...formData, rack: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="rackNo">Rack No *</Label>
                  <Input
                    id="rackNo"
                    placeholder="e.g., R-01"
                    value={formData.rackNo}
                    onChange={e => setFormData({ ...formData, rackNo: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Material Type */}
              <div className="grid gap-1.5">
                <Label>Material Type *</Label>
                <Select
                  value={formData.materialType}
                  onValueChange={v => setFormData({ ...formData, materialType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MATERIAL_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Min Stock — two fields side by side */}
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="minStockPieces">Min Stock (pieces)</Label>
                  <Input
                    id="minStockPieces"
                    type="number"
                    min={0}
                    step="1"
                    placeholder="0"
                    value={formData.minStockPieces}
                    onChange={e => setFormData({ ...formData, minStockPieces: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="minStockLengthMM">Min Stock Length (mm)</Label>
                  <Input
                    id="minStockLengthMM"
                    type="number"
                    min={0}
                    step="1"
                    placeholder="0"
                    value={formData.minStockLengthMM}
                    onChange={e => setFormData({ ...formData, minStockLengthMM: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* IsActive (edit only) */}
              {editing && (
                <div className="flex items-center gap-3">
                  <input
                    id="isActive"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300"
                    checked={isActiveEdit}
                    onChange={e => setIsActiveEdit(e.target.checked)}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Warehouse?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{toDelete?.name}</strong> — {toDelete?.rack} / {toDelete?.rackNo}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
