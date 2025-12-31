"use client"

import { RawMaterial } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils/formatters'
import { Package, Ruler, Weight, Box, AlertTriangle, Calendar } from 'lucide-react'

interface ViewRawMaterialDialogProps {
  material: RawMaterial
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewRawMaterialDialog({
  material,
  open,
  onOpenChange,
}: ViewRawMaterialDialogProps) {
  const isLowStock = material.stockQty < material.minStockLevel

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Raw Material Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold">{material.materialName}</h3>
              <Badge variant="outline" className="mt-2">{material.grade}</Badge>
            </div>
            {isLowStock && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Low Stock
              </Badge>
            )}
          </div>

          {/* Material Specifications */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase">
              Material Specifications
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Box className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Shape</p>
                  <p className="font-medium">{material.shape}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Ruler className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Diameter</p>
                  <p className="font-medium">{material.diameter} mm</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Ruler className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Length</p>
                  <p className="font-medium">{material.lengthInMM} mm</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Weight className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Weight</p>
                  <p className="font-medium">{material.weightKG} kg</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Weight className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Density</p>
                  <p className="font-medium">{material.density} g/cm³</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stock Information */}
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase">
              Stock Information
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  isLowStock ? 'bg-destructive/10' : 'bg-primary/10'
                }`}>
                  <Package className={`h-5 w-5 ${
                    isLowStock ? 'text-destructive' : 'text-primary'
                  }`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Current Stock</p>
                  <p className={`text-2xl font-bold ${isLowStock ? 'text-destructive' : 'text-green-600'}`}>
                    {material.stockQty}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Min Stock Level</p>
                  <p className="text-2xl font-bold">{material.minStockLevel}</p>
                </div>
              </div>
            </div>

            {isLowStock && (
              <div className="bg-destructive/10 border border-destructive/20 rounded p-3 mt-3">
                <p className="text-sm text-destructive font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Stock level is below minimum. Reorder required.
                </p>
              </div>
            )}
          </div>

          {/* System Information */}
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase">
              System Information
            </h4>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created On</p>
                <p className="font-medium">{formatDate(material.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
