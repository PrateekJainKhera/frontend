'use client'

import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Package,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  Warehouse,
  Weight,
  Ruler,
  Calendar,
  Building2,
} from 'lucide-react'
import { MaterialRequisition } from '@/types/material-issue'
import { MaterialPiece } from '@/types/raw-material-inventory'
import { rawMaterialInventories } from '@/lib/mock-data/raw-material-inventory'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface MaterialAllocationDialogProps {
  open: boolean
  onClose: () => void
  requisition: MaterialRequisition | null
}

export function MaterialAllocationDialog({
  open,
  onClose,
  requisition,
}: MaterialAllocationDialogProps) {
  const [selectedPieces, setSelectedPieces] = useState<Set<string>>(new Set())
  const [allocatedLengths, setAllocatedLengths] = useState<Record<string, number>>({})

  if (!requisition) return null

  const material = requisition.materials[0] // For now, handle single material
  const requiredLength = material.dimensions.length || 0
  const requiredQuantity = material.quantityRequired
  const totalRequiredLength = requiredLength * requiredQuantity

  // Find available inventory pieces
  const availablePieces = useMemo(() => {
    const inventory = rawMaterialInventories.find(
      inv => inv.grade === material.materialGrade
    )

    if (!inventory) return []

    // Map MaterialPiece to expected format and filter
    return inventory.pieces
      .filter((piece: MaterialPiece) =>
        piece.status === 'Available' &&
        piece.currentLength &&
        piece.currentLength >= requiredLength
      )
      .map((piece: MaterialPiece) => ({
        pieceId: piece.id,
        pieceNumber: `${piece.grade}-${piece.diameter}-${piece.id.slice(-3)}`,
        currentLength: piece.currentLength || 0,
        weight: piece.currentWeight || 0,
        status: piece.status,
        location: piece.location,
        grnNumber: piece.batchNumber || 'N/A',
        receivedDate: piece.purchaseDate,
        supplier: piece.supplierName,
      }))
      .sort((a, b) => {
        // Sort by best fit (minimal wastage)
        const wasteA = a.currentLength - requiredLength
        const wasteB = b.currentLength - requiredLength
        return wasteA - wasteB
      })
  }, [material.materialGrade, requiredLength])

  // Calculate allocation summary
  const allocationSummary = useMemo(() => {
    let totalPieces = selectedPieces.size
    let totalLength = 0
    let totalWeight = 0

    selectedPieces.forEach(pieceId => {
      const piece = availablePieces.find(p => p.pieceId === pieceId)
      if (piece) {
        const allocLength = allocatedLengths[pieceId] || requiredLength
        totalLength += allocLength
        totalWeight += (allocLength / piece.currentLength) * piece.weight
      }
    })

    const fulfillmentPercent = (totalLength / totalRequiredLength) * 100
    const wastage = totalLength - totalRequiredLength
    const wastagePercent = totalLength > 0 ? (wastage / totalLength) * 100 : 0

    return {
      totalPieces,
      totalLength,
      totalWeight,
      fulfillmentPercent,
      wastage,
      wastagePercent,
      isComplete: totalLength >= totalRequiredLength,
    }
  }, [selectedPieces, allocatedLengths, requiredLength, totalRequiredLength, availablePieces])

  const togglePieceSelection = (pieceId: string) => {
    const newSelected = new Set(selectedPieces)
    if (newSelected.has(pieceId)) {
      newSelected.delete(pieceId)
      const newLengths = { ...allocatedLengths }
      delete newLengths[pieceId]
      setAllocatedLengths(newLengths)
    } else {
      newSelected.add(pieceId)
      setAllocatedLengths({
        ...allocatedLengths,
        [pieceId]: requiredLength,
      })
    }
    setSelectedPieces(newSelected)
  }

  const updateAllocatedLength = (pieceId: string, length: number) => {
    const piece = availablePieces.find(p => p.pieceId === pieceId)
    if (!piece) return

    // Validate length
    if (length <= 0 || length > piece.currentLength) {
      toast.error('Invalid length', {
        description: `Length must be between 1 and ${piece.currentLength}mm`,
      })
      return
    }

    setAllocatedLengths({
      ...allocatedLengths,
      [pieceId]: length,
    })
  }

  const autoSelectOptimalPieces = () => {
    const newSelected = new Set<string>()
    const newLengths: Record<string, number> = {}
    let remainingLength = totalRequiredLength

    // Greedy algorithm: select pieces with minimal wastage
    for (const piece of availablePieces) {
      if (remainingLength <= 0) break

      const allocLength = Math.min(piece.currentLength, remainingLength)
      newSelected.add(piece.pieceId)
      newLengths[piece.pieceId] = allocLength
      remainingLength -= allocLength
    }

    setSelectedPieces(newSelected)
    setAllocatedLengths(newLengths)

    toast.success('Optimal pieces selected', {
      description: `Selected ${newSelected.size} pieces with minimal wastage`,
    })
  }

  const handleAllocate = () => {
    if (selectedPieces.size === 0) {
      toast.error('No pieces selected', {
        description: 'Please select at least one piece to allocate',
      })
      return
    }

    if (!allocationSummary.isComplete) {
      toast.warning('Partial allocation', {
        description: `Only ${allocationSummary.fulfillmentPercent.toFixed(1)}% of requirement fulfilled. Continue anyway?`,
      })
    }

    // Simulate allocation
    toast.success('Materials allocated successfully', {
      description: `${allocationSummary.totalPieces} pieces allocated to ${requisition.jobCardNo}`,
    })

    onClose()
  }

  const getPieceStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Available': 'bg-green-100 text-green-800 border-green-300',
      'Reserved': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'InUse': 'bg-blue-100 text-blue-800 border-blue-300',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Allocate Materials - {requisition.requisitionNo}
          </DialogTitle>
          <DialogDescription>
            Select inventory pieces to fulfill material requisition for {requisition.jobCardNo}
          </DialogDescription>
        </DialogHeader>

        {/* Requirement Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Requirement Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Material</p>
                <p className="font-semibold">{material.materialName}</p>
                <p className="text-xs text-muted-foreground">{material.materialGrade}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dimensions</p>
                <p className="font-semibold">Ø {material.dimensions.diameter}mm</p>
                <p className="text-xs text-muted-foreground">
                  {requiredLength}mm per piece
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Quantity Required</p>
                <p className="font-semibold">{requiredQuantity} {material.unit}</p>
                <p className="text-xs text-muted-foreground">
                  Total: {(totalRequiredLength / 1000).toFixed(2)}m
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Job Card</p>
                <p className="font-semibold">{requisition.jobCardNo}</p>
                <p className="text-xs text-muted-foreground">{requisition.orderNo}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Allocation Summary */}
        {selectedPieces.size > 0 && (
          <Card className={allocationSummary.isComplete ? 'border-green-300 bg-green-50' : 'border-orange-300 bg-orange-50'}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {allocationSummary.isComplete ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                )}
                Allocation Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Pieces Selected</p>
                  <p className="text-xl font-bold">{allocationSummary.totalPieces}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Length</p>
                  <p className="text-xl font-bold">{(allocationSummary.totalLength / 1000).toFixed(2)}m</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Weight</p>
                  <p className="text-xl font-bold">{allocationSummary.totalWeight.toFixed(2)}kg</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fulfillment</p>
                  <p className={`text-xl font-bold ${allocationSummary.isComplete ? 'text-green-600' : 'text-orange-600'}`}>
                    {allocationSummary.fulfillmentPercent.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expected Wastage</p>
                  <p className="text-xl font-bold text-red-600">
                    {allocationSummary.wastagePercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Pieces */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Available Inventory Pieces</h3>
              <p className="text-sm text-muted-foreground">
                {availablePieces.length} pieces available (sorted by best fit)
              </p>
            </div>
            <Button onClick={autoSelectOptimalPieces} variant="outline" size="sm">
              <TrendingDown className="mr-2 h-4 w-4" />
              Auto Select (Minimal Wastage)
            </Button>
          </div>

          {availablePieces.length === 0 ? (
            <Card className="border-red-300 bg-red-50">
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-2" />
                  <p className="font-semibold text-red-900">No suitable pieces available</p>
                  <p className="text-sm text-red-700 mt-1">
                    No pieces found with sufficient length ({requiredLength}mm)
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Select</TableHead>
                    <TableHead>Piece Number</TableHead>
                    <TableHead>Current Length</TableHead>
                    <TableHead>Allocate Length</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Wastage</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>GRN Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availablePieces.map((piece) => {
                    const isSelected = selectedPieces.has(piece.pieceId)
                    const allocLength = allocatedLengths[piece.pieceId] || requiredLength
                    const wastage = piece.currentLength - allocLength
                    const wastagePercent = (wastage / piece.currentLength) * 100

                    return (
                      <TableRow key={piece.pieceId} className={isSelected ? 'bg-blue-50' : ''}>
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => togglePieceSelection(piece.pieceId)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{piece.pieceNumber}</span>
                            <Badge
                              variant="outline"
                              className={`w-fit text-xs mt-1 ${getPieceStatusColor(piece.status)}`}
                            >
                              {piece.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Ruler className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium">{piece.currentLength}mm</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {isSelected ? (
                            <Input
                              type="number"
                              value={allocLength}
                              onChange={(e) => updateAllocatedLength(piece.pieceId, Number(e.target.value))}
                              className="w-24"
                              min={1}
                              max={piece.currentLength}
                            />
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Weight className="h-3 w-3 text-muted-foreground" />
                            <span>{piece.weight.toFixed(2)}kg</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {isSelected ? (
                            <div className="flex flex-col">
                              <span className="font-medium text-red-600">{wastage}mm</span>
                              <span className="text-xs text-muted-foreground">
                                {wastagePercent.toFixed(1)}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Warehouse className="h-3 w-3 text-muted-foreground" />
                            <span>{piece.location}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-xs">
                            <span className="font-medium">{piece.grnNumber}</span>
                            <span className="text-muted-foreground">
                              {format(new Date(piece.receivedDate), 'dd MMM yyyy')}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAllocate}
            disabled={selectedPieces.size === 0}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Allocate {selectedPieces.size} Piece{selectedPieces.size !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
