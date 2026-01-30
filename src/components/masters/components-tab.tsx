"use client"

import { useState, useEffect } from 'react'
import { Filter, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { componentService, ComponentResponse } from '@/lib/api/components'
import { toast } from 'sonner'
import { ComponentCategory } from '@/types'
import { ComponentsDataGrid } from '@/components/tables/components-data-grid'
import { AddComponentDialog } from '@/components/dialogs/add-component-dialog'

interface ComponentsTabProps {
  searchQuery?: string
}

export function ComponentsTab({ searchQuery = '' }: ComponentsTabProps) {
  const [components, setComponents] = useState<ComponentResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  useEffect(() => {
    loadComponents()
  }, [])

  const loadComponents = async () => {
    setLoading(true)
    try {
      const data = await componentService.getAll()
      setComponents(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load components'
      toast.error(message)
      setComponents([])
    } finally {
      setLoading(false)
    }
  }

  const filteredComponents = components.filter((component) => {
    const matchesSearch =
      component.partNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      component.componentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      component.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      component.supplierName?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory =
      categoryFilter === 'all' || component.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  // Get unique manufacturers for stats
  const uniqueManufacturers = [...new Set(components.filter(c => c.manufacturer).map(c => c.manufacturer))]

  return (
    <div className="space-y-4">
      {/* Filter Row */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.values(ComponentCategory).map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards - Master data only (no inventory) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardDescription>Total Components</CardDescription>
            <CardTitle className="text-2xl">{components.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardDescription>Categories</CardDescription>
            <CardTitle className="text-2xl text-blue-600">
              {Object.keys(ComponentCategory).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardDescription>Manufacturers</CardDescription>
            <CardTitle className="text-2xl text-purple-600">
              {uniqueManufacturers.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardDescription>Search Results</CardDescription>
            <CardTitle className="text-2xl">{filteredComponents.length}</CardTitle>
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
        <ComponentsDataGrid components={filteredComponents} onUpdate={loadComponents} />
      )}

      {/* Add Component Dialog */}
      <AddComponentDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={loadComponents}
      />

      {/* Floating Action Button */}
      <Button
        onClick={() => setAddDialogOpen(true)}
        className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  )
}
