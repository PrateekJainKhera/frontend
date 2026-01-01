import { ProcessCategory, SkillLevel, RollerType } from './enums'
import { ProcessSubCategory, MachineType, CNCOperationType, MagneticProcessType } from './pfd-template'
import { OSPProcessType } from './osp-tracking'

export interface Process {
  id: string
  processCode: string
  processName: string
  category: ProcessCategory
  defaultMachine?: string
  standardTimeMin: number
  skillRequired: SkillLevel
  isOutsourced: boolean
  createdAt: Date
  updatedAt: Date

  // Enhanced categorization
  subCategory?: ProcessSubCategory | null

  // Machine specifics
  machineType?: MachineType
  machineId?: string | null
  machineName?: string | null

  // CNC-specific
  isCNC?: boolean
  cncSequence?: number | null
  cncOperationType?: CNCOperationType | null

  // Time estimates
  setupTimeMin?: number
  cycleTimeMin?: number
  cycleTimeFormula?: string | null

  // Manual operation
  isManualOperation?: boolean

  // OSP specifics
  outsourceVendor?: string | null
  ospVendorId?: string | null
  ospVendorName?: string | null
  ospProcessType?: OSPProcessType | null
  ospLeadTimeDays?: number | null
  ospCostPerPiece?: number | null

  // Quality
  requiresInspection?: boolean
  inspectionType?: string | null

  // Magnetic roller specific
  isMagneticRollerProcess?: boolean
  magneticProcessType?: MagneticProcessType | null
  magnetQuantityFormula?: string | null
  chemicalType?: string | null
  heatingTemperature?: number | null
  heatingDurationMin?: number | null
  vacuumPressure?: number | null
}

export interface ProcessTemplate {
  id: string
  templateName: string
  description?: string
  applicableTypes: RollerType[]
  steps: ProcessTemplateStep[]
  createdAt: Date
  updatedAt: Date
}

export interface ProcessTemplateStep {
  id: string
  templateId: string
  processId: string
  processName: string
  stepNo: number
  isMandatory: boolean
  canBeParallel: boolean
}
