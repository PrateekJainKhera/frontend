"use client";

import { useState, useEffect } from "react";
import { Package, TrendingDown, AlertTriangle, BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { simulateApiCall } from "@/lib/utils/mock-api";
import { en8SteelRodInventory, en8SteelRodPieces } from "@/lib/mock-data/raw-material-inventory";
import { formatLength, formatWeight, calculateInventoryValue } from "@/lib/utils/material-usage-calculations";
import { MaterialUsageStatus } from "@/types/raw-material-inventory";

export default function RawMaterialInventoryPage() {
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState(en8SteelRodInventory);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    const data = await simulateApiCall(en8SteelRodInventory, 800);
    setInventory(data);
    setLoading(false);
  };

  const { totalValue, availableValue, wastageValue } = calculateInventoryValue(inventory.pieces);

  const getStatusBadge = (status: MaterialUsageStatus) => {
    switch (status) {
      case MaterialUsageStatus.AVAILABLE:
        return <Badge className="bg-green-600">Available</Badge>;
      case MaterialUsageStatus.IN_USE:
        return <Badge className="bg-blue-600">In Use</Badge>;
      case MaterialUsageStatus.RESERVED:
        return <Badge className="bg-yellow-600">Reserved</Badge>;
      case MaterialUsageStatus.SCRAP:
        return <Badge variant="destructive">Scrap</Badge>;
      case MaterialUsageStatus.CONSUMED:
        return <Badge variant="secondary">Consumed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-[400px]" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-3xl font-bold text-primary">Raw Material Inventory</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Total Pieces
            </CardDescription>
            <CardTitle className="text-3xl">{inventory.totalPieces}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Available:</span>
                <span className="text-green-600 font-medium">{inventory.availablePieces}</span>
              </div>
              <div className="flex justify-between">
                <span>Scrap:</span>
                <span className="text-red-600 font-medium">{inventory.scrapPieces}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Length</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {inventory.totalLength ? formatLength(inventory.totalLength) : "N/A"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Available for production
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Wastage
            </CardDescription>
            <CardTitle className="text-3xl text-orange-600">
              {inventory.wastagePercentage?.toFixed(1)}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {inventory.totalWastageLength ? formatLength(inventory.totalWastageLength) : "0 mm"} total waste
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Inventory Value</CardDescription>
            <CardTitle className="text-3xl text-primary">
              ₹{availableValue.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Scrap value:</span>
                <span className="text-orange-600">₹{wastageValue}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pieces" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pieces">Material Pieces</TabsTrigger>
          <TabsTrigger value="usage">Usage History</TabsTrigger>
          <TabsTrigger value="wastage">Wastage Analysis</TabsTrigger>
        </TabsList>

        {/* Material Pieces Tab */}
        <TabsContent value="pieces" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Material Pieces</CardTitle>
              <CardDescription>
                Individual tracking of each material piece from purchase to consumption
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inventory.pieces.map((piece) => {
                  const usagePercentage = piece.originalLength
                    ? ((piece.originalLength - (piece.currentLength || 0)) / piece.originalLength) * 100
                    : 0;

                  return (
                    <Card key={piece.id} className={piece.isWastage ? "border-orange-500" : ""}>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          {/* Left: Basic Info */}
                          <div className="md:col-span-2 space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{piece.rawMaterialName}</h3>
                              {getStatusBadge(piece.status)}
                              {piece.isWastage && (
                                <Badge variant="outline" className="text-orange-600 border-orange-600">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Wastage
                                </Badge>
                              )}
                            </div>

                            <div className="text-sm text-muted-foreground space-y-1">
                              <div>Grade: <span className="font-medium">{piece.grade}</span></div>
                              <div>Diameter: <span className="font-medium">Ø{piece.diameter}mm</span></div>
                              <div>Location: <span className="font-medium">{piece.location}</span> {piece.binNumber && `(${piece.binNumber})`}</div>
                              <div>Batch: <span className="font-medium">{piece.batchNumber}</span></div>
                            </div>
                          </div>

                          {/* Middle: Dimensions */}
                          <div className="space-y-2">
                            <div>
                              <div className="text-xs text-muted-foreground">Original Length</div>
                              <div className="font-semibold">
                                {piece.originalLength ? formatLength(piece.originalLength) : "N/A"}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Current Length</div>
                              <div className={`font-semibold text-lg ${piece.isWastage ? "text-orange-600" : "text-green-600"}`}>
                                {piece.currentLength ? formatLength(piece.currentLength) : "N/A"}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Usage</div>
                              <Progress value={usagePercentage} className="h-2" />
                              <div className="text-xs mt-1">{usagePercentage.toFixed(0)}% used</div>
                            </div>
                          </div>

                          {/* Right: Value & Actions */}
                          <div className="space-y-2">
                            <div>
                              <div className="text-xs text-muted-foreground">Purchase Cost</div>
                              <div className="font-semibold">₹{piece.purchaseCost.toLocaleString()}</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Current Value</div>
                              <div className="font-semibold text-green-600">
                                ₹
                                {piece.originalLength && piece.currentLength
                                  ? Math.round((piece.purchaseCost / piece.originalLength) * piece.currentLength).toLocaleString()
                                  : "N/A"}
                              </div>
                            </div>
                            {piece.isWastage && piece.scrapValue && (
                              <div>
                                <div className="text-xs text-muted-foreground">Scrap Value</div>
                                <div className="font-semibold text-orange-600">₹{piece.scrapValue}</div>
                              </div>
                            )}
                            <div>
                              <div className="text-xs text-muted-foreground">Times Used</div>
                              <div className="font-semibold">{piece.usageHistory.length} cuts</div>
                            </div>
                          </div>
                        </div>

                        {/* Wastage Reason */}
                        {piece.isWastage && piece.wastageReason && (
                          <div className="mt-4 p-3 bg-orange-50 rounded-md border border-orange-200">
                            <div className="text-sm">
                              <span className="font-medium text-orange-800">Wastage Reason: </span>
                              <span className="text-orange-700">{piece.wastageReason}</span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage History Tab */}
        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Material Usage History</CardTitle>
              <CardDescription>
                Complete history of all material cuts and consumption
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inventory.pieces.flatMap((piece) =>
                  piece.usageHistory.map((usage) => (
                    <Card key={usage.id}>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="md:col-span-2">
                            <div className="font-semibold text-lg mb-2">
                              {usage.productName}
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <div>Order: <span className="font-medium">{usage.orderNo}</span></div>
                              <div>Part: <span className="font-medium">{usage.childPartName}</span></div>
                              <div>Date: <span className="font-medium">{new Date(usage.cuttingDate).toLocaleDateString()}</span></div>
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Length Used</div>
                            <div className="font-semibold text-lg text-blue-600">
                              {usage.lengthUsed ? formatLength(usage.lengthUsed) : "N/A"}
                            </div>
                            <div className="text-xs text-muted-foreground mt-2">Remaining After</div>
                            <div className="font-medium">
                              {usage.lengthRemaining ? formatLength(usage.lengthRemaining) : "N/A"}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Operator</div>
                            <div className="font-medium">{usage.cutByOperator}</div>
                            <div className="text-xs text-muted-foreground mt-2">Machine</div>
                            <div className="font-medium">{usage.machineUsed || "N/A"}</div>
                            {usage.wastageGenerated && (
                              <>
                                <div className="text-xs text-muted-foreground mt-2">Cutting Wastage</div>
                                <div className="font-medium text-orange-600">
                                  {formatLength(usage.wastageGenerated)}
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {usage.notes && (
                          <div className="mt-3 text-sm text-muted-foreground italic">
                            Note: {usage.notes}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Wastage Analysis Tab */}
        <TabsContent value="wastage" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Wastage Summary</CardTitle>
                <CardDescription>Overview of material wastage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg">
                  <div>
                    <div className="text-sm text-muted-foreground">Total Wastage</div>
                    <div className="text-2xl font-bold text-orange-600">
                      {inventory.totalWastageLength ? formatLength(inventory.totalWastageLength) : "0 mm"}
                    </div>
                  </div>
                  <TrendingDown className="h-8 w-8 text-orange-600" />
                </div>

                <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                  <div>
                    <div className="text-sm text-muted-foreground">Wastage Value</div>
                    <div className="text-2xl font-bold text-red-600">
                      ₹{inventory.totalWastageValue?.toLocaleString() || 0}
                    </div>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>

                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                  <div>
                    <div className="text-sm text-muted-foreground">Wastage Percentage</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {inventory.wastagePercentage?.toFixed(2)}%
                    </div>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>

                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                  <div>
                    <div className="text-sm text-muted-foreground">Scrap Pieces</div>
                    <div className="text-2xl font-bold text-green-600">
                      {inventory.scrapPieces}
                    </div>
                  </div>
                  <Package className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Wastage Pieces</CardTitle>
                <CardDescription>Material pieces marked as wastage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {inventory.pieces.filter(p => p.isWastage).map((piece) => (
                    <div key={piece.id} className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-semibold">{piece.rawMaterialName}</div>
                          <div className="text-sm text-muted-foreground">{piece.batchNumber}</div>
                        </div>
                        <Badge variant="destructive">Scrap</Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                        <div>
                          <div className="text-muted-foreground">Remaining</div>
                          <div className="font-semibold text-orange-600">
                            {piece.currentLength ? formatLength(piece.currentLength) : "N/A"}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Scrap Value</div>
                          <div className="font-semibold text-green-600">
                            ₹{piece.scrapValue || 0}
                          </div>
                        </div>
                      </div>

                      {piece.wastageReason && (
                        <div className="mt-3 text-sm text-orange-700">
                          <span className="font-medium">Reason:</span> {piece.wastageReason}
                        </div>
                      )}
                    </div>
                  ))}

                  {inventory.pieces.filter(p => p.isWastage).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No wastage pieces found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
