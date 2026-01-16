// ============================================
// Production Execution Types
// ============================================

export type ProductionStatus =
  | 'NOT_STARTED'    // Job card ready, material issued, not started
  | 'IN_PROGRESS'    // Work has started
  | 'COMPLETED'      // Work finished, ready for next operation/QC

export interface ProductionExecution {
  executionId: string
  jobCardId: string
  jobCardNo: string

  // Operator tracking
  operatorId: string
  operatorName: string

  // Time tracking
  startTime: Date
  endTime?: Date

  // Actual production
  actualQuantity: number
  actualLengthUsed?: number  // For material tracking

  // Status
  status: ProductionStatus

  // Notes
  notes?: string

  // Metadata
  createdAt: Date
  updatedAt: Date
}

// For dashboard display - combines job card + execution data
export interface ProductionJobCard {
  // Job Card basics
  jobCardId: string
  jobCardNo: string
  orderId: string
  orderNo: string

  // Child Part
  childPartId: string
  childPartName: string
  childPartCode: string

  // Operation
  operationId: string
  operationName: string
  operationSequence: number

  // Drawing reference
  drawingId: string
  drawingNo: string
  drawingRevision: string
  drawingUrl?: string

  // Requirements
  requiredQuantity: number
  requiredLength?: number

  // Material status (from Planning/Stores)
  materialStatus: 'PENDING' | 'ISSUED'

  // Production status
  productionStatus: ProductionStatus

  // Current execution (if in progress)
  currentExecution?: ProductionExecution

  // Completed quantity (across all executions)
  completedQuantity: number

  // Material issued summary
  materialIssued?: {
    materialName: string
    materialGrade: string
    issuedQuantity: number
    issuedWeight?: number
  }
}

// For statistics
export interface ProductionStats {
  readyToStart: number      // materialStatus=ISSUED, productionStatus=NOT_STARTED
  inProgress: number        // productionStatus=IN_PROGRESS
  completedToday: number    // productionStatus=COMPLETED today
  totalJobCards: number
}
