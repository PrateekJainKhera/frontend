import { Priority } from './enums'

// ============================================
// Material Requisition Types
// ============================================

export type RequisitionStatus =
  | 'Pending'      // Request created, awaiting allocation
  | 'Partial'      // Some materials allocated, not all
  | 'Allocated'    // Fully allocated, awaiting issue
  | 'Issued'       // Materials issued to job
  | 'Cancelled'    // Requisition cancelled

export type AllocationStatus =
  | 'Reserved'     // Material piece reserved for this requisition
  | 'Issued'       // Material issued and deducted from stock
  | 'Cancelled'    // Allocation cancelled

export type IssueStatus =
  | 'Pending'      // Issue created, awaiting confirmation
  | 'Issued'       // Materials issued
  | 'Returned'     // Materials returned to inventory
  | 'Cancelled'    // Issue cancelled

// ============================================
// Material Requisition
// ============================================

export interface MaterialRequirementDetail {
  materialId: string
  materialName: string
  materialType: 'rod' | 'pipe' | 'sheet' | 'plate' | 'coil'
  materialGrade: string
  dimensions: {
    diameter?: number  // For rods/pipes
    thickness?: number // For sheets/plates
    width?: number     // For sheets/plates
    length?: number    // Required length
  }
  quantityRequired: number
  unit: 'pcs' | 'kg' | 'meters' | 'sqm'
  quantityAllocated: number
  quantityIssued: number
  quantityPending: number
}

export interface MaterialRequisition {
  requisitionId: string
  requisitionNo: string
  requisitionDate: Date

  // Job Card linkage
  jobCardId: string
  jobCardNo: string
  orderId: string
  orderNo: string
  customerName: string

  // Material requirements
  materials: MaterialRequirementDetail[]

  // Status tracking
  status: RequisitionStatus
  priority: Priority
  dueDate: Date

  // Metadata
  requestedBy: string
  requestedByName: string
  createdAt: Date
  updatedAt: Date
  notes?: string

  // Allocation summary
  totalItems: number
  allocatedItems: number
  issuedItems: number
  pendingItems: number
}

// ============================================
// Material Allocation
// ============================================

export interface PieceAllocation {
  pieceId: string
  pieceNumber: string
  currentLength: number
  allocatedLength: number
  weight: number
  location: string
  grn: {
    grnId: string
    grnNo: string
    receivedDate: Date
    supplier: string
  }
}

export interface MaterialAllocation {
  allocationId: string
  allocationNo: string
  allocationDate: Date

  // Requisition linkage
  requisitionId: string
  requisitionNo: string
  requisitionItemId: string  // Links to specific material in requisition

  // Job card reference
  jobCardId: string
  jobCardNo: string

  // Material details
  materialId: string
  materialName: string
  materialGrade: string

  // Piece allocations
  pieces: PieceAllocation[]
  totalAllocatedLength: number
  totalAllocatedWeight: number
  totalPieces: number

  // Status
  status: AllocationStatus

  // Wastage tracking
  expectedWastage: number
  expectedWastagePercent: number

  // Metadata
  allocatedBy: string
  allocatedByName: string
  createdAt: Date
  updatedAt: Date
  notes?: string
}

// ============================================
// Material Issue
// ============================================

export interface IssuedPiece {
  pieceId: string
  pieceNumber: string
  issuedLength: number
  weight: number
  statusBeforeIssue: string
  statusAfterIssue: 'InUse'
}

export interface MaterialIssue {
  issueId: string
  issueNo: string
  issueDate: Date

  // Allocation linkage
  allocationId: string
  allocationNo: string

  // Requisition reference
  requisitionId: string
  requisitionNo: string

  // Job card reference
  jobCardId: string
  jobCardNo: string
  orderId: string
  orderNo: string

  // Material details
  materialId: string
  materialName: string
  materialGrade: string
  materialType: 'rod' | 'pipe' | 'sheet' | 'plate' | 'coil'

  // Issued pieces
  pieces: IssuedPiece[]
  totalIssuedLength: number
  totalIssuedWeight: number
  totalPieces: number

  // Status
  status: IssueStatus

  // Metadata
  issuedBy: string
  issuedByName: string
  receivedBy?: string
  receivedByName?: string
  createdAt: Date
  updatedAt: Date
  confirmedAt?: Date

  // Return tracking (if partial return)
  returnDetails?: {
    returnDate: Date
    returnedPieces: {
      pieceId: string
      returnedLength: number
      reason: string
    }[]
    returnedBy: string
    notes: string
  }

  notes?: string
}

// ============================================
// Material Return
// ============================================

export interface MaterialReturn {
  returnId: string
  returnNo: string
  returnDate: Date

  // Original issue reference
  issueId: string
  issueNo: string

  // Job card reference
  jobCardId: string
  jobCardNo: string

  // Material details
  materialId: string
  materialName: string
  materialGrade: string

  // Returned pieces
  returnedPieces: {
    pieceId: string
    pieceNumber: string
    returnedLength: number
    weight: number
    condition: 'Good' | 'Scrap' | 'Damaged'
    newStatus: 'Available' | 'Scrap'
  }[]

  totalReturnedLength: number
  totalReturnedWeight: number

  // Reason
  returnReason: 'Job_Completed' | 'Excess_Material' | 'Wrong_Material' | 'Damaged' | 'Other'

  // Metadata
  returnedBy: string
  returnedByName: string
  acceptedBy: string
  acceptedByName: string
  createdAt: Date
  notes?: string
}

// ============================================
// Summary and Stats Types
// ============================================

export interface MaterialRequisitionSummary {
  totalRequisitions: number
  pendingRequisitions: number
  partialRequisitions: number
  allocatedRequisitions: number
  issuedRequisitions: number

  // Material-wise stats
  materialStats: {
    materialId: string
    materialName: string
    totalRequired: number
    totalAllocated: number
    totalIssued: number
    unit: string
  }[]

  // Priority breakdown
  highPriority: number
  mediumPriority: number
  lowPriority: number

  // Aging analysis
  overdueRequisitions: number
  dueTodayRequisitions: number
}

export interface StoresDashboardStats {
  pendingRequisitions: number
  pendingAllocations: number
  todaysIssues: number
  lowStockAlerts: number

  // Recent activity
  recentRequisitions: MaterialRequisition[]
  recentIssues: MaterialIssue[]

  // Material availability
  criticalMaterials: {
    materialId: string
    materialName: string
    availableStock: number
    pendingDemand: number
    shortfall: number
  }[]
}

// ============================================
// Filter and Search Types
// ============================================

export interface RequisitionFilters {
  status?: RequisitionStatus[]
  priority?: Priority[]
  dateFrom?: Date
  dateTo?: Date
  jobCardNo?: string
  orderNo?: string
  materialType?: string
  requestedBy?: string
}

export interface AllocationFilters {
  status?: AllocationStatus[]
  dateFrom?: Date
  dateTo?: Date
  materialId?: string
  allocatedBy?: string
}

export interface IssueFilters {
  status?: IssueStatus[]
  dateFrom?: Date
  dateTo?: Date
  jobCardNo?: string
  materialId?: string
  issuedBy?: string
}
