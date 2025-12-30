import { ProcessCategory, SkillLevel, RollerType } from './enums'

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
