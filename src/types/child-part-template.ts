import { RollerType } from './enums'

export enum ChildPartType {
  SHAFT = 'Shaft',
  CORE = 'Core',
  SLEEVE = 'Sleeve',
  END_DISK = 'End Disk',
  HOUSING = 'Housing',
  COVER = 'Cover',
  OTHER = 'Other'
}

export interface ChildPartProcessStep {
  id: string
  processId: string
  processName: string
  stepNumber: number
  machineName?: string
  standardTimeHours: number
  restTimeHours?: number // Rest/cooling time required after this process step
  description?: string
}

export interface ChildPartMaterialRequirement {
  id: string
  rawMaterialId: string
  rawMaterialName: string
  materialGrade: string
  quantityRequired: number
  unit: string // 'kg', 'meter', 'pieces'
  wastagePercent: number
}

export interface ChildPartTemplate {
  id: string
  templateCode: string
  templateName: string
  childPartType: ChildPartType
  rollerType: RollerType // Which roller this child part is used in
  drawingNumber?: string
  drawingRevision?: string

  // Dimensional specifications
  length?: number
  diameter?: number
  innerDiameter?: number
  outerDiameter?: number
  thickness?: number
  dimensionUnit: string // 'mm', 'cm', 'inch'

  // Material requirements (BOM for raw materials)
  materialRequirements: ChildPartMaterialRequirement[]

  // Manufacturing process sequence
  processSteps: ChildPartProcessStep[]

  // Total standard time (sum of all process steps)
  totalStandardTimeHours: number

  description?: string
  technicalNotes?: string
  qualityCheckpoints?: string[]

  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy?: string
  updatedBy?: string
}
