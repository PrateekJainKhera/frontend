import { ChildPartProductionOrder, ChildPartProcess } from "@/types/child-part-production";
import { PFDProcessStep } from "@/types/pfd-template";
import { differenceInMinutes, addMinutes, format } from "date-fns";

/**
 * Calculate total estimated time for a process sequence
 */
export function calculateTotalEstimatedTime(
  processes: ChildPartProcess[] | PFDProcessStep[]
): number {
  return processes.reduce((total, process) => {
    // Check if it's a ChildPartProcess or PFDProcessStep
    if ('estimatedSetupTimeMin' in process) {
      // ChildPartProcess
      return total + process.estimatedSetupTimeMin + process.estimatedCycleTimeMin;
    } else {
      // PFDProcessStep
      return total + process.setupTimeMin + process.cycleTimeMin;
    }
  }, 0);
}

/**
 * Calculate elapsed time for completed processes
 */
export function calculateElapsedTime(processes: ChildPartProcess[]): number {
  return processes
    .filter((p) => p.status === "Completed" && p.actualStartTime && p.actualEndTime)
    .reduce((total, process) => {
      const elapsed = differenceInMinutes(
        new Date(process.actualEndTime!),
        new Date(process.actualStartTime!)
      );
      return total + elapsed;
    }, 0);
}

/**
 * Calculate remaining time for pending processes
 */
export function calculateRemainingTime(
  processes: ChildPartProcess[] | PFDProcessStep[]
): number {
  const totalEstimated = calculateTotalEstimatedTime(processes);

  if ('actualStartTime' in processes[0]) {
    const elapsed = calculateElapsedTime(processes as ChildPartProcess[]);
    return Math.max(0, totalEstimated - elapsed);
  }

  return totalEstimated;
}

/**
 * Calculate time variance (actual vs estimated)
 */
export function calculateTimeVariance(processes: ChildPartProcess[]): number {
  const estimated = calculateTotalEstimatedTime(processes);
  const actual = calculateElapsedTime(processes);
  return actual - estimated;
}

/**
 * Calculate estimated completion date based on current progress
 */
export function calculateEstimatedCompletionDate(
  childPart: ChildPartProductionOrder
): Date {
  const now = new Date();
  const remainingTime = calculateRemainingTime(childPart.processSequence);
  return addMinutes(now, remainingTime);
}

/**
 * Calculate overall progress percentage
 */
export function calculateProgressPercentage(
  childPart: ChildPartProductionOrder
): number {
  const totalTime = calculateTotalEstimatedTime(childPart.processSequence);
  const elapsedTime = calculateElapsedTime(childPart.processSequence);

  if (totalTime === 0) return 0;
  return Math.min(100, Math.round((elapsedTime / totalTime) * 100));
}

/**
 * Calculate cycle time based on product dimensions
 * Formula: base time + (diameter factor * diameter) + (length factor * length)
 */
export function calculateCycleTime(
  baseTimeMin: number,
  diameter: number,
  length: number,
  diameterFactor: number = 0.5,
  lengthFactor: number = 0.002
): number {
  return Math.ceil(baseTimeMin + (diameterFactor * diameter) + (lengthFactor * length));
}

/**
 * Format time in minutes to human-readable format
 */
export function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

/**
 * Calculate lead time (from order to completion)
 */
export function calculateLeadTime(orderDate: Date, completionDate: Date): number {
  return differenceInMinutes(completionDate, orderDate);
}

/**
 * Calculate on-time delivery percentage
 */
export function calculateOnTimePercentage(
  totalOrders: number,
  onTimeOrders: number
): number {
  if (totalOrders === 0) return 0;
  return Math.round((onTimeOrders / totalOrders) * 100);
}

/**
 * Predict bottleneck based on machine utilization
 */
export function predictBottleneck(
  machineUtilization: { machineId: string; utilization: number }[]
): string[] {
  return machineUtilization
    .filter((m) => m.utilization >= 90)
    .map((m) => m.machineId);
}

/**
 * Calculate optimal batch size based on setup and cycle times
 */
export function calculateOptimalBatchSize(
  setupTimeMin: number,
  cycleTimePerPieceMin: number,
  targetUtilization: number = 0.85
): number {
  // Economic Order Quantity inspired formula
  // Minimize setup time overhead while maintaining target utilization
  const setupRatio = setupTimeMin / (setupTimeMin + cycleTimePerPieceMin);

  if (setupRatio > (1 - targetUtilization)) {
    // High setup time relative to cycle time - increase batch size
    return Math.ceil(setupTimeMin / cycleTimePerPieceMin);
  }

  return Math.max(1, Math.ceil(setupTimeMin / (cycleTimePerPieceMin * 0.1)));
}

/**
 * Calculate machine efficiency (actual production time / available time)
 */
export function calculateMachineEfficiency(
  actualProductionMin: number,
  availableTimeMin: number
): number {
  if (availableTimeMin === 0) return 0;
  return Math.min(100, Math.round((actualProductionMin / availableTimeMin) * 100));
}

/**
 * Calculate OEE (Overall Equipment Effectiveness)
 * OEE = Availability × Performance × Quality
 */
export function calculateOEE(
  availability: number,
  performance: number,
  quality: number
): number {
  return Math.round(availability * performance * quality);
}

/**
 * Estimate queue wait time based on current machine load
 */
export function estimateQueueWaitTime(
  currentJobRemainingMin: number,
  queuedJobsTimeMin: number,
  priority: "High" | "Medium" | "Low"
): number {
  let waitTime = currentJobRemainingMin;

  // For high priority, assume it jumps ahead of low priority jobs
  if (priority === "High") {
    waitTime += queuedJobsTimeMin * 0.3; // Only 30% of queue
  } else if (priority === "Medium") {
    waitTime += queuedJobsTimeMin * 0.6; // 60% of queue
  } else {
    waitTime += queuedJobsTimeMin; // Full queue
  }

  return Math.ceil(waitTime);
}

/**
 * Calculate capacity utilization across all machines
 */
export function calculateCapacityUtilization(
  totalAvailableHours: number,
  totalUsedHours: number
): number {
  if (totalAvailableHours === 0) return 0;
  return Math.min(100, Math.round((totalUsedHours / totalAvailableHours) * 100));
}

/**
 * Calculate throughput time (time from start to completion of actual work)
 */
export function calculateThroughputTime(
  processes: ChildPartProcess[]
): number {
  const completedProcesses = processes.filter(
    (p) => p.status === "Completed" && p.actualStartTime && p.actualEndTime
  );

  if (completedProcesses.length === 0) return 0;

  const firstStart = new Date(
    Math.min(...completedProcesses.map((p) => new Date(p.actualStartTime!).getTime()))
  );
  const lastEnd = new Date(
    Math.max(...completedProcesses.map((p) => new Date(p.actualEndTime!).getTime()))
  );

  return differenceInMinutes(lastEnd, firstStart);
}
