import { MaterialPiece, MaterialUsage, RawMaterialInventory, MaterialConsumptionRecord } from "@/types/raw-material-inventory";

/**
 * Check if a material piece is wastage based on remaining dimensions
 */
export function isWastagePiece(
  piece: MaterialPiece,
  minimumUsableLength: number = 300, // Default: 300mm
  minimumUsableWeight: number = 0.5 // Default: 0.5kg
): boolean {
  if (piece.currentLength !== undefined && piece.currentLength > 0) {
    return piece.currentLength < minimumUsableLength;
  }

  if (piece.currentWeight !== undefined && piece.currentWeight > 0) {
    return piece.currentWeight < minimumUsableWeight;
  }

  return false;
}

/**
 * Calculate remaining length after usage
 */
export function calculateRemainingLength(
  currentLength: number,
  lengthUsed: number
): number {
  return Math.max(0, currentLength - lengthUsed);
}

/**
 * Calculate remaining weight after usage
 */
export function calculateRemainingWeight(
  currentWeight: number,
  weightUsed: number
): number {
  return Math.max(0, currentWeight - weightUsed);
}

/**
 * Calculate wastage percentage for a material piece
 */
export function calculateWastagePercentage(
  originalLength: number,
  currentLength: number
): number {
  if (originalLength === 0) return 0;
  const used = originalLength - currentLength;
  return Math.round((used / originalLength) * 100);
}

/**
 * Calculate material utilization efficiency
 */
export function calculateMaterialEfficiency(
  totalMaterialUsed: number,
  totalMaterialConsumed: number,
  totalWastage: number
): number {
  if (totalMaterialUsed === 0) return 0;
  const efficiency = (totalMaterialConsumed / totalMaterialUsed) * 100;
  return Math.round(efficiency * 10) / 10; // Round to 1 decimal
}

/**
 * Calculate total value of wastage
 */
export function calculateWastageValue(
  wastagePieces: MaterialPiece[]
): number {
  return wastagePieces.reduce((total, piece) => {
    if (!piece.currentLength || !piece.originalLength) return total;

    // Calculate cost per mm
    const costPerMm = piece.purchaseCost / piece.originalLength;
    // Calculate wastage cost
    const wastageLength = piece.currentLength;
    const wastageCost = costPerMm * wastageLength;

    return total + wastageCost;
  }, 0);
}

/**
 * Find best material piece for a required length
 * Returns the piece that minimizes wastage
 */
export function findBestMaterialPiece(
  availablePieces: MaterialPiece[],
  requiredLength: number,
  minimumUsableLength: number = 300
): MaterialPiece | null {
  // Filter pieces that can fulfill the requirement
  const suitablePieces = availablePieces.filter(
    piece =>
      piece.currentLength &&
      piece.currentLength >= requiredLength &&
      piece.status === "Available"
  );

  if (suitablePieces.length === 0) return null;

  // Sort by remaining length after cutting (ascending)
  // This minimizes wastage by using pieces that leave least unusable scrap
  const sorted = suitablePieces.sort((a, b) => {
    const remainingA = (a.currentLength || 0) - requiredLength;
    const remainingB = (b.currentLength || 0) - requiredLength;

    // Prefer pieces that leave reusable length or zero
    const wasteA = remainingA < minimumUsableLength ? remainingA : 0;
    const wasteB = remainingB < minimumUsableLength ? remainingB : 0;

    if (wasteA !== wasteB) {
      return wasteA - wasteB; // Prefer less waste
    }

    // If waste is same, prefer smaller remaining (exact fit)
    return remainingA - remainingB;
  });

  return sorted[0];
}

/**
 * Calculate optimal cutting plan for multiple requirements
 * This is a basic implementation - can be enhanced with better algorithms
 */
