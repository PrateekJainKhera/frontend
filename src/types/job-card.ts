import { Priority } from './enums'

export enum JobCardStatus {
  PENDING = 'Pending',
  READY = 'Ready',           // Dependencies met, can start
  IN_PROGRESS = 'In Progress',
  PAUSED = 'Paused',
  COMPLETED = 'Completed',
  BLOCKED = 'Blocked'         // Waiting for previous step
}

export enum JobCardCreationType {
  AUTO_GENERATED = 'Auto-Generated',
  MANUAL = 'Manual',
  REWORK = 'Rework'
}

export interface JobCard {
  // Identity
  id: string
  jobCardNo: string                    // "JC-ORD-128-1"
  creationType: JobCardCreationType

  // Order linkage
  orderId: string
  orderNo: string

  // Process details
  processId: string
  processName: string
  processCode: string
  stepNo: number                       // Sequence in process template (1, 2, 3, 4)
  processTemplateId?: string | null

  // Dependencies
  dependsOnJobCardIds: string[]        // Previous job card IDs that must complete first
  blockedBy: string[]                  // Job cards currently blocking this one

  // Quantity tracking
  quantity: number
  completedQty: number
  rejectedQty: number
  reworkQty: number
  inProgressQty: number

  // Status & Priority
  status: JobCardStatus
  priority: Priority

  // Machine & Operator assignment
  assignedMachineId?: string | null
  assignedMachineName?: string | null
  assignedOperatorId?: string | null
  assignedOperatorName?: string | null

  // Time tracking
  estimatedSetupTimeMin: number
  estimatedCycleTimeMin: number
  estimatedTotalTimeMin: number
  actualSetupTimeMin?: number | null
  actualCycleTimeMin?: number | null
  actualTotalTimeMin?: number | null

  scheduledStartTime?: Date | null
  actualStartTime?: Date | null
  actualEndTime?: Date | null

  // Material allocation
  allocatedMaterials?: JobCardMaterial[]

  // Customer & Product info (denormalized for display)
  customerName: string
  customerCode: string
  productName: string
  productCode: string

  // Instructions & Notes
  workInstructions?: string
  qualityCheckpoints?: string
  specialNotes?: string

  // Metadata
  createdAt: Date
  createdBy: string
  updatedAt: Date
  updatedBy: string

  // Rework specific (if creationType === REWORK)
  parentJobCardId?: string | null
  reworkReason?: string | null
}

export interface JobCardMaterial {
  id: string
  jobCardId: string
  materialType: 'RAW_MATERIAL' | 'COMPONENT'
  materialId: string
  materialName: string
  materialCode: string
  requiredQuantity: number
  allocatedQuantity: number
  unit: string
  isAllocated: boolean
  allocationDate?: Date | null
  notes?: string
}

export interface JobCardProductionEntry {
  id: string
  jobCardId: string
  entryType: 'COMPLETION' | 'REJECTION' | 'REWORK'
  quantity: number
  operatorId: string
  operatorName: string
  enteredAt: Date
  remarks?: string
}

export interface JobCardGenerationConfig {
  orderId: string
  processTemplateId: string
  quantity: number
  priority: Priority
  generateForSteps: number[]           // [1, 2, 3, 4] or selective steps
  autoAssignMachines: boolean
  schedulingStrategy: 'ASAP' | 'JIT' | 'MANUAL'
}

export interface DependencyCheckResult {
  canStart: boolean
  blockedBy: JobCard[]
  blocks: JobCard[]
}

export interface MaterialCheckResult {
  allAvailable: boolean
  items: {
    materialId: string
    materialName: string
    required: number
    currentStock: number
    available: boolean
    unit: string
  }[]
}
