"use client"

import { useState, useEffect } from "react"
import { Check, Clock, Package2, AlertTriangle, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { materialPieceService, MaterialPieceResponse, SuggestedPiece } from "@/lib/api/material-pieces"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

interface SelectedPieceInfo {
  piece: MaterialPieceResponse
  quantityMM: number
}

interface PieceSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  materialId: number
  materialName: string
  materialGrade?: string
  requiredLengthMM: number
  onConfirm: (selectedPieces: SelectedPieceInfo[]) => void
}

export function PieceSelectionDialog({
  open,
  onOpenChange,
  materialId,
  materialName,
  materialGrade,
  requiredLengthMM,
  onConfirm,
}: PieceSelectionDialogProps) {
  const [loading, setLoading] = useState(true)
  const [availablePieces, setAvailablePieces] = useState<MaterialPieceResponse[]>([])
  const [suggestedPieces, setSuggestedPieces] = useState<SuggestedPiece[]>([])
  const [selectedPieceIds, setSelectedPieceIds] = useState<Set<number>>(new Set())
  const [customQuantities, setCustomQuantities] = useState<Map<number, number>>(new Map())

  useEffect(() => {
    if (open && materialId) {
      loadPieces()
    }
  }, [open, materialId])

  const loadPieces = async () => {
    try {
      setLoading(true)
      const pieces = await materialPieceService.getAvailableByMaterialId(materialId)
      setAvailablePieces(pieces)

      // Get auto-suggestions
      const suggestions = materialPieceService.suggestPieces(pieces, requiredLengthMM)
      setSuggestedPieces(suggestions)

      // Auto-select suggested pieces
      const suggestedIds = new Set(suggestions.map(s => s.id))
      setSelectedPieceIds(suggestedIds)

      // Set suggested quantities
      const quantities = new Map<number, number>()
      suggestions.forEach(s => {
        quantities.set(s.id, s.suggestedQuantityMM)
      })
      setCustomQuantities(quantities)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load pieces")
    } finally {
      setLoading(false)
    }
  }

  const togglePieceSelection = (pieceId: number, currentLengthMM: number) => {
    const newSelected = new Set(selectedPieceIds)
    const newQuantities = new Map(customQuantities)

    if (newSelected.has(pieceId)) {
      newSelected.delete(pieceId)
      newQuantities.delete(pieceId)
    } else {
      newSelected.add(pieceId)
      // Default to using the full piece or remaining required length, whichever is smaller
      const totalSelected = getTotalSelectedLength(newSelected, newQuantities)
      const remaining = requiredLengthMM - totalSelected
      newQuantities.set(pieceId, Math.min(currentLengthMM, remaining + currentLengthMM))
    }

    setSelectedPieceIds(newSelected)
    setCustomQuantities(newQuantities)
  }

  const updateQuantity = (pieceId: number, quantity: number) => {
    const piece = availablePieces.find(p => p.id === pieceId)
    if (!piece) return

    const newQuantities = new Map(customQuantities)
    const clampedQuantity = Math.min(Math.max(0, quantity), piece.currentLengthMM)
    newQuantities.set(pieceId, clampedQuantity)
    setCustomQuantities(newQuantities)
  }

  const getTotalSelectedLength = (
    selectedIds: Set<number> = selectedPieceIds,
    quantities: Map<number, number> = customQuantities
  ): number => {
    return Array.from(selectedIds).reduce((total, id) => {
      return total + (quantities.get(id) || 0)
    }, 0)
  }

  const handleConfirm = () => {
    const selectedPieces: SelectedPieceInfo[] = Array.from(selectedPieceIds).map(id => {
      const piece = availablePieces.find(p => p.id === id)!
      return {
        piece,
        quantityMM: customQuantities.get(id) || piece.currentLengthMM
      }
    })

    onConfirm(selectedPieces)
    onOpenChange(false)
  }

  const totalSelected = getTotalSelectedLength()
  const shortage = Math.max(0, requiredLengthMM - totalSelected)
  const isSufficient = totalSelected >= requiredLengthMM

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package2 className="h-5 w-5" />
            Select Material Pieces
          </DialogTitle>
          <DialogDescription>
            {materialName} {materialGrade && `(${materialGrade})`}
            <br />
            Required: {requiredLengthMM.toFixed(2)} mm
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : availablePieces.length === 0 ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No available pieces found for this material.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              {/* Summary */}
              <div className="bg-slate-50 p-4 rounded-lg border space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Selected:</span>
                  <span className={`text-lg font-bold ${isSufficient ? 'text-green-600' : 'text-red-600'}`}>
                    {totalSelected.toFixed(2)} mm
                  </span>
                </div>
                {!isSufficient && shortage > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-red-600">Shortage:</span>
                    <span className="font-semibold text-red-600">{shortage.toFixed(2)} mm</span>
                  </div>
                )}
                {isSufficient && totalSelected > requiredLengthMM && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-orange-600">Waste:</span>
                    <span className="font-semibold text-orange-600">
                      {(totalSelected - requiredLengthMM).toFixed(2)} mm (
                      {(((totalSelected - requiredLengthMM) / requiredLengthMM) * 100).toFixed(1)}%)
                    </span>
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  {selectedPieceIds.size} piece(s) selected from {availablePieces.length} available
                </div>
              </div>

              {/* Pieces List */}
              <div className="space-y-2">
                {availablePieces.map((piece) => {
                  const isSelected = selectedPieceIds.has(piece.id)
                  const isSuggested = suggestedPieces.some(s => s.id === piece.id)
                  const suggestedPiece = suggestedPieces.find(s => s.id === piece.id)
                  const selectedQuantity = customQuantities.get(piece.id) || piece.currentLengthMM

                  return (
                    <div
                      key={piece.id}
                      className={`border rounded-lg p-4 transition-all ${
                        isSelected
                          ? 'bg-blue-50 border-blue-300 shadow-sm'
                          : isSuggested
                          ? 'bg-green-50 border-green-300'
                          : 'bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => togglePieceSelection(piece.id, piece.currentLengthMM)}
                          className="mt-1"
                        />

                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm">{piece.pieceNo}</span>
                              {isSuggested && (
                                <Badge className="bg-green-600 text-xs">
                                  <Check className="h-3 w-3 mr-1" />
                                  Suggested
                                </Badge>
                              )}
                              {piece.storageLocation && (
                                <span className="text-xs text-muted-foreground">
                                  📍 {piece.storageLocation}
                                  {piece.binNumber && ` - ${piece.binNumber}`}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {new Date(piece.receivedDate).toLocaleDateString()}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <div className="text-muted-foreground text-xs">Current Length</div>
                              <div className="font-medium">{piece.currentLengthMM.toFixed(2)} mm</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground text-xs">Weight</div>
                              <div className="font-medium">{piece.currentWeightKG.toFixed(2)} kg</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground text-xs">Usage</div>
                              <div className="font-medium">{piece.usagePercentage.toFixed(0)}%</div>
                            </div>
                            {piece.grnNo && (
                              <div>
                                <div className="text-muted-foreground text-xs">GRN</div>
                                <div className="font-medium text-xs">{piece.grnNo}</div>
                              </div>
                            )}
                          </div>

                          {isSelected && (
                            <div className="pt-2 border-t">
                              <label className="text-xs text-muted-foreground block mb-1">
                                Quantity to Use (mm)
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  max={piece.currentLengthMM}
                                  step="0.01"
                                  value={selectedQuantity}
                                  onChange={(e) => updateQuantity(piece.id, parseFloat(e.target.value))}
                                  className="w-32 px-2 py-1 border rounded text-sm"
                                />
                                <span className="text-xs text-muted-foreground">
                                  Max: {piece.currentLengthMM.toFixed(2)} mm
                                </span>
                                {suggestedPiece && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs h-7"
                                    onClick={() => updateQuantity(piece.id, suggestedPiece.suggestedQuantityMM)}
                                  >
                                    Use Suggested ({suggestedPiece.suggestedQuantityMM.toFixed(2)} mm)
                                  </Button>
                                )}
                              </div>
                              {suggestedPiece && suggestedPiece.wastePercentage > 0 && (
                                <div className="text-xs text-orange-600 mt-1">
                                  Estimated waste: {suggestedPiece.wastePercentage.toFixed(1)}%
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedPieceIds.size === 0}
            className={!isSufficient ? 'bg-orange-600 hover:bg-orange-700' : ''}
          >
            {isSufficient ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Confirm Selection
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Confirm (Insufficient)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
