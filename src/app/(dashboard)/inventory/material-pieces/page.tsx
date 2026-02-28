"use client";

import { useState, useEffect } from "react";
import { Package, AlertTriangle, Search, MoveRight, Pencil } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { materialPieceService, MaterialPieceResponse } from "@/lib/api/material-pieces";
import { AdjustPieceLengthDialog } from "@/components/dialogs/adjust-piece-length-dialog";
import { warehouseService, WarehouseResponse } from "@/lib/api/warehouses";
import { toast } from "sonner";

export default function MaterialPiecesPage() {
  const [loading, setLoading]               = useState(true);
  const [pieces, setPieces]                 = useState<MaterialPieceResponse[]>([]);
  const [filteredPieces, setFilteredPieces] = useState<MaterialPieceResponse[]>([]);
  const [warehouses, setWarehouses]         = useState<WarehouseResponse[]>([]);
  const [searchTerm, setSearchTerm]         = useState("");
  const [activeTab, setActiveTab]           = useState("all");
  const [filterWarehouse, setFilterWarehouse] = useState("all");

  // Selection state (for bulk relocate)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Adjust length dialog
  const [adjustPiece, setAdjustPiece] = useState<MaterialPieceResponse | null>(null)

  // Relocate dialog
  const [relocateOpen, setRelocateOpen]         = useState(false);
  const [targetWarehouseId, setTargetWarehouseId] = useState<string>("");
  const [relocating, setRelocating]             = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    filterPieces();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pieces, searchTerm, activeTab, filterWarehouse]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [piecesData, warehousesData] = await Promise.all([
        materialPieceService.getAll(),
        warehouseService.getAll(),
      ]);
      setPieces(piecesData);
      setWarehouses(warehousesData);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const filterPieces = () => {
    let filtered = pieces;

    if (activeTab === "available") {
      filtered = filtered.filter(p => p.status === "Available" && !p.isWastage);
    } else if (activeTab === "reserved") {
      filtered = filtered.filter(p => p.status === "Reserved");
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

    if (filterWarehouse !== "all") {
      const wid = parseInt(filterWarehouse);
      filtered = filtered.filter(p => p.warehouseId === wid);
    }

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.pieceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.materialName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.grade?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.grnNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.warehouseName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredPieces(filtered);
    // Clear selection when filter changes
    setSelectedIds(new Set());
  };

  // ── Selection helpers ──────────────────────────────────────────────────────
  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredPieces.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPieces.map(p => p.id)));
    }
  };

  const allSelected = filteredPieces.length > 0 && selectedIds.size === filteredPieces.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  // ── Relocate ──────────────────────────────────────────────────────────────
  const openRelocate = (singleId?: number) => {
    if (singleId) setSelectedIds(new Set([singleId]));
    setTargetWarehouseId("");
    setRelocateOpen(true);
  };

  const handleRelocate = async () => {
    if (!targetWarehouseId || selectedIds.size === 0) return;
    setRelocating(true);
    try {
      const count = await materialPieceService.relocate(
        Array.from(selectedIds),
        parseInt(targetWarehouseId)
      );
      toast.success(`${count} piece(s) relocated successfully`);
      setRelocateOpen(false);
      setSelectedIds(new Set());
      loadAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to relocate");
    } finally {
      setRelocating(false);
    }
  };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const available = pieces.filter(p => p.status === "Available" && !p.isWastage);
  const reserved  = pieces.filter(p => p.status === "Reserved");
  const inUse     = pieces.filter(p =>
    p.status === "Issued" || p.status === "In Use" || p.status === "Allocated" ||
    (p.issuedToJobCardId && p.status !== "Consumed")
  );
  const consumed  = pieces.filter(p => p.status === "Consumed");
  const wastage   = pieces.filter(p => p.isWastage);

  const stats = {
    totalPieces:     pieces.length,
    availablePieces: available.length,
    reservedPieces:  reserved.length,
    inUsePieces:     inUse.length,
    consumedPieces:  consumed.length,
    wastagePieces:   wastage.length,
    totalLength:     pieces.reduce((s, p) => s + p.currentLengthMeters, 0),
    availableLength: available.reduce((s, p) => s + p.currentLengthMeters, 0),
    wastageLength:   wastage.reduce((s, p) => s + p.currentLengthMeters, 0),
    totalWeight:     pieces.reduce((s, p) => s + p.currentWeightKG, 0),
    availableWeight: available.reduce((s, p) => s + p.currentWeightKG, 0),
    wastageWeight:   wastage.reduce((s, p) => s + p.currentWeightKG, 0),
  };

  const getSourceBadge = (grnNo: string | null | undefined) => {
    if (!grnNo) return <Badge variant="outline" className="text-xs">Unknown</Badge>;
    if (grnNo.startsWith("OS-"))
      return <Badge className="text-xs bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100">Opening Stock</Badge>;
    return <Badge className="text-xs bg-green-100 text-green-700 border-green-200 hover:bg-green-100">GRN Inward</Badge>;
  };

  const getStatusBadge = (piece: MaterialPieceResponse) => {
    if (piece.isWastage) return <Badge variant="destructive">Wastage</Badge>;
    switch (piece.status) {
      case "Available":  return <Badge className="bg-green-600">Available</Badge>;
      case "Reserved":   return <Badge className="bg-orange-500">Reserved</Badge>;
      case "In Use":
      case "Issued":     return <Badge className="bg-blue-600">Issued</Badge>;
      case "Consumed":   return <Badge className="bg-gray-500">Consumed</Badge>;
      case "Allocated":  return <Badge className="bg-yellow-600">Allocated</Badge>;
      case "Scrap":      return <Badge variant="destructive">Scrap</Badge>;
      default:           return <Badge variant="outline">{piece.status}</Badge>;
    }
  };

  // Only Raw Material warehouses for the filter (can be in pieces of either type)
  const rawMatWarehouses = warehouses.filter(w => w.materialType === "RawMaterial" && w.isActive);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-[400px]" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Material Pieces Inventory</h1>
        <Button onClick={loadAll} variant="outline" size="sm">Refresh</Button>
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
            <p className="text-xs text-muted-foreground">Issued to job cards</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consumed</CardTitle>
            <Package className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-500">{stats.consumedPieces}</div>
            <p className="text-xs text-muted-foreground">Production completed</p>
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

      {/* Search + Warehouse Filter + Bulk Relocate */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by piece no, material, grade, GRN, warehouse..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Warehouse filter */}
        <Select value={filterWarehouse} onValueChange={v => { setFilterWarehouse(v); }}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="All Warehouses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Warehouses</SelectItem>
            {rawMatWarehouses.map(w => (
              <SelectItem key={w.id} value={String(w.id)}>
                {w.name} — {w.rack} {w.rackNo}
              </SelectItem>
            ))}
            <SelectItem value="unassigned">Unassigned</SelectItem>
          </SelectContent>
        </Select>

        {/* Bulk relocate button — visible when ≥1 selected */}
        {selectedIds.size > 0 && (
          <Button
            size="sm"
            onClick={() => openRelocate()}
            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white"
          >
            <MoveRight className="h-4 w-4" />
            Relocate ({selectedIds.size})
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={v => { setActiveTab(v); setSelectedIds(new Set()); }}>
        <TabsList>
          <TabsTrigger value="all">All ({pieces.length})</TabsTrigger>
          <TabsTrigger value="available">Available ({stats.availablePieces})</TabsTrigger>
          <TabsTrigger value="reserved">Reserved ({stats.reservedPieces})</TabsTrigger>
          <TabsTrigger value="in-use">Issued ({stats.inUsePieces})</TabsTrigger>
          <TabsTrigger value="consumed">Consumed ({stats.consumedPieces})</TabsTrigger>
          <TabsTrigger value="wastage">Wastage ({stats.wastagePieces})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Material Pieces</CardTitle>
                  <CardDescription>
                    Physical pieces tracked individually with current length and usage
                  </CardDescription>
                </div>
                {selectedIds.size > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {selectedIds.size} selected
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    {/* Select all checkbox */}
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300"
                        checked={allSelected}
                        ref={el => { if (el) el.indeterminate = someSelected; }}
                        onChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Piece No</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Ø (mm)</TableHead>
                    <TableHead>Orig. Length</TableHead>
                    <TableHead>Curr. Length</TableHead>
                    <TableHead>Usage %</TableHead>
                    <TableHead>Weight (kg)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>GRN No</TableHead>
                    <TableHead>Warehouse / Location</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPieces.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={13} className="text-center text-muted-foreground py-10">
                        No pieces found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPieces.map(piece => (
                      <TableRow
                        key={piece.id}
                        className={selectedIds.has(piece.id) ? "bg-orange-50" : ""}
                      >
                        <TableCell>
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300"
                            checked={selectedIds.has(piece.id)}
                            onChange={() => toggleSelect(piece.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-sm">{piece.pieceNo}</TableCell>
                        <TableCell className="text-sm">{piece.materialName}</TableCell>
                        <TableCell className="text-sm">{piece.grade}</TableCell>
                        <TableCell className="text-sm">
                          {piece.diameter ? `${piece.diameter}` : '-'}
                        </TableCell>
                        <TableCell className="text-sm">{piece.originalLengthMeters.toFixed(2)}m</TableCell>
                        <TableCell className="text-sm font-medium">{piece.currentLengthMeters.toFixed(2)}m</TableCell>
                        <TableCell>
                          <span className={piece.usagePercentage > 80 ? "text-red-600 font-medium text-sm" : "text-sm"}>
                            {piece.usagePercentage.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">{piece.currentWeightKG.toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(piece)}</TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            {getSourceBadge(piece.grnNo)}
                            <p className="text-xs text-muted-foreground">{piece.grnNo}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {piece.warehouseName ? (
                            <span className="text-foreground font-medium">{piece.warehouseName}</span>
                          ) : piece.storageLocation ? (
                            <span className="text-muted-foreground">{piece.storageLocation}</span>
                          ) : (
                            <span className="text-muted-foreground/50 italic text-xs">Unassigned</span>
                          )}
                        </TableCell>
                        {/* Per-row actions (Available / Reserved pieces) */}
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {(piece.status === "Available" || piece.status === "Reserved") && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                title="Adjust length"
                                onClick={() => setAdjustPiece(piece)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {piece.status === "Available" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                title="Relocate this piece"
                                onClick={() => openRelocate(piece.id)}
                              >
                                <MoveRight className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
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

      {/* Relocate Dialog */}
      <Dialog open={relocateOpen} onOpenChange={open => { if (!open) setSelectedIds(new Set()); setRelocateOpen(open); }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MoveRight className="h-5 w-5 text-orange-500" />
              Relocate {selectedIds.size} Piece{selectedIds.size !== 1 ? 's' : ''}
            </DialogTitle>
            <DialogDescription>
              Select the destination warehouse rack to move the selected piece{selectedIds.size !== 1 ? 's' : ''} to.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 grid gap-3">
            <Label>Destination Warehouse *</Label>
            <Select value={targetWarehouseId} onValueChange={setTargetWarehouseId}>
              <SelectTrigger>
                <SelectValue placeholder="Select warehouse rack..." />
              </SelectTrigger>
              <SelectContent>
                {warehouses.filter(w => w.isActive).map(w => (
                  <SelectItem key={w.id} value={String(w.id)}>
                    <span className="flex flex-col">
                      <span>{w.name} — {w.rack} {w.rackNo}</span>
                      <span className="text-xs text-muted-foreground">
                        {w.materialType === 'RawMaterial' ? 'Raw Material' : 'Component'}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {targetWarehouseId && (
              <div className="rounded-md bg-orange-50 border border-orange-200 p-3 text-sm text-orange-800">
                <strong>{selectedIds.size}</strong> piece{selectedIds.size !== 1 ? 's' : ''} will be moved to{' '}
                <strong>
                  {warehouses.find(w => w.id === parseInt(targetWarehouseId))?.name}
                  {' — '}
                  {warehouses.find(w => w.id === parseInt(targetWarehouseId))?.rack}
                  {' '}
                  {warehouses.find(w => w.id === parseInt(targetWarehouseId))?.rackNo}
                </strong>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setRelocateOpen(false); setSelectedIds(new Set()); }}>
              Cancel
            </Button>
            <Button
              onClick={handleRelocate}
              disabled={!targetWarehouseId || relocating}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {relocating ? 'Relocating...' : `Relocate ${selectedIds.size} Piece${selectedIds.size !== 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Length Dialog */}
      {adjustPiece && (
        <AdjustPieceLengthDialog
          piece={adjustPiece}
          open={!!adjustPiece}
          onOpenChange={open => { if (!open) setAdjustPiece(null) }}
          onSuccess={() => { setAdjustPiece(null); loadAll(); }}
        />
      )}
    </div>
  );
}
