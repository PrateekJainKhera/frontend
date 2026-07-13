"use client"
import { getCurrentUserName } from '@/lib/auth'

import { useEffect, useState } from 'react'
import { Replace } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { toast } from 'sonner'
import { materialService, MaterialResponse } from '@/lib/api/materials'
import { materialRequisitionService, MaterialRequisitionItemResponse } from '@/lib/api/material-requisitions'

/**
 * The ONE "Change Material / Size" window — used by both the planner
 * (Material Requisitions page) and stores (Cutting Planning issue window).
 * Any saved change resets an approved requisition to Pending (re-approval)
 * and is written to the audit log with a compulsory reason.
 */
export function ChangeMaterialDialog({
  open, requisitionId, itemId, changedByRole, onClose, onSaved,
}: {
  open: boolean
  requisitionId: number | null
  itemId: number | null
  changedByRole: 'Planner' | 'Stores'
  onClose: () => void
  onSaved: () => void
}) {
  const [materials, setMaterials] = useState<MaterialResponse[]>([])
  const [item, setItem] = useState<MaterialRequisitionItemResponse | null>(null)
  const [loadingItem, setLoadingItem] = useState(false)

  const [newMaterialId, setNewMaterialId] = useState('')
  const [newLengthMM, setNewLengthMM] = useState('')
  const [newPieces, setNewPieces] = useState('')
  const [newWastageMM, setNewWastageMM] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    materialService.getAll().then(setMaterials).catch(() => {})
  }, [])

  // Load the requisition line whenever the dialog opens
  useEffect(() => {
    if (!open || !requisitionId || !itemId) return
    setLoadingItem(true)
    setItem(null); setReason('')
    materialRequisitionService.getItems(requisitionId)
      .then(items => {
        const it = items.find(i => i.id === itemId) ?? null
        setItem(it)
        setNewMaterialId(it?.materialId ? String(it.materialId) : '')
        setNewLengthMM(it?.lengthRequiredMM != null ? String(it.lengthRequiredMM) : '')
        setNewPieces(it?.numberOfPieces != null ? String(it.numberOfPieces) : '')
        setNewWastageMM(it?.wastageMM != null ? String(it.wastageMM) : '')
      })
      .catch(() => toast.error('Failed to load requisition line'))
      .finally(() => setLoadingItem(false))
  }, [open, requisitionId, itemId])

  const anyChanged = !!item && (
    (newMaterialId !== '' && Number(newMaterialId) !== item.materialId) ||
    (newLengthMM !== '' && Number(newLengthMM) !== (item.lengthRequiredMM ?? 0)) ||
    (newPieces !== '' && Number(newPieces) !== (item.numberOfPieces ?? 0)) ||
    (newWastageMM !== '' && Number(newWastageMM) !== (item.wastageMM ?? 0))
  )

  const save = async () => {
    if (!requisitionId || !itemId) return
    if (!newMaterialId) { toast.error('Select a material'); return }
    if (!reason.trim()) { toast.error('Reason is required'); return }
    const len = Number(newLengthMM)
    if (newLengthMM && (isNaN(len) || len <= 0)) { toast.error('Length must be a positive number (mm)'); return }
    if (len > 4000) { toast.error('Length per piece cannot exceed 4000 mm (4 m bar limit)'); return }
    setSaving(true)
    try {
      const res = await materialRequisitionService.changeItemMaterial(requisitionId, itemId, {
        materialId: Number(newMaterialId),
        lengthRequiredMM: newLengthMM ? len : undefined,
        numberOfPieces: newPieces ? Number(newPieces) : undefined,
        wastageMM: newWastageMM !== '' ? Number(newWastageMM) : undefined,
        reason: reason.trim(),
        changedBy: getCurrentUserName(),
        changedByRole,
      })
      toast.success(res.message || 'Requisition line updated', { duration: 6000 })
      onClose()
      onSaved()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update line')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Material</DialogTitle>
        </DialogHeader>

        {loadingItem ? (
          <p className="text-sm text-muted-foreground py-6">Loading line…</p>
        ) : item && (
          <div className="space-y-4 py-2">
            <div className="text-sm rounded-md border bg-muted/30 px-3 py-2">
              <div className="text-muted-foreground text-xs">Current</div>
              <div className="font-medium">
                {item.materialName || '—'}{item.materialGrade ? ` · ${item.materialGrade}` : ''}
              </div>
              <div className="text-xs text-muted-foreground">
                {item.lengthRequiredMM ?? item.quantityRequired} mm
                {item.numberOfPieces ? ` × ${item.numberOfPieces} pcs` : ''}
                {item.wastageMM != null ? ` · wastage ${item.wastageMM} mm` : ''}
                {item.jobCardNo ? ` · ${item.jobCardNo}` : ''}
              </div>
            </div>

            <div className="space-y-2">
              <Label>New material <span className="text-destructive">*</span></Label>
              <SearchableSelect
                value={newMaterialId}
                onChange={setNewMaterialId}
                options={materials.map(m => ({ value: String(m.id), label: `${m.materialName} (${m.materialCode})${m.grade ? ' · ' + m.grade : ''}` }))}
                placeholder="Search material…"
                searchPlaceholder="Search by name / code…"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Length/piece (mm)</Label>
                <Input type="number" min={1} max={4000} value={newLengthMM} placeholder="e.g. 300"
                  onChange={e => setNewLengthMM(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Wastage (mm)</Label>
                <Input type="number" min={0} value={newWastageMM} placeholder="e.g. 5"
                  onChange={e => setNewWastageMM(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>No. of pieces</Label>
                <Input type="number" min={1} value={newPieces} placeholder="e.g. 2"
                  onChange={e => setNewPieces(e.target.value)} />
              </div>
            </div>

            {anyChanged && (
              <p className="text-xs rounded-md border border-amber-300 bg-amber-50 text-amber-800 px-3 py-2">
                Saving this change will reset the requisition to <strong>Pending</strong> for re-approval, and any selected pieces will be cleared.
              </p>
            )}

            <div className="space-y-2">
              <Label>Reason <span className="text-destructive">*</span></Label>
              <Input placeholder="Why is this being changed? (required)"
                value={reason}
                onChange={e => setReason(e.target.value)}
                className={!reason.trim() ? 'border-destructive' : ''} />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving || !newMaterialId || !reason.trim() || loadingItem} className="gap-1.5">
            <Replace className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save change'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
