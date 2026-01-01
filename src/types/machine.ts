import { MachineType } from "./pfd-template";
import { Priority } from "./enums";

export interface MachineQueueItem {
  jobCardId: string;
  orderNo: string;
  processName: string;
  estimatedSetupMin: number;
  estimatedCycleMin: number;
  estimatedStartTime: Date;
  estimatedEndTime: Date;
  priority: Priority;
}

export interface Machine {
  id: string;
  machineCode: string;
  machineName: string;
  machineType: MachineType;

  // Capacity
  isOperational: boolean;
  shiftHoursPerDay: number;
  utilizationTarget: number;

  // Current load
  currentJobCardId: string | null;
  currentJobCardNo: string | null;
  currentOrderNo: string | null;
  currentProcessName: string | null;
  currentOperatorId: string | null;
  currentOperatorName: string | null;
  estimatedBusyUntil: Date | null;
  currentProgress: number;
  currentElapsedMin: number;
  currentTotalMin: number;

  // Queue
  queuedJobCards: MachineQueueItem[];
  totalQueueTimeMin: number;

  // Utilization
  currentUtilizationPercent: number;
}

export enum MachineStatus {
  IDLE = "IDLE",
  BUSY = "BUSY",
  MAINTENANCE = "MAINTENANCE",
  BREAKDOWN = "BREAKDOWN"
}
