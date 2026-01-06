"use client";

import { use } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { allChildPartProduction } from "@/lib/mock-data/child-part-production";
import { ChildPartStatus } from "@/types/child-part-production";
import { PFDFlowViewer } from "@/components/production/pfd-flow-viewer";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ChildPartDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const childPart = allChildPartProduction.find((cp) => cp.id === id);

  if (!childPart) {
    return (
      <div className="p-6">
        <Card className="p-12 text-center">
          <h2 className="text-2xl font-bold mb-2">Child Part Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The child part you're looking for doesn't exist.
          </p>
          <Link href="/production/child-parts">
            <Button>Back to Child Parts</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: ChildPartStatus) => {
    switch (status) {
      case ChildPartStatus.ReadyForAssembly:
        return "bg-green-100 text-green-800 border-green-300";
      case ChildPartStatus.InProcess:
        return "bg-blue-100 text-blue-800 border-blue-300";
      case ChildPartStatus.NotStarted:
        return "bg-gray-100 text-gray-800 border-gray-300";
      case ChildPartStatus.QualityCheck:
        return "bg-purple-100 text-purple-800 border-purple-300";
      case ChildPartStatus.MaterialIssued:
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Back Button */}
      <Link href="/production/child-parts">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Child Parts
        </Button>
      </Link>

      {/* Header */}
      <Card className="p-6 border-l-4 border-l-primary">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="text-4xl">{childPart.icon}</div>
              <div>
                <h1 className="text-3xl font-bold text-primary">
                  {childPart.childPartName} for Order #{childPart.parentOrderNo}
                </h1>
                <p className="text-muted-foreground mt-1">{childPart.productName}</p>
              </div>
            </div>
          </div>
          <Badge variant="outline" className={getStatusColor(childPart.status)}>
            {childPart.status}
          </Badge>
        </div>

        {/* Key Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
          <div>
            <div className="text-xs text-muted-foreground">Job Card</div>
            <div className="font-semibold">{childPart.jobCardNumber}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Quantity Required</div>
            <div className="font-semibold">{childPart.quantityRequired} pcs</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Material</div>
            <div className="font-semibold">
              {childPart.rawMaterialGrade} • {childPart.rawMaterialQtyRequired}{" "}
              {childPart.rawMaterialUnit}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Progress</div>
            <div className="font-semibold text-primary">{childPart.progressPercentage}%</div>
          </div>
        </div>
      </Card>

      {/* Production Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-green-500">
          <div className="text-2xl font-bold text-green-600">{childPart.quantityProduced}</div>
          <div className="text-sm text-muted-foreground">Produced</div>
        </Card>
        <Card className="p-4 border-l-4 border-l-blue-500">
          <div className="text-2xl font-bold text-blue-600">
            {childPart.quantityRequired - childPart.quantityProduced}
          </div>
          <div className="text-sm text-muted-foreground">Remaining</div>
        </Card>
        <Card className="p-4 border-l-4 border-l-red-500">
          <div className="text-2xl font-bold text-red-600">{childPart.quantityRejected}</div>
          <div className="text-sm text-muted-foreground">Rejected</div>
        </Card>
        <Card className="p-4 border-l-4 border-l-yellow-500">
          <div className="text-2xl font-bold text-yellow-600">{childPart.quantityInRework}</div>
          <div className="text-sm text-muted-foreground">In Rework</div>
        </Card>
      </div>

      {/* Current Process Info */}
      {childPart.currentProcessName && (
        <Card className="p-6 bg-blue-50 border-l-4 border-l-blue-500">
          <h2 className="text-xl font-semibold mb-4">Current Process</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">Process</div>
              <div className="font-semibold text-lg">{childPart.currentProcessName}</div>
            </div>
            {childPart.currentMachineId && (
              <div>
                <div className="text-xs text-muted-foreground">Machine</div>
                <div className="font-semibold text-lg">{childPart.currentMachineId}</div>
              </div>
            )}
            {childPart.assignedOperator && (
              <div>
                <div className="text-xs text-muted-foreground">Operator</div>
                <div className="font-semibold text-lg">{childPart.assignedOperator}</div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Blocking Reason */}
      {childPart.blockingReason && !childPart.isAssemblyReady && (
        <Card className="p-4 bg-yellow-50 border-l-4 border-l-yellow-500">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <div>
              <div className="font-semibold">Blocking Issue</div>
              <div className="text-sm text-muted-foreground">{childPart.blockingReason}</div>
            </div>
          </div>
        </Card>
      )}

      {/* Assembly Ready Badge */}
      {childPart.isAssemblyReady && (
        <Card className="p-4 bg-green-50 border-l-4 border-l-green-500">
          <div className="flex items-center gap-2">
            <span className="text-xl">✅</span>
            <div>
              <div className="font-semibold text-green-600">Ready for Assembly</div>
              <div className="text-sm text-muted-foreground">
                This child part is ready to be used in assembly
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Process Flow Visualization */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Process Flow Visualization</h2>
        <PFDFlowViewer
          processSequence={childPart.processSequence}
          productName={childPart.productName}
          childPartName={childPart.childPartName}
          materialSpec={`${childPart.rawMaterialGrade} • ${childPart.rawMaterialQtyRequired} ${childPart.rawMaterialUnit}`}
        />
      </div>

      {/* Action Buttons */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Actions</div>
          <div className="flex gap-2">
            <Button variant="outline">Record Production</Button>
            <Button variant="outline">Record Rejection</Button>
            <Button variant="outline">View Drawing</Button>
            {childPart.isAssemblyReady && (
              <Button className="bg-green-600 hover:bg-green-700">Move to Assembly</Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
