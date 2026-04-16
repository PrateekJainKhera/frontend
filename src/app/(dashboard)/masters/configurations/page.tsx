"use client"

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { rollerTypeService, RollerTypeResponse } from '@/lib/api/roller-types'
import { machineModelService } from '@/lib/api/machine-models'
import { MachineModel } from '@/types/machine-model'
import { processCategoryService } from '@/lib/api/process-categories'
import { ProcessCategory } from '@/types/process-category'
import { childPartTypeService, ChildPartTypeResponse } from '@/lib/api/child-part-types'
import { materialTypeService, MaterialTypeResponse } from '@/lib/api/material-types'

interface GenericItem {
  id: number
  name: string
  isActive: boolean
}

// ─── Inline edit row ──────────────────────────────────────────────────────────
function EditableRow({ item, onSave, onCancel }: {
  item: GenericItem
  onSave: (name: string, isActive: boolean) => Promise<void>
  onCancel: () => void
}) {
  const [name, setName] = useState(item.name)
  const [isActive, setIsActive] = useState(item.isActive)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Name is required'); return }
    setSaving(true)
    try { await onSave(name.trim(), isActive) } finally { setSaving(false) }
  }

  return (
    <tr className="border-b bg-muted/30">
      <td className="px-4 py-2">
        <Input value={name} onChange={e => setName(e.target.value)} className="h-8 text-sm" autoFocus
          onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onCancel() }} />
      </td>
      <td className="px-4 py-2">
        <Switch checked={isActive} onCheckedChange={setIsActive} />
      </td>
      <td className="px-4 py-2 text-right">
        <div className="flex justify-end gap-1">
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSave} disabled={saving}>
            <Check className="h-4 w-4 text-green-600" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onCancel}>
            <X className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </td>
    </tr>
  )
}

// ─── Add row ──────────────────────────────────────────────────────────────────
function AddRow({ onAdd, onCancel }: { onAdd: (name: string) => Promise<void>; onCancel: () => void }) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const handleAdd = async () => {
    if (!name.trim()) { toast.error('Name is required'); return }
    setSaving(true)
    try { await onAdd(name.trim()) } finally { setSaving(false) }
  }

  return (
    <tr className="border-b bg-blue-50/50">
      <td className="px-4 py-2">
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Enter name..."
          className="h-8 text-sm" autoFocus
          onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') onCancel() }} />
      </td>
      <td className="px-4 py-2 text-sm text-muted-foreground">Active</td>
      <td className="px-4 py-2 text-right">
        <div className="flex justify-end gap-1">
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleAdd} disabled={saving}>
            <Check className="h-4 w-4 text-green-600" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onCancel}>
            <X className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </td>
    </tr>
  )
}

