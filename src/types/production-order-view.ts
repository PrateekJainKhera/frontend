import { JobCard } from './job-card'

// ============================================
// Production Order View Types
// ============================================
// Groups job cards by order to show complete production workflow

export interface OrderProductionView {
  // Order details
  orderId: string
  orderNo: string
  customerName: string
  customerCode: string
  productName: string
  productCode: string

  // Child parts with their processes
  childParts: ChildPartProduction[]

  // Assembly job card (if exists)
  assemblyJobCard?: JobCard

  // QC status (can be expanded to full QC job card if needed)
  qcStatus: 'Pending' | 'In Progress' | 'Completed'

  // Overall progress
  totalSteps: number
  completedSteps: number
  inProgressSteps: number
  pendingSteps: number
}

export interface ChildPartProduction {
  childPartId: string
  childPartName: string

  // All processes for this child part, sorted by stepNo
  processes: JobCard[]

  // Progress for this child part
  completedProcesses: number
  totalProcesses: number
  currentProcess?: JobCard  // The process currently in progress or next to start
}

// Helper type for progress calculation
export interface ProductionProgress {
  percentage: number
  completedSteps: number
  totalSteps: number
  currentStepName?: string
  status: 'Not Started' | 'In Progress' | 'Completed'
}
