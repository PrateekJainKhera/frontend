/**
 * Scheduling Module Types
 * Matches backend DTOs for machine scheduling
 */

export type ScheduleStatus =
  | 'Scheduled'
  | 'InProgress'
  | 'Completed'
  | 'Cancelled'
  | 'Rescheduled';

export type SchedulingMethod =
  | 'Manual'
  | 'Semi-Automatic'
  | 'Fully-Automatic'
  | 'OSP';

/**
 * Machine Schedule
 */
export interface MachineSchedule {
  id: number;
  jobCardId: number;
  jobCardNo?: string;
  machineId: number;
  machineCode?: string;
  machineName?: string;

  // Time tracking
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  estimatedDurationMinutes: number;
  actualStartTime?: Date | null;
  actualEndTime?: Date | null;
  actualDurationMinutes?: number | null;

  // Status and method
  status: ScheduleStatus;
  schedulingMethod: SchedulingMethod;
  suggestedBySystem: boolean;
  confirmedBy?: string | null;
  confirmedAt?: Date | null;

  // Process info
  processId: number;
  processName?: string;
  processCode?: string;

  // Rescheduling tracking
  isRescheduled: boolean;
  rescheduledFromId?: number | null;
  rescheduledReason?: string | null;
  rescheduledAt?: Date | null;
  rescheduledBy?: string | null;

  // Audit
  notes?: string | null;
  createdAt: Date;
  createdBy?: string | null;
  updatedAt?: Date | null;
  updatedBy?: string | null;
}

/**
 * Schedule Slot (for visualization in suggestions)
 */
export interface ScheduleSlot {
  scheduleId: number;
  jobCardNo: string;
  startTime: Date;
  endTime: Date;
  status: ScheduleStatus;
}

/**
 * Machine Suggestion Response (Semi-Automatic Scheduling)
 */
export interface MachineSuggestion {
  machineId: number;
  machineCode: string;
  machineName: string;

  // Capability info from ProcessMachineCapability
  setupTimeHours: number;
  cycleTimePerPieceHours: number;
  preferenceLevel: number;  // 1 = Best, 5 = Last Resort
  efficiencyRating: number;
  isPreferredMachine: boolean;

  // Calculated times for this specific job
  estimatedSetupMinutes: number;
  estimatedCycleMinutes: number;
  totalEstimatedMinutes: number;

  // Next available time slot
  nextAvailableStart?: Date | null;
  suggestedStart?: Date | null;
  suggestedEnd?: Date | null;

  // Current machine status
  isCurrentlyAvailable: boolean;
  scheduledJobsCount: number;
  currentStatus?: string | null;

  // Upcoming schedules (for visualization)
  upcomingSchedules?: ScheduleSlot[];
}

/**
 * Request DTOs
 */
export interface CreateScheduleRequest {
  jobCardId: number;
  machineId: number;
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  estimatedDurationMinutes: number;
  schedulingMethod?: SchedulingMethod;
  suggestedBySystem?: boolean;
  isOsp?: boolean;
  confirmedBy?: string;
  notes?: string;
  createdBy?: string;
}

export interface UpdateStatusRequest {
  status: ScheduleStatus;
  updatedBy?: string;
}

export interface RescheduleRequest {
  newStartTime: Date;
  newEndTime: Date;
  reason: string;
  rescheduledBy?: string;
}

/**
 * Process step item within the scheduling tree (each job card = one process step)
 */
export interface ProcessStepSchedulingItem {
  jobCardId: number
  jobCardNo: string
  processId: number
  processName?: string | null
  processCode?: string | null
  stepNo?: number | null
  isOsp?: boolean
  quantity: number
  priority: string
  jobCardStatus: string

  // Machine assignment (null = not yet assigned)
  scheduleId?: number | null
  assignedMachineId?: number | null
  assignedMachineCode?: string | null
  assignedMachineName?: string | null
  scheduledStartTime?: string | null
  scheduledEndTime?: string | null
  scheduleStatus?: string | null
  estimatedDurationMinutes?: number | null
}

/**
 * Group of process steps under one child part or assembly
 */
export interface ChildPartGroup {
  groupName: string
  creationType: string  // "ChildPart" | "Assembly"
  totalSteps: number
  scheduledSteps: number
  steps: ProcessStepSchedulingItem[]
}

/**
 * Full scheduling tree for an order
 */
export interface OrderSchedulingTree {
  orderId: number
  orderNo: string
  priority: string
  totalSteps: number
  scheduledSteps: number
  pendingSteps: number
  groups: ChildPartGroup[]
}

/**
 * API Response wrapper
 */
export interface ScheduleApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}