export function calculateOptimalCuttingPlan(
  availablePieces: MaterialPiece[],
  requirements: { requiredLength: number; quantity: number; orderId: string }[],
  minimumUsableLength: number = 300
): {
  plan: { pieceId: string; cuts: { length: number; orderId: string }[]; remaining: number; isWastage: boolean }[];
  totalWastage: number;
  efficiency: number;
} {
  const plan: {
    pieceId: string;
    cuts: { length: number; orderId: string }[];
    remaining: number;
    isWastage: boolean;
  }[] = [];

  let totalWastage = 0;
  let totalUsed = 0;
  let totalConsumed = 0;

  // Sort requirements by length (descending) - cut longer pieces first
  const sortedRequirements = requirements
    .flatMap(req => Array(req.quantity).fill({ length: req.requiredLength, orderId: req.orderId }))
    .sort((a, b) => b.length - a.length);

  // Sort pieces by length (ascending) - use smaller pieces first
  const sortedPieces = [...availablePieces]
    .filter(p => p.currentLength && p.status === "Available")
    .sort((a, b) => (a.currentLength || 0) - (b.currentLength || 0));

  for (const req of sortedRequirements) {
    const bestPiece = findBestMaterialPiece(sortedPieces, req.length, minimumUsableLength);

    if (!bestPiece || !bestPiece.currentLength) continue;

    // Find or create plan entry for this piece
    let planEntry = plan.find(p => p.pieceId === bestPiece.id);
    if (!planEntry) {
      planEntry = {
        pieceId: bestPiece.id,
        cuts: [],
        remaining: bestPiece.currentLength,
        isWastage: false
      };
      plan.push(planEntry);
    }

    // Add cut
    planEntry.cuts.push({ length: req.length, orderId: req.orderId });
    planEntry.remaining -= req.length;

    // Update piece in sorted array
    bestPiece.currentLength = planEntry.remaining;

    totalUsed += req.length;
    totalConsumed += req.length;
  }

  // Calculate wastage
  for (const entry of plan) {
    entry.isWastage = entry.remaining < minimumUsableLength && entry.remaining > 0;
    if (entry.isWastage) {
      totalWastage += entry.remaining;
      totalUsed += entry.remaining;
    }
  }

  const efficiency = totalUsed > 0 ? (totalConsumed / totalUsed) * 100 : 0;

  return { plan, totalWastage, efficiency };
}

/**
 * Group wastage pieces by reason
 */
export function groupWastageByReason(
  pieces: MaterialPiece[]
): { reason: string; count: number; totalLength: number; totalValue: number }[] {
  const grouped = new Map<string, { count: number; totalLength: number; totalValue: number }>();

  for (const piece of pieces) {
    if (!piece.isWastage || !piece.wastageReason) continue;

    const reason = piece.wastageReason;
    const existing = grouped.get(reason) || { count: 0, totalLength: 0, totalValue: 0 };

    existing.count++;
    existing.totalLength += piece.currentLength || 0;

    // Calculate value
    if (piece.currentLength && piece.originalLength) {
      const costPerMm = piece.purchaseCost / piece.originalLength;
      existing.totalValue += costPerMm * piece.currentLength;
    }

    grouped.set(reason, existing);
  }

  return Array.from(grouped.entries()).map(([reason, data]) => ({
    reason,
    ...data
  }));
}

/**
 * Calculate inventory value for material pieces
 */
export function calculateInventoryValue(pieces: MaterialPiece[]): {
  totalValue: number;
  availableValue: number;
  wastageValue: number;
} {
  let totalValue = 0;
  let availableValue = 0;
  let wastageValue = 0;

  for (const piece of pieces) {
    if (!piece.currentLength || !piece.originalLength) continue;

    const costPerMm = piece.purchaseCost / piece.originalLength;
    const currentValue = costPerMm * piece.currentLength;

    totalValue += currentValue;

    if (piece.isWastage) {
      wastageValue += currentValue;
    } else if (piece.status === "Available") {
      availableValue += currentValue;
    }
  }

  return {
    totalValue: Math.round(totalValue),
    availableValue: Math.round(availableValue),
    wastageValue: Math.round(wastageValue)
  };
}

/**
 * Get wastage recommendations based on usage patterns
 */
export function getWastageRecommendations(
  inventory: RawMaterialInventory
): string[] {
  const recommendations: string[] = [];

  // High wastage percentage
  if (inventory.wastagePercentage && inventory.wastagePercentage > 15) {
    recommendations.push(
      `High wastage rate (${inventory.wastagePercentage}%). Review cutting plans and consider ordering custom lengths.`
    );
  }

  // Many small pieces
  const smallPieces = inventory.pieces.filter(p =>
    p.currentLength && p.currentLength < 500 && p.currentLength >= (p.minimumUsableLength || 300)
  );
  if (smallPieces.length > 5) {
    recommendations.push(
      `${smallPieces.length} small reusable pieces (300-500mm). Plan jobs to utilize these before ordering new material.`
    );
  }

  // Wastage pieces with value
  const valuableWastage = inventory.pieces.filter(p =>
    p.isWastage && p.scrapValue && p.scrapValue > 100
  );
  if (valuableWastage.length > 0) {
    const totalScrapValue = valuableWastage.reduce((sum, p) => sum + (p.scrapValue || 0), 0);
    recommendations.push(
      `₹${totalScrapValue} worth of scrap can be sold. Contact scrap dealer.`
    );
  }

  // No recommendations
  if (recommendations.length === 0) {
    recommendations.push("Material usage is efficient. Continue current practices.");
  }

  return recommendations;
}

/**
 * Format length for display
 */
export function formatLength(lengthMm: number): string {
  if (lengthMm >= 1000) {
    return `${(lengthMm / 1000).toFixed(2)} m`;
  }
  return `${lengthMm} mm`;
}

/**
 * Format weight for display
 */
export function formatWeight(weightKg: number): string {
  if (weightKg >= 1) {
    return `${weightKg.toFixed(2)} kg`;
  }
  return `${(weightKg * 1000).toFixed(0)} g`;
}
