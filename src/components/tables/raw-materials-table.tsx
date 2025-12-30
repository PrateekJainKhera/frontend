"use client"

import { RawMaterial } from '@/types'
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
import { Edit, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface RawMaterialsTableProps {
  materials: RawMaterial[]
}

export function RawMaterialsTable({ materials }: RawMaterialsTableProps) {
  if (materials.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No materials found</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Material Name</TableHead>
            <TableHead>Grade</TableHead>
            <TableHead>Shape</TableHead>
            <TableHead>Diameter</TableHead>
            <TableHead>Length</TableHead>
            <TableHead>Weight/Unit</TableHead>
            <TableHead>Stock Qty</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {materials.map((material) => {
            const isLowStock = material.stockQty < material.minStockLevel

            return (
              <TableRow key={material.id}>
                <TableCell className="font-medium">
                  {material.materialName}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{material.grade}</Badge>
                </TableCell>
                <TableCell>{material.shape}</TableCell>
                <TableCell className="text-sm">⌀{material.diameter}mm</TableCell>
                <TableCell className="text-sm">{material.lengthInMM}mm</TableCell>
                <TableCell className="font-mono text-sm">
                  {material.weightKG.toFixed(2)} kg
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <span className={isLowStock ? 'text-destructive font-semibold' : ''}>
                      {material.stockQty}
                    </span>
                    <span className="text-muted-foreground text-xs ml-1">
                      (min: {material.minStockLevel})
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {isLowStock ? (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Low Stock
                    </Badge>
                  ) : (
                    <Badge variant="secondary">In Stock</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {/* Low Stock Alert */}
      {materials.some(m => m.stockQty < m.minStockLevel) && (
        <div className="p-4 bg-muted/50">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {materials.filter(m => m.stockQty < m.minStockLevel).length} material(s) below minimum stock level.
              Reorder required.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  )
}
