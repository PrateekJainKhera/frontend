"use client"

import { useState, useEffect } from 'react'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { vendorService, VendorResponse } from '@/lib/api/vendors'
import { toast } from 'sonner'
import { CreateVendorDialog } from '@/components/dialogs/create-vendor-dialog'
import { VendorsDataGrid } from '@/components/tables/vendors-data-grid'

export default function VendorsPage() {
  const [vendors, setVendors] = useState<VendorResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

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
    v.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.vendorCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  )

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-2 bg-background border-2 border-border rounded-lg px-4 py-1 shadow-sm w-full max-w-2xl">
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <Input
          placeholder="Search by name, code, or contact person..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border-0 shadow-none focus-visible:ring-0 h-8 px-0 text-sm flex-1 placeholder:text-muted-foreground/40 focus:placeholder:text-transparent caret-foreground"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardDescription>Total Vendors</CardDescription>
            <CardTitle className="text-2xl">{vendors.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {vendors.filter(v => v.isActive).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardDescription>Inactive</CardDescription>
            <CardTitle className="text-2xl text-muted-foreground">
              {vendors.filter(v => !v.isActive).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardDescription>Search Results</CardDescription>
            <CardTitle className="text-2xl">{filtered.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Data Grid */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <VendorsDataGrid vendors={filtered} onUpdate={loadVendors} />
      )}

      <CreateVendorDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={loadVendors}
      />

      {/* Floating Action Button */}
      <Button
        onClick={() => setCreateDialogOpen(true)}
        className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  )
}
