"use client"

import { ComponentResponse } from '@/lib/api/components'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  Building2,
  Truck,
  Calendar,
  Clock,
  FileText,
} from 'lucide-react'
import { formatDate } from '@/lib/utils/formatters'

interface ViewComponentDialogProps {
  component: ComponentResponse
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

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Unit</p>
                  <p className="font-medium">{component.unit}</p>
                </div>
              </div>
            </div>
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
                  <p className="text-sm">{formatDate(new Date(component.createdAt))}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Last Updated</p>
                  <p className="text-sm">{formatDate(new Date(component.updatedAt))}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
