"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AssemblyReadiness } from "@/types/order";
import { format, differenceInDays } from "date-fns";

interface AssemblyReadinessPanelProps {
  assemblyReadiness: AssemblyReadiness;
  productName?: string;
  quantity?: number;
  onRefresh?: () => void;
}

export function AssemblyReadinessPanel({
  assemblyReadiness,
  productName,
  quantity,
  onRefresh,
}: AssemblyReadinessPanelProps) {
  const { isReady, readinessPercentage, readyItems, blockingItems } = assemblyReadiness;

  const totalParts = readyItems.length + blockingItems.length;

  const getStatusBadge = () => {
    if (isReady) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-300">
          ✅ READY ({readinessPercentage}% complete)
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
        ⚠️ NOT READY ({readinessPercentage}% complete)
      </Badge>
    );
  };

  const getExpectedAssemblyStartDate = () => {
    if (blockingItems.length === 0) return null;

    const latestDate = blockingItems.reduce((latest, item) => {
      if (!item.expectedReadyDate) return latest;
      const itemDate = new Date(item.expectedReadyDate);
      return itemDate > latest ? itemDate : latest;
    }, new Date());

    return latestDate;
  };

  const expectedStartDate = getExpectedAssemblyStartDate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 border-l-4 border-l-primary">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Assembly Readiness Check</h2>
            {productName && (
              <div className="text-sm text-muted-foreground">
                <strong>Product:</strong> {productName}
                {quantity && <span className="ml-2">• Quantity: {quantity} pcs</span>}
              </div>
            )}
          </div>
          <div className="text-right">
            {getStatusBadge()}
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh} className="mt-2">
                🔄 Refresh Status
              </Button>
            )}
          </div>
        </div>

        {/* Overall Progress */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Readiness</span>
            <span className="text-sm font-bold text-primary">{readinessPercentage}%</span>
          </div>
          <Progress value={readinessPercentage} className="h-3" />
        </div>
      </Card>

      {/* Ready Components */}
      {readyItems.length > 0 && (
        <Card className="p-6 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              READY COMPONENTS ({readyItems.length}/{totalParts})
            </h3>
            <div className="text-2xl">✅</div>
          </div>

          <div className="space-y-3">
            {readyItems.map((item) => (
              <div
                key={item.childPartId}
                className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">✅</div>
                  <div>
                    <div className="font-semibold">{item.childPartName}</div>
                    <div className="text-sm text-muted-foreground">
                      Quantity: {item.quantityReady} pcs
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Ready Since</div>
                  <div className="text-sm font-medium">
                    {format(new Date(item.readyDate), "MMM dd, yyyy")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Pending Components */}
      {blockingItems.length > 0 && (
        <Card className="p-6 border-l-4 border-l-yellow-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              PENDING COMPONENTS ({blockingItems.length}/{totalParts})
            </h3>
            <div className="text-2xl">⚠️</div>
          </div>

          <div className="space-y-3">
            {blockingItems.map((item) => {
              const isDelayed = item.delayDays !== null && item.delayDays > 0;

              return (
                <div
                  key={item.childPartId}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isDelayed
                      ? "bg-red-50 border-red-200"
                      : "bg-yellow-50 border-yellow-200"
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-2xl">{isDelayed ? "❌" : "⏸️"}</div>
                    <div className="flex-1">
                      <div className="font-semibold">{item.childPartName}</div>
                      <div className="text-sm text-muted-foreground">
                        Status: {item.currentStatus}
                      </div>
                      {item.expectedReadyDate && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Expected: {format(new Date(item.expectedReadyDate), "MMM dd, yyyy")}
                          {isDelayed && (
                            <span className="text-red-600 font-medium ml-2">
                              (Delayed by {item.delayDays} days)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Assembly Status Footer */}
      <Card className="p-6 bg-secondary/30">
        <div className="flex items-center justify-between">
          <div>
            {isReady ? (
              <div className="space-y-1">
                <div className="text-xl font-bold text-green-600">✅ Assembly Can Start</div>
                <div className="text-sm text-muted-foreground">
                  All child parts are ready for assembly
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-xl font-bold text-yellow-600">⚠️ Assembly BLOCKED</div>
                <div className="text-sm text-muted-foreground">
                  Reason: {blockingItems.length} child part
                  {blockingItems.length > 1 ? "s" : ""} not ready
                </div>
              </div>
            )}
          </div>

          {expectedStartDate && !isReady && (
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Expected Assembly Start</div>
              <div className="text-lg font-bold text-primary">
                {format(expectedStartDate, "MMM dd, yyyy")}
              </div>
              <div className="text-xs text-muted-foreground">
                {differenceInDays(expectedStartDate, new Date())} days from now
              </div>
            </div>
          )}

          {isReady && (
            <div className="text-right">
              <Button size="lg" className="bg-green-600 hover:bg-green-700">
                Start Assembly Process
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
