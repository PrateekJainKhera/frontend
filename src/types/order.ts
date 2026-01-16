import { OrderStatus, Priority, DelayReason, ProcessStatus, OrderSource, SchedulingStrategy, PlanningStatus, DrawingReviewStatus } from './enums'
import { Customer } from './customer'
import { Product } from './product'
import { ChildPartStatus } from './child-part-production'

export interface Order {
  id: string
  orderNo: string
  customerId: string
  customer?: Customer
  productId: string
  product?: Product
  quantity: number
  originalQuantity: number
  qtyCompleted: number
  qtyRejected: number
  qtyInProgress: number
  orderDate: Date
  dueDate: Date
  adjustedDueDate?: Date | null
  delayReason?: DelayReason | null
  status: OrderStatus
  priority: Priority
  planningStatus: PlanningStatus  // Planning state - NOT_PLANNED, PLANNED, RELEASED

  // Drawing Review - BUSINESS RULE: Planning blocked until APPROVED
  drawingReviewStatus: DrawingReviewStatus
  drawingReviewNotes?: string | null
  reviewedBy?: string | null
  reviewedAt?: Date | null
  linkedProductTemplateId?: string | null
  linkedChildPartTemplateIds?: string[]

  // Drawing linkage (optional - for drawing-driven orders)
  primaryDrawingId?: string | null
  primaryDrawingNumber?: string | null
  primaryDrawingRevision?: string | null
  drawingSource?: 'customer' | 'company' | null  // Who provided the drawing

  currentProcess?: string | null
  currentMachine?: string | null
  currentOperator?: string | null
  processHistory?: ProcessHistory[]
  orderSource: OrderSource
  agentCustomerId?: string
  agentCustomer?: Customer
  agentCommission?: number
  schedulingStrategy?: SchedulingStrategy
  canReschedule: boolean
  rescheduleHistory?: RescheduleHistory[]
  createdAt: Date
  updatedAt: Date
  createdBy: string

  // Assembly tracking
  assemblyReadiness?: AssemblyReadiness
  canStartAssembly?: boolean
  assemblyBlockedReason?: string | null
  assemblyStartDate?: Date | null
  assemblyCompletionDate?: Date | null

  // Time estimates
  estimatedTotalTimeMin?: number
  estimatedCompletionDate?: Date
  actualStartDate?: Date | null
  actualCompletionDate?: Date | null
  timeVarianceMin?: number | null

  // Material approval
  materialGradeApproved?: string | null
  materialGradeApprovedBy?: string | null
  materialGradeApprovalDate?: Date | null
  materialGradeNotes?: string | null
  alternativeMaterialsConsidered?: AlternativeMaterial[]
}

export interface ProcessHistory {
  id: string
  orderId: string
  processName: string
  stepNo: number
  machineUsed: string
  operatorId: string
  operatorName: string
  qtyProcessed: number
  qtyCompleted: number
  qtyRejected: number
  startTime: Date
  endTime?: Date | null
  status: ProcessStatus
  remarks?: string
}

export interface RescheduleHistory {
  id: string
  orderId: string
  oldDueDate: Date
  newDueDate: Date
  reason: string
  rescheduledBy: string
  rescheduledByName: string
  rescheduledAt: Date
}

export interface BlockingItem {
  childPartId: string
  childPartName: string
  currentStatus: ChildPartStatus
  expectedReadyDate: Date | null
  delayDays: number | null
}

export interface ReadyItem {
  childPartId: string
  childPartName: string
  readyDate: Date
  quantityReady: number
}

export interface AssemblyReadiness {
  orderId: string
  lastChecked: Date
  isReady: boolean
  blockingItems: BlockingItem[]
  readyItems: ReadyItem[]
  readinessPercentage: number
}

export interface AlternativeMaterial {
  materialId: string
  materialGrade: string
  reason: string
  costDifference: number
  wasApproved: boolean
  approvedBy: string | null
}
