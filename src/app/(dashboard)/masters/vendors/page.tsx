"use client"

import { useState, useEffect } from 'react'
import { Plus, Search, Building2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { vendorService, VendorResponse } from '@/lib/api/vendors'
import { toast } from 'sonner'
import { CreateVendorDialog } from '@/components/dialogs/create-vendor-dialog'
import { EditVendorDialog } from '@/components/dialogs/edit-vendor-dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function VendorsPage() {
  const [vendors, setVendors] = useState<VendorResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editVendor, setEditVendor] = useState<VendorResponse | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<VendorResponse | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { loadVendors() }, [])

  const loadVendors = async () => {
    setLoading(true)
    try {
      const data = await vendorService.getAll()
      setVendors(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load vendors')
    } finally {
      setLoading(false)
    }
  }

  const filtered = vendors.filter(v =>
    v.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.vendorCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  )

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await vendorService.delete(deleteTarget.id)
      toast.success(`"${deleteTarget.vendorName}" deleted`)
      setDeleteTarget(null)
      loadVendors()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete vendor')
    } finally {
      setDeleting(false)
    }
  }

  const totalActive = vendors.filter(v => v.isActive).length
  const totalInactive = vendors.length - totalActive

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Vendor Master</h1>
          <p className="text-muted-foreground text-sm">Manage vendors for purchase requests and orders</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card className="border-2 border-border p-4">
          <p className="text-sm text-muted-foreground">Total Vendors</p>
          <p className="text-2xl font-bold">{vendors.length}</p>
        </Card>
        <Card className="border-2 border-border p-4">
          <p className="text-sm text-muted-foreground">Active</p>
          <p className="text-2xl font-bold text-green-600">{totalActive}</p>
        </Card>
        <Card className="border-2 border-border p-4 col-span-2 sm:col-span-1">
          <p className="text-sm text-muted-foreground">Inactive</p>
          <p className="text-2xl font-bold text-muted-foreground">{totalInactive}</p>
        </Card>
      </div>

      {/* Search */}
      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search vendors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-2 border-border p-8 text-center">
          <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No vendors found</p>
          <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add First Vendor
          </Button>
        </Card>
      ) : (
        <>
          {/* Mobile: card per vendor */}
          <div className="block md:hidden space-y-3">
            {filtered.map((vendor) => (
              <Card key={vendor.id} className="border-2 border-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{vendor.vendorName}</p>
                      <p className="text-xs font-mono text-muted-foreground">{vendor.vendorCode}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={vendor.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                        {vendor.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span><Badge variant="outline" className="text-xs">{vendor.vendorType}</Badge></span>
                    {vendor.contactPerson && <span>Contact: {vendor.contactPerson}</span>}
                    {vendor.phone && <span>📞 {vendor.phone}</span>}
                    {vendor.city && <span>📍 {vendor.city}</span>}
                    {vendor.gstNo && <span>GST: <span className="font-mono">{vendor.gstNo}</span></span>}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditVendor(vendor)}>Edit</Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteTarget(vendor)}>
                      <Trash2 className="h-3.5 w-3.5 mr-1" />Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop: table */}
          <Card className="hidden md:block border-2 border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="bg-muted border-b">
                    <th className="text-left p-3 font-semibold">Code</th>
                    <th className="text-left p-3 font-semibold">Vendor Name</th>
                    <th className="text-left p-3 font-semibold hidden lg:table-cell">Type</th>
                    <th className="text-left p-3 font-semibold hidden lg:table-cell">Contact</th>
                    <th className="text-left p-3 font-semibold">Phone</th>
                    <th className="text-left p-3 font-semibold hidden lg:table-cell">City</th>
                    <th className="text-left p-3 font-semibold hidden xl:table-cell">GST No</th>
                    <th className="text-left p-3 font-semibold">Status</th>
                    <th className="text-left p-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((vendor) => (
                    <tr key={vendor.id} className="border-b hover:bg-muted/40 transition-colors">
                      <td className="p-3 font-mono font-semibold text-xs">{vendor.vendorCode}</td>
                      <td className="p-3 font-medium">{vendor.vendorName}</td>
                      <td className="p-3 hidden lg:table-cell">
                        <Badge variant="outline">{vendor.vendorType}</Badge>
                      </td>
                      <td className="p-3 text-muted-foreground hidden lg:table-cell">{vendor.contactPerson || '—'}</td>
                      <td className="p-3 text-muted-foreground">{vendor.phone || '—'}</td>
                      <td className="p-3 text-muted-foreground hidden lg:table-cell">{vendor.city || '—'}</td>
                      <td className="p-3 font-mono text-xs hidden xl:table-cell">{vendor.gstNo || '—'}</td>
                      <td className="p-3">
                        <Badge className={vendor.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                          {vendor.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setEditVendor(vendor)}>Edit</Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteTarget(vendor)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      <CreateVendorDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={loadVendors}
      />

      {editVendor && (
        <EditVendorDialog
          vendor={editVendor}
          open={!!editVendor}
          onOpenChange={(open) => { if (!open) setEditVendor(null) }}
          onSuccess={loadVendors}
        />
      )}

      {/* Floating Action Button */}
      <Button
        onClick={() => setCreateDialogOpen(true)}
        className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vendor?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.vendorName}</strong>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive hover:bg-destructive/90">
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
