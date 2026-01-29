"use client"

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { mockMaterialCategories } from '@/lib/mock-data'
import { MaterialCategory } from '@/types'
import { simulateApiCall } from '@/lib/utils/mock-api'
import { MaterialCategoriesDataGrid } from '@/components/tables/material-categories-data-grid'

interface MaterialCategoriesTabProps {
  searchQuery?: string
}

export function MaterialCategoriesTab({ searchQuery = '' }: MaterialCategoriesTabProps) {
  const [categories, setCategories] = useState<MaterialCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    setLoading(true)
    const data = await simulateApiCall(mockMaterialCategories, 800)
    setCategories(data)
    setLoading(false)
  }

  const filteredCategories = categories.filter(
    (category) =>
      category.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.categoryCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeCount = categories.filter(c => c.isActive).length
  const rawMaterialCount = categories.filter(c => c.materialType === 'raw_material').length
  const componentCount = categories.filter(c => c.materialType === 'component').length

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardDescription>Total Categories</CardDescription>
            <CardTitle className="text-2xl">{categories.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-2xl text-green-600">{activeCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardDescription>Raw Materials</CardDescription>
            <CardTitle className="text-2xl text-blue-600">{rawMaterialCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardDescription>Components</CardDescription>
            <CardTitle className="text-2xl text-purple-600">{componentCount}</CardTitle>
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
        <MaterialCategoriesDataGrid categories={filteredCategories} />
      )}

      {/* Floating Action Button */}
      <Button asChild>
        <Link
          href="/masters/material-categories/create"
          className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50 flex items-center justify-center"
        >
          <Plus className="h-6 w-6" />
        </Link>
      </Button>
    </div>
  )
}
