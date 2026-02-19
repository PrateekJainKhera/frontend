// Approved requisition shown in left panel
export interface IssueWindowRequisition {
  id: number
  requisitionNo: string
  orderNo?: string
  jobCardNo?: string
  customerName?: string
  priority: string
  dueDate?: string
  createdAt: string
  itemCount: number
}

// Material group: all cuts of same material across selected requisitions
export interface MaterialGroup {
  materialId?: number
  materialName: string
  materialCode?: string
  grade?: string
  diameterMM?: number
  totalLengthNeededMM: number
  cuts: MaterialGroupCutItem[]
}

// One individual cut row (qty expanded — 1 row per physical cut)
export interface MaterialGroupCutItem {
  requisitionItemId: number
  requisitionId: number
  cutIndex: number
  cutLengthMM: number
  partName?: string
  jobCardNo?: string
  requisitionNo?: string
  materialId?: number
}

// Available bar/piece from inventory
export interface AvailablePiece {
  id: number
  pieceNo: string
  currentLengthMM: number
  storageLocation?: string
  grnNo?: string
}

// ── Cutting Plan Suggestion types ─────────────────────────────────────────

export interface SuggestCutItem {
  requisitionItemId: number
  requisitionId?: number
  cutIndex: number
  cutLengthMM: number
  partName?: string
  jobCardNo?: string
  requisitionNo?: string
  materialId?: number
}

export interface SuggestCuttingPlanRequest {
  cuts: SuggestCutItem[]
  materialId?: number
  grade?: string
  diameterMM?: number
}

export interface CuttingPlanOption {
  planIndex: number
  planLabel: string
  planDescription: string
  totalBars: number
  totalScrapMM: number
  totalStockReturnMM: number
  totalBarLengthUsedMM: number
  isComplete: boolean
  bars: BarCutPlan[]
}

export interface BarCutPlan {
  pieceId: number
  pieceNo: string
  barLengthMM: number
  totalCutMM: number
  remainingMM: number
  willBeScrap: boolean
  cuts: PlanCutItem[]
}

export interface PlanCutItem {
  requisitionItemId: number
  requisitionId?: number
  cutIndex: number
  cutLengthMM: number
  partName?: string
  jobCardNo?: string
  requisitionNo?: string
  materialId?: number
}

// ── Draft types ───────────────────────────────────────────────────────────

// Draft summary for listing
export interface DraftSummary {
  id: number
  draftNo: string
  status: 'Draft' | 'Issued'
  requisitionCount: number
  totalBars: number
  totalCuts: number
  createdAt: string
  issuedAt?: string
}

// Draft full detail
export interface DraftDetail {
  id: number
  draftNo: string
  status: 'Draft' | 'Issued'
  requisitionIds: string
  issuedBy?: string
  receivedBy?: string
  notes?: string
  createdAt: string
  issuedAt?: string
  barAssignments: DraftBarAssignment[]
}

export interface DraftBarAssignment {
  id: number
  draftId: number
  materialId?: number
  materialName?: string
  materialCode?: string
  grade?: string
  diameterMM?: number
  pieceId?: number
  pieceNo?: string
  pieceCurrentLengthMM?: number
  totalCutMM?: number
  remainingMM?: number
  willBeScrap: boolean
  sortOrder: number
  cuts: DraftCut[]
}

export interface DraftCut {
  id: number
  requisitionItemId: number
  requisitionId?: number
  cutIndex: number
  cutLengthMM: number
  partName?: string
  jobCardNo?: string
  requisitionNo?: string
  materialId?: number
  sortOrder: number
}

// ── API request types ─────────────────────────────────────────────────────

export interface CutRequest {
  requisitionItemId: number
  requisitionId?: number
  cutIndex: number
  cutLengthMM: number
  partName?: string
  jobCardNo?: string
  requisitionNo?: string
  materialId?: number
}

export interface BarAssignmentRequest {
  materialId?: number
  materialName?: string
  materialCode?: string
  grade?: string
  diameterMM?: number
  pieceId: number
  pieceNo?: string
  pieceCurrentLengthMM: number
  cuts: CutRequest[]
}

export interface SaveDraftRequest {
  requisitionIds: number[]
  barAssignments: BarAssignmentRequest[]
  notes?: string
}

export interface IssueDraftRequest {
  issuedBy: string
  receivedBy: string
}

export interface FinalizeMultipleDraftsRequest {
  draftIds: number[]
  issuedBy: string
  receivedBy: string
}

export interface IssueResult {
  requisitionId: number
  requisitionNo: string
  success: boolean
  message?: string
  issueId?: number
}
