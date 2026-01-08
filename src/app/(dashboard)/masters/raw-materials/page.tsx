"use client"

import { useState, useEffect } from 'react'
import { Plus, Search, Calculator } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { mockRawMaterials } from '@/lib/mock-data'
import { simulateApiCall } from '@/lib/utils/mock-api'
import { RawMaterial } from '@/types'
import { RawMaterialsTable } from '@/components/tables/raw-materials-table'
import { MaterialCalculatorDialog } from '@/components/forms/material-calculator-dialog'
import { AddRawMaterialDialog } from '@/components/forms/add-raw-material-dialog'

export default function RawMaterialsPage() {
  const [materials, setMaterials] = useState<RawMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false)
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

  // Calculate low stock items
  const lowStockCount = materials.filter(m => m.stockQty < m.minStockLevel).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="sr-only">Raw Material Master</h1>
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" onClick={() => setIsCalculatorOpen(true)}>
            <Calculator className="mr-2 h-4 w-4" />
            Weight Calculator
          </Button>
          <Button onClick={() => setIsAddMaterialOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Material
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          <CardHeader className="pb-3">
            <CardDescription>Total Materials</CardDescription>
            <CardTitle className="text-3xl">{materials.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          <CardHeader className="pb-3">
            <CardDescription>Total Stock Weight</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {materials.reduce((sum, m) => sum + (m.weightKG * m.stockQty), 0).toFixed(0)} kg
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          <CardHeader className="pb-3">
            <CardDescription>Low Stock Alerts</CardDescription>
            <CardTitle className={`text-3xl ${lowStockCount > 0 ? 'text-destructive' : 'text-green-600'}`}>
              {lowStockCount}
            </CardTitle>
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

      {/* Calculator Dialog */}
      <MaterialCalculatorDialog
        open={isCalculatorOpen}
        onOpenChange={setIsCalculatorOpen}
      />

      {/* Add Material Dialog */}
      <AddRawMaterialDialog
        open={isAddMaterialOpen}
        onOpenChange={setIsAddMaterialOpen}
      />
    </div>
  )
}
