"use client";

import { useState, useEffect } from "react";
import { Package, TrendingDown, AlertTriangle, BarChart3, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatLength, calculateInventoryValue } from "@/lib/utils/material-usage-calculations";
import { MaterialUsageStatus } from "@/types/raw-material-inventory";
import { GRNEntryDialog } from "@/components/forms/grn-entry-dialog";
import { materialPieceService, MaterialPieceResponse } from "@/lib/api/material-pieces";
import { toast } from "sonner";

interface AggregatedMaterial {
  materialId: number;
  materialName: string;
  materialType: string; // Steel, SS, Aluminum, Brass, etc.
  materialForm: string; // Rod, Pipe, Sheet, Bar, Plate, Tube, etc.
  grade: string;
  diameter: number | null;
  totalPieces: number;
  availablePieces: number;
  inUsePieces: number;
  scrapPieces: number;
  totalLength: number;
  availableLength: number;
  totalWeight: number;
  availableWeight: number;
  totalWastageLength: number;
  wastagePercentage: number;
  totalWastageValue: number;
  pieces: MaterialPieceResponse[];
}

export default function RawMaterialInventoryPage() {
  const [loading, setLoading] = useState(true);
  const [pieces, setPieces] = useState<MaterialPieceResponse[]>([]);
  const [materials, setMaterials] = useState<AggregatedMaterial[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<AggregatedMaterial | null>(null);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedForm, setSelectedForm] = useState<string>("all");
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [isGRNOpen, setIsGRNOpen] = useState(false);

  const toggleCardExpansion = (materialId: number) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(materialId)) {
        newSet.delete(materialId);
      } else {
        newSet.add(materialId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const allPieces = await materialPieceService.getAll();
      setPieces(allPieces);

      // Aggregate pieces by materialId
      const aggregated = aggregatePiecesByMaterial(allPieces);
      setMaterials(aggregated);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  const getMaterialType = (grade: string | null | undefined, materialName: string | null | undefined): string => {
    const gradeUpper = (grade || materialName || "").toUpperCase();

    if (gradeUpper.includes("SS") || gradeUpper.includes("STAINLESS")) {
      return "Stainless Steel";
    } else if (gradeUpper.includes("EN") || gradeUpper.includes("STEEL") || gradeUpper.includes("MS")) {
      return "Steel";
    } else if (gradeUpper.includes("AL") || gradeUpper.includes("ALUMINUM") || gradeUpper.includes("ALUMINIUM") || /^[0-9]{4}$/.test(gradeUpper)) {
      return "Aluminum";
    } else if (gradeUpper.includes("BRASS") || gradeUpper.includes("BR")) {
      return "Brass";
    } else if (gradeUpper.includes("COPPER") || gradeUpper.includes("CU")) {
      return "Copper";
    } else {
      return "Other";
    }
  };

  const getMaterialForm = (materialName: string | null | undefined): string => {
    const nameUpper = (materialName || "").toUpperCase();

    if (nameUpper.includes("ROD")) {
      return "Rod";
    } else if (nameUpper.includes("PIPE")) {
      return "Pipe";
    } else if (nameUpper.includes("SHEET")) {
      return "Sheet";
    } else if (nameUpper.includes("PLATE")) {
      return "Plate";
    } else if (nameUpper.includes("BAR")) {
      return "Bar";
    } else if (nameUpper.includes("TUBE")) {
      return "Tube";
    } else if (nameUpper.includes("ANGLE")) {
      return "Angle";
    } else if (nameUpper.includes("CHANNEL")) {
      return "Channel";
    } else if (nameUpper.includes("BEAM")) {
      return "Beam";
    } else if (nameUpper.includes("FLAT")) {
      return "Flat";
    } else {
      return "Other";
    }
  };

  const aggregatePiecesByMaterial = (allPieces: MaterialPieceResponse[]): AggregatedMaterial[] => {
    const grouped = allPieces.reduce((acc, piece) => {
      const key = piece.materialId;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(piece);
      return acc;
    }, {} as Record<number, MaterialPieceResponse[]>);

    return Object.entries(grouped).map(([materialId, materialPieces]) => {
      const firstPiece = materialPieces[0];
      const availablePieces = materialPieces.filter(p => p.status === "Available" && !p.isWastage);
      const inUsePieces = materialPieces.filter(p => p.status === "In Use" || p.issuedToJobCardId);
      const scrapPieces = materialPieces.filter(p => p.isWastage);

      const totalLength = materialPieces.reduce((sum, p) => sum + p.currentLengthMM, 0);
      const availableLength = availablePieces.reduce((sum, p) => sum + p.currentLengthMM, 0);
      const totalWeight = materialPieces.reduce((sum, p) => sum + p.currentWeightKG, 0);
      const availableWeight = availablePieces.reduce((sum, p) => sum + p.currentWeightKG, 0);
      const totalWastageLength = scrapPieces.reduce((sum, p) => sum + p.currentLengthMM, 0);

      const originalLength = materialPieces.reduce((sum, p) => sum + p.originalLengthMM, 0);
      const usedLength = originalLength - totalLength;
      const wastagePercentage = originalLength > 0 ? (totalWastageLength / originalLength) * 100 : 0;

      // Calculate wastage value (assuming scrap is 30% of original cost)
      const totalWastageValue = scrapPieces.reduce((sum, p) => sum + (p.currentValue || 0) * 0.3, 0);

      return {
        materialId: parseInt(materialId),
        materialName: firstPiece.materialName || "Unknown",
        materialType: getMaterialType(firstPiece.grade, firstPiece.materialName),
        materialForm: getMaterialForm(firstPiece.materialName),
        grade: firstPiece.grade || "N/A",
        diameter: firstPiece.diameter ?? null,
        totalPieces: materialPieces.length,
        availablePieces: availablePieces.length,
        inUsePieces: inUsePieces.length,
        scrapPieces: scrapPieces.length,
        totalLength,
        availableLength,
        totalWeight,
        availableWeight,
        totalWastageLength,
        wastagePercentage,
        totalWastageValue,
        pieces: materialPieces,
      };
    });
  };

  // Get unique material types and forms for filtering
  const materialTypes = ["all", ...new Set(materials.map(m => m.materialType))];
  const materialForms = ["all", ...new Set(materials.map(m => m.materialForm))];

  // Filter materials by selected type and form
  let filteredMaterials = materials;
  if (selectedType !== "all") {
    filteredMaterials = filteredMaterials.filter(m => m.materialType === selectedType);
  }
  if (selectedForm !== "all") {
    filteredMaterials = filteredMaterials.filter(m => m.materialForm === selectedForm);
  }

  // Get overall stats
  const totalPieces = pieces.length;
  const availablePieces = pieces.filter(p => p.status === "Available" && !p.isWastage).length;
  const scrapPieces = pieces.filter(p => p.isWastage).length;
  const totalLength = pieces.reduce((sum, p) => sum + p.currentLengthMM, 0);
  const totalWastageLength = pieces.filter(p => p.isWastage).reduce((sum, p) => sum + p.currentLengthMM, 0);
  const originalLength = pieces.reduce((sum, p) => sum + p.originalLengthMM, 0);
  const wastagePercentage = originalLength > 0 ? (totalWastageLength / originalLength) * 100 : 0;

  const availableValue = pieces.filter(p => p.status === "Available" && !p.isWastage)
    .reduce((sum, p) => sum + (p.currentValue || 0), 0);
  const wastageValue = pieces.filter(p => p.isWastage)
    .reduce((sum, p) => sum + (p.currentValue || 0) * 0.3, 0);

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

  const handleMaterialClick = (material: AggregatedMaterial) => {
    setSelectedMaterial(material);
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
      {/* Header with GRN Button */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Raw Material Inventory</h1>
        <Button onClick={() => setIsGRNOpen(true)}>
          Inward Material (GRN)
        </Button>
      </div>

      {/* GRN Dialog */}
      <GRNEntryDialog
        open={isGRNOpen}
        onOpenChange={setIsGRNOpen}
        onSuccess={loadInventory}
      />

      {/* Main Tabs */}
      <Tabs defaultValue="material-list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="material-list">Material List</TabsTrigger>
          <TabsTrigger value="piece-details">Piece Details</TabsTrigger>
          <TabsTrigger value="usage-history">Usage History</TabsTrigger>
          <TabsTrigger value="wastage">Wastage Analysis</TabsTrigger>
        </TabsList>

        {/* Material List Tab */}
        <TabsContent value="material-list">
          <Card>
            <CardHeader>
              <CardTitle>Material Summary by Type</CardTitle>
              <CardDescription>
                Aggregated inventory grouped by material
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Material Filters */}
              <div className="flex flex-wrap gap-4 mb-6 pb-4 border-b items-center">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-muted-foreground">Type:</label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {materialTypes.filter(t => t !== "all").map((type) => (
                        <SelectItem key={type} value={type}>
                          {type} ({materials.filter(m => m.materialType === type).length})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-muted-foreground">Form:</label>
                  <Select value={selectedForm} onValueChange={setSelectedForm}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select form" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Forms</SelectItem>
                      {materialForms.filter(f => f !== "all").map((form) => (
                        <SelectItem key={form} value={form}>
                          {form} ({materials.filter(m => m.materialForm === form).length})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(selectedType !== "all" || selectedForm !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedType("all");
                      setSelectedForm("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                {filteredMaterials.map((material) => {
                  const isExpanded = expandedCards.has(material.materialId);

                  return (
                    <Card
                      key={material.materialId}
                      className="cursor-pointer hover:border-primary transition-all"
                    >
                      <CardContent className="pt-4 pb-4">
                        {/* Compact View - Always Visible */}
                        <div
                          className="cursor-pointer"
                          onClick={() => toggleCardExpansion(material.materialId)}
                        >
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                            {/* Material Info */}
                            <div className="md:col-span-2">
                              <div className="flex items-center gap-2 flex-wrap mb-2">
                                <h3 className="font-semibold text-base">{material.materialName}</h3>
                                <Badge variant="outline" className="text-xs">
                                  {material.materialType}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {material.materialForm}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <span>Grade: <span className="font-medium text-foreground">{material.grade}</span></span>
                                {material.diameter && (
                                  <span className="ml-3">• Ø{material.diameter}mm</span>
                                )}
                              </div>
                            </div>

                            {/* Stock Info */}
                            <div>
                              <div className="text-xs text-muted-foreground">Available Stock</div>
                              <div className="font-semibold text-base text-green-600">
                                {formatLength(material.availableLength)}
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {material.availablePieces} of {material.totalPieces} pieces
                              </div>
                            </div>

                            {/* Weight */}
                            <div>
                              <div className="text-xs text-muted-foreground">Weight</div>
                              <div className="font-semibold text-base">
                                {material.totalWeight.toFixed(2)} kg
                              </div>
                              <div className="text-xs text-green-600 mt-0.5">
                                {material.availableWeight.toFixed(2)} kg avail.
                              </div>
                            </div>

                            {/* Status & Expand */}
                            <div className="flex items-center justify-between md:justify-end gap-3">
                              <div className="flex gap-2">
                                <Badge className="bg-green-600 text-xs">{material.availablePieces}</Badge>
                                {material.inUsePieces > 0 && (
                                  <Badge className="bg-blue-600 text-xs">{material.inUsePieces}</Badge>
                                )}
                                {material.scrapPieces > 0 && (
                                  <Badge variant="destructive" className="text-xs">{material.scrapPieces}</Badge>
                                )}
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Expanded View - Details */}
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium text-muted-foreground">Stock Details</h4>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Total Stock:</span>
                                  <span className="font-medium">{formatLength(material.totalLength)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Available:</span>
                                  <span className="font-medium text-green-600">{formatLength(material.availableLength)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Total Pieces:</span>
                                  <span className="font-medium">{material.totalPieces}</span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <h4 className="text-sm font-medium text-muted-foreground">Weight & Status</h4>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Total Weight:</span>
                                  <span className="font-medium">{material.totalWeight.toFixed(2)} kg</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Available Weight:</span>
                                  <span className="font-medium">{material.availableWeight.toFixed(2)} kg</span>
                                </div>
                                <div className="flex gap-2 mt-2">
                                  <Badge className="bg-green-600 text-xs">{material.availablePieces} Available</Badge>
                                  <Badge className="bg-blue-600 text-xs">{material.inUsePieces} In Use</Badge>
                                  <Badge variant="destructive" className="text-xs">{material.scrapPieces} Scrap</Badge>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <h4 className="text-sm font-medium text-muted-foreground">Wastage</h4>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Wastage %:</span>
                                  <span className="font-medium text-orange-600">{material.wastagePercentage.toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Wastage Length:</span>
                                  <span className="font-medium">{formatLength(material.totalWastageLength)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Wastage Value:</span>
                                  <span className="font-medium">₹{material.totalWastageValue.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
                {filteredMaterials.length === 0 && materials.length > 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No materials found for the selected type.
                  </div>
                )}
                {materials.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No materials in inventory. Create a GRN to add materials.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Piece Details Tab */}
        <TabsContent value="piece-details" className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:border-primary/50 hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Total Pieces
                </CardDescription>
                <CardTitle className="text-3xl">{totalPieces}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>Available:</span>
                    <span className="text-green-600 font-medium">{availablePieces}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Scrap:</span>
                    <span className="text-red-600 font-medium">{scrapPieces}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:border-blue-400/50 hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-3">
                <CardDescription>Total Length</CardDescription>
                <CardTitle className="text-3xl text-blue-600">
                  {formatLength(totalLength)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  Available for production
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:border-orange-400/50 hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-3">
                <CardDescription className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Wastage
                </CardDescription>
                <CardTitle className="text-3xl text-orange-600">
                  {wastagePercentage.toFixed(1)}%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  {formatLength(totalWastageLength)} total waste
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:border-primary/50 hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-3">
                <CardDescription>Inventory Value</CardDescription>
                <CardTitle className="text-3xl text-primary">
                  ₹{availableValue.toFixed(2)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>Scrap value:</span>
                    <span className="text-orange-600">₹{wastageValue.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Piece List */}
          <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
            <CardHeader>
              <CardTitle>Material Pieces</CardTitle>
              <CardDescription>
                Individual tracking of each material piece from purchase to consumption
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pieces.map((piece) => {
                  const usagePercentage = piece.usagePercentage || 0;

                  return (
                    <Card key={piece.id} className={piece.isWastage ? "border-orange-500" : ""}>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          {/* Left: Basic Info */}
                          <div className="md:col-span-2 space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{piece.materialName}</h3>
                              {getStatusBadge(piece.status as MaterialUsageStatus)}
                              {piece.isWastage && (
                                <Badge variant="outline" className="text-orange-600 border-orange-600">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Wastage
                                </Badge>
                              )}
                            </div>

                            <div className="text-sm text-muted-foreground space-y-1">
                              <div>Piece No: <span className="font-medium">{piece.pieceNo}</span></div>
                              <div>Grade: <span className="font-medium">{piece.grade}</span></div>
                              {piece.diameter && (
                                <div>Diameter: <span className="font-medium">Ø{piece.diameter}mm</span></div>
                              )}
                              <div>Location: <span className="font-medium">{piece.storageLocation}</span></div>
                              <div>GRN: <span className="font-medium">{piece.grnNo}</span></div>
                            </div>
                          </div>

                          {/* Middle: Dimensions */}
                          <div className="space-y-2">
                            <div>
                              <div className="text-xs text-muted-foreground">Original Length</div>
                              <div className="font-semibold">
                                {formatLength(piece.originalLengthMM)}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Current Length</div>
                              <div className={`font-semibold text-lg ${piece.isWastage ? "text-orange-600" : "text-green-600"}`}>
                                {formatLength(piece.currentLengthMM)}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Usage</div>
                              <Progress value={usagePercentage} className="h-2" />
                              <div className="text-xs mt-1">{usagePercentage.toFixed(0)}% used</div>
                            </div>
                          </div>

                          {/* Right: Value & Info */}
                          <div className="space-y-2">
                            <div>
                              <div className="text-xs text-muted-foreground">Weight</div>
                              <div className="font-semibold">{piece.currentWeightKG.toFixed(2)} kg</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Current Value</div>
                              <div className="font-semibold text-green-600">
                                ₹{piece.currentValue?.toFixed(2) || "0.00"}
                              </div>
                            </div>
                            {piece.isWastage && piece.scrapValue && (
                              <div>
                                <div className="text-xs text-muted-foreground">Scrap Value</div>
                                <div className="font-semibold text-orange-600">₹{piece.scrapValue.toFixed(2)}</div>
                              </div>
                            )}
                            <div>
                              <div className="text-xs text-muted-foreground">Received</div>
                              <div className="font-medium text-sm">
                                {new Date(piece.receivedDate).toLocaleDateString()}
                              </div>
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
                {pieces.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No material pieces found. Create a GRN to add inventory.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage History Tab */}
        <TabsContent value="usage-history" className="space-y-4">
          <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
            <CardHeader>
              <CardTitle>Material Usage History</CardTitle>
              <CardDescription>
                Complete history of all material cuts and consumption
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Usage history tracking will be available once material requisitions and cutting operations are implemented.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Wastage Analysis Tab */}
        <TabsContent value="wastage" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
              <CardHeader>
                <CardTitle>Wastage Summary</CardTitle>
                <CardDescription>Overview of material wastage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg">
                  <div>
                    <div className="text-sm text-muted-foreground">Total Wastage</div>
                    <div className="text-2xl font-bold text-orange-600">
                      {formatLength(totalWastageLength)}
                    </div>
                  </div>
                  <TrendingDown className="h-8 w-8 text-orange-600" />
                </div>

                <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                  <div>
                    <div className="text-sm text-muted-foreground">Wastage Value</div>
                    <div className="text-2xl font-bold text-red-600">
                      ₹{wastageValue.toFixed(2)}
                    </div>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>

                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                  <div>
                    <div className="text-sm text-muted-foreground">Wastage Percentage</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {wastagePercentage.toFixed(2)}%
                    </div>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>

                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                  <div>
                    <div className="text-sm text-muted-foreground">Scrap Pieces</div>
                    <div className="text-2xl font-bold text-green-600">
                      {scrapPieces}
                    </div>
                  </div>
                  <Package className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
              <CardHeader>
                <CardTitle>Wastage Pieces</CardTitle>
                <CardDescription>Material pieces marked as wastage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pieces.filter(p => p.isWastage).map((piece) => (
                    <div key={piece.id} className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-semibold">{piece.materialName}</div>
                          <div className="text-sm text-muted-foreground">{piece.pieceNo}</div>
                        </div>
                        <Badge variant="destructive">Scrap</Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                        <div>
                          <div className="text-muted-foreground">Remaining</div>
                          <div className="font-semibold text-orange-600">
                            {formatLength(piece.currentLengthMM)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Scrap Value</div>
                          <div className="font-semibold text-green-600">
                            ₹{piece.scrapValue?.toFixed(2) || "0.00"}
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

                  {pieces.filter(p => p.isWastage).length === 0 && (
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
