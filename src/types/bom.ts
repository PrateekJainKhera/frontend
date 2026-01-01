export interface ProductBOM {
  id: string
  productId: string
  bomVersion: string
  isActive: boolean
  notes?: string
  createdAt: Date
  updatedAt: Date
  bomItems: BOMItem[]
}

export interface BOMItem {
  id: string
  bomId: string
  itemType: 'COMPONENT' | 'RAW_MATERIAL'
  itemId: string
  itemName: string
  itemCode: string
  quantity: number
  unit: string
  isOptional: boolean
  notes?: string
  approvalRequired: boolean
  approvedSuppliers?: string[]
}

export interface BOMRequirement extends BOMItem {
  requiredQty: number
  currentStock: number
  shortfall: number
}
