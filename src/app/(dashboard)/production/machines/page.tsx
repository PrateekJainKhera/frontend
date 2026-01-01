"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { mockMachines, calculateOverallUtilization } from "@/lib/mock-data/machines";
import { format } from "date-fns";

export default function MachinesPage() {
  const overallUtilization = calculateOverallUtilization();

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return "text-red-600";
    if (utilization >= 75) return "text-orange-600";
    if (utilization >= 50) return "text-yellow-600";
    return "text-green-600";
  };

  const getUtilizationBadge = (utilization: number) => {
    if (utilization >= 90) return "🔴";
    if (utilization >= 75) return "🟡";
    if (utilization >= 50) return "🟢";
    return "⚪";
  };

  const getStatusBadge = (machine: typeof mockMachines[0]) => {
    if (!machine.isOperational) {
      return <Badge className="bg-red-100 text-red-800">🔴 Down</Badge>;
    }
    if (machine.currentJobCardId) {
      return <Badge className="bg-blue-100 text-blue-800">🔄 Busy</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800">🟢 Idle</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Machine Load Overview</h1>
          <p className="text-muted-foreground mt-1">
            Real-time machine utilization and job queue status
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Last Updated</div>
          <div className="font-medium">{format(new Date(), "MMM dd, yyyy HH:mm")}</div>
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 border-l-4 border-l-primary">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Overall Utilization</div>
            <div className={`text-3xl font-bold ${getUtilizationColor(overallUtilization)}`}>
              {overallUtilization}%
            </div>
            <Progress value={overallUtilization} className="h-2" />
          </div>
        </Card>
        <Card className="p-6 border-l-4 border-l-green-500">
          <div className="text-sm text-muted-foreground">Target Utilization</div>
          <div className="text-3xl font-bold text-green-600">85%</div>
        </Card>
        <Card className="p-6 border-l-4 border-l-blue-500">
          <div className="text-sm text-muted-foreground">Machines Busy</div>
          <div className="text-3xl font-bold text-blue-600">
            {mockMachines.filter((m) => m.currentJobCardId).length}
          </div>
        </Card>
        <Card className="p-6 border-l-4 border-l-orange-500">
          <div className="text-sm text-muted-foreground">Bottlenecks</div>
          <div className="text-3xl font-bold text-orange-600">
            {mockMachines.filter((m) => m.currentUtilizationPercent >= 90).length}
          </div>
        </Card>
      </div>

      {/* Machine List */}
      <div className="space-y-4">
        {mockMachines.map((machine) => (
          <Card
            key={machine.id}
            className={`p-6 border-l-4 ${
              machine.currentUtilizationPercent >= 90
                ? "border-l-red-500"
                : machine.currentUtilizationPercent >= 75
                ? "border-l-orange-500"
                : machine.currentUtilizationPercent >= 50
                ? "border-l-yellow-500"
                : "border-l-green-500"
            }`}
          >
            <div className="space-y-4">
              {/* Machine Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">
                    {getUtilizationBadge(machine.currentUtilizationPercent)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-semibold">
                        {machine.machineCode} ({machine.machineName})
                      </h3>
                      {getStatusBadge(machine)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {machine.machineType} • {machine.shiftHoursPerDay}hrs/day
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getUtilizationColor(machine.currentUtilizationPercent)}`}>
                    {machine.currentUtilizationPercent}%
                  </div>
                  <div className="text-xs text-muted-foreground">Utilization</div>
                </div>
              </div>

              {/* Current Job */}
              {machine.currentJobCardId ? (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="font-semibold">
                        Current: #{machine.currentOrderNo} {machine.currentJobCardNo}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {machine.currentProcessName}
                      </div>
                      {machine.currentOperatorName && (
                        <div className="text-sm text-muted-foreground">
                          Operator: {machine.currentOperatorName}
                        </div>
                      )}
                    </div>
                    {machine.estimatedBusyUntil && (
                      <div className="text-right text-sm">
                        <div className="text-muted-foreground">Est. Free</div>
                        <div className="font-medium">{format(machine.estimatedBusyUntil, "HH:mm")}</div>
                        <div className="text-xs text-muted-foreground">
                          ({machine.currentTotalMin - machine.currentElapsedMin} min left)
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>Progress</span>
                      <span className="font-medium">
                        {machine.currentElapsedMin}/{machine.currentTotalMin} min ({machine.currentProgress}%)
                      </span>
                    </div>
                    <Progress value={machine.currentProgress} className="h-2" />
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center">
                  <div className="text-green-600 font-semibold">🟢 IDLE - Available Now</div>
                </div>
              )}

              {/* Queue */}
              {machine.queuedJobCards.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold">
                      Queue: {machine.queuedJobCards.length} job{machine.queuedJobCards.length > 1 ? "s" : ""} waiting
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total: {machine.totalQueueTimeMin} min ({(machine.totalQueueTimeMin / 60).toFixed(1)} hrs)
                    </div>
                  </div>

                  <div className="space-y-2">
                    {machine.queuedJobCards.map((job, index) => (
                      <div
                        key={job.jobCardId}
                        className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-mono text-muted-foreground">
                            {index + 1}.
                          </div>
                          <div>
                            <div className="font-medium">
                              #{job.orderNo} - {job.processName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Setup: {job.estimatedSetupMin} min • Cycle: {job.estimatedCycleMin} min
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant="outline"
                            className={
                              job.priority === "High"
                                ? "bg-red-100 text-red-800"
                                : job.priority === "Medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                            }
                          >
                            {job.priority}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            {job.estimatedSetupMin + job.estimatedCycleMin} min total
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center text-sm text-muted-foreground py-2">
                  No jobs in queue
                </div>
              )}

              {/* Bottleneck Warning */}
              {machine.currentUtilizationPercent >= 90 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⚠️</span>
                    <div className="text-sm">
                      <strong className="text-red-800">Bottleneck Detected</strong>
                      <div className="text-red-600">
                        High utilization - Consider scheduling optimization or adding capacity
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Action Footer */}
      <Card className="p-6 bg-secondary/30">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Machine Management</div>
          <div className="flex gap-2">
            <Button variant="outline">View Gantt Chart</Button>
            <Button variant="outline">Optimize Schedule</Button>
            <Button>Add Shift</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
