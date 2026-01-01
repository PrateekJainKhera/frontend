import { OrderStatus } from './enums'
import { PFDProcessStep } from './pfd-template'

export enum ReworkStatus {
  CREATED = "Created",
  IN_PROGRESS = "In Progress",
  COMPLETED = "Completed - Passed",
  FAILED = "Failed - Re-rejected",
  ON_HOLD = "On Hold"
}

export interface ReworkOrder {
  id: string
  reworkOrderNo: string
  parentOrderId: string
  parentOrderNo: string
  parentProductName: string
  rejectionId: string
  reworkQty: number
  startFromProcess: string
  isRework: boolean
  reworkReason: string
  approvedBy: string
  status: OrderStatus
  createdAt: Date
  updatedAt: Date

  // Enhanced traceability
  rejectionReason?: string
  rejectionDate?: Date
  rejectedProcessStep?: number
  rejectedProcessName?: string
  rejectedByInspector?: string

  // Rework process
  reworkProcessSteps?: PFDProcessStep[]
  restartFromStep?: number
  currentStep?: number
  currentProcessName?: string | null
  currentMachineId?: string | null
  currentOperatorName?: string | null

  // Tracking
  reworkStatus?: ReworkStatus
  reworkStartDate?: Date | null
  reworkCompletionDate?: Date | null
  reworkCost?: number | null
  reworkTimeMin?: number | null

  // Quality check
  finalInspectionPassed?: boolean | null
  finalInspectorName?: string | null
  finalInspectionDate?: Date | null
  finalInspectionNotes?: string | null

  // Linkage
  childPartId?: string | null
  childPartName?: string | null
  originalMachineId?: string | null
  reworkMachineId?: string | null
}
