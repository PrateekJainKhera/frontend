import { RollerType } from "./enums";

export enum ProcessCategory {
  CNC_TURNING = "CNC Turning",
  CNC_MILLING = "CNC Milling",
  VMC = "VMC",
  GRINDING = "Grinding",
  HOBBING = "Hobbing",
  HEAT_TREATMENT = "Heat Treatment",
  SURFACE_TREATMENT = "Surface Treatment",
  MANUAL_OPERATION = "Manual Operation",
  ASSEMBLY = "Assembly",
  INSPECTION = "Inspection"
}

export enum ProcessSubCategory {
  // CNC Turning
  TURNING_1ST = "1st Turning",
  TURNING_2ND = "2nd Turning",
  TURNING_3RD = "3rd Turning",
  TURNING_4TH = "4th Turning",

  // Grinding
  GRINDING_OD = "OD Grinding",
  GRINDING_FINISH = "Finish Grinding",

  // VMC
  VMC_SLOTTING = "Slotting",
  VMC_FACING = "Facing",

  // Manual
  MANUAL_POLISHING = "Manual Polishing",
  MANUAL_ASSEMBLY = "Manual Assembly",

  // OSP
  OSP_BLACKENING = "Blackening",
  OSP_HEAT_TREATMENT = "Heat Treatment",
  OSP_ANODISING = "Anodising"
}

export enum MachineType {
  CNC_LATHE = "CNC Lathe",
  CNC_MILLING = "CNC Milling Machine",
  VMC = "VMC (Vertical Machining Center)",
  GRINDING_MACHINE = "Grinding Machine",
  HOBBING_MACHINE = "Hobbing Machine",
  MANUAL_TOOL = "Manual Tool",
  OUTSOURCE = "Outsource (OSP)"
}

export enum CNCOperationType {
  ROUGHING = "Roughing",
  SEMI_FINISHING = "Semi-Finishing",
  FINISHING = "Finishing",
  THREADING = "Threading",
  GROOVING = "Grooving"
}

export enum MagneticProcessType {
  VMC_SLOTTING = "VMC Slotting",
  MAGNET_ASSEMBLY = "Magnet Assembly",
  CHEMICAL_APPLICATION = "Chemical Application",
  VACUUMING = "Vacuuming",
  HEATING_CYCLE = "Heating Cycle",
  MULTI_STAGE_GRINDING = "Multi-Stage Grinding"
}

export interface PFDProcessStep {
  stepNumber: number;
  processId: string;
  processName: string;
  processCategory: ProcessCategory;
  subCategory: ProcessSubCategory | null;

  // Visual indicators
  icon: string;
  color: string;

  // Machine details
  machineType: MachineType;
  defaultMachineId: string | null;
  allowedMachines: string[];

  // Timing
  setupTimeMin: number;
  cycleTimeMin: number;
  isParallelizable: boolean;

  // Dependencies
  dependsOnSteps: number[];
  isOptional: boolean;
  optionalCondition: string | null;

  // Quality
  hasInspectionCheckpoint: boolean;
  inspectionCriteria: string | null;

  // Manual operation
  isManual: boolean;
  manualInstructions: string | null;

  // Outsource
  isOutsourced: boolean;
  ospVendor: string | null;
  ospLeadTimeDays: number | null;

  // Magnetic roller specific
  isMagneticRollerProcess?: boolean;
  magneticProcessType?: MagneticProcessType | null;
  magnetQuantityFormula?: string | null;
  chemicalType?: string | null;
  heatingTemperature?: number | null;
  heatingDurationMin?: number | null;
  vacuumPressure?: number | null;

  // CNC specific
  isCNC?: boolean;
  cncSequence?: number | null;
  cncOperationType?: CNCOperationType | null;
}

export interface PFDTemplate {
  id: string;
  productType: RollerType;
  childPartType: string | null;
  version: string;
  isActive: boolean;
  processFlow: PFDProcessStep[];
}
