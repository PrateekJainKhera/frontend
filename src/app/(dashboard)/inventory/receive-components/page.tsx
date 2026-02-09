"use client"

import { useState, useEffect } from 'react'
import { PackagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { inventoryService, InventoryResponse } from '@/lib/api/inventory'
import { toast } from 'sonner'
import { ReceiveComponentDialog } from '@/components/dialogs/receive-component-dialog'
import { ComponentInventoryDataGrid } from '@/components/tables/component-inventory-data-grid'

export default function ReceiveComponentsPage() {
  const [inventory, setInventory] = useState<InventoryResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false)

  useEffect(() => {
    loadInventory()
  }, [])

  const loadInventory = async () => {
    setLoading(true)
    try {
      const data = await inventoryService.getAll()
      setInventory(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load inventory'
      toast.error(message)
      setInventory([])
    } finally {
      setLoading(false)
    }
  }

  // Filter inventory for components (non raw materials)
  const componentInventory = inventory.filter((item) => {
    // Assuming components have UOM as PCS, SET, etc. (not mm or kg)
    const isComponent = item.uom !== 'mm' && item.uom !== 'kg'
    return isComponent
  })

  const totalComponents = componentInventory.length
  const lowStock = componentInventory.filter(i => i.isLowStock).length
  const outOfStock = componentInventory.filter(i => i.isOutOfStock).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Receive Components</h1>
          <p className="text-muted-foreground text-sm">
            Receive purchased components directly into inventory
          </p>
        </div>
        <Button onClick={() => setReceiveDialogOpen(true)}>
          <PackagePlus className="mr-2 h-4 w-4" />
          Receive Component
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-4">
          <p className="text-sm text-muted-foreground">Total Components</p>
          <p className="text-2xl font-bold">{totalComponents}</p>
        </Card>
        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-4">
          <p className="text-sm text-muted-foreground">Available</p>
          <p className="text-2xl font-bold text-green-600">
            {totalComponents - lowStock - outOfStock}
          </p>
        </Card>
        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-4">
          <p className="text-sm text-muted-foreground">Low Stock</p>
          <p className="text-2xl font-bold text-yellow-600">{lowStock}</p>
        </Card>
        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-4">
          <p className="text-sm text-muted-foreground">Out of Stock</p>
          <p className="text-2xl font-bold text-red-600">{outOfStock}</p>
        </Card>
      </div>

      {/* Component Inventory Data Grid */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : componentInventory.length === 0 ? (
        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-8 text-center">
          <p className="text-muted-foreground">No component inventory found</p>
          <p className="text-sm text-muted-foreground mt-2">
            Click "Receive Component" to add components to inventory
          </p>
        </Card>
      ) : (
        <ComponentInventoryDataGrid inventory={componentInventory} />
      )}

      {/* Receive Component Dialog */}
      <ReceiveComponentDialog
        open={receiveDialogOpen}
        onOpenChange={setReceiveDialogOpen}
        onSuccess={loadInventory}
      />
    </div>
  )
}
