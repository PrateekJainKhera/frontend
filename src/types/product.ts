import { RollerType } from './enums'

export interface ProductChildPartDrawing {
  id: number
  productId: number
  childPartTemplateId: number
  drawingId: number
  createdAt: Date
  createdBy?: string
  updatedAt?: Date
  updatedBy?: string
}

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

  // Legacy drawing fields (kept for backward compatibility)
  drawingNo?: string
  revisionNo?: string
  revisionDate?: string

  // Product-Level Drawing Review (NEW)
  assemblyDrawingId?: number
  customerProvidedDrawingId?: number
  drawingReviewStatus: string // See DrawingReviewStatus enum for valid values
  drawingReviewedBy?: string
  drawingReviewedAt?: Date
  drawingReviewNotes?: string
  drawingRequestedAt?: Date
  drawingRequestedBy?: string

  numberOfTeeth: number
  surfaceFinish?: string
  hardness?: string
  productTemplateId?: number
  processTemplateId: number
  createdAt: Date
  updatedAt: Date
  createdBy: string
}
