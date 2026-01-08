"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { allChildPartProduction } from "@/lib/mock-data/child-part-production";
import { ChildPartStatus } from "@/types/child-part-production";
import { checkAssemblyReadiness, getAssemblyReadinessBadge } from "@/lib/utils/assembly-logic";
import Link from "next/link";

export default function ChildPartsProductionPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [orderFilter, setOrderFilter] = useState<string>("all");

  // Group child parts by parent order
  const groupedByOrder = allChildPartProduction.reduce((acc, childPart) => {
    if (!acc[childPart.parentOrderNo]) {
      acc[childPart.parentOrderNo] = [];
    }
    acc[childPart.parentOrderNo].push(childPart);
    return acc;
  }, {} as Record<string, typeof allChildPartProduction>);

  // Filter child parts
  const filteredOrders = Object.entries(groupedByOrder).filter(([orderNo, childParts]) => {
    if (orderFilter !== "all" && orderNo !== orderFilter) return false;
    if (searchTerm && !orderNo.toLowerCase().includes(searchTerm.toLowerCase())) {
      const matchingParts = childParts.some((cp) =>
        cp.childPartName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (!matchingParts) return false;
    }
    if (statusFilter !== "all") {
      const hasMatchingStatus = childParts.some((cp) => cp.status === statusFilter);
      if (!hasMatchingStatus) return false;
    }
    return true;
  });

  const getStatusColor = (status: ChildPartStatus) => {
    switch (status) {
      case ChildPartStatus.ReadyForAssembly:
        return "bg-green-100 text-green-800 border-green-300";
      case ChildPartStatus.InProcess:
        return "bg-blue-100 text-blue-800 border-blue-300";
      case ChildPartStatus.NotStarted:
        return "bg-slate-100 text-slate-700 border-slate-300";
      case ChildPartStatus.QualityCheck:
        return "bg-purple-100 text-purple-800 border-purple-300";
      case ChildPartStatus.MaterialIssued:
        return "bg-amber-100 text-amber-800 border-amber-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  const getProgressBar = (percentage: number) => {
    const filledDots = Math.round(percentage / 10);
    const emptyDots = 10 - filledDots;
    return (
      <div className="flex items-center gap-1">
        <div className="flex">
          {Array.from({ length: filledDots }).map((_, i) => (
            <div key={`filled-${i}`} className="w-2 h-2 bg-primary rounded-full" />
          ))}
          {Array.from({ length: emptyDots }).map((_, i) => (
            <div key={`empty-${i}`} className="w-2 h-2 bg-slate-200 rounded-full" />
          ))}
        </div>
        <span className="text-sm font-medium ml-2">{percentage}%</span>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <h1 className="sr-only">Child Part Production Dashboard</h1>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Search</label>
            <Input
              placeholder="Order or part name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Order</label>
            <Select value={orderFilter} onValueChange={setOrderFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                {Object.keys(groupedByOrder).map((orderNo) => (
                  <SelectItem key={orderNo} value={orderNo}>
                    {orderNo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value={ChildPartStatus.NotStarted}>Not Started</SelectItem>
                <SelectItem value={ChildPartStatus.InProcess}>In Process</SelectItem>
                <SelectItem value={ChildPartStatus.ReadyForAssembly}>Ready for Assembly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setOrderFilter("all");
              }}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Orders with Child Parts */}
      <div className="space-y-6">
        {filteredOrders.map(([orderNo, childParts]) => {
          const firstPart = childParts[0];
          const assemblyReadiness = checkAssemblyReadiness(firstPart.parentOrderId, childParts);
          const assemblyBadge = getAssemblyReadinessBadge(assemblyReadiness.isReady);

          return (
            <Card key={orderNo} className="p-6 border-l-4 border-l-primary">
              <div className="space-y-4">
                {/* Order Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">Order #{orderNo}</h3>
                    <p className="text-sm text-muted-foreground">{firstPart.productName}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {assemblyReadiness.readinessPercentage}%
                    </div>
                    <div className="text-xs text-muted-foreground">Complete</div>
                  </div>
                </div>

                {/* Child Parts Grid */}
                <div className="grid grid-cols-1 gap-3">
                  {childParts.map((childPart) => (
                    <Link
                      key={childPart.id}
                      href={`/production/child-parts/${childPart.id}`}
                      className="block"
                    >
                      <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors cursor-pointer border border-primary/10 hover:border-primary/20">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="text-3xl">{childPart.icon}</div>
                          <div className="flex-1">
                            <div className="font-semibold">{childPart.childPartName}</div>
                            <div className="text-sm text-muted-foreground">
                              {childPart.currentProcessName || "Waiting to start"}
                            </div>
                          </div>
                          <div className="min-w-[200px]">
                            {getProgressBar(childPart.progressPercentage || 0)}
                          </div>
                          <div className="min-w-[140px]">
                            <Badge variant="outline" className={getStatusColor(childPart.status)}>
                              {childPart.status === ChildPartStatus.ReadyForAssembly ? "✅ Ready" : childPart.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Assembly Status */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">Assembly Status:</span>
                      <Badge variant="outline" className={`ml-2 ${assemblyBadge.color}`}>
                        {assemblyBadge.icon} {assemblyBadge.text}
                      </Badge>
                    </div>
                    {!assemblyReadiness.isReady && assemblyReadiness.blockingItems.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        Waiting for: {assemblyReadiness.blockingItems.map((item) => item.childPartName).join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}

        {filteredOrders.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No child parts found matching your filters.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
