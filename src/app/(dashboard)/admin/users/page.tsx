'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, RefreshCw, KeyRound, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { adminService, UserResponse, RoleResponse } from '@/lib/api/auth'
import { SearchInput } from '@/components/ui/search-input'

export default function UsersPage() {
  const [users, setUsers] = useState<UserResponse[]>([])
  const [roles, setRoles] = useState<RoleResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Create/Edit dialog
  const [dialog, setDialog] = useState<'create' | 'edit' | 'password' | null>(null)
  const [selected, setSelected] = useState<UserResponse | null>(null)
  const [saving, setSaving] = useState(false)

  // Form fields
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [roleId, setRoleId] = useState<string>('')
  const [isActive, setIsActive] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [u, r] = await Promise.all([adminService.getUsers(), adminService.getRoles()])
      setUsers(u)
      setRoles(r)
    } catch { toast.error('Failed to load users') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  function openCreate() {
    setSelected(null)
    setFullName(''); setUsername(''); setPassword(''); setRoleId(''); setIsActive(true)
    setDialog('create')
  }

  function openEdit(u: UserResponse) {
    setSelected(u)
    setFullName(u.fullName)
    setUsername(u.username)
    setRoleId(u.roleId ? String(u.roleId) : '')
    setIsActive(u.isActive)
    setDialog('edit')
  }

  function openPassword(u: UserResponse) {
    setSelected(u)
    setPassword('')
    setDialog('password')
  }

  async function handleCreate() {
    if (!fullName.trim() || !username.trim() || !password.trim()) {
      toast.error('Fill all required fields'); return
    }
    setSaving(true)
    try {
      await adminService.createUser({
        fullName: fullName.trim(),
        username: username.trim(),
        password,
        roleId: roleId ? Number(roleId) : null,
      })
      toast.success('User created')
      setDialog(null)
      await load()
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  async function handleEdit() {
    if (!selected || !fullName.trim()) { toast.error('Fill all fields'); return }
    setSaving(true)
    try {
      await adminService.updateUser(selected.id, {
        fullName: fullName.trim(),
        roleId: roleId ? Number(roleId) : null,
        isActive,
      })
      toast.success('User updated')
      setDialog(null)
      await load()
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  async function handlePassword() {
    if (!selected || !password.trim()) { toast.error('Enter new password'); return }
    setSaving(true)
    try {
      await adminService.resetPassword(selected.id, password)
      toast.success('Password reset')
      setDialog(null)
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  async function handleDelete(u: UserResponse) {
    if (u.isAdmin) { toast.error('Cannot delete admin user'); return }
    if (!confirm(`Delete user "${u.fullName}"?`)) return
    try {
      await adminService.deleteUser(u.id)
      toast.success('User deleted')
      await load()
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed') }
  }

  const filteredUsers = searchQuery.trim()
    ? users.filter(u =>
        u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">User Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Create accounts and assign roles</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
          <Button size="sm" onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />New User</Button>
        </div>
      </div>

      <div className="mb-4">
        <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search name or username..." />
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading...
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Username</th>
                <th className="text-left px-4 py-3 font-medium">Role</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {u.isAdmin && <ShieldCheck className="h-4 w-4 text-blue-600" />}
                      <span className="font-medium">{u.fullName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">{u.username}</td>
                  <td className="px-4 py-3">
                    {u.roleName
                      ? <Badge variant="outline">{u.roleName}</Badge>
                      : <span className="text-muted-foreground text-xs">No role</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={u.isActive ? 'default' : 'secondary'}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openPassword(u)}>
                        <KeyRound className="h-3.5 w-3.5" />
                      </Button>
                      {!u.isAdmin && (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(u)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => handleDelete(u)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={dialog === 'create'} onOpenChange={(v) => { if (!v) setDialog(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Create User</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label>Full Name <span className="text-red-500">*</span></Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" />
            </div>
            <div className="space-y-1.5">
              <Label>Username <span className="text-red-500">*</span></Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="johndoe" />
            </div>
            <div className="space-y-1.5">
              <Label>Password <span className="text-red-500">*</span></Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={roleId || 'none'} onValueChange={(v) => setRoleId(v === 'none' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="No role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No role</SelectItem>
                  {roles.map((r) => <SelectItem key={r.id} value={String(r.id)}>{r.roleName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)} disabled={saving}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>Create User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={dialog === 'edit'} onOpenChange={(v) => { if (!v) setDialog(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit User — {selected?.username}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label>Full Name <span className="text-red-500">*</span></Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={roleId || 'none'} onValueChange={(v) => setRoleId(v === 'none' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="No role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No role</SelectItem>
                  {roles.map((r) => <SelectItem key={r.id} value={String(r.id)}>{r.roleName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label>{isActive ? 'Active' : 'Inactive'}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)} disabled={saving}>Cancel</Button>
            <Button onClick={handleEdit} disabled={saving}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={dialog === 'password'} onOpenChange={(v) => { if (!v) setDialog(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Reset Password — {selected?.username}</DialogTitle></DialogHeader>
          <div className="space-y-1.5 py-1">
            <Label>New Password <span className="text-red-500">*</span></Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)} disabled={saving}>Cancel</Button>
            <Button onClick={handlePassword} disabled={saving}>Reset Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
