"use client"

import { useState, useEffect } from 'react'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { materialService, MaterialResponse } from '@/lib/api/materials'
import { toast } from 'sonner'
import { RawMaterialsTable } from '@/components/tables/raw-materials-table'
import { AddRawMaterialDialog } from '@/components/forms/add-raw-material-dialog'

export default function RawMaterialsPage() {
  const [materials, setMaterials] = useState<MaterialResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false)

  useEffect(() => {
    loadMaterials()
  }, [])

  const loadMaterials = async () => {
    setLoading(true)
    try {
      const data = await materialService.getAll()
      setMaterials(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load materials'
      toast.error(message)
      setMaterials([])
    } finally {
      setLoading(false)
    }
  }

  const filteredMaterials = materials.filter(
    (material) =>
      material.materialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      material.grade.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get unique grades and shapes for stats (catalog info only)
  const uniqueGrades = [...new Set(materials.map(m => m.grade))]
  const uniqueShapes = [...new Set(materials.map(m => m.shape))]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="sr-only">Raw Material Master</h1>
        <div className="flex gap-2 ml-auto">
          <Button onClick={() => setIsAddMaterialOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Material
          </Button>
        </div>
      </div>

      {/* Stats Cards - Catalog info only, no stock */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          <CardHeader className="pb-3">
            <CardDescription>Total Materials</CardDescription>
            <CardTitle className="text-3xl">{materials.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          <CardHeader className="pb-3">
            <CardDescription>Grades</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{uniqueGrades.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          <CardHeader className="pb-3">
            <CardDescription>Shapes</CardDescription>
            <CardTitle className="text-3xl text-green-600">{uniqueShapes.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          <CardHeader className="pb-3">
            <CardDescription>Search Results</CardDescription>
            <CardTitle className="text-3xl">{filteredMaterials.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

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
    </div>
  )
}
