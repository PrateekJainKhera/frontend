import { MachineSuggestion } from './schedule'

// ── Step 1 ────────────────────────────────────────────────────────────────────
export interface SchedulableOrderV2 {
  orderId: number
  orderItemId?: number | null   // null for legacy single-product orders
  itemSequence?: string | null  // "A", "B", "C" etc.
  orderNo: string
  customerName?: string | null
  dueDate?: string | null
  priority: string
  totalJobCards: number
  materialIssuedCount: number
  alreadyScheduledCount: number
  readyToScheduleCount: number
  reworkCount: number
}

// ── Step 2 ────────────────────────────────────────────────────────────────────
export interface JobCardForScheduling {
  jobCardId: number
  jobCardNo: string
  orderId: number
  orderNo: string
  customerName?: string | null
  dueDate?: string | null
  childPartName?: string | null
  creationType?: string | null
  machineModelName?: string | null
  rollerType?: string | null
  numberOfTeeth?: number | null
  processId: number
  processName: string
  processCode?: string | null
  stepNo?: number | null
  processCategoryId?: number | null
  processCategoryName?: string | null
  isOsp: boolean
  isManual: boolean
  quantity: number
  priority: string
  materialIssued: boolean
  isAlreadyScheduled: boolean
  isRework: boolean
  jobCardType: string
  setupTimeMinutes: number
  cycleTimeMinutesPerPiece: number
  estimatedDurationMinutes: number
}

export interface ChildPartJobGroup {
  childPartName: string
  creationType: string
  jobCards: JobCardForScheduling[]
}

// ── Step 4 ────────────────────────────────────────────────────────────────────
export interface CategoryMachineSuggestion {
  categoryKey: string
  processCategoryId?: number | null
  processCategoryName: string
  isOsp: boolean
  isManual: boolean
  jobCardIds: number[]
  totalJobCards: number
  totalEstimatedMinutes: number
  totalEstimatedHours: number
  suggestedMachines: MachineSuggestion[]
}

// ── Step 5 ────────────────────────────────────────────────────────────────────
export interface BatchScheduleV2Result {
  jobCardId: number
  jobCardNo: string
  orderNo?: string | null
  success: boolean
  scheduleId?: number | null
  machineName?: string | null
  scheduledStart?: string | null
  scheduledEnd?: string | null
  error?: string | null
}

// ── Requests ──────────────────────────────────────────────────────────────────
export interface CreateScheduleV2Request {
  jobCardId: number
  machineId?: number | null
  shiftId?: number | null
  shiftName?: string | null
  scheduledStartTime: string   // ISO
  scheduledEndTime: string     // ISO
  estimatedDurationMinutes: number
  isOsp: boolean
  isManual: boolean
  createdBy?: string
  notes?: string
}

export interface BatchRescheduleRequest {
  scheduleIds: number[]
  shiftId: number
  newDate: string
  reason: string
  rescheduledBy?: string
}