// ─── Master table ─────────────────────────────────────────────────────────────
function MasterTable({ items, loading, onAdd, onUpdate, onDelete }: {
  items: GenericItem[]
  loading: boolean
  onAdd: (name: string) => Promise<void>
  onUpdate: (id: number, name: string, isActive: boolean) => Promise<void>
  onDelete: (id: number, name: string) => Promise<void>
}) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [adding, setAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const handleAdd = async (name: string) => { await onAdd(name); setAdding(false) }
  const handleUpdate = async (id: number, name: string, isActive: boolean) => {
    await onUpdate(id, name, isActive); setEditingId(null)
  }
  const handleDelete = async (id: number, name: string) => {
    setDeletingId(id)
    try { await onDelete(id, name) } finally { setDeletingId(null) }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {loading ? '' : `${items.filter(i => i.isActive).length} active · ${items.length} total`}
        </p>
        <Button size="sm" onClick={() => { setAdding(true); setEditingId(null) }} disabled={adding}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add
        </Button>
      </div>

      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-2 text-right font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i} className="border-b">
                  <td colSpan={3} className="px-4 py-2"><Skeleton className="h-5 w-full" /></td>
                </tr>
              ))
            ) : items.length === 0 && !adding ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground text-sm">
                  No entries yet. Click Add to create one.
                </td>
              </tr>
            ) : (
              items.map(item =>
                editingId === item.id ? (
                  <EditableRow key={item.id} item={item}
                    onSave={(name, isActive) => handleUpdate(item.id, name, isActive)}
                    onCancel={() => setEditingId(null)} />
                ) : (
                  <tr key={item.id} className="border-b hover:bg-muted/20">
                    <td className="px-4 py-2 font-medium">{item.name}</td>
                    <td className="px-4 py-2">
                      <Badge variant={item.isActive ? 'default' : 'secondary'} className="text-xs">
                        {item.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7"
                          onClick={() => { setEditingId(item.id); setAdding(false) }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7"
                          onClick={() => handleDelete(item.id, item.name)}
                          disabled={deletingId === item.id}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              )
            )}
            {adding && <AddRow onAdd={handleAdd} onCancel={() => setAdding(false)} />}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ConfigurationsPage() {
  const [rollerTypes, setRollerTypes] = useState<GenericItem[]>([])
  const [machineModels, setMachineModels] = useState<GenericItem[]>([])
  const [processCategories, setProcessCategories] = useState<GenericItem[]>([])
  const [childPartTypes, setChildPartTypes] = useState<GenericItem[]>([])
  const [materialTypes, setMaterialTypes] = useState<GenericItem[]>([])
  const [loading, setLoading] = useState({
    rollerTypes: true, machineModels: true, processCategories: true,
    childPartTypes: true, materialTypes: true,
  })

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    const [rt, mm, pc, cpt, mt] = await Promise.allSettled([
      rollerTypeService.getAll(),
      machineModelService.getAll(),
      processCategoryService.getAll(),
      childPartTypeService.getAll(),
      materialTypeService.getAll(),
    ])
    if (rt.status === 'fulfilled')
      setRollerTypes(rt.value.map((r: RollerTypeResponse) => ({ id: r.id, name: r.typeName, isActive: r.isActive })))
    if (mm.status === 'fulfilled')
      setMachineModels(mm.value.map((m: MachineModel) => ({ id: m.id, name: m.modelName, isActive: m.isActive })))
    if (pc.status === 'fulfilled')
      setProcessCategories(pc.value.map((p: ProcessCategory) => ({ id: p.id, name: p.categoryName, isActive: p.isActive })))
    if (cpt.status === 'fulfilled')
      setChildPartTypes(cpt.value.map((c: ChildPartTypeResponse) => ({ id: c.id, name: c.typeName, isActive: c.isActive })))
    if (mt.status === 'fulfilled')
      setMaterialTypes(mt.value.map((m: MaterialTypeResponse) => ({ id: m.id, name: m.name, isActive: m.isActive })))
    setLoading({ rollerTypes: false, machineModels: false, processCategories: false, childPartTypes: false, materialTypes: false })
  }

  // Roller Types
  const addRollerType = async (name: string) => {
    await rollerTypeService.create({ typeName: name, createdBy: 'Admin' })
    toast.success(`Roller type '${name}' created`)
    const data = await rollerTypeService.getAll()
    setRollerTypes(data.map(r => ({ id: r.id, name: r.typeName, isActive: r.isActive })))
  }
  const updateRollerType = async (id: number, name: string, isActive: boolean) => {
    await rollerTypeService.update(id, { typeName: name, isActive })
    toast.success('Updated')
    setRollerTypes(prev => prev.map(r => r.id === id ? { ...r, name, isActive } : r))
  }
  const deleteRollerType = async (id: number, name: string) => {
    await rollerTypeService.delete(id)
    toast.success(`'${name}' deleted`)
    setRollerTypes(prev => prev.filter(r => r.id !== id))
  }

  // Machine Models
  const addMachineModel = async (name: string) => {
    await machineModelService.create({ modelName: name })
    toast.success(`Machine model '${name}' created`)
    const data = await machineModelService.getAll()
    setMachineModels(data.map(m => ({ id: m.id, name: m.modelName, isActive: m.isActive })))
  }
  const updateMachineModel = async (id: number, name: string, isActive: boolean) => {
    await machineModelService.update(id, { id, modelName: name, isActive })
    toast.success('Updated')
    setMachineModels(prev => prev.map(m => m.id === id ? { ...m, name, isActive } : m))
  }
  const deleteMachineModel = async (id: number, name: string) => {
    await machineModelService.delete(id)
    toast.success(`'${name}' deleted`)
    setMachineModels(prev => prev.filter(m => m.id !== id))
  }

  // Process Categories
  const addProcessCategory = async (name: string) => {
    await processCategoryService.create({ categoryName: name, createdBy: 'Admin' })
    toast.success(`Process category '${name}' created`)
    const data = await processCategoryService.getAll()
    setProcessCategories(data.map(p => ({ id: p.id, name: p.categoryName, isActive: p.isActive })))
  }
  const updateProcessCategory = async (id: number, name: string, isActive: boolean) => {
    await processCategoryService.update(id, { id, categoryName: name, isActive, updatedBy: 'Admin' })
    toast.success('Updated')
    setProcessCategories(prev => prev.map(p => p.id === id ? { ...p, name, isActive } : p))
  }
  const deleteProcessCategory = async (id: number, name: string) => {
    await processCategoryService.delete(id)
    toast.success(`'${name}' deleted`)
    setProcessCategories(prev => prev.filter(p => p.id !== id))
  }

  // Child Part Types
  const addChildPartType = async (name: string) => {
    await childPartTypeService.create({ typeName: name, createdBy: 'Admin' })
    toast.success(`Child part type '${name}' created`)
    const data = await childPartTypeService.getAll()
    setChildPartTypes(data.map(c => ({ id: c.id, name: c.typeName, isActive: c.isActive })))
  }
  const updateChildPartType = async (id: number, name: string, isActive: boolean) => {
    await childPartTypeService.update(id, { typeName: name, isActive })
    toast.success('Updated')
    setChildPartTypes(prev => prev.map(c => c.id === id ? { ...c, name, isActive } : c))
  }
  const deleteChildPartType = async (id: number, name: string) => {
    await childPartTypeService.delete(id)
    toast.success(`'${name}' deleted`)
    setChildPartTypes(prev => prev.filter(c => c.id !== id))
  }

  // Material Types
  const addMaterialType = async (name: string) => {
    await materialTypeService.create({ name })
    toast.success(`Material type '${name}' created`)
    const data = await materialTypeService.getAll()
    setMaterialTypes(data.map(m => ({ id: m.id, name: m.name, isActive: m.isActive })))
  }
  const updateMaterialType = async (id: number, name: string, isActive: boolean) => {
    await materialTypeService.update(id, { name, isActive })
    toast.success('Updated')
    setMaterialTypes(prev => prev.map(m => m.id === id ? { ...m, name, isActive } : m))
  }
  const deleteMaterialType = async (id: number, name: string) => {
    await materialTypeService.delete(id)
    toast.success(`'${name}' deleted`)
    setMaterialTypes(prev => prev.filter(m => m.id !== id))
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="roller-types" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-5">
          <TabsTrigger value="roller-types">Roller Types</TabsTrigger>
          <TabsTrigger value="machine-models">Machine Models</TabsTrigger>
          <TabsTrigger value="process-categories">Process Categories</TabsTrigger>
          <TabsTrigger value="child-part-types">Child Part Types</TabsTrigger>
          <TabsTrigger value="material-types">Material Types</TabsTrigger>
        </TabsList>

        <TabsContent value="roller-types" className="mt-4">
          <MasterTable items={rollerTypes} loading={loading.rollerTypes}
            onAdd={addRollerType} onUpdate={updateRollerType} onDelete={deleteRollerType} />
        </TabsContent>

        <TabsContent value="machine-models" className="mt-4">
          <MasterTable items={machineModels} loading={loading.machineModels}
            onAdd={addMachineModel} onUpdate={updateMachineModel} onDelete={deleteMachineModel} />
        </TabsContent>

        <TabsContent value="process-categories" className="mt-4">
          <MasterTable items={processCategories} loading={loading.processCategories}
            onAdd={addProcessCategory} onUpdate={updateProcessCategory} onDelete={deleteProcessCategory} />
        </TabsContent>

        <TabsContent value="child-part-types" className="mt-4">
          <MasterTable items={childPartTypes} loading={loading.childPartTypes}
            onAdd={addChildPartType} onUpdate={updateChildPartType} onDelete={deleteChildPartType} />
        </TabsContent>

        <TabsContent value="material-types" className="mt-4">
          <MasterTable items={materialTypes} loading={loading.materialTypes}
            onAdd={addMaterialType} onUpdate={updateMaterialType} onDelete={deleteMaterialType} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
