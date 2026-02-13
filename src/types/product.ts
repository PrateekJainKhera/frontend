import { RollerType } from './enums'

export interface Product {
  id: number
  partCode: string
  customerName: string
  modelId: number
  modelName: string // Kept for backward compatibility
  rollerType: RollerType
  diameter: number
  length: number
  materialGrade: string
  drawingNo?: string
  revisionNo?: string
  revisionDate?: string
  numberOfTeeth: number
  surfaceFinish?: string
  hardness?: string
  processTemplateId: number
  createdAt: Date
  updatedAt: Date
  createdBy: string
}
