'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Clock, Plus, Loader2 } from 'lucide-react'
import { shiftService } from '@/lib/api/shifts'
import { Shift, CreateShiftRequest } from '@/types/shift'
import { toast } from 'sonner'
import { ShiftsDataGrid } from '@/components/tables/shifts-data-grid'
import { SearchInput } from '@/components/ui/search-input'

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
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<CreateShiftRequest>(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)

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

  const filteredShifts = searchQuery.trim()
    ? shifts.filter(s => s.shiftName?.toLowerCase().includes(searchQuery.toLowerCase()))
    : shifts

  return (
    <div className="space-y-4">
      <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search shift name..." />

      {/* Data Grid */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <ShiftsDataGrid shifts={filteredShifts} onEdit={openEdit} onUpdate={load} />
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-blue-500" />
              {editingId ? 'Edit Shift' : 'New Shift'}
            </DialogTitle>
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

      {/* Floating Action Button */}
      <Button
        onClick={openCreate}
        className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  )
}
