import { RollerType } from './enums'

export interface Product {
  id: number
  partCode: string
  customerName: string
  modelName: string
  rollerType: RollerType
  diameter: number
  length: number
  materialGrade: string
  drawingNo?: string
  revisionNo?: string
  revisionDate?: string
  numberOfTeeth?: number | null
  surfaceFinish?: string
  hardness?: string
  processTemplateId: number
  createdAt: Date
  updatedAt: Date
  createdBy: string
}
