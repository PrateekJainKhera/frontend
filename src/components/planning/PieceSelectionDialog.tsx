"use client"

import { useState, useEffect, useMemo } from "react"
import { Check, AlertTriangle, Scissors, ChevronDown, ChevronUp } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { materialPieceService, MaterialPieceResponse } from "@/lib/api/material-pieces"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

interface SelectedPieceInfo {
  piece: MaterialPieceResponse
  quantityMM: number
}

interface ChildPartInfo {
  childPartName: string
  pieceLengthMM: number
  piecesCount: number
  wastagePercent: number
}

interface PieceSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  materialId: number
  materialName: string
  materialGrade?: string
  requiredLengthMM: number
  childParts: ChildPartInfo[]
  onConfirm: (selectedPieces: SelectedPieceInfo[]) => void
}

function calcCuts(rodLengthMM: number, cutLengthMM: number): number {
  if (cutLengthMM <= 0) return 0
  return Math.floor(rodLengthMM / cutLengthMM)
}

export function PieceSelectionDialog({
  open,
  onOpenChange,
  materialId,
  materialName,
  materialGrade,
  requiredLengthMM,
  childParts,
  onConfirm,
}: PieceSelectionDialogProps) {
  const [loading, setLoading] = useState(true)
  const [availablePieces, setAvailablePieces] = useState<MaterialPieceResponse[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [customQuantities, setCustomQuantities] = useState<Map<number, number>>(new Map())

  const isSinglePart = childParts.length === 1
  const singlePart = isSinglePart ? childParts[0] : null
  const totalPiecesNeeded = childParts.reduce((s, cp) => s + cp.piecesCount, 0)

  useEffect(() => {
    if (open && materialId) loadPieces()
  }, [open, materialId])

  const loadPieces = async () => {
    try {
      setLoading(true)
      setSelectedIds(new Set())
      setCustomQuantities(new Map())
      setExpandedId(null)
      const pieces = await materialPieceService.getAvailableByMaterialId(materialId)
      setAvailablePieces(pieces)
      autoSelect(pieces)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load pieces")
    } finally {
      setLoading(false)
    }
  }

  const autoSelect = (pieces: MaterialPieceResponse[]) => {
    const available = pieces.filter(p => p.status === "Available")
    if (available.length === 0) return

    const sorted = [...available].sort((a, b) => {
      const wasteA = a.currentLengthMM >= requiredLengthMM
        ? (a.currentLengthMM - requiredLengthMM) / requiredLengthMM : Infinity
      const wasteB = b.currentLengthMM >= requiredLengthMM
        ? (b.currentLengthMM - requiredLengthMM) / requiredLengthMM : Infinity
      if (wasteA === Infinity && wasteB === Infinity) return b.currentLengthMM - a.currentLengthMM
      if (wasteA === Infinity) return 1
      if (wasteB === Infinity) return -1
      if (Math.abs(wasteA - wasteB) > 0.05) return wasteA - wasteB
      return new Date(a.receivedDate).getTime() - new Date(b.receivedDate).getTime()
    })

    const newSelected = new Set<number>()
    const newQuantities = new Map<number, number>()
    let accumulated = 0
    for (const piece of sorted) {
      if (accumulated >= requiredLengthMM) break
      const useAmount = Math.min(piece.currentLengthMM, requiredLengthMM - accumulated)
      newSelected.add(piece.id)
      newQuantities.set(piece.id, useAmount)
      accumulated += useAmount
    }
    setSelectedIds(newSelected)
    setCustomQuantities(newQuantities)
  }

  const toggleSelect = (piece: MaterialPieceResponse) => {
    const newSelected = new Set(selectedIds)
    const newQty = new Map(customQuantities)
    if (newSelected.has(piece.id)) {
      newSelected.delete(piece.id)
      newQty.delete(piece.id)
    } else {
      newSelected.add(piece.id)
      const covered = Array.from(newSelected).reduce(
        (s, id) => s + (newQty.get(id) ?? (availablePieces.find(p => p.id === id)?.currentLengthMM ?? 0)), 0
      )
      const remaining = Math.max(0, requiredLengthMM - (covered - piece.currentLengthMM))
      newQty.set(piece.id, Math.min(piece.currentLengthMM, remaining || piece.currentLengthMM))
    }
    setSelectedIds(newSelected)
    setCustomQuantities(newQty)
  }

  const updateQty = (pieceId: number, val: number) => {
    const piece = availablePieces.find(p => p.id === pieceId)
    if (!piece) return
    const newQty = new Map(customQuantities)
    newQty.set(pieceId, Math.max(0, Math.min(val, piece.currentLengthMM)))
    setCustomQuantities(newQty)
  }

  const totalSelected = useMemo(
    () => Array.from(selectedIds).reduce((s, id) => s + (customQuantities.get(id) ?? 0), 0),
    [selectedIds, customQuantities]
  )

  const isCovered = totalSelected >= requiredLengthMM
  const shortage = Math.max(0, requiredLengthMM - totalSelected)
  const excess = Math.max(0, totalSelected - requiredLengthMM)
  const coveragePct = Math.min(100, requiredLengthMM > 0 ? (totalSelected / requiredLengthMM) * 100 : 0)

  // Sort display: small pieces first (ascending length), then unavailable at bottom
  const sortedDisplayPieces = useMemo(() => {
    return [...availablePieces].sort((a, b) => {
      if (a.status === "Available" && b.status !== "Available") return -1
      if (a.status !== "Available" && b.status === "Available") return 1
      return a.currentLengthMM - b.currentLengthMM
    })
  }, [availablePieces])

  const handleConfirm = () => {
    const result: SelectedPieceInfo[] = Array.from(selectedIds).map(id => ({
      piece: availablePieces.find(p => p.id === id)!,
      quantityMM: customQuantities.get(id) ?? 0,
    }))
    onConfirm(result)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[90vw] h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* ── Header ─────────────────────────────────── */}
        <div className="px-5 pt-5 pb-3 border-b bg-white flex-shrink-0">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold leading-tight">
              Select Material Pieces
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {materialName}
              {materialGrade && <span className="ml-1 font-semibold text-foreground">· {materialGrade}</span>}
            </p>
          </DialogHeader>

          {/* Requirement summary chips + coverage in one row */}
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-100 text-slate-700 rounded-full px-2.5 py-1">
              <Scissors className="h-3 w-3" />
              {requiredLengthMM.toFixed(0)} mm
            </span>
            {isSinglePart && singlePart && (
              <>
                <span className="inline-flex items-center text-[11px] font-semibold bg-blue-50 text-blue-700 rounded-full px-2.5 py-1">
                  {singlePart.piecesCount} pcs × {singlePart.pieceLengthMM.toFixed(0)} mm/pc
                </span>
                {singlePart.wastagePercent > 0 && (
                  <span className="inline-flex items-center text-[11px] font-semibold bg-amber-50 text-amber-700 rounded-full px-2.5 py-1">
                    +{singlePart.wastagePercent}% wastage
                  </span>
                )}
              </>
            )}
            {!isSinglePart && (
              <span className="inline-flex items-center text-[11px] font-semibold bg-purple-50 text-purple-700 rounded-full px-2.5 py-1">
                {totalPiecesNeeded} pcs / {childParts.length} parts
              </span>
            )}
          </div>

          {/* Coverage progress */}
          <div className="mt-2.5">
            <div className="flex justify-between items-center text-xs mb-1">
              <span className={`font-semibold ${isCovered ? "text-green-600" : "text-red-600"}`}>
                {totalSelected.toFixed(0)} / {requiredLengthMM.toFixed(0)} mm
              </span>
              <span className={`font-medium ${isCovered ? "text-green-600" : "text-red-500"}`}>
                {isCovered
                  ? excess > 0 ? `+${excess.toFixed(0)} mm excess` : "✓ Exact fit"
                  : `${shortage.toFixed(0)} mm short`}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${isCovered ? "bg-green-500" : "bg-red-500"}`}
                style={{ width: `${coveragePct}%` }}
              />
            </div>
          </div>
        </div>

        {/* ── Piece list ──────────────────────────────── */}
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2 bg-gray-50/50">
          {loading ? (
            [...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)
          ) : availablePieces.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
              <AlertTriangle className="h-8 w-8 text-amber-400" />
              <p className="text-sm text-muted-foreground">No available pieces found for this material</p>
            </div>
          ) : (
            sortedDisplayPieces.map((piece) => {
              const isSelected = selectedIds.has(piece.id)
              const usedQty = customQuantities.get(piece.id) ?? piece.currentLengthMM
              const isExpanded = expandedId === piece.id

              const cutsAvailable = singlePart ? calcCuts(piece.currentLengthMM, singlePart.pieceLengthMM) : null
              const leftoverMM = singlePart && cutsAvailable !== null
                ? piece.currentLengthMM - cutsAvailable * singlePart.pieceLengthMM : null
              const wastePct = singlePart && cutsAvailable !== null && cutsAvailable > 0 && leftoverMM !== null
                ? (leftoverMM / piece.currentLengthMM) * 100 : null
              const fillPct = singlePart && cutsAvailable !== null && piece.currentLengthMM > 0
                ? Math.min(100, (cutsAvailable * singlePart.pieceLengthMM / piece.currentLengthMM) * 100)
                : Math.min(100, (requiredLengthMM / piece.currentLengthMM) * 100)

              // Badge config
              let badgeLabel = ""
              let badgeColor = "bg-gray-400"
              if (singlePart && cutsAvailable !== null) {
                if (cutsAvailable <= 0) {
                  badgeLabel = "Too short"; badgeColor = "bg-gray-400"
                } else if (cutsAvailable >= singlePart.piecesCount) {
                  badgeLabel = `✓ Covers all ${singlePart.piecesCount} pcs`; badgeColor = "bg-green-600"
                } else {
                  badgeLabel = `${cutsAvailable} / ${singlePart.piecesCount} pcs`; badgeColor = "bg-amber-500"
                }
              }

              return (
                <div
                  key={piece.id}
                  className={`rounded-lg border-2 bg-white transition-all overflow-hidden ${
                    isSelected ? "border-blue-500 shadow-sm shadow-blue-100" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {/* Main clickable row */}
                  <div
                    className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
                    onClick={() => toggleSelect(piece)}
                  >
                    {/* Checkbox */}
                    <div className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                      isSelected ? "bg-blue-500 border-blue-500" : "border-gray-300"
                    }`}>
                      {isSelected && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      {/* Top row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs">{piece.pieceNo}</span>
                        <span className="text-xs text-muted-foreground">{piece.currentLengthMM.toFixed(0)} mm</span>
                        {singlePart && badgeLabel && (
                          <Badge className={`${badgeColor} text-white text-[10px] px-1.5 py-0 h-4`}>
                            {badgeLabel}
                          </Badge>
                        )}
                        {wastePct !== null && wastePct < 100 && (
                          <span className={`text-[10px] font-semibold px-1.5 py-0 rounded-full ${
                            wastePct <= 10 ? "bg-green-50 text-green-700" : wastePct <= 25 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-600"
                          }`}>
                            {wastePct.toFixed(0)}% waste
                          </span>
                        )}
                        {piece.storageLocation && (
                          <span className="text-[10px] text-muted-foreground ml-auto hidden sm:block">
                            📍 {piece.storageLocation}
                          </span>
                        )}
                      </div>

                      {/* Visual rod bar */}
                      <div className="relative h-5 bg-gray-100 rounded overflow-hidden">
                        <div
                          className={`h-full rounded transition-all ${isSelected ? "bg-blue-400" : "bg-emerald-300"}`}
                          style={{ width: `${fillPct}%` }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-gray-700">
                          {piece.currentLengthMM.toFixed(0)} mm
                          {singlePart && cutsAvailable !== null && cutsAvailable > 0 &&
                            ` → ${cutsAvailable} cut${cutsAvailable > 1 ? "s" : ""}`}
                        </span>
                      </div>
                    </div>

                    {/* Expand toggle */}
                    <button
                      className="flex-shrink-0 w-6 h-6 rounded hover:bg-gray-100 flex items-center justify-center transition-colors"
                      onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : piece.id) }}
                    >
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-gray-500" /> : <ChevronDown className="h-3.5 w-3.5 text-gray-500" />}
                    </button>
                  </div>

                  {/* Expanded section */}
                  {isExpanded && (
                    <div className="px-3 pb-3 border-t bg-gray-50/80 space-y-2 pt-2.5">
                      {/* Multi-part cut breakdown */}
                      {!isSinglePart && childParts.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Cut Breakdown</p>
                          {childParts.map((cp, i) => {
                            const cuts = calcCuts(piece.currentLengthMM, cp.pieceLengthMM)
                            return (
                              <div key={i} className="flex justify-between items-center text-xs py-1 px-2 bg-white rounded border">
                                <span className="text-muted-foreground">{cp.childPartName}</span>
                                <span className={`font-semibold text-[10px] ${cuts >= cp.piecesCount ? "text-green-600" : "text-amber-600"}`}>
                                  {cuts} × {cp.pieceLengthMM.toFixed(0)} mm{cuts >= cp.piecesCount ? " ✓" : ` (need ${cp.piecesCount})`}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Stats row */}
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: "Weight", value: `${piece.currentWeightKG.toFixed(2)} kg` },
                          { label: "Usage", value: `${piece.usagePercentage.toFixed(0)}%` },
                          { label: "Received", value: new Date(piece.receivedDate).toLocaleDateString() },
                        ].map(({ label, value }) => (
                          <div key={label} className="bg-white border rounded px-2 py-1.5 text-center">
                            <div className="text-[9px] text-muted-foreground uppercase tracking-wide font-medium">{label}</div>
                            <div className="text-xs font-bold mt-0.5">{value}</div>
                          </div>
                        ))}
                      </div>

                      {/* Quantity input when selected */}
                      {isSelected && (
                        <div className="flex flex-wrap items-center gap-2 pt-1.5 border-t" onClick={e => e.stopPropagation()}>
                          <span className="text-xs text-muted-foreground">Use (mm):</span>
                          <input
                            type="number"
                            min="0"
                            max={piece.currentLengthMM}
                            step="1"
                            value={Math.round(usedQty)}
                            onChange={(e) => updateQty(piece.id, parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 border rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white font-medium"
                          />
                          <span className="text-xs text-muted-foreground">/ {piece.currentLengthMM.toFixed(0)} mm</span>
                          {singlePart && cutsAvailable !== null && cutsAvailable > 0 && (
                            <button
                              className="ml-auto text-xs text-blue-600 hover:text-blue-700 font-semibold hover:underline"
                              onClick={() => updateQty(piece.id, cutsAvailable * singlePart.pieceLengthMM)}
                            >
                              Use {cutsAvailable} cut{cutsAvailable > 1 ? "s" : ""} ({(cutsAvailable * singlePart.pieceLengthMM).toFixed(0)} mm)
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* ── Footer ──────────────────────────────────── */}
        <div className="px-5 py-3 border-t bg-white flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {selectedIds.size} rod{selectedIds.size !== 1 ? "s" : ""} selected
            </span>
            {selectedIds.size > 0 && (
              <span className={`text-xs font-semibold ${isCovered ? "text-green-600" : "text-red-500"}`}>
                · {totalSelected.toFixed(0)} mm
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={selectedIds.size === 0}
              size="sm"
              variant={isCovered ? "default" : "destructive"}
              className="min-w-[130px]"
            >
              {isCovered ? (
                <><Check className="h-3.5 w-3.5 mr-1.5" /> Confirm Selection</>
              ) : (
                <><AlertTriangle className="h-3.5 w-3.5 mr-1.5" /> Confirm (Short)</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
