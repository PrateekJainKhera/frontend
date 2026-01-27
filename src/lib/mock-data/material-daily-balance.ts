import { MaterialDailyBalance, MaterialInventoryDailyReport } from '@/types/material-daily-balance'

// Mock data for Material Inventory Daily Balance
export const mockMaterialDailyBalance: MaterialDailyBalance[] = [
    {
        id: 'mdb-001',
        rawMaterialId: 'rm-1',
        materialName: 'EN8 Rod 50mm',
        grade: 'EN8',
        shape: 'Rod',
        diameter: 50,

        openingPieces: 10,
        openingLengthMM: 28000,

        receivedPieces: 5,
        receivedLengthMM: 15000,

        issuedPieces: 3,
        issuedLengthMM: 9000,

        scrapPieces: 1,
        scrapLengthMM: 250,

        closingPieces: 11,
        closingLengthMM: 33750,

        minStockLevel: 20000,
        isLowStock: false,
        category: 'Steel'
    },
    {
        id: 'mdb-002',
        rawMaterialId: 'rm-2',
        materialName: 'EN8 Rod 80mm',
        grade: 'EN8',
        shape: 'Rod',
        diameter: 80,

        openingPieces: 8,
        openingLengthMM: 24000,

        receivedPieces: 0,
        receivedLengthMM: 0,

        issuedPieces: 2,
        issuedLengthMM: 5500,

        scrapPieces: 0,
        scrapLengthMM: 0,

        closingPieces: 6,
        closingLengthMM: 18500,

        minStockLevel: 15000,
        isLowStock: false,
        category: 'Steel'
    },
    {
        id: 'mdb-003',
        rawMaterialId: 'rm-3',
        materialName: 'EN19 Rod 100mm',
        grade: 'EN19',
        shape: 'Rod',
        diameter: 100,

        openingPieces: 5,
        openingLengthMM: 15000,

        receivedPieces: 3,
        receivedLengthMM: 9000,

        issuedPieces: 4,
        issuedLengthMM: 11500,

        scrapPieces: 1,
        scrapLengthMM: 280,

        closingPieces: 3,
        closingLengthMM: 12220,

        minStockLevel: 10000,
        isLowStock: false,
        category: 'Alloy'
    },
    {
        id: 'mdb-004',
        rawMaterialId: 'rm-4',
        materialName: 'SS304 Pipe 60mm',
        grade: 'SS304',
        shape: 'Pipe',
        diameter: 60,

        openingPieces: 4,
        openingLengthMM: 12000,

        receivedPieces: 0,
        receivedLengthMM: 0,

        issuedPieces: 2,
        issuedLengthMM: 4800,

        scrapPieces: 0,
        scrapLengthMM: 0,

        closingPieces: 2,
        closingLengthMM: 7200,

        minStockLevel: 8000,
        isLowStock: true, // Below min stock!
        category: 'Stainless Steel'
    },
    {
        id: 'mdb-005',
        rawMaterialId: 'rm-5',
        materialName: 'SS316 Rod 75mm',
        grade: 'SS316',
        shape: 'Rod',
        diameter: 75,

        openingPieces: 6,
        openingLengthMM: 18000,

        receivedPieces: 2,
        receivedLengthMM: 6000,

        issuedPieces: 1,
        issuedLengthMM: 2800,

        scrapPieces: 0,
        scrapLengthMM: 0,

        closingPieces: 7,
        closingLengthMM: 21200,

        minStockLevel: 15000,
        isLowStock: false,
        category: 'Stainless Steel'
    },
    {
        id: 'mdb-006',
        rawMaterialId: 'rm-6',
        materialName: 'EN24 Rod 65mm',
        grade: 'EN24',
        shape: 'Rod',
        diameter: 65,

        openingPieces: 3,
        openingLengthMM: 9000,

        receivedPieces: 0,
        receivedLengthMM: 0,

        issuedPieces: 2,
        issuedLengthMM: 5200,

        scrapPieces: 1,
        scrapLengthMM: 180,

        closingPieces: 0,
        closingLengthMM: 3620,

        minStockLevel: 6000,
        isLowStock: true, // Below min stock!
        category: 'Alloy'
    }
]

// Daily Report
export const mockMaterialInventoryReport: MaterialInventoryDailyReport = {
    date: new Date(),
    materials: mockMaterialDailyBalance,
    totalMaterials: mockMaterialDailyBalance.length,
    lowStockCount: mockMaterialDailyBalance.filter(m => m.isLowStock).length,
    totalReceivedLength: mockMaterialDailyBalance.reduce((sum, m) => sum + m.receivedLengthMM, 0),
    totalIssuedLength: mockMaterialDailyBalance.reduce((sum, m) => sum + m.issuedLengthMM, 0)
}
