"use client";

import { useState, useEffect } from "react";
import { Package, TrendingDown, AlertTriangle, Filter, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { materialPieceService, MaterialPieceResponse } from "@/lib/api/material-pieces";
import { toast } from "sonner";

export default function MaterialPiecesPage() {
  const [loading, setLoading] = useState(true);
  const [pieces, setPieces] = useState<MaterialPieceResponse[]>([]);
  const [filteredPieces, setFilteredPieces] = useState<MaterialPieceResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    loadPieces();
  }, []);

  useEffect(() => {
    filterPieces();
  }, [pieces, searchTerm, activeTab]);

  const loadPieces = async () => {
    try {
      setLoading(true);
      const data = await materialPieceService.getAll();
      setPieces(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load material pieces");
    } finally {
      setLoading(false);
    }
  };

  const filterPieces = () => {
    let filtered = pieces;

    // Filter by tab
    if (activeTab === "available") {
      filtered = filtered.filter(p => p.status === "Available" && !p.isWastage);
    } else if (activeTab === "in-use") {
      filtered = filtered.filter(p =>
        p.status === "Issued" || p.status === "In Use" || p.status === "Allocated" ||
        (p.issuedToJobCardId && p.status !== "Consumed")
      );
    } else if (activeTab === "consumed") {
      filtered = filtered.filter(p => p.status === "Consumed");
    } else if (activeTab === "wastage") {
      filtered = filtered.filter(p => p.isWastage);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.pieceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.materialName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.grade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.grnNo?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredPieces(filtered);
  };

  const getStatusBadge = (piece: MaterialPieceResponse) => {
    if (piece.isWastage) {
      return <Badge variant="destructive">Wastage</Badge>;
    }
    switch (piece.status) {
      case "Available":
        return <Badge className="bg-green-600">Available</Badge>;
      case "In Use":
      case "Issued":
        return <Badge className="bg-blue-600">Issued</Badge>;
      case "Consumed":
        return <Badge className="bg-gray-500">Consumed</Badge>;
      case "Reserved":
      case "Allocated":
        return <Badge className="bg-yellow-600">Allocated</Badge>;
      case "Scrap":
        return <Badge variant="destructive">Scrap</Badge>;
      default:
        return <Badge variant="outline">{piece.status}</Badge>;
    }
  };

  const calculateStats = () => {
    const available = pieces.filter(p => p.status === "Available" && !p.isWastage);
    const inUse = pieces.filter(p =>
      p.status === "Issued" || p.status === "In Use" || p.status === "Allocated" ||
      (p.issuedToJobCardId && p.status !== "Consumed")
    );
    const consumed = pieces.filter(p => p.status === "Consumed");
    const wastage = pieces.filter(p => p.isWastage);

    const totalLength = pieces.reduce((sum, p) => sum + p.currentLengthMeters, 0);
    const availableLength = available.reduce((sum, p) => sum + p.currentLengthMeters, 0);
    const wastageLength = wastage.reduce((sum, p) => sum + p.currentLengthMeters, 0);

    const totalWeight = pieces.reduce((sum, p) => sum + p.currentWeightKG, 0);
    const availableWeight = available.reduce((sum, p) => sum + p.currentWeightKG, 0);
    const wastageWeight = wastage.reduce((sum, p) => sum + p.currentWeightKG, 0);

    return {
      totalPieces: pieces.length,
      availablePieces: available.length,
      inUsePieces: inUse.length,
      consumedPieces: consumed.length,
      wastagePieces: wastage.length,
      totalLength,
      availableLength,
      wastageLength,
      totalWeight,
      availableWeight,
      wastageWeight,
    };
  };

  const stats = calculateStats();

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Material Pieces Inventory</h1>
        <Button onClick={loadPieces} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pieces</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPieces}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalLength.toFixed(2)}m | {stats.totalWeight.toFixed(2)} kg
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.availablePieces}</div>
            <p className="text-xs text-muted-foreground">
              {stats.availableLength.toFixed(2)}m | {stats.availableWeight.toFixed(2)} kg
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issued</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inUsePieces}</div>
            <p className="text-xs text-muted-foreground">
              Issued to job cards
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consumed</CardTitle>
            <Package className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-500">{stats.consumedPieces}</div>
            <p className="text-xs text-muted-foreground">
              Production completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wastage</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.wastagePieces}</div>
            <p className="text-xs text-muted-foreground">
              {stats.wastageLength.toFixed(2)}m | {stats.wastageWeight.toFixed(2)} kg
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by piece no, material, grade, or GRN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({pieces.length})</TabsTrigger>
          <TabsTrigger value="available">Available ({stats.availablePieces})</TabsTrigger>
          <TabsTrigger value="in-use">Issued ({stats.inUsePieces})</TabsTrigger>
          <TabsTrigger value="consumed">Consumed ({stats.consumedPieces})</TabsTrigger>
          <TabsTrigger value="wastage">Wastage ({stats.wastagePieces})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Material Pieces</CardTitle>
              <CardDescription>
                Physical pieces tracked individually with current length and usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Piece No</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Diameter</TableHead>
                    <TableHead>Original Length</TableHead>
                    <TableHead>Current Length</TableHead>
                    <TableHead>Usage %</TableHead>
                    <TableHead>Weight (kg)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>GRN No</TableHead>
                    <TableHead>Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPieces.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center text-muted-foreground">
                        No pieces found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPieces.map((piece) => (
                      <TableRow key={piece.id}>
                        <TableCell className="font-medium">{piece.pieceNo}</TableCell>
                        <TableCell>{piece.materialName}</TableCell>
                        <TableCell>{piece.grade}</TableCell>
                        <TableCell>{piece.diameter ? `${piece.diameter}mm` : '-'}</TableCell>
                        <TableCell>{piece.originalLengthMeters.toFixed(2)}m</TableCell>
                        <TableCell>{piece.currentLengthMeters.toFixed(2)}m</TableCell>
                        <TableCell>
                          <span className={piece.usagePercentage > 80 ? "text-red-600" : ""}>
                            {piece.usagePercentage.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell>{piece.currentWeightKG.toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(piece)}</TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">{piece.grnNo}</span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {piece.storageLocation}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
