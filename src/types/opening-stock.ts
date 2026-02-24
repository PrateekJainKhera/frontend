// ── Summary (list view) ────────────────────────────────────────────────────
export interface OpeningStockSummary {
  id: number
  entryNo: string
  entryDate: string
  status: 'Draft' | 'Confirmed'
  remarks?: string
  createdAt: string
  createdBy?: string
  confirmedAt?: string
  confirmedBy?: string
  totalPieces: number
  totalComponents: number
  rawMaterialLines: number
  componentLines: number
}

// ── Detail (create / edit view) ───────────────────────────────────────────
export interface OpeningStockDetail {
  id: number
  entryNo: string
  entryDate: string
  status: 'Draft' | 'Confirmed'
  remarks?: string
  createdAt: string
  createdBy?: string
  confirmedAt?: string
  confirmedBy?: string
  totalPieces?: number
  totalComponents?: number
  items: OpeningStockItemDetail[]
}

export interface OpeningStockItemDetail {
  id: number
  sequenceNo: number
  itemType: 'RawMaterial' | 'Component'
  // Raw material
  materialId?: number
  materialName?: string
  grade?: string
  materialType?: string   // Rod / Pipe / Sheet / Forged
  diameter?: number
  outerDiameter?: number
  innerDiameter?: number
  width?: number
  thickness?: number
  materialDensity?: number
  totalWeightKG?: number
  calculatedLengthMM?: number
  weightPerMeterKG?: number
  numberOfPieces?: number
  lengthPerPieceMM?: number
  warehouseId?: number
  // Component
  componentId?: number
  componentName?: string
  partNumber?: string
  quantity?: number
  uom?: string
  // Common
  unitCost?: number
  lineTotal?: number
  remarks?: string
}

// ── Request types ──────────────────────────────────────────────────────────
export interface OpeningStockItemRequest {
  sequenceNo: number
  itemType: 'RawMaterial' | 'Component'
  // Raw material
  materialId?: number
  materialName?: string
  grade?: string
  materialType?: string
  diameter?: number
  outerDiameter?: number
  innerDiameter?: number
  width?: number
  thickness?: number
  materialDensity?: number
  totalWeightKG?: number
  numberOfPieces?: number
  lengthPerPieceMM?: number
  warehouseId?: number
  // Component
  componentId?: number
  componentName?: string
  partNumber?: string
  quantity?: number
  uom?: string
  // Common
  unitCost?: number
  remarks?: string
}

export interface CreateOpeningStockRequest {
  entryDate: string
  remarks?: string
  createdBy?: string
  items: OpeningStockItemRequest[]
}

export interface ConfirmOpeningStockRequest {
  confirmedBy?: string
}
