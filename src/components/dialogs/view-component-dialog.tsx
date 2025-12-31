"use client"

import { Component } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  Package,
  Building2,
  Truck,
  DollarSign,
  Calendar,
  MapPin,
  Clock,
  FileText,
  AlertTriangle
} from 'lucide-react'
import { formatDate } from '@/lib/utils/formatters'

interface ViewComponentDialogProps {
  component: Component
  open: boolean
  onOpenChange: (open: boolean) => void
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

export function ViewComponentDialog({
  component,
  open,
  onOpenChange,
}: ViewComponentDialogProps) {
  const isLowStock = component.stockQty < component.minStockLevel

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl">{component.componentName}</DialogTitle>
              <DialogDescription className="mt-2">
                <span className="font-mono text-base">{component.partNumber}</span>
              </DialogDescription>
            </div>
            <Badge className={`${getCategoryColor(component.category)} text-base px-4 py-1`}>
              {component.category}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Component Details */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase">
              Component Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {component.manufacturer && (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Manufacturer</p>
                    <p className="font-medium">{component.manufacturer}</p>
                  </div>
                </div>
              )}

              {component.supplierName && (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Truck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Supplier</p>
                    <p className="font-medium">{component.supplierName}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Lead Time</p>
                  <p className="font-medium">{component.leadTimeDays} days</p>
                </div>
              </div>

              {component.location && (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Storage Location</p>
                    <p className="font-medium">{component.location}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stock & Cost Information */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase">
              Stock & Cost Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isLowStock ? 'bg-amber-100' : 'bg-primary/10'}`}>
                  <Package className={`h-5 w-5 ${isLowStock ? 'text-amber-600' : 'text-primary'}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Current Stock</p>
                  <p className={`font-medium text-lg ${isLowStock ? 'text-amber-600' : ''}`}>
                    {component.stockQty} {component.unit}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Min Stock Level</p>
                  <p className="font-medium text-lg">{component.minStockLevel} {component.unit}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Unit Cost</p>
                  <p className="font-medium text-lg text-green-600">₹{component.unitCost.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {isLowStock && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-900">Low Stock Warning</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Current stock ({component.stockQty} {component.unit}) is below minimum level ({component.minStockLevel} {component.unit}).
                      Consider reordering soon.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Specifications */}
          {component.specifications && (
            <div className="space-y-3 pt-4 border-t">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Technical Specifications
              </h4>
              <p className="text-sm bg-muted p-3 rounded font-mono">
                {component.specifications}
              </p>
            </div>
          )}

          {/* Notes */}
          {component.notes && (
            <div className="space-y-3 pt-4 border-t">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase">
                Notes
              </h4>
              <p className="text-sm bg-muted p-3 rounded">{component.notes}</p>
            </div>
          )}

          {/* System Information */}
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase">
              System Information
            </h4>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="grid grid-cols-2 gap-4 flex-1">
                <div>
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-sm">{formatDate(component.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Last Updated</p>
                  <p className="text-sm">{formatDate(component.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
