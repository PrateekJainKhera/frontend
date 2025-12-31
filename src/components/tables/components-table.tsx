"use client"

import { useState } from 'react'
import { Component } from '@/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, Edit, AlertTriangle } from 'lucide-react'
import { ViewComponentDialog } from '@/components/dialogs/view-component-dialog'
import { EditComponentDialog } from '@/components/dialogs/edit-component-dialog'

interface ComponentsTableProps {
  components: Component[]
  onUpdate?: () => void
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'Bearing':
      return 'bg-blue-100 text-blue-700'
    case 'Gear':
      return 'bg-purple-100 text-purple-700'
    case 'Seal':
      return 'bg-green-100 text-green-700'
    case 'Coupling':
      return 'bg-amber-100 text-amber-700'
    case 'Shaft':
      return 'bg-gray-100 text-gray-700'
    case 'Bushing':
      return 'bg-cyan-100 text-cyan-700'
    case 'Fastener':
      return 'bg-pink-100 text-pink-700'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

export function ComponentsTable({ components, onUpdate }: ComponentsTableProps) {
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const handleView = (component: Component) => {
    setSelectedComponent(component)
    setViewDialogOpen(true)
  }

  const handleEdit = (component: Component) => {
    setSelectedComponent(component)
    setEditDialogOpen(true)
  }

  const handleSuccess = () => {
    if (onUpdate) {
      onUpdate()
    }
  }

  if (components.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No components found</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Part Number</TableHead>
              <TableHead>Component Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Manufacturer</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Unit Cost</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {components.map((component) => {
              const isLowStock = component.stockQty < component.minStockLevel

              return (
                <TableRow key={component.id}>
                  <TableCell className="font-mono font-semibold">
                    {component.partNumber}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate">{component.componentName}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getCategoryColor(component.category)}>
                      {component.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {component.manufacturer || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {isLowStock && (
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                      )}
                      <div>
                        <div className={`font-semibold ${isLowStock ? 'text-amber-600' : ''}`}>
                          {component.stockQty} {component.unit}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Min: {component.minStockLevel}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">
                    ₹{component.unitCost.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleView(component)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(component)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {selectedComponent && (
        <>
          <ViewComponentDialog
            component={selectedComponent}
            open={viewDialogOpen}
            onOpenChange={setViewDialogOpen}
          />
          <EditComponentDialog
            component={selectedComponent}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onSuccess={handleSuccess}
          />
        </>
      )}
    </>
  )
}
