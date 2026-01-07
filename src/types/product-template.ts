import { RollerType } from './enums'

/**
 * Product Template - Complete manufacturing recipe for a roller type
 * Combines child parts BOM + process sequence in one template
 */
export interface ProductTemplate {
  id: string
  templateCode: string
  templateName: string
  description?: string
  rollerType: RollerType

  // Child parts required for this product
  childParts: ProductTemplateChildPart[]

  // Process sequence (links to existing process templates)
  processTemplateId: string
  processTemplateName: string

  // Metadata
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy?: string
}

/**
 * Child part requirement in a product template
 */
export interface ProductTemplateChildPart {
  id: string
  productTemplateId: string
  childPartName: string
  childPartCode?: string
  quantity: number // Quantity required per roller
  unit: string // e.g., "pcs", "kg", "m"
  notes?: string
  sequenceNo: number // Order in which parts are needed
}

/**
 * Size variant - used when creating orders from template
 */
export interface ProductSizeVariant {
  length: number
  diameter: number
  unit: 'mm' | 'inch'
}
