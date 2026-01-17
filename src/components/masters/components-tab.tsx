"use client"

import { useState, useEffect } from 'react'
import { Search, Filter, Plus } from 'lucide-react'
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
import { mockComponents } from '@/lib/mock-data'
import { simulateApiCall } from '@/lib/utils/mock-api'
import { Component, ComponentCategory } from '@/types'
import { ComponentsTable } from '@/components/tables/components-table'
import { AddComponentDialog } from '@/components/dialogs/add-component-dialog'

export function ComponentsTab() {
  const [components, setComponents] = useState<Component[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  useEffect(() => {
    loadComponents()
  }, [])

  const loadComponents = async () => {
    setLoading(true)
    const data = await simulateApiCall(mockComponents, 800)
    setComponents(data)
    setLoading(false)
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

  const lowStockComponents = components.filter(
    (c) => c.stockQty < c.minStockLevel
  ).length

  const totalValue = components.reduce(
    (sum, c) => sum + c.stockQty * c.unitCost,
    0
  )

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-4">
          <p className="text-sm text-muted-foreground">Total Components</p>
          <p className="text-2xl font-bold">{components.length}</p>
        </Card>
        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-4">
          <p className="text-sm text-muted-foreground">Low Stock Items</p>
          <p className="text-2xl font-bold text-amber-600">{lowStockComponents}</p>
        </Card>
        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-4">
          <p className="text-sm text-muted-foreground">Total Inventory Value</p>
          <p className="text-2xl font-bold text-green-600">
            ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
        </Card>
        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-4">
          <p className="text-sm text-muted-foreground">Categories</p>
          <p className="text-2xl font-bold text-blue-600">
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
