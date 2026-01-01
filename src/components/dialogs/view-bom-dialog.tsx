"use client"

import { ProductBOM } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { BOMTable } from '@/components/tables/bom-table'
import { calculateBOMCost, groupBOMItemsByType, getItemsRequiringApproval } from '@/lib/utils/bom-calculations'
import { Package, Layers, AlertCircle, CheckCircle, DollarSign } from 'lucide-react'

interface ViewBOMDialogProps {
  bom: ProductBOM
  open: boolean
  onOpenChange: (open: boolean) => void
  productName?: string
}

export function ViewBOMDialog({
  bom,
  open,
  onOpenChange,
  productName,
}: ViewBOMDialogProps) {
  const totalCost = calculateBOMCost(bom)
  const { components, rawMaterials } = groupBOMItemsByType(bom)
  const approvalItems = getItemsRequiringApproval(bom)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl">Bill of Materials</DialogTitle>
              <DialogDescription className="mt-2">
                {productName && <span className="font-semibold">{productName}</span>}
                {productName && ' • '}
                Version: {bom.bomVersion}
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              {bom.isActive ? (
                <Badge className="bg-green-100 text-green-700">Active</Badge>
              ) : (
                <Badge className="bg-gray-100 text-gray-700">Inactive</Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Components</p>
                  <p className="text-2xl font-bold">{components.length}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                  <Layers className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Raw Materials</p>
                  <p className="text-2xl font-bold">{rawMaterials.length}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Need Approval</p>
                  <p className="text-2xl font-bold">{approvalItems.length}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cost per Unit</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₹{totalCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* BOM Notes */}
          {bom.notes && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <p className="text-sm font-semibold text-blue-900">BOM Notes</p>
              <p className="text-sm text-blue-700 mt-1">{bom.notes}</p>
            </Card>
          )}

          {/* BOM Items Table */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase">
              BOM Items ({bom.bomItems.length} total)
            </h4>
            <BOMTable bomItems={bom.bomItems} showStockInfo={false} />
          </div>

          {/* Approval Summary */}
          {approvalItems.length > 0 && (
            <div className="space-y-3 pt-4 border-t">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                Items Requiring Approval ({approvalItems.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {approvalItems.map((item) => (
                  <Card key={item.id} className="p-3 bg-orange-50 border-orange-200">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{item.itemName}</p>
                        <p className="text-xs text-muted-foreground font-mono">{item.itemCode}</p>
                        {item.approvedSuppliers && item.approvedSuppliers.length > 0 && (
                          <div className="mt-2 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <p className="text-xs text-green-700">
                              Approved: {item.approvedSuppliers.join(', ')}
                            </p>
                          </div>
                        )}
                        {item.notes && (
                          <p className="text-xs text-orange-700 mt-1">{item.notes}</p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Component vs Raw Material Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground uppercase mb-3 flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-600" />
                Components ({components.length})
              </h4>
              <div className="space-y-2">
                {components.map((item) => (
                  <Card key={item.id} className="p-3">
                    <p className="font-semibold text-sm">{item.itemName}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} {item.unit} • {item.itemCode}
                    </p>
                  </Card>
                ))}
                {components.length === 0 && (
                  <p className="text-sm text-muted-foreground">No components</p>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-muted-foreground uppercase mb-3 flex items-center gap-2">
                <Layers className="h-4 w-4 text-purple-600" />
                Raw Materials ({rawMaterials.length})
              </h4>
              <div className="space-y-2">
                {rawMaterials.map((item) => (
                  <Card key={item.id} className="p-3">
                    <p className="font-semibold text-sm">{item.itemName}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} {item.unit} • {item.itemCode}
                    </p>
                  </Card>
                ))}
                {rawMaterials.length === 0 && (
                  <p className="text-sm text-muted-foreground">No raw materials</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
