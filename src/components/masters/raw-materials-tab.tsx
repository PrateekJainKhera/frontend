"use client"

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { materialService, MaterialResponse } from '@/lib/api/materials'
import { toast } from 'sonner'
import { RawMaterialsDataGrid } from '@/components/tables/raw-materials-data-grid'
import { AddRawMaterialDialog } from '@/components/forms/add-raw-material-dialog'

interface RawMaterialsTabProps {
  searchQuery?: string
}

export function RawMaterialsTab({ searchQuery = '' }: RawMaterialsTabProps) {
  const [materials, setMaterials] = useState<MaterialResponse[]>([])
  const [loading, setLoading] = useState(true)
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

  // Get unique grades and shapes for stats
  const uniqueGrades = [...new Set(materials.map(m => m.grade))]
  const uniqueShapes = [...new Set(materials.map(m => m.shape))]

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardDescription>Total Materials</CardDescription>
            <CardTitle className="text-2xl">{materials.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardDescription>Grades</CardDescription>
            <CardTitle className="text-2xl text-blue-600">{uniqueGrades.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardDescription>Shapes</CardDescription>
            <CardTitle className="text-2xl text-green-600">{uniqueShapes.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardDescription>Search Results</CardDescription>
            <CardTitle className="text-2xl">{filteredMaterials.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Data Grid Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <RawMaterialsDataGrid materials={filteredMaterials} onUpdate={loadMaterials} />
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
