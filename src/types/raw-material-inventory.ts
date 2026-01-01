// Raw Material Inventory Tracking with Usage and Wastage

export enum MaterialUsageStatus {
  AVAILABLE = "Available",
  IN_USE = "In Use",
  RESERVED = "Reserved",
  SCRAP = "Scrap/Wastage",
  CONSUMED = "Fully Consumed"
}

export interface MaterialPiece {
  id: string;
  rawMaterialId: string;
  rawMaterialName: string;
  grade: string;
  shape: string; // Rod, Pipe, Sheet

  // Physical dimensions
  originalLength?: number; // For Rod/Pipe (mm)
  currentLength?: number; // Remaining length
  diameter?: number; // For Rod/Pipe (mm)
  thickness?: number; // For Sheet (mm)
  width?: number; // For Sheet (mm)

  originalWeight?: number; // kg
  currentWeight?: number; // kg

  // Tracking
  status: MaterialUsageStatus;
  location: string; // Warehouse location
  binNumber?: string; // Storage bin
  purchaseDate: Date;
  purchaseCost: number;
  supplierName: string;
  batchNumber?: string;

  // Usage history
  usageHistory: MaterialUsage[];

  // Wastage rules
  minimumUsableLength?: number; // Below this = wastage (e.g., 300mm)
  minimumUsableWeight?: number; // Below this = wastage (e.g., 0.5kg)

  // Flags
  isWastage: boolean;
  isReusable: boolean;
  wastageReason?: string;
  scrapValue?: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface MaterialUsage {
  id: string;
  materialPieceId: string;
  orderId: string;
  orderNo: string;
  childPartId?: string;
  childPartName?: string;
  productName: string;

  // Consumption
  lengthUsed?: number; // mm
  weightUsed?: number; // kg
  quantityUsed: number; // Number of pieces cut from this

  // Remaining after this usage
  lengthRemaining?: number;
  weightRemaining?: number;

  // Cutting details
  cuttingDate: Date;
  cutByOperator: string;
  machineUsed?: string;

  // Wastage
  wastageGenerated?: number; // Length/weight wasted in cutting
  wastageReason?: string; // "Cutting scrap", "End piece too small", etc.

  notes?: string;
}

export interface RawMaterialInventory {
  rawMaterialId: string;
  rawMaterialName: string;
  grade: string;
  shape: string;

  // Stock summary
  totalPieces: number;
  availablePieces: number;
  reservedPieces: number;
  inUsePieces: number;
  scrapPieces: number;

  // Quantity summary
  totalLength?: number; // Total available length across all pieces
  totalWeight?: number; // Total available weight

  // Cost summary
  totalValue: number; // Current value of available stock
  averageCostPerKg?: number;
  averageCostPerMeter?: number;

  // Wastage tracking
  totalWastageLength?: number;
  totalWastageWeight?: number;
  totalWastageValue?: number;
  wastagePercentage?: number;

  // All pieces
  pieces: MaterialPiece[];

  // Reorder
  minStockLevel: number;
  reorderPoint: number;
  needsReorder: boolean;
}

export interface MaterialConsumptionRecord {
  id: string;
  date: Date;
  orderId: string;
  orderNo: string;
  productName: string;

  rawMaterialId: string;
  rawMaterialName: string;
  grade: string;

  // What was requested
  requiredLength?: number;
  requiredWeight?: number;
  requiredQuantity: number;

  // What was actually consumed
  consumedPieces: {
    pieceId: string;
    lengthUsed?: number;
    weightUsed?: number;
    lengthRemaining?: number;
    weightRemaining?: number;
    becameWastage: boolean;
  }[];

  // Summary
  totalLengthUsed?: number;
  totalWeightUsed?: number;
  totalWastageGenerated?: number;
  wastagePercentage?: number;
  totalCost: number;

  consumedBy: string; // Operator name
  approvedBy?: string;
  notes?: string;
}

export interface WastageReport {
  reportId: string;
  periodStart: Date;
  periodEnd: Date;

  // Summary by material
  materialWastage: {
    rawMaterialId: string;
    rawMaterialName: string;
    grade: string;
    totalWastageLength?: number;
    totalWastageWeight?: number;
    totalWastageValue: number;
    wastagePercentage: number;
    piecesBecameScrap: number;
  }[];

  // Overall summary
  totalWastageValue: number;
  totalMaterialCost: number;
  overallWastagePercentage: number;

  // Top wastage reasons
  wastageReasons: {
    reason: string;
    count: number;
    totalValue: number;
  }[];

  // Recommendations
  recommendations: string[];
}

export interface MaterialCuttingPlan {
  id: string;
  rawMaterialId: string;
  rawMaterialName: string;

  // Input
  availablePieces: {
    pieceId: string;
    currentLength: number;
    location: string;
  }[];

  // Requirements
  cuttingRequirements: {
    orderId: string;
    orderNo: string;
    requiredLength: number;
    quantity: number;
  }[];

  // Optimized plan
  cuttingPlan: {
    pieceId: string;
    cuts: {
      cutLength: number;
      forOrder: string;
      sequence: number;
    }[];
    remainingLength: number;
    isWastage: boolean;
  }[];

  // Results
  totalMaterialUsed: number;
  totalWastage: number;
  wastagePercentage: number;
  efficiency: number;

  createdAt: Date;
  createdBy: string;
}
