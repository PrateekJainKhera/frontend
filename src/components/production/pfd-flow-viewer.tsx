"use client";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChildPartProcess, ProcessStatus } from "@/types/child-part-production";
import { PFDProcessStep } from "@/types/pfd-template";
import { format } from "date-fns";

interface PFDFlowViewerProps {
  processSequence: ChildPartProcess[] | PFDProcessStep[];
  productName?: string;
  childPartName?: string;
  materialSpec?: string;
}

export function PFDFlowViewer({
  processSequence,
  productName,
  childPartName,
  materialSpec,
}: PFDFlowViewerProps) {
  const getStatusIcon = (status: ProcessStatus | string) => {
    switch (status) {
      case ProcessStatus.Completed:
      case "Completed":
        return "✅";
      case ProcessStatus.InProgress:
      case "In Progress":
        return "🔄";
      case ProcessStatus.Pending:
      case "Pending":
        return "⏸️";
      case ProcessStatus.Skipped:
      case "Skipped":
        return "⏭️";
      default:
        return "⏸️";
    }
  };

  const getStatusColor = (status: ProcessStatus | string) => {
    switch (status) {
      case ProcessStatus.Completed:
      case "Completed":
        return "text-green-600";
      case ProcessStatus.InProgress:
      case "In Progress":
        return "text-blue-600";
      case ProcessStatus.Pending:
      case "Pending":
        return "text-gray-500";
      case ProcessStatus.Skipped:
      case "Skipped":
        return "text-yellow-600";
      default:
        return "text-gray-500";
    }
  };

  // Check if it's a ChildPartProcess or PFDProcessStep
  const isChildPartProcess = (
    step: ChildPartProcess | PFDProcessStep
  ): step is ChildPartProcess => {
    return "status" in step && "actualStartTime" in step;
  };

  // Helper to get time properties (handles both ChildPartProcess and PFDProcessStep)
  const getStepTime = (step: ChildPartProcess | PFDProcessStep) => {
    if (isChildPartProcess(step)) {
      return {
        setup: step.estimatedSetupTimeMin,
        cycle: step.estimatedCycleTimeMin,
        total: step.estimatedSetupTimeMin + step.estimatedCycleTimeMin
      };
    } else {
      return {
        setup: step.setupTimeMin,
        cycle: step.cycleTimeMin,
        total: step.setupTimeMin + step.cycleTimeMin
      };
    }
  };

  // Helper to get step number
  const getStepNumber = (step: ChildPartProcess | PFDProcessStep, index: number) => {
    if (isChildPartProcess(step)) {
      return step.sequence || index + 1;
    } else {
      return step.stepNumber || index + 1;
    }
  };

  // Helper to get machine ID
  const getMachineId = (step: ChildPartProcess | PFDProcessStep) => {
    if (isChildPartProcess(step)) {
      return step.machineId;
    } else {
      return step.defaultMachineId;
    }
  };

  const totalEstimatedTime = processSequence.reduce(
    (sum, step) => sum + getStepTime(step).total,
    0
  );

  const completedSteps = processSequence.filter((step) => {
    if (isChildPartProcess(step)) {
      return step.status === ProcessStatus.Completed;
    }
    return false;
  }).length;

  const elapsedTime = processSequence
    .filter((step) => isChildPartProcess(step) && step.status === ProcessStatus.Completed)
    .reduce((sum, step) => sum + getStepTime(step).total, 0);

  const progressPercentage = totalEstimatedTime > 0 ? Math.round((elapsedTime / totalEstimatedTime) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      {(productName || childPartName || materialSpec) && (
        <Card className="p-4 bg-secondary/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {productName && (
              <div>
                <div className="text-xs text-muted-foreground">Product</div>
                <div className="font-medium">{productName}</div>
              </div>
            )}
            {childPartName && (
              <div>
                <div className="text-xs text-muted-foreground">Child Part</div>
                <div className="font-medium">{childPartName}</div>
              </div>
            )}
            {materialSpec && (
              <div>
                <div className="text-xs text-muted-foreground">Material</div>
                <div className="font-medium">{materialSpec}</div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Process Flow */}
      <div className="space-y-3">
        {processSequence.map((step, index) => {
          const isActive = isChildPartProcess(step) && step.status === ProcessStatus.InProgress;
          const isCompleted = isChildPartProcess(step) && step.status === ProcessStatus.Completed;
          const timeInfo = getStepTime(step);
          const machineId = getMachineId(step);

          return (
            <div key={index}>
              <Card
                className={`p-4 ${
                  isActive
                    ? "border-l-4 border-l-blue-500 bg-blue-50/50"
                    : isCompleted
                    ? "border-l-4 border-l-green-500 bg-green-50/30"
                    : "border-l-4 border-l-gray-300"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Icon and Process Info */}
                  <div className="flex items-start gap-3 flex-1">
                    <div className="text-2xl mt-1">
                      {"icon" in step
                        ? step.icon
                        : index === 0
                        ? "📦"
                        : index === processSequence.length - 1
                        ? "✅"
                        : "🔧"}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-lg">
                          {getStepNumber(step, index)}. {step.processName}
                        </span>
                        {isChildPartProcess(step) && (
                          <span className={`text-sm ${getStatusColor(step.status)}`}>
                            {getStatusIcon(step.status)} {step.status}
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-muted-foreground space-y-1">
                        {machineId && (
                          <div>
                            <strong>Machine:</strong> {machineId}
                          </div>
                        )}
                        {isChildPartProcess(step) && step.operatorName && (
                          <div>
                            <strong>Operator:</strong> {step.operatorName}
                          </div>
                        )}
                        <div>
                          <strong>Time:</strong> {timeInfo.total} min
                          {timeInfo.setup > 0 && (
                            <span className="text-xs ml-1">
                              (Setup: {timeInfo.setup} min, Cycle: {timeInfo.cycle} min)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Progress for In Progress items */}
                      {isActive && isChildPartProcess(step) && step.actualStartTime && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span>Started: {format(new Date(step.actualStartTime), "MMM dd, HH:mm")}</span>
                            <span className="font-medium">In Progress...</span>
                          </div>
                          <Progress value={60} className="h-2" />
                        </div>
                      )}

                      {/* Completion info */}
                      {isCompleted && isChildPartProcess(step) && step.actualEndTime && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          <strong>Completed:</strong> {format(new Date(step.actualEndTime), "MMM dd, yyyy HH:mm")}
                        </div>
                      )}

                      {/* Remarks */}
                      {isChildPartProcess(step) && step.remarks && (
                        <div className="mt-2 text-xs italic text-muted-foreground">
                          Note: {step.remarks}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Arrow between steps */}
              {index < processSequence.length - 1 && (
                <div className="flex justify-center my-2">
                  <div className="text-2xl text-muted-foreground">↓</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <Card className="p-4 bg-primary/5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">{processSequence.length}</div>
            <div className="text-xs text-muted-foreground">Total Steps</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{completedSteps}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-muted-foreground">{totalEstimatedTime} min</div>
            <div className="text-xs text-muted-foreground">
              Total Est. Time ({(totalEstimatedTime / 60).toFixed(1)} hours)
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">{progressPercentage}%</div>
            <div className="text-xs text-muted-foreground">Overall Progress</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
