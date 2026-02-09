"use client"

import { useState, useEffect } from 'react'
import { inventoryService, InventoryResponse, InventoryTransactionResponse } from '@/lib/api/inventory'
import { componentService, ComponentResponse } from '@/lib/api/components'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Package, TrendingUp, Calendar, MapPin } from 'lucide-react'

interface ComponentDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  inventory: InventoryResponse
}

export function ComponentDetailsDialog({
  open,
  onOpenChange,
  inventory,
}: ComponentDetailsDialogProps) {
  const [component, setComponent] = useState<ComponentResponse | null>(null)
  const [transactions, setTransactions] = useState<InventoryTransactionResponse[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && inventory) {
      loadComponentDetails()
    }
  }, [open, inventory])

  const loadComponentDetails = async () => {
    setLoading(true)
    try {
      // Load component master data
      try {
        const compData = await componentService.getById(inventory.materialId)
        setComponent(compData)
      } catch (error) {
        console.warn('Could not load component master data:', error)
        setComponent(null)
      }

      // Load transactions
      const txData = await inventoryService.getTransactionsByMaterialId(inventory.materialId)
      setTransactions(txData)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load component details'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Component Details</DialogTitle>
          <DialogDescription>
            View component information and transaction history
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Component Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4 border-2">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Component Info</h3>
                </div>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Part Number:</dt>
                    <dd className="font-medium">{inventory.materialCode || 'N/A'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Name:</dt>
                    <dd className="font-medium">{inventory.materialName}</dd>
                  </div>
                  {component && (
                    <>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Category:</dt>
                        <dd className="font-medium">{component.category}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Manufacturer:</dt>
                        <dd className="font-medium">{component.manufacturer || 'N/A'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Supplier:</dt>
                        <dd className="font-medium">{component.supplierName || 'N/A'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Lead Time:</dt>
                        <dd className="font-medium">{component.leadTimeDays} days</dd>
                      </div>
                    </>
                  )}
                </dl>
              </Card>

              <Card className="p-4 border-2">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Stock Information</h3>
                </div>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Current Stock:</dt>
                    <dd className="font-bold text-lg">{(inventory.totalQuantity || 0).toFixed(2)} {inventory.uom}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Available:</dt>
                    <dd className="font-medium text-green-600">{(inventory.availableQuantity || 0).toFixed(2)} {inventory.uom}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Reserved:</dt>
                    <dd className="font-medium text-yellow-600">{(inventory.reservedQuantity || 0).toFixed(2)} {inventory.uom}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Min Stock Level:</dt>
                    <dd className="font-medium">{(inventory.minimumStock || 0).toFixed(2)} {inventory.uom}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Avg Cost/Unit:</dt>
                    <dd className="font-medium">₹{(inventory.averageCostPerUnit || 0).toFixed(2)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Total Value:</dt>
                    <dd className="font-bold">₹{(inventory.totalStockValue || 0).toFixed(2)}</dd>
                  </div>
                </dl>
              </Card>
            </div>

            {/* Additional Info */}
            <Card className="p-4 border-2">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Location & Dates</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-muted-foreground mb-1">Storage Location:</dt>
                  <dd className="font-medium">{inventory.primaryStorageLocation || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground mb-1">Warehouse Code:</dt>
                  <dd className="font-medium">{inventory.warehouseCode || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground mb-1">Last Stock In:</dt>
                  <dd className="font-medium">
                    {inventory.lastStockInDate ? format(new Date(inventory.lastStockInDate), 'MMM dd, yyyy') : 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground mb-1">Last Updated:</dt>
                  <dd className="font-medium">
                    {inventory.updatedAt ? format(new Date(inventory.updatedAt), 'MMM dd, yyyy') : 'N/A'}
                  </dd>
                </div>
              </div>
            </Card>

            {/* Transaction History */}
            <Card className="p-4 border-2">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Transaction History</h3>
              </div>
              {transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No transactions found
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Transaction No</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Created By</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.slice(0, 10).map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell>
                            {format(new Date(tx.transactionDate), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {tx.transactionNo}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              tx.transactionType === 'IN'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {tx.transactionType}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {(tx.quantity || 0).toFixed(2)} {tx.uom}
                          </TableCell>
                          <TableCell className="text-sm">
                            {tx.referenceNumber || 'N/A'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {tx.createdBy}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {transactions.length > 10 && (
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Showing 10 of {transactions.length} transactions
                    </p>
                  )}
                </div>
              )}
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
