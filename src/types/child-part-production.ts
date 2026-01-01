export enum ChildPartStatus {
  NotStarted = "Not Started",
  MaterialIssued = "Material Issued",
  InProcess = "In Process",
  QualityCheck = "Quality Check",
  ReadyForAssembly = "Ready for Assembly",
  Consumed = "Consumed in Assembly",
  Rejected = "Rejected",
  OnHold = "On Hold"
}

export enum ProcessType {
  CNC = "CNC",
  VMC = "VMC",
  MANUAL = "MANUAL",
  OSP = "OSP",
  GRINDING = "GRINDING",
  HOBBING = "HOBBING"
}

export enum ProcessStatus {
  Pending = "Pending",
  InProgress = "In Progress",
  Completed = "Completed",
  Skipped = "Skipped"
}

export interface ChildPartProcess {
  processId: string;
  processName: string;
  processType: ProcessType;
  machineId: string | null;
  sequence: number;

  // Time tracking
  estimatedCycleTimeMin: number;
  estimatedSetupTimeMin: number;
  actualStartTime: Date | null;
  actualEndTime: Date | null;

  // Status
  status: ProcessStatus;
  operatorName: string | null;
  remarks: string | null;
}

export interface ChildPartProductionOrder {
  id: string;
  childPartId: string;
  childPartName: string;
  parentOrderId: string;
  parentOrderNo: string;

  // Manufacturing details
  rawMaterialId: string;
  rawMaterialGrade: string;
  rawMaterialQtyRequired: number;
  rawMaterialUnit: string;

  // Production tracking
  quantityRequired: number;
  quantityProduced: number;
  quantityRejected: number;
  quantityInRework: number;

  // Status tracking
  status: ChildPartStatus;

  // Process flow
  processSequence: ChildPartProcess[];
  currentProcessId: string | null;
  currentProcessName: string | null;
  currentMachineId: string | null;

  // Dates
  plannedStartDate: Date;
  actualStartDate: Date | null;
  plannedCompletionDate: Date;
  actualCompletionDate: Date | null;
  readyForAssemblyDate: Date | null;

  // Resource assignment
  assignedOperator: string | null;
  jobCardNumber: string;

  // Dependencies
  isAssemblyReady: boolean;
  blockingReason: string | null;

  // Additional details
  productName?: string;
  icon?: string;
  progressPercentage?: number;
}
