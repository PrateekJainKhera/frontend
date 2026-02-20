'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Clock, Plus, Pencil, Trash2, Loader2, RefreshCw } from 'lucide-react'
import { shiftService } from '@/lib/api/shifts'
import { Shift, CreateShiftRequest } from '@/types/shift'
import { toast } from 'sonner'

const DEFAULT_FORM: CreateShiftRequest = {
  shiftName: '',
  startTime: '08:00',
  endTime: '16:00',
  regularHours: 8,
  maxOvertimeHours: 3,
  isActive: true,
}

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<CreateShiftRequest>(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      setShifts(await shiftService.getAll())
    } catch {
      toast.error('Failed to load shifts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditingId(null)
    setForm(DEFAULT_FORM)
    setDialogOpen(true)
  }

  const openEdit = (s: Shift) => {
    setEditingId(s.id)
    setForm({
      shiftName: s.shiftName,
      startTime: s.startTime,
      endTime: s.endTime,
      regularHours: s.regularHours,
      maxOvertimeHours: s.maxOvertimeHours,
      isActive: s.isActive,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.shiftName.trim()) { toast.error('Shift name is required'); return }
    setSaving(true)
    try {
      if (editingId) {
        await shiftService.update(editingId, form)
        toast.success('Shift updated')
      } else {
        await shiftService.create(form)
        toast.success('Shift created')
      }
      setDialogOpen(false)
      load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this shift?')) return
    setDeletingId(id)
    try {
      await shiftService.delete(id)
      toast.success('Shift deleted')
      load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" /> Shift Master
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Define work shifts used for machine scheduling
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          </Button>
          <Button size="sm" className="h-8 gap-1 text-xs" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" /> Add Shift
          </Button>
        </div>
      </div>

      {/* Shift Cards */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : shifts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No shifts configured.</p>
          <Button size="sm" className="mt-3 gap-1" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" /> Create First Shift
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {shifts.map(s => (
            <div
              key={s.id}
              className={`flex items-center gap-4 rounded-lg border px-4 py-3 bg-card ${!s.isActive ? 'opacity-60' : ''}`}
            >
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{s.shiftName}</span>
                  {!s.isActive && <Badge variant="outline" className="text-[10px] h-4 px-1">Inactive</Badge>}
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                  <span>{s.startTime} – {s.endTime}</span>
                  <span>·</span>
                  <span>{s.regularHours}h regular</span>
                  <span>·</span>
                  <span>+{s.maxOvertimeHours}h OT max</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost" size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => openEdit(s)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost" size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600"
                  onClick={() => handleDelete(s.id)}
                  disabled={deletingId === s.id}
                >
                  {deletingId === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">{editingId ? 'Edit Shift' : 'New Shift'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1">
              <Label className="text-xs">Shift Name</Label>
              <Input
                value={form.shiftName}
                onChange={e => setForm(f => ({ ...f, shiftName: e.target.value }))}
                placeholder="e.g. Shift A"
                className="h-8 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Start Time</Label>
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">End Time</Label>
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Regular Hours</Label>
                <Input
                  type="number"
                  min={1}
                  max={24}
                  step={0.5}
                  value={form.regularHours}
                  onChange={e => setForm(f => ({ ...f, regularHours: parseFloat(e.target.value) || 8 }))}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Max OT Hours</Label>
                <Input
                  type="number"
                  min={0}
                  max={8}
                  step={0.5}
                  value={form.maxOvertimeHours}
                  onChange={e => setForm(f => ({ ...f, maxOvertimeHours: parseFloat(e.target.value) || 0 }))}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.isActive}
                onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))}
              />
              <Label className="text-xs">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />Saving…</> : 'Save Shift'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
