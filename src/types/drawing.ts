// Drawing domain types (moved out of mock-data; used with the real drawings API)

export interface ManufacturingDimensions {
  // For SHAFT (Rod/Solid)
  rodDiameter?: number // mm - for rod-type parts
  finishedLength?: number // mm - final shaft length after machining
  finishedDiameter?: number // mm - final diameter after machining

  // For PIPE (Hollow/Tube)
  pipeOD?: number // mm - outer diameter
  pipeID?: number // mm - inner diameter
  pipeThickness?: number // mm - wall thickness
  cutLength?: number // mm - cut length required

  // Common for all
  materialGrade: string // e.g., EN8, MS, SS304
  tolerance?: string // e.g., ±0.01mm, H7
  surfaceFinish?: string // e.g., N6, Ra 1.6
  hardness?: string // e.g., 45-50 HRC

  // Additional specifications
  keySlotLength?: number // mm
  keySlotWidth?: number // mm
  threadSize?: string // e.g., M20x1.5
  bearingSize?: string // e.g., 6205

  // Weight and material
  theoreticalWeight?: number // kg per piece
  materialRequiredPerPiece?: number // kg raw material needed
}

export interface Drawing {
  id: string
  drawingNumber: string
  drawingName: string
  drawingType: 'shaft' | 'pipe' | 'final' | 'gear' | 'bushing' | 'roller' | 'other'
  revision: string // A, B, C, etc.
  revisionDate: string // Date when this revision was created
  status: 'draft' | 'approved' | 'obsolete'

  // File information
  fileName: string
  fileType: 'pdf' | 'image' | 'dwg'
  fileUrl: string
  fileSize: number // in KB

  // CRITICAL: Manufacturing Dimensions (entered by engineer)
  // These dimensions are AUTHORITATIVE and used by job cards
  manufacturingDimensions?: ManufacturingDimensions

  // Linking to parts/products
  linkedPartId?: string // Links to raw material, component, or child part
  linkedPartName?: string
  linkedProductId?: string // Links to product/roller model
  linkedProductName?: string
  linkedCustomerId?: string // Optional customer-specific drawing
  linkedCustomerName?: string

  // Metadata
  description: string
  notes?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  approvedBy?: string
  approvedAt?: string
}
