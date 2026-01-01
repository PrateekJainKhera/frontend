import { MaterialPiece, MaterialUsageStatus, RawMaterialInventory } from "@/types/raw-material-inventory";
import { subDays } from "date-fns";

// Example: EN8 Steel Rod inventory with usage tracking
export const en8SteelRodPieces: MaterialPiece[] = [
  {
    id: "piece-001",
    rawMaterialId: "rm-001",
    rawMaterialName: "EN8 Steel Rod",
    grade: "EN8",
    shape: "Rod",

    // Dimensions
    originalLength: 6000, // 6 meters original
    currentLength: 4800, // 4.8 meters remaining
    diameter: 50,

    originalWeight: 115.2, // kg
    currentWeight: 92.16, // kg

    // Status
    status: MaterialUsageStatus.AVAILABLE,
    location: "Warehouse A",
    binNumber: "A-12",
    purchaseDate: subDays(new Date(), 30),
    purchaseCost: 8000,
    supplierName: "Steel Suppliers Ltd",
    batchNumber: "BATCH-2024-001",

    // Usage history
    usageHistory: [
      {
        id: "usage-001",
        materialPieceId: "piece-001",
        orderId: "ORD-001",
        orderNo: "ORD-001",
        childPartId: "CPP-001",
        childPartName: "Shaft",
        productName: "Printing Roller Assembly",

        lengthUsed: 1200,
        weightUsed: 23.04,
        quantityUsed: 1,
        lengthRemaining: 4800,
        weightRemaining: 92.16,

        cuttingDate: subDays(new Date(), 10),
        cutByOperator: "Ramesh",
        machineUsed: "Saw-01",
        wastageGenerated: 50, // Cutting wastage
        wastageReason: "Cutting scrap",
        notes: "Clean cut, no issues"
      }
    ],

    // Wastage rules
    minimumUsableLength: 300,
    minimumUsableWeight: 0.5,

    isWastage: false,
    isReusable: true,

    createdAt: subDays(new Date(), 30),
    updatedAt: subDays(new Date(), 10)
  },

  {
    id: "piece-002",
    rawMaterialId: "rm-001",
    rawMaterialName: "EN8 Steel Rod",
    grade: "EN8",
    shape: "Rod",

    originalLength: 6000,
    currentLength: 3300,
    diameter: 50,

    originalWeight: 115.2,
    currentWeight: 63.36,

    status: MaterialUsageStatus.AVAILABLE,
    location: "Warehouse A",
    binNumber: "A-12",
    purchaseDate: subDays(new Date(), 25),
    purchaseCost: 8000,
    supplierName: "Steel Suppliers Ltd",
    batchNumber: "BATCH-2024-002",

    usageHistory: [
      {
        id: "usage-002",
        materialPieceId: "piece-002",
        orderId: "ORD-002",
        orderNo: "ORD-002",
        childPartId: "CPP-006",
        childPartName: "Main Shaft",
        productName: "Magnetic Roller",

        lengthUsed: 1500,
        weightUsed: 28.8,
        quantityUsed: 1,
        lengthRemaining: 4500,
        weightRemaining: 86.4,

        cuttingDate: subDays(new Date(), 8),
        cutByOperator: "Prakash",
        machineUsed: "Saw-01",
        wastageGenerated: 60,
        wastageReason: "Cutting scrap"
      },
      {
        id: "usage-003",
        materialPieceId: "piece-002",
        orderId: "ORD-003",
        orderNo: "ORD-003",
        childPartId: "CPP-010",
        childPartName: "Roller Shaft",
        productName: "Rubber Roller",

        lengthUsed: 1200,
        weightUsed: 23.04,
        quantityUsed: 1,
        lengthRemaining: 3300,
        weightRemaining: 63.36,

        cuttingDate: subDays(new Date(), 3),
        cutByOperator: "Ramesh",
        machineUsed: "Saw-01",
        wastageGenerated: 40,
        wastageReason: "Cutting scrap"
      }
    ],

    minimumUsableLength: 300,
    minimumUsableWeight: 0.5,

    isWastage: false,
    isReusable: true,

    createdAt: subDays(new Date(), 25),
    updatedAt: subDays(new Date(), 3)
  },

  {
    id: "piece-003",
    rawMaterialId: "rm-001",
    rawMaterialName: "EN8 Steel Rod",
    grade: "EN8",
    shape: "Rod",

    originalLength: 6000,
    currentLength: 1500,
    diameter: 50,

    originalWeight: 115.2,
    currentWeight: 28.8,

    status: MaterialUsageStatus.AVAILABLE,
    location: "Warehouse A",
    binNumber: "A-12",
    purchaseDate: subDays(new Date(), 20),
    purchaseCost: 8000,
    supplierName: "Steel Suppliers Ltd",
    batchNumber: "BATCH-2024-003",

    usageHistory: [
      {
        id: "usage-004",
        materialPieceId: "piece-003",
        orderId: "ORD-004",
        orderNo: "ORD-004",
        childPartId: "CPP-015",
        childPartName: "Tikki",
        productName: "Printing Roller",

        lengthUsed: 1800,
        weightUsed: 34.56,
        quantityUsed: 1,
        lengthRemaining: 4200,
        weightRemaining: 80.64,

        cuttingDate: subDays(new Date(), 7),
        cutByOperator: "Suresh",
        machineUsed: "Saw-01",
        wastageGenerated: 55,
        wastageReason: "Cutting scrap"
      },
      {
        id: "usage-005",
        materialPieceId: "piece-003",
        orderId: "ORD-005",
        orderNo: "ORD-005",
        childPartId: "CPP-018",
        childPartName: "Connector Shaft",
        productName: "Idler Roller",

        lengthUsed: 2700,
        weightUsed: 51.84,
        quantityUsed: 1,
        lengthRemaining: 1500,
        weightRemaining: 28.8,

        cuttingDate: subDays(new Date(), 2),
        cutByOperator: "Ramesh",
        machineUsed: "Saw-01",
        wastageGenerated: 70,
        wastageReason: "Cutting scrap"
      }
    ],

    minimumUsableLength: 300,
    minimumUsableWeight: 0.5,

    isWastage: false,
    isReusable: true,

    createdAt: subDays(new Date(), 20),
    updatedAt: subDays(new Date(), 2)
  },

  // WASTAGE PIECE - Too small to use
  {
    id: "piece-004",
    rawMaterialId: "rm-001",
    rawMaterialName: "EN8 Steel Rod",
    grade: "EN8",
    shape: "Rod",

    originalLength: 6000,
    currentLength: 200, // Only 200mm left - WASTAGE!
    diameter: 50,

    originalWeight: 115.2,
    currentWeight: 3.84,

    status: MaterialUsageStatus.SCRAP,
    location: "Scrap Yard",
    binNumber: "SCRAP-01",
    purchaseDate: subDays(new Date(), 45),
    purchaseCost: 8000,
    supplierName: "Steel Suppliers Ltd",
    batchNumber: "BATCH-2023-098",

    usageHistory: [
      {
        id: "usage-006",
        materialPieceId: "piece-004",
        orderId: "ORD-006",
        orderNo: "ORD-006",
        childPartId: "CPP-020",
        childPartName: "Small Shaft",
        productName: "Mini Roller",

        lengthUsed: 1300,
        weightUsed: 24.96,
        quantityUsed: 1,
        lengthRemaining: 4700,
        weightRemaining: 90.24,

        cuttingDate: subDays(new Date(), 15),
        cutByOperator: "Prakash",
        machineUsed: "Saw-01",
        wastageGenerated: 45,
        wastageReason: "Cutting scrap"
      },
      {
        id: "usage-007",
        materialPieceId: "piece-004",
        orderId: "ORD-007",
        orderNo: "ORD-007",
        childPartId: "CPP-025",
        childPartName: "Pin",
        productName: "Assembly Pin",

        lengthUsed: 4500,
        weightUsed: 86.4,
        quantityUsed: 1,
        lengthRemaining: 200,
        weightRemaining: 3.84,

        cuttingDate: subDays(new Date(), 5),
        cutByOperator: "Suresh",
        machineUsed: "Saw-01",
        wastageGenerated: 100,
        wastageReason: "End piece too small - unusable"
      }
    ],

    minimumUsableLength: 300,
    minimumUsableWeight: 0.5,

    isWastage: true,
    isReusable: false,
    wastageReason: "Remaining length (200mm) below minimum usable length (300mm)",
    scrapValue: 150, // Can sell for scrap

    createdAt: subDays(new Date(), 45),
    updatedAt: subDays(new Date(), 5)
  },

  // ANOTHER WASTAGE PIECE
  {
    id: "piece-005",
    rawMaterialId: "rm-001",
    rawMaterialName: "EN8 Steel Rod",
    grade: "EN8",
    shape: "Rod",

    originalLength: 6000,
    currentLength: 280, // 280mm - just below 300mm cutoff
    diameter: 50,

    originalWeight: 115.2,
    currentWeight: 5.38,

    status: MaterialUsageStatus.SCRAP,
    location: "Scrap Yard",
    binNumber: "SCRAP-01",
    purchaseDate: subDays(new Date(), 40),
    purchaseCost: 8000,
    supplierName: "Steel Suppliers Ltd",
    batchNumber: "BATCH-2023-099",

    usageHistory: [
      {
        id: "usage-008",
        materialPieceId: "piece-005",
        orderId: "ORD-008",
        orderNo: "ORD-008",
        childPartId: "CPP-028",
        childPartName: "Long Shaft",
        productName: "Heavy Duty Roller",

        lengthUsed: 5720,
        weightUsed: 109.82,
        quantityUsed: 1,
        lengthRemaining: 280,
        weightRemaining: 5.38,

        cuttingDate: subDays(new Date(), 6),
        cutByOperator: "Ramesh",
        machineUsed: "Saw-01",
        wastageGenerated: 80,
        wastageReason: "End piece too small"
      }
    ],

    minimumUsableLength: 300,
    minimumUsableWeight: 0.5,

    isWastage: true,
    isReusable: false,
    wastageReason: "Remaining length (280mm) below minimum usable length (300mm)",
    scrapValue: 140,

    createdAt: subDays(new Date(), 40),
    updatedAt: subDays(new Date(), 6)
  },

  // GOOD REUSABLE PIECE (just above minimum)
  {
    id: "piece-006",
    rawMaterialId: "rm-001",
    rawMaterialName: "EN8 Steel Rod",
    grade: "EN8",
    shape: "Rod",

    originalLength: 6000,
    currentLength: 450, // 450mm - can still be used!
    diameter: 50,

    originalWeight: 115.2,
    currentWeight: 8.64,

    status: MaterialUsageStatus.AVAILABLE,
    location: "Warehouse A",
    binNumber: "A-12-SHORT", // Separate bin for short pieces
    purchaseDate: subDays(new Date(), 35),
    purchaseCost: 8000,
    supplierName: "Steel Suppliers Ltd",
    batchNumber: "BATCH-2024-004",

    usageHistory: [
      {
        id: "usage-009",
        materialPieceId: "piece-006",
        orderId: "ORD-009",
        orderNo: "ORD-009",
        childPartId: "CPP-030",
        childPartName: "Main Body",
        productName: "Standard Roller",

        lengthUsed: 5550,
        weightUsed: 106.56,
        quantityUsed: 1,
        lengthRemaining: 450,
        weightRemaining: 8.64,

        cuttingDate: subDays(new Date(), 4),
        cutByOperator: "Prakash",
        machineUsed: "Saw-01",
        wastageGenerated: 90,
        wastageReason: "Cutting scrap",
        notes: "Short piece - store for small parts"
      }
    ],

    minimumUsableLength: 300,
    minimumUsableWeight: 0.5,

    isWastage: false,
    isReusable: true,

    createdAt: subDays(new Date(), 35),
    updatedAt: subDays(new Date(), 4)
  }
];

