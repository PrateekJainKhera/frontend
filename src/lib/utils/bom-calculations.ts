import { ProductBOM, BOMItem, BOMRequirement } from '@/types'
import { mockComponents } from '@/lib/mock-data/components'
import { mockRawMaterials } from '@/lib/mock-data/raw-materials'

// Get current stock for an item
// NOTE: Stock tracking should be done via Inventory module, not Masters
// This is a placeholder that would connect to inventory data
export function getCurrentStock(itemId: string, itemType: 'COMPONENT' | 'RAW_MATERIAL'): number {
  // In real implementation, this would query the Inventory module
  // For now, return 0 as placeholder - stock data doesn't exist in Masters
  return 0
}

// Get unit cost for an item
// NOTE: Pricing data should come from a Pricing module, not Masters
// This is a placeholder that would connect to pricing data
export function getUnitCost(itemId: string, itemType: 'COMPONENT' | 'RAW_MATERIAL'): number {
  // In real implementation, this would query the Pricing module
  // For now, return placeholder values - pricing data doesn't exist in Masters
  return 100 // Placeholder cost
}

// Calculate shortfall for a BOM item based on order quantity
function calculateShortfall(item: BOMItem, orderQuantity: number): number {
  const requiredQty = item.quantity * orderQuantity
  const currentStock = getCurrentStock(item.itemId, item.itemType)
  const shortfall = requiredQty - currentStock
  return shortfall > 0 ? shortfall : 0
}

// Calculate total material requirements for order quantity
export function calculateBOMRequirements(
  bom: ProductBOM,
  orderQuantity: number
): BOMRequirement[] {
  return bom.bomItems.map(item => ({
    ...item,
    requiredQty: item.quantity * orderQuantity,
    currentStock: getCurrentStock(item.itemId, item.itemType),
    shortfall: calculateShortfall(item, orderQuantity)
  }))
}

// Check if all BOM materials are in stock
export function isBOMFulfillable(
  bom: ProductBOM,
  orderQuantity: number
): { fulfillable: boolean; missingItems: BOMItem[] } {
  const missingItems: BOMItem[] = []

  for (const item of bom.bomItems) {
    const shortfall = calculateShortfall(item, orderQuantity)
    if (shortfall > 0 && !item.isOptional) {
      missingItems.push(item)
    }
  }

  return {
    fulfillable: missingItems.length === 0,
    missingItems
  }
}

// Calculate total BOM cost per unit
export function calculateBOMCost(bom: ProductBOM): number {
  return bom.bomItems.reduce((total, item) => {
    const unitCost = getUnitCost(item.itemId, item.itemType)
    return total + (item.quantity * unitCost)
  }, 0)
}

// Calculate total BOM cost for order quantity
export function calculateTotalBOMCost(bom: ProductBOM, orderQuantity: number): number {
  return calculateBOMCost(bom) * orderQuantity
}

// Get BOM items requiring approval
export function getItemsRequiringApproval(bom: ProductBOM): BOMItem[] {
  return bom.bomItems.filter(item => item.approvalRequired)
}

// Validate all material approvals
export function validateMaterialApprovals(
  bomItems: BOMItem[]
): { allApproved: boolean; pendingApprovals: BOMItem[] } {
  // In a real app, this would check approval status from database
  // For mock, assume items with approvedSuppliers list are approved
  const pendingApprovals = bomItems.filter(item =>
    item.approvalRequired && (!item.approvedSuppliers || item.approvedSuppliers.length === 0)
  )

  return {
    allApproved: pendingApprovals.length === 0,
    pendingApprovals
  }
}

// Group BOM items by type
export function groupBOMItemsByType(bom: ProductBOM): {
  components: BOMItem[]
  rawMaterials: BOMItem[]
} {
  return {
    components: bom.bomItems.filter(item => item.itemType === 'COMPONENT'),
    rawMaterials: bom.bomItems.filter(item => item.itemType === 'RAW_MATERIAL')
  }
}
