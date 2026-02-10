"use client"

import { useEffect, useState } from "react"
import { Package, AlertTriangle, CheckCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { inventoryService } from "@/lib/api/inventory"

interface ComponentSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  componentId: number
  componentName: string
  componentCode?: string
  requiredQuantity: number
  uom?: string
  onConfirm: () => void
}

export function ComponentSelectionDialog({
  open,
  onOpenChange,
  componentId,
  componentName,
  componentCode,
  requiredQuantity,
  uom,
  onConfirm,
}: ComponentSelectionDialogProps) {
  const [loading, setLoading] = useState(true)
  const [availableStock, setAvailableStock] = useState(0)
  const [currentStock, setCurrentStock] = useState(0)
  const [stockUom, setStockUom] = useState(uom || "PCS")
  const [stockLocation, setStockLocation] = useState("")

  useEffect(() => {
    if (open && componentId) {
      loadStock()
    }
  }, [open, componentId])

  const loadStock = async () => {
    try {
      setLoading(true)
      const stock = await inventoryService.getComponentStock(componentId)
      setAvailableStock(stock.availableStock)
      setCurrentStock(stock.currentStock)
      setStockUom(stock.uom || uom || "PCS")
      setStockLocation(stock.location || "")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load component stock")
    } finally {
      setLoading(false)
    }
  }

  const isSufficient = availableStock >= requiredQuantity
  const displayUom = stockUom || uom || "PCS"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Component Stock Check
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Component Info */}
          <div className="rounded-lg border p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{componentName}</span>
              {componentCode && (
                <Badge variant="outline" className="text-xs">{componentCode}</Badge>
              )}
            </div>
            {stockLocation && (
              <p className="text-xs text-muted-foreground">Location: {stockLocation}</p>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-6">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="ml-2 text-sm text-muted-foreground">Loading stock...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Stock Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Available Stock</p>
                  <p className="text-2xl font-bold text-green-600">{availableStock}</p>
                  <p className="text-xs text-muted-foreground">{displayUom}</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Required</p>
                  <p className="text-2xl font-bold">{requiredQuantity}</p>
                  <p className="text-xs text-muted-foreground">{displayUom}</p>
                </div>
              </div>

              {/* Status Banner */}
              {isSufficient ? (
                <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2">
                  <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                  <p className="text-sm text-green-700">
                    Sufficient stock available. <strong>{requiredQuantity} {displayUom}</strong> will be deducted on issue.
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <p className="text-sm text-amber-700">
                    Insufficient stock. Available: <strong>{availableStock}</strong>, Required: <strong>{requiredQuantity}</strong>.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false)
              onConfirm()
            }}
            disabled={loading || !isSufficient}
            className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
          >
            <CheckCircle className="h-4 w-4" />
            Confirm Component
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
