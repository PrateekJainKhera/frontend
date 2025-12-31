export enum ComponentCategory {
  BEARING = 'Bearing',
  GEAR = 'Gear',
  SEAL = 'Seal',
  COUPLING = 'Coupling',
  SHAFT = 'Shaft',
  BUSHING = 'Bushing',
  FASTENER = 'Fastener',
  OTHER = 'Other'
}

export interface Component {
  id: string
  partNumber: string
  componentName: string
  category: ComponentCategory
  manufacturer?: string
  supplierName?: string
  specifications?: string
  unitCost: number
  stockQty: number
  minStockLevel: number
  leadTimeDays: number
  unit: string // e.g., 'pcs', 'sets', 'pairs'
  location?: string // Storage location
  notes?: string
  createdAt: Date
  updatedAt: Date
}
