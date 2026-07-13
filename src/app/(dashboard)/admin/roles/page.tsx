'use client'

import { useState, useEffect, useCallback, Fragment } from 'react'
import { toast } from 'sonner'
import {
  Plus, Pencil, Trash2, RefreshCw, ChevronRight, ChevronDown, ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { adminService, RoleResponse, PermissionMap } from '@/lib/api/auth'
import {
  PERMISSION_CATALOG, ALL_ACTIONS, allPermissionEntries, PermAction, PermModule,
} from '@/lib/permission-catalog'

// Build a permission map that covers every catalog key. When a submenu row is
// missing for the role (legacy roles that only had module-level permissions), it
// is seeded from the parent module so the grid reflects the *effective* access.
function hydrate(map: PermissionMap): PermissionMap {
  const out: PermissionMap = {}
  for (const mod of PERMISSION_CATALOG) {
    out[mod.key] = { ...(map[mod.key] || {}) }
    for (const child of mod.children) {
      if (map[child.key]) {
        out[child.key] = { ...map[child.key] }
      } else {
        // seed from module-level values (fallback behaviour)
        const seeded: Record<string, boolean> = {}
        child.actions.forEach((a) => { seeded[a] = map[mod.key]?.[a] ?? false })
        out[child.key] = seeded
      }
    }
  }
  return out
}

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRole, setExpandedRole] = useState<number | null>(null)
  const [permMap, setPermMap] = useState<PermissionMap>({})
  const [permLoading, setPermLoading] = useState(false)
  const [permSaving, setPermSaving] = useState(false)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())

  // Create/Edit dialog
  const [dialog, setDialog] = useState<'create' | 'edit' | null>(null)
  const [selected, setSelected] = useState<RoleResponse | null>(null)
  const [roleName, setRoleName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try { setRoles(await adminService.getRoles()) }
    catch { toast.error('Failed to load roles') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function toggleExpand(roleId: number) {
    if (expandedRole === roleId) { setExpandedRole(null); return }
    setExpandedRole(roleId)
    setPermLoading(true)
    try {
      const map = await adminService.getPermissions(roleId)
      setPermMap(hydrate(map))
    } catch { toast.error('Failed to load permissions') }
    finally { setPermLoading(false) }
  }

  function toggleModule(key: string) {
    setExpandedModules((prev) => {
      const n = new Set(prev)
      n.has(key) ? n.delete(key) : n.add(key)
      return n
    })
  }

  function togglePerm(key: string, action: string) {
    setPermMap((prev) => ({
      ...prev,
      [key]: { ...prev[key], [action]: !prev[key]?.[action] },
    }))
  }

  // Toggle every applicable action for a single row (module or submenu)
  function toggleRowAll(key: string, actions: PermAction[]) {
    setPermMap((prev) => {
      const allOn = actions.every((a) => prev[key]?.[a])
      return { ...prev, [key]: actions.reduce((acc, a) => ({ ...acc, [a]: !allOn }), { ...prev[key] }) }
    })
  }

  // Grant / clear an entire module including all of its submenus
  function toggleModuleCascade(mod: PermModule) {
    setPermMap((prev) => {
      const keys = [{ key: mod.key, actions: mod.actions }, ...mod.children.map((c) => ({ key: c.key, actions: c.actions }))]
      const allOn = keys.every(({ key, actions }) => actions.every((a) => prev[key]?.[a]))
      const next = { ...prev }
      keys.forEach(({ key, actions }) => {
        next[key] = actions.reduce((acc, a) => ({ ...acc, [a]: !allOn }), { ...next[key] })
      })
      return next
    })
  }

  async function savePermissions() {
    if (!expandedRole) return
    setPermSaving(true)
    try {
      const entries = allPermissionEntries().map(({ key, action }) => ({
        module: key,
        action,
        isAllowed: permMap[key]?.[action] ?? false,
      }))
      await adminService.savePermissions(expandedRole, entries)
      toast.success('Permissions saved')
    } catch { toast.error('Failed to save permissions') }
    finally { setPermSaving(false) }
  }

  function openCreate() {
    setSelected(null); setRoleName(''); setDescription('')
    setDialog('create')
  }
  function openEdit(r: RoleResponse) {
    setSelected(r); setRoleName(r.roleName); setDescription(r.description || '')
    setDialog('edit')
  }
  async function handleCreate() {
    if (!roleName.trim()) { toast.error('Role name is required'); return }
    setSaving(true)
    try {
      await adminService.createRole({ roleName: roleName.trim(), description: description.trim() || undefined })
      toast.success('Role created'); setDialog(null); await load()
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }
  async function handleEdit() {
    if (!selected || !roleName.trim()) return
    setSaving(true)
    try {
      await adminService.updateRole(selected.id, { roleName: roleName.trim(), description: description.trim() || undefined })
      toast.success('Role updated'); setDialog(null); await load()
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }
  async function handleDelete(r: RoleResponse) {
    if (r.userCount > 0) { toast.error(`Cannot delete — ${r.userCount} user(s) assigned`); return }
    if (!confirm(`Delete role "${r.roleName}"?`)) return
    try {
      await adminService.deleteRole(r.id)
      toast.success('Role deleted'); await load()
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed') }
  }

  const cell = (key: string, action: PermAction, applicable: boolean) => (
    <td key={action} className="text-center py-2 px-3">
      {applicable ? (
        <Checkbox checked={permMap[key]?.[action] ?? false} onCheckedChange={() => togglePerm(key, action)} />
      ) : (
        <span className="text-muted-foreground/30">—</span>
      )}
    </td>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Role Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Define roles and assign permissions per menu and submenu</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
          <Button size="sm" onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />New Role</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading...
        </div>
      ) : (
        <div className="space-y-2">
          {roles.map((r) => {
            const isExpanded = expandedRole === r.id
            return (
              <div key={r.id} className="border rounded-lg overflow-hidden">
                {/* Role header row */}
                <div className="flex items-center gap-3 px-4 py-3 bg-muted/30 hover:bg-muted/50 cursor-pointer" onClick={() => toggleExpand(r.id)}>
                  {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span className="font-medium">{r.roleName}</span>
                  {r.description && <span className="text-sm text-muted-foreground">{r.description}</span>}
                  <div className="ml-auto flex items-center gap-2">
                    <Badge variant="secondary">{r.userCount} user{r.userCount !== 1 ? 's' : ''}</Badge>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEdit(r) }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={(e) => { e.stopPropagation(); handleDelete(r) }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Permission grid */}
                {isExpanded && (
                  <div className="px-4 py-4">
                    {permLoading ? (
                      <div className="flex items-center gap-2 text-muted-foreground py-4">
                        <RefreshCw className="h-4 w-4 animate-spin" /> Loading permissions...
                      </div>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 pr-4 font-medium w-64">Menu / Page</th>
                                {ALL_ACTIONS.map((a) => (
                                  <th key={a} className="text-center py-2 px-3 font-medium text-xs uppercase tracking-wide text-muted-foreground">{a}</th>
                                ))}
                                <th className="text-center py-2 px-3 font-medium text-xs text-muted-foreground">All</th>
                              </tr>
                            </thead>
                            <tbody>
                              {PERMISSION_CATALOG.map((mod) => {
                                const hasChildren = mod.children.length > 0
                                const open = expandedModules.has(mod.key)
                                const modAllOn = mod.actions.every((a) => permMap[mod.key]?.[a])
                                return (
                                  <Fragment key={mod.key}>
                                    {/* Module row */}
                                    <tr className="border-b bg-muted/20">
                                      <td className="py-2.5 pr-4 font-semibold">
                                        <button
                                          type="button"
                                          className="inline-flex items-center gap-1.5"
                                          onClick={() => hasChildren && toggleModule(mod.key)}
                                        >
                                          {hasChildren ? (
                                            open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />
                                          ) : (
                                            <span className="w-3.5" />
                                          )}
                                          {mod.label}
                                          {hasChildren && (
                                            <span className="text-[10px] font-normal text-muted-foreground">({mod.children.length})</span>
                                          )}
                                        </button>
                                      </td>
                                      {ALL_ACTIONS.map((action) => cell(mod.key, action, mod.actions.includes(action)))}
                                      <td className="text-center py-2.5 px-3">
                                        <button
                                          type="button"
                                          className="text-[11px] font-medium text-primary hover:underline"
                                          onClick={() => toggleModuleCascade(mod)}
                                          title="Grant / clear this module and all its pages"
                                        >
                                          {modAllOn ? 'Clear' : 'Grant'}
                                        </button>
                                      </td>
                                    </tr>

                                    {/* Submenu rows */}
                                    {hasChildren && open && mod.children.map((child) => {
                                      const rowAllOn = child.actions.every((a) => permMap[child.key]?.[a])
                                      return (
                                        <tr key={child.key} className="border-b hover:bg-muted/10">
                                          <td className="py-2 pr-4 pl-8 text-muted-foreground">{child.label}</td>
                                          {ALL_ACTIONS.map((action) => cell(child.key, action, child.actions.includes(action)))}
                                          <td className="text-center py-2 px-3">
                                            <Checkbox checked={rowAllOn} onCheckedChange={() => toggleRowAll(child.key, child.actions)} />
                                          </td>
                                        </tr>
                                      )
                                    })}
                                  </Fragment>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <p className="text-xs text-muted-foreground">
                            Tip: “Grant” fills a whole module + its pages. Submenu rows override the module for that page.
                          </p>
                          <Button onClick={savePermissions} disabled={permSaving} className="gap-2">
                            {permSaving && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                            Save Permissions
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={dialog === 'create'} onOpenChange={(v) => { if (!v) setDialog(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Create Role</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label>Role Name <span className="text-red-500">*</span></Label>
              <Input value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="e.g. Store Manager" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)} disabled={saving}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>Create Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={dialog === 'edit'} onOpenChange={(v) => { if (!v) setDialog(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Edit Role</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label>Role Name <span className="text-red-500">*</span></Label>
              <Input value={roleName} onChange={(e) => setRoleName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)} disabled={saving}>Cancel</Button>
            <Button onClick={handleEdit} disabled={saving}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
