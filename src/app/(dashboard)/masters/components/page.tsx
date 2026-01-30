"use client"

import { useState, useEffect } from 'react'
import { Search, Filter, Settings2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
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
import { ComponentsTable } from '@/components/tables/components-table'
import { AddComponentDialog } from '@/components/dialogs/add-component-dialog'

export default function ComponentsPage() {
  const [components, setComponents] = useState<ComponentResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
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

  // Count unique categories
  const uniqueCategories = new Set(components.map(c => c.category)).size

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* <h1 className="sr-only">Components & Parts</h1> */}
        <Button onClick={() => setAddDialogOpen(true)} className="ml-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Component
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-4">
          <p className="text-sm text-muted-foreground">Total Components</p>
          <p className="text-2xl font-bold">{components.length}</p>
        </Card>
        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-4">
          <p className="text-sm text-muted-foreground">Categories</p>
          <p className="text-2xl font-bold text-blue-600">
            {uniqueCategories}
          </p>
        </Card>
        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-4">
          <p className="text-sm text-muted-foreground">Available Types</p>
          <p className="text-2xl font-bold text-green-600">
            {Object.keys(ComponentCategory).length}
          </p>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by part number, name, manufacturer, or supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-45">
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
      </Card>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : (
        <ComponentsTable components={filteredComponents} onUpdate={loadComponents} />
      )}

      {/* Add Component Dialog */}
      <AddComponentDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={loadComponents}
      />
    </div>
  )
}
