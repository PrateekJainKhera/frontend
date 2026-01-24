"use client"

import { useState, useEffect } from 'react'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { mockRawMaterials } from '@/lib/mock-data'
import { simulateApiCall } from '@/lib/utils/mock-api'
import { RawMaterial } from '@/types'
import { RawMaterialsTable } from '@/components/tables/raw-materials-table'
import { AddRawMaterialDialog } from '@/components/forms/add-raw-material-dialog'

export function RawMaterialsTab() {
  const [materials, setMaterials] = useState<RawMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false)

  useEffect(() => {
    loadMaterials()
  }, [])

  const loadMaterials = async () => {
    setLoading(true)
    const data = await simulateApiCall(mockRawMaterials, 800)
    setMaterials(data)
    setLoading(false)
  }

  const filteredMaterials = materials.filter(
    (material) =>
      material.materialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.grade.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Reference catalog of materials used in the factory
          </p>
        </div>
        <Button onClick={() => setIsAddMaterialOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Material Type
        </Button>
      </div>

      {/* Stats Card - Only Total Materials (no stock info) */}
      <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] max-w-xs">
        <CardHeader className="pb-3">
          <CardDescription>Total Material Types</CardDescription>
          <CardTitle className="text-3xl">{materials.length}</CardTitle>
        </CardHeader>
      </Card>

      {/* Search */}
      <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by material name or grade..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </Card>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <RawMaterialsTable materials={filteredMaterials} onUpdate={loadMaterials} />
      )}

      {/* Add Material Dialog */}
      <AddRawMaterialDialog
        open={isAddMaterialOpen}
        onOpenChange={setIsAddMaterialOpen}
      />

      {/* Floating Action Button */}
      <Button
        onClick={() => setIsAddMaterialOpen(true)}
        className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  )
}
