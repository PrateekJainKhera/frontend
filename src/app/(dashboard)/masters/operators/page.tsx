"use client"

import { useEffect, useMemo, useState } from 'react'
import { Users, Search, RefreshCw, Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { operatorService, OperatorResponse, SaveOperatorRequest } from '@/lib/api/operators'

const SKILL_LEVELS = ['Trainee', 'Junior', 'Senior', 'Expert']
const SHIFTS = ['Day', 'Night', 'General']

const emptyForm: SaveOperatorRequest = {
  operatorCode: '', operatorName: '', mobile: '', employeeId: '',
  designation: '', department: '', skillLevel: '', shift: '', remarks: '',
}

export default function OperatorsPage() {
  const [rows, setRows] = useState<OperatorResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<OperatorResponse | null>(null)
  const [form, setForm] = useState<SaveOperatorRequest>(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    operatorService.getAll().then(setRows).catch(e => toast.error(e.message)).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return rows
    return rows.filter(r =>
      r.operatorCode.toLowerCase().includes(q) ||
      r.operatorName.toLowerCase().includes(q) ||
      (r.department ?? '').toLowerCase().includes(q) ||
      (r.designation ?? '').toLowerCase().includes(q))
  }, [rows, search])

  const openCreate = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true) }
  const openEdit = (r: OperatorResponse) => {
    setEditing(r)
    setForm({
      operatorCode: r.operatorCode, operatorName: r.operatorName,
      mobile: r.mobile ?? '', employeeId: r.employeeId ?? '',
      designation: r.designation ?? '', department: r.department ?? '',
      skillLevel: r.skillLevel ?? '', shift: r.shift ?? '', remarks: r.remarks ?? '',
    })
    setDialogOpen(true)
  }

  const save = async () => {
    if (!form.operatorCode.trim() || !form.operatorName.trim()) {
      toast.error('Operator code and name are required'); return
    }
    setSaving(true)
    try {
      if (editing) {
        await operatorService.update(editing.id, form)
        toast.success('Operator updated')
      } else {
        await operatorService.create(form)
        toast.success('Operator created')
      }
      setDialogOpen(false)
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (r: OperatorResponse) => {
    if (!confirm(`Delete operator "${r.operatorName}" (${r.operatorCode})?`)) return
    try {
      await operatorService.delete(r.id)
      toast.success('Operator deleted')
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete')
    }
  }

  const setF = (k: keyof SaveOperatorRequest, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Users className="h-7 w-7 text-primary" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Operators</h1>
          <p className="text-sm text-muted-foreground">{rows.length} operator(s)</p>
        </div>
        <div className="flex items-center gap-2 border rounded-md px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search code / name / department…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 h-9 px-0 w-60" />
        </div>
        <Button variant="outline" size="icon" onClick={load} title="Refresh">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add Operator
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No operators yet</p>
            <p className="text-sm">Add your shop-floor operators to use them in production.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(r => (
            <div key={r.id} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/40 flex-wrap">
              <div className="w-56 shrink-0">
                <span className="font-semibold text-sm block">{r.operatorName}</span>
                <span className="text-xs text-muted-foreground font-mono">{r.operatorCode}{r.employeeId ? ` · ${r.employeeId}` : ''}</span>
              </div>
              <span className="text-sm text-muted-foreground w-40 shrink-0 truncate">{r.designation ?? '—'}</span>
              <span className="text-sm text-muted-foreground w-32 shrink-0 truncate">{r.department ?? '—'}</span>
              {r.skillLevel && <Badge variant="outline" className="text-xs">{r.skillLevel}</Badge>}
              {r.shift && <Badge variant="secondary" className="text-xs">{r.shift} shift</Badge>}
              <Badge variant="outline" className={`text-xs ${r.isActive ? 'border-green-400 text-green-700' : 'border-gray-300 text-gray-500'}`}>
                {r.isActive ? 'Active' : 'Inactive'}
              </Badge>
              <span className="text-xs text-muted-foreground">{r.mobile ?? ''}</span>
              <div className="ml-auto flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(r)} title="Edit">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(r)} title="Delete">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.operatorName}` : 'Add Operator'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-1">
            <div className="space-y-1.5">
              <Label>Operator Code <span className="text-destructive">*</span></Label>
              <Input value={form.operatorCode} onChange={e => setF('operatorCode', e.target.value)} placeholder="e.g. OP-001" />
            </div>
            <div className="space-y-1.5">
              <Label>Name <span className="text-destructive">*</span></Label>
              <Input value={form.operatorName} onChange={e => setF('operatorName', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Mobile</Label>
              <Input value={form.mobile} onChange={e => setF('mobile', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Employee ID</Label>
              <Input value={form.employeeId} onChange={e => setF('employeeId', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Designation</Label>
              <Input value={form.designation} onChange={e => setF('designation', e.target.value)} placeholder="e.g. Machinist" />
            </div>
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Input value={form.department} onChange={e => setF('department', e.target.value)} placeholder="e.g. Machining" />
            </div>
            <div className="space-y-1.5">
              <Label>Skill Level</Label>
              <Select value={form.skillLevel || undefined} onValueChange={v => setF('skillLevel', v)}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  {SKILL_LEVELS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Shift</Label>
              <Select value={form.shift || undefined} onValueChange={v => setF('shift', v)}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  {SHIFTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Remarks</Label>
              <Input value={form.remarks} onChange={e => setF('remarks', e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Operator'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
