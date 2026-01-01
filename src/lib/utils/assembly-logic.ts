import { AssemblyReadiness, BlockingItem, ReadyItem } from "@/types/order";
import { ChildPartProductionOrder, ChildPartStatus } from "@/types/child-part-production";

/**
 * Check if all child parts are ready for assembly
 */
export function checkAssemblyReadiness(
  orderId: string,
  childParts: ChildPartProductionOrder[]
): AssemblyReadiness {
  const readyItems: ReadyItem[] = [];
  const blockingItems: BlockingItem[] = [];

  childParts.forEach((childPart) => {
    if (childPart.status === ChildPartStatus.ReadyForAssembly) {
      readyItems.push({
        childPartId: childPart.id,
        childPartName: childPart.childPartName,
        readyDate: childPart.readyForAssemblyDate!,
        quantityReady: childPart.quantityProduced,
      });
    } else {
      const expectedReadyDate = childPart.plannedCompletionDate;
      const delayDays = calculateDelayDays(childPart);

      blockingItems.push({
        childPartId: childPart.id,
        childPartName: childPart.childPartName,
        currentStatus: childPart.status,
        expectedReadyDate,
        delayDays,
      });
    }
  });

  const isReady = blockingItems.length === 0 && childParts.length > 0;
  const readinessPercentage =
    childParts.length > 0 ? Math.round((readyItems.length / childParts.length) * 100) : 0;

  return {
    orderId,
    lastChecked: new Date(),
    isReady,
    blockingItems,
    readyItems,
    readinessPercentage,
  };
}

/**
 * Calculate delay in days for a child part
 */
function calculateDelayDays(childPart: ChildPartProductionOrder): number | null {
  if (childPart.status === ChildPartStatus.ReadyForAssembly) {
    return null;
  }

  const now = new Date();
  const plannedCompletion = new Date(childPart.plannedCompletionDate);

  if (plannedCompletion < now) {
    const diffTime = Math.abs(now.getTime() - plannedCompletion.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  return null;
}

/**
 * Check if assembly can start
 */
export function canStartAssembly(
  orderId: string,
  childParts: ChildPartProductionOrder[]
): boolean {
  const readiness = checkAssemblyReadiness(orderId, childParts);
  return readiness.isReady;
}

/**
 * Get assembly blocked reason
 */
export function getAssemblyBlockedReason(
  childParts: ChildPartProductionOrder[]
): string | null {
  const blockingParts = childParts.filter(
    (cp) => cp.status !== ChildPartStatus.ReadyForAssembly
  );

  if (blockingParts.length === 0) {
    return null;
  }

  if (blockingParts.length === 1) {
    return `${blockingParts[0].childPartName} not ready`;
  }

  return `${blockingParts.length} child parts not ready: ${blockingParts
    .map((p) => p.childPartName)
    .join(", ")}`;
}

/**
 * Calculate expected assembly start date
 */
export function getExpectedAssemblyStartDate(
  childParts: ChildPartProductionOrder[]
): Date | null {
  if (childParts.length === 0) {
    return null;
  }

  // Find the latest planned completion date among all child parts
  const latestDate = childParts.reduce((latest, childPart) => {
    const completionDate = new Date(childPart.plannedCompletionDate);
    return completionDate > latest ? completionDate : latest;
  }, new Date(0));

  // Add 1 day buffer for assembly start
  const assemblyStartDate = new Date(latestDate);
  assemblyStartDate.setDate(assemblyStartDate.getDate() + 1);

  return assemblyStartDate;
}

/**
 * Get assembly readiness status color
 */
export function getAssemblyReadinessColor(percentage: number): string {
  if (percentage === 100) return "text-green-600";
  if (percentage >= 60) return "text-yellow-600";
  return "text-red-600";
}

/**
 * Get assembly readiness badge
 */
export function getAssemblyReadinessBadge(isReady: boolean): {
  text: string;
  icon: string;
  color: string;
} {
  if (isReady) {
    return {
      text: "READY TO START",
      icon: "✅",
      color: "bg-green-100 text-green-800 border-green-300",
    };
  }

  return {
    text: "BLOCKED",
    icon: "⚠️",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
  };
}
