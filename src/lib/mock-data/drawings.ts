// Manufacturing Dimensions - CRITICAL for job card generation
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
  partType: 'shaft' | 'pipe' | 'final' | 'gear' | 'bushing' | 'roller' | 'other'
  revision: string // A, B, C, etc.
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

export const mockDrawings: Drawing[] = [
  {
    id: '1',
    drawingNumber: 'SHAFT-001',
    drawingName: 'Main Shaft Assembly',
    partType: 'shaft',
    revision: 'B',
    status: 'approved',
    fileName: 'SHAFT-001-RevB.pdf',
    fileType: 'pdf',
    fileUrl: '/drawings/shaft-001-b.pdf',
    fileSize: 245,
    manufacturingDimensions: {
      rodDiameter: 50,
      finishedLength: 1200,
      finishedDiameter: 48,
      materialGrade: 'EN8',
      tolerance: '±0.01mm',
      surfaceFinish: 'N6',
      hardness: '45-50 HRC',
      keySlotLength: 40,
      keySlotWidth: 12,
      bearingSize: '6210',
      theoreticalWeight: 15.5,
      materialRequiredPerPiece: 17.0
    },
    linkedPartId: 'part-001',
    linkedPartName: 'Steel Shaft Ø50mm',
    linkedProductId: 'prod-001',
    linkedProductName: 'Printing Roller Model PR-100',
    linkedCustomerId: 'cust-001',
    linkedCustomerName: 'ABC Industries',
    description: 'Main shaft for printing roller assembly',
    notes: 'Critical tolerance: ±0.01mm on bearing surfaces',
    createdBy: 'Ramesh Kumar',
    createdAt: '2024-01-10',
    updatedAt: '2024-01-25',
    approvedBy: 'Suresh Patel',
    approvedAt: '2024-01-26'
  },
  {
    id: '2',
    drawingNumber: 'PIPE-045',
    drawingName: 'Roller Pipe Core',
    partType: 'pipe',
    revision: 'C',
    status: 'approved',
    fileName: 'PIPE-045-RevC.pdf',
    fileType: 'pdf',
    fileUrl: '/drawings/pipe-045-c.pdf',
    fileSize: 189,
    manufacturingDimensions: {
      pipeOD: 110,
      pipeID: 90,
      pipeThickness: 10,
      cutLength: 1500,
      materialGrade: 'MS (Mild Steel)',
      tolerance: '±0.5mm',
      surfaceFinish: 'N8',
      theoreticalWeight: 35.2,
      materialRequiredPerPiece: 36.5
    },
    linkedPartId: 'part-002',
    linkedPartName: 'MS Pipe 110x90mm',
    linkedProductId: 'prod-002',
    linkedProductName: 'Industrial Roller Model IR-200',
    description: 'Core pipe for industrial roller',
    notes: 'Check straightness before machining',
    createdBy: 'Vikram Shah',
    createdAt: '2024-01-15',
    updatedAt: '2024-02-01',
    approvedBy: 'Suresh Patel',
    approvedAt: '2024-02-02'
  },
  {
    id: '3',
    drawingNumber: 'GEAR-012',
    drawingName: 'Drive Gear 24T',
    partType: 'gear',
    revision: 'A',
    status: 'approved',
    fileName: 'GEAR-012-RevA.pdf',
    fileType: 'pdf',
    fileUrl: '/drawings/gear-012-a.pdf',
    fileSize: 312,
    linkedPartId: 'comp-003',
    linkedPartName: '24 Tooth Drive Gear',
    description: '24 tooth drive gear for roller system',
    notes: 'Material: EN8, Hardness: 45-50 HRC',
    createdBy: 'Ramesh Kumar',
    createdAt: '2024-01-20',
    updatedAt: '2024-01-20',
    approvedBy: 'Suresh Patel',
    approvedAt: '2024-01-22'
  },
  {
    id: '4',
    drawingNumber: 'FINAL-PR100',
    drawingName: 'Printing Roller Assembly',
    partType: 'final',
    revision: 'D',
    status: 'approved',
    fileName: 'FINAL-PR100-RevD.pdf',
    fileType: 'pdf',
    fileUrl: '/drawings/final-pr100-d.pdf',
    fileSize: 567,
    linkedProductId: 'prod-001',
    linkedProductName: 'Printing Roller Model PR-100',
    linkedCustomerId: 'cust-001',
    linkedCustomerName: 'ABC Industries',
    description: 'Complete assembly drawing for PR-100 model',
    notes: 'Customer-specific modifications in Rev D',
    createdBy: 'Vikram Shah',
    createdAt: '2024-02-01',
    updatedAt: '2024-02-10',
    approvedBy: 'Suresh Patel',
    approvedAt: '2024-02-11'
  },
  {
    id: '5',
    drawingNumber: 'BUSH-007',
    drawingName: 'Bearing Bush',
    partType: 'bushing',
    revision: 'A',
    status: 'draft',
    fileName: 'BUSH-007-RevA.pdf',
    fileType: 'pdf',
    fileUrl: '/drawings/bush-007-a.pdf',
    fileSize: 156,
    linkedPartId: 'comp-005',
    linkedPartName: 'Bronze Bush Ø50x60mm',
    description: 'Bronze bearing bush for shaft support',
    notes: 'Pending approval - awaiting customer feedback',
    createdBy: 'Ramesh Kumar',
    createdAt: '2024-02-15',
    updatedAt: '2024-02-15'
  },
  {
    id: '6',
    drawingNumber: 'SHAFT-001',
    drawingName: 'Main Shaft Assembly',
    partType: 'shaft',
    revision: 'A',
    status: 'obsolete',
    fileName: 'SHAFT-001-RevA.pdf',
    fileType: 'pdf',
    fileUrl: '/drawings/shaft-001-a.pdf',
    fileSize: 228,
    linkedPartId: 'part-001',
    linkedPartName: 'Steel Shaft Ø50mm',
    linkedProductId: 'prod-001',
    linkedProductName: 'Printing Roller Model PR-100',
    description: 'Main shaft for printing roller assembly (OLD)',
    notes: 'Superseded by Rev B - DO NOT USE',
    createdBy: 'Ramesh Kumar',
    createdAt: '2024-01-10',
    updatedAt: '2024-01-25',
    approvedBy: 'Suresh Patel',
    approvedAt: '2024-01-15'
  },
  {
    id: '7',
    drawingNumber: 'ROLLER-SR50',
    drawingName: 'Standard Roller 50mm',
    partType: 'roller',
    revision: 'B',
    status: 'approved',
    fileName: 'ROLLER-SR50-RevB.pdf',
    fileType: 'pdf',
    fileUrl: '/drawings/roller-sr50-b.pdf',
    fileSize: 423,
    linkedProductId: 'prod-005',
    linkedProductName: 'Standard Roller SR-50',
    description: 'Standard 50mm diameter roller',
    notes: 'Standard design - no customer customization',
    createdBy: 'Vikram Shah',
    createdAt: '2024-01-05',
    updatedAt: '2024-01-18',
    approvedBy: 'Suresh Patel',
    approvedAt: '2024-01-19'
  }
]
