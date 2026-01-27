// Material Inventory Daily Balance Types

export interface MaterialDailyBalance {
    id: string
    rawMaterialId: string
    materialName: string
    grade: string
    shape: string
    diameter: number

    // Opening Balance
    openingPieces: number
    openingLengthMM: number

    // Receipts (GRN In)
    receivedPieces: number
    receivedLengthMM: number

    // Issues (Production Out)
    issuedPieces: number
    issuedLengthMM: number

    // Scrap
    scrapPieces: number
    scrapLengthMM: number

    // Closing Balance
    closingPieces: number
    closingLengthMM: number

    // Stock Status
    minStockLevel: number // in mm
    isLowStock: boolean

    // Category for grouping
    category: 'Steel' | 'Stainless Steel' | 'Alloy' | 'Other'
}

export interface MaterialInventoryDailyReport {
    date: Date
    materials: MaterialDailyBalance[]

    // Summary
    totalMaterials: number
    lowStockCount: number
    totalReceivedLength: number
    totalIssuedLength: number
}