// Inventory summary for EN8 Steel Rod
export const en8SteelRodInventory: RawMaterialInventory = {
  rawMaterialId: "rm-001",
  rawMaterialName: "EN8 Steel Rod Ø50mm",
  grade: "EN8",
  shape: "Rod",

  // Stock summary
  totalPieces: 6,
  availablePieces: 4, // piece-001, 002, 003, 006
  reservedPieces: 0,
  inUsePieces: 0,
  scrapPieces: 2, // piece-004, 005

  // Quantity summary
  totalLength: 10730, // 4800 + 3300 + 1500 + 450 + 200 + 280
  totalWeight: 205.98,

  // Cost summary
  totalValue: 14310, // Approximate based on remaining material
  averageCostPerKg: 69.44,
  averageCostPerMeter: 1333,

  // Wastage tracking
  totalWastageLength: 480, // 200 + 280
  totalWastageWeight: 9.22,
  totalWastageValue: 640,
  wastagePercentage: 4.28, // (480 / 11210) * 100

  pieces: en8SteelRodPieces,

  // Reorder
  minStockLevel: 5000, // 5 meters minimum
  reorderPoint: 8000, // Reorder when below 8 meters
  needsReorder: false // Currently have 10.73 meters
};

// Export mock data
export const rawMaterialInventories = [en8SteelRodInventory];
