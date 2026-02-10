"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
  type MRT_PaginationState,
} from 'material-react-table';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ArrowLeft, CheckCircle, XCircle, Scissors, PackageCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { materialRequisitionService, MaterialRequisitionResponse, MaterialRequisitionItemResponse } from "@/lib/api/material-requisitions";
import { materialPieceService, MaterialPieceResponse } from "@/lib/api/material-pieces";
import { PieceSelectionDialog } from "@/components/planning/PieceSelectionDialog";
import { ComponentSelectionDialog } from "@/components/inventory/ComponentSelectionDialog";
import { toast } from "sonner";
import { format } from "date-fns";

// MUI Theme matching app styles
const muiTheme = createTheme({
  palette: { mode: 'light' },
  typography: { fontFamily: 'inherit' },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          border: '2px solid hsl(var(--border))',
          borderRadius: '0.5rem',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: 'hsl(var(--muted))',
            fontWeight: 600,
          },
        },
      },
    },
  },
});

export default function MaterialRequisitionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requisitionId = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [requisition, setRequisition] = useState<MaterialRequisitionResponse | null>(null);
  const [items, setItems] = useState<MaterialRequisitionItemResponse[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [piecesMap, setPiecesMap] = useState<Map<number, MaterialPieceResponse[]>>(new Map());
  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // Local piece selection state (in-memory, persists within session)
  const [localPiecesMap, setLocalPiecesMap] = useState<Map<number, MaterialPieceResponse[]>>(new Map());

  // Items that had selectedPieceIds set from planning — read-only on this page
  const [planningLockedItems, setPlanningLockedItems] = useState<Set<number>>(new Set());

  // Issue dialog state
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [issuedBy, setIssuedBy] = useState("");
  const [receivedBy, setReceivedBy] = useState("");

  // Piece selection dialog state (raw material items)
  const [pieceDialogOpen, setPieceDialogOpen] = useState(false);
  const [selectedItemForPieces, setSelectedItemForPieces] = useState<MaterialRequisitionItemResponse | null>(null);

  // Component selection dialog state (purchased component items)
  const [componentDialogOpen, setComponentDialogOpen] = useState(false);
  const [selectedItemForComponent, setSelectedItemForComponent] = useState<MaterialRequisitionItemResponse | null>(null);

  useEffect(() => {
    loadRequisition();
  }, [requisitionId]);

  const loadRequisition = async () => {
    try {
      setLoading(true);
      const data = await materialRequisitionService.getById(requisitionId);
      setRequisition(data);

      // Load requisition items
      const itemsData = await materialRequisitionService.getItems(requisitionId);
      setItems(itemsData);

      // Load selected pieces for each item
      const newPiecesMap = new Map<number, MaterialPieceResponse[]>();
      for (const item of itemsData) {
        if (item.selectedPieceIds && item.selectedPieceIds.length > 0) {
          try {
            const pieces = await Promise.all(
              item.selectedPieceIds.map(pieceId => materialPieceService.getById(pieceId))
            );
            newPiecesMap.set(item.id, pieces);
          } catch (error) {
            console.error(`Failed to load pieces for item ${item.id}:`, error);
          }
        }
      }
      setPiecesMap(newPiecesMap);

      // Track items whose pieces were already chosen during planning (read-only on this page)
      const locked = new Set(
        itemsData
          .filter(i => i.selectedPieceIds && i.selectedPieceIds.length > 0)
          .map(i => i.id)
      );
      setPlanningLockedItems(locked);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load requisition");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!requisition) return;

    try {
      setActionLoading(true);
      await materialRequisitionService.approve(requisition.id, "Current User");
      toast.success("Requisition approved successfully");
      loadRequisition();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to approve requisition");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!requisition) return;

    try {
      setActionLoading(true);
      await materialRequisitionService.reject(requisition.id, "Current User", "Rejected by user");
      toast.success("Requisition rejected");
      router.push("/inventory/material-requisitions");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reject requisition");
    } finally {
      setActionLoading(false);
    }
  };

  const handleIssue = async () => {
    if (!requisition) return;
    try {
      setActionLoading(true);
      await materialRequisitionService.issueMaterials({
        requisitionId: requisition.id,
        ...(requisition.jobCardId ? { jobCardId: requisition.jobCardId } : {}),
        issuedBy,
        receivedBy,
      });
      toast.success("Materials issued successfully");
      setIssueDialogOpen(false);
      setIssuedBy("");
      setReceivedBy("");
      loadRequisition();
    } catch (error: any) {
      // Extract backend error message if available (axios throws on 4xx)
      const msg = error?.response?.data?.message
        || (error instanceof Error ? error.message : "Failed to issue materials");
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePiecesConfirmed = async (selectedPieces: { piece: MaterialPieceResponse; quantityMM: number }[]) => {
    if (!selectedItemForPieces) return;
    const itemId = selectedItemForPieces.id;
    const pieceIds = selectedPieces.map(sp => sp.piece.id);
    const pieces = selectedPieces.map(sp => sp.piece);

    // Save to local state immediately — reopen will restore this selection
    setLocalPiecesMap(prev => new Map(prev).set(itemId, pieces));

    // Also persist to backend
    try {
      await materialRequisitionService.updateItemSelectedPieces(requisitionId, itemId, pieceIds);
      toast.success("Pieces selected successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save piece selection");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      Pending: { label: "Pending", variant: "secondary" },
      Approved: { label: "Approved", variant: "default" },
      Rejected: { label: "Rejected", variant: "destructive" },
      Issued: { label: "Issued", variant: "outline" },
    };

    const config = statusConfig[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig: Record<string, { variant: "default" | "destructive" | "outline" | "secondary" }> = {
      Low: { variant: "outline" },
      Medium: { variant: "secondary" },
      High: { variant: "default" },
      Urgent: { variant: "destructive" },
    };

    const config = priorityConfig[priority] || { variant: "outline" };
    return <Badge variant={config.variant}>{priority}</Badge>;
  };

  // Define columns for MaterialReactTable
  const columns = useMemo<MRT_ColumnDef<MaterialRequisitionItemResponse>[]>(
    () => [
      {
        accessorKey: 'lineNo',
        header: 'Line',
        size: 70,
        Cell: ({ cell }) => (
          <span className="font-medium">{cell.getValue<number>()}</span>
        ),
      },
      {
        id: 'itemName',
        header: 'Material / Component',
        size: 200,
        Cell: ({ row }) => {
          const item = row.original;
          const isComp = !!item.componentId;
          const name = isComp ? (item.componentName || item.componentCode || "-") : (item.materialName || "-");
          const code = isComp ? item.componentCode : item.materialCode;
          return (
            <div>
              <div className="font-medium flex items-center gap-1">
                {isComp && <span className="text-xs font-normal text-blue-600 bg-blue-50 border border-blue-200 rounded px-1 py-0">Component</span>}
                {name}
              </div>
              <div className="text-xs text-muted-foreground">{code || ""}</div>
            </div>
          );
        },
      },
      {
        accessorKey: 'materialGrade',
        header: 'Grade',
        size: 100,
        Cell: ({ cell }) => (
          <span className="text-sm">{cell.getValue<string>() || "-"}</span>
        ),
      },
      {
        accessorKey: 'quantityRequired',
        header: 'Required Qty',
        size: 120,
        Cell: ({ cell }) => (
          <span className="font-medium">{cell.getValue<number>()}</span>
        ),
        muiTableBodyCellProps: {
          align: 'right',
        },
        muiTableHeadCellProps: {
          align: 'right',
        },
      },
      {
        accessorKey: 'uom',
        header: 'UOM',
        size: 80,
        Cell: ({ cell }) => (
          <span className="text-sm">{cell.getValue<string>() || "-"}</span>
        ),
      },
      {
        id: 'selectedPieces',
        header: 'Selected Pieces',
        size: 220,
        Cell: ({ row }) => {
          const item = row.original;
          // Local state takes priority (updated on confirm); fallback to server-loaded piecesMap
          const pieces = localPiecesMap.get(item.id) || piecesMap.get(item.id) || [];

          // Planning-locked items cannot be edited on inventory page
          const isLocked = planningLockedItems.has(item.id);
          const isRawMaterial = !!item.materialId;
          const isComponent = !!item.componentId;
          const canEditPieces = !isLocked && isRawMaterial && requisition?.status !== "Issued" && requisition?.status !== "Rejected";
          const canEditComponent = isComponent && requisition?.status !== "Issued" && requisition?.status !== "Rejected";

          // Component item — show "Select Component" button (stock check)
          if (isComponent) {
            return (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1.5"
                      disabled={!canEditComponent}
                      onClick={() => {
                        setSelectedItemForComponent(item);
                        setComponentDialogOpen(true);
                      }}
                    >
                      <PackageCheck className="h-3 w-3" />
                      {item.componentName || item.componentCode || "Component"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Check component stock availability</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          }

          if (pieces.length > 0) {
            return (
              <div className="flex flex-wrap items-center gap-1">
                {pieces.map((piece) => (
                  <TooltipProvider key={piece.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="cursor-help">
                          {piece.pieceNo}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs space-y-1">
                          <div><strong>Piece:</strong> {piece.pieceNo}</div>
                          <div><strong>Length:</strong> {piece.currentLengthMM} mm</div>
                          <div><strong>Status:</strong> {piece.status}</div>
                          <div><strong>Location:</strong> {piece.storageLocation || "-"}</div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
                {canEditPieces && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 ml-1 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setSelectedItemForPieces(item);
                      setPieceDialogOpen(true);
                    }}
                  >
                    <Scissors className="h-3 w-3" />
                  </Button>
                )}
              </div>
            );
          }

          if (canEditPieces) {
            return (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1.5"
                      onClick={() => {
                        setSelectedItemForPieces(item);
                        setPieceDialogOpen(true);
                      }}
                    >
                      <Scissors className="h-3 w-3" />
                      Select Pieces
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Select material pieces for this item</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          }

          return <span className="text-xs text-muted-foreground">No pieces selected</span>;
        },
      },
      {
        accessorKey: 'jobCardNo',
        header: 'Job Card',
        size: 130,
        Cell: ({ cell }) => {
          const value = cell.getValue<string>();
          return value ? (
            <span className="text-sm font-medium text-blue-600">{value}</span>
          ) : (
            <span className="text-muted-foreground">-</span>
          );
        },
      },
      {
        accessorKey: 'processName',
        header: 'Process',
        size: 150,
        Cell: ({ cell }) => (
          <span className="text-sm">{cell.getValue<string>() || "-"}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 100,
        Cell: ({ row }) => (
          <Badge variant={row.original.status === "Pending" ? "secondary" : "default"}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: 'remarks',
        header: 'Remarks',
        size: 180,
        Cell: ({ cell }) => (
          <span className="text-xs text-muted-foreground">
            {cell.getValue<string>() || "-"}
          </span>
        ),
      },
    ],
    [piecesMap, localPiecesMap, planningLockedItems, requisition]
  );

  const table = useMaterialReactTable({
    columns,
    data: items,
    enableColumnActions: true,
    enableColumnFilters: true,
    enableSorting: true,
    enableGlobalFilter: true,
    enableTopToolbar: true,
    enableBottomToolbar: true,
    enableRowActions: false,
    enableColumnOrdering: true,

    onPaginationChange: setPagination,
    state: { pagination },
    muiPaginationProps: {
      rowsPerPageOptions: [10, 25, 50],
      showFirstButton: true,
      showLastButton: true,
    },
    paginationDisplayMode: 'pages',

    muiSearchTextFieldProps: {
      placeholder: 'Search materials...',
      sx: { minWidth: '300px' },
      variant: 'outlined',
    },
  });

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!requisition) {
    return (
      <div className="p-8">
        <div className="text-center text-muted-foreground">
          Requisition not found
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/inventory/material-requisitions">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Material Requisition</h1>
          </div>
          <p className="text-muted-foreground">{requisition.requisitionNo}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <TooltipProvider>
            {requisition.status === "Pending" && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleApprove}
                      disabled={actionLoading}
                      size="icon"
                      variant="default"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Approve Requisition</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleReject}
                      disabled={actionLoading}
                      size="icon"
                      variant="destructive"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Reject Requisition</p>
                  </TooltipContent>
                </Tooltip>
              </>
            )}

            {requisition.status === "Approved" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setIssueDialogOpen(true)}
                    disabled={actionLoading}
                    size="sm"
                    className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <PackageCheck className="h-4 w-4" />
                    Issue Materials
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Issue selected pieces to the job card</p>
                </TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      </div>

      {/* Requisition Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Requisition Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Status</div>
                <div className="mt-1">{getStatusBadge(requisition.status)}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Priority</div>
                <div className="mt-1">{getPriorityBadge(requisition.priority)}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Requisition Date</div>
                <div className="mt-1 text-sm">{format(new Date(requisition.requisitionDate), "PPP")}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Due Date</div>
                <div className="mt-1 text-sm">
                  {requisition.dueDate ? format(new Date(requisition.dueDate), "PPP") : "-"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Order No</div>
                <div className="mt-1 text-sm font-medium">{requisition.orderNo || "-"}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Job Card No</div>
                <div className="mt-1 text-sm font-medium text-blue-600">
                  {requisition.jobCardNo || "-"}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Customer</div>
                <div className="mt-1 text-sm">{requisition.customerName || "-"}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Requested By</div>
                <div className="mt-1 text-sm">{requisition.requestedBy || "-"}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Material Items */}
      <Card>
        <CardHeader>
          <CardTitle>Material Requirements</CardTitle>
          <CardDescription>
            List of materials required with selected pieces, job card and process details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeProvider theme={muiTheme}>
            <MaterialReactTable table={table} />
          </ThemeProvider>
        </CardContent>
      </Card>

      {/* Remarks */}
      {requisition.remarks && (
        <Card>
          <CardHeader>
            <CardTitle>Remarks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{requisition.remarks}</p>
          </CardContent>
        </Card>
      )}

      {/* Issue Materials Dialog */}
      <Dialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue Materials</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              This will mark all selected pieces as <strong>Issued</strong> and update the requisition status.
            </p>
            <div className="space-y-2">
              <Label htmlFor="issuedBy">Issued By</Label>
              <Input
                id="issuedBy"
                placeholder="Store keeper name"
                value={issuedBy}
                onChange={e => setIssuedBy(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="receivedBy">Received By</Label>
              <Input
                id="receivedBy"
                placeholder="Production operator / receiver name"
                value={receivedBy}
                onChange={e => setReceivedBy(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIssueDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleIssue}
              disabled={actionLoading || !issuedBy.trim() || !receivedBy.trim()}
              className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
            >
              <PackageCheck className="h-4 w-4" />
              Confirm Issue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Piece Selection Dialog (raw material items) */}
      {selectedItemForPieces && (
        <PieceSelectionDialog
          open={pieceDialogOpen}
          onOpenChange={(open) => {
            setPieceDialogOpen(open);
            if (!open) setSelectedItemForPieces(null);
          }}
          materialId={selectedItemForPieces.materialId!}
          materialName={selectedItemForPieces.materialName || ""}
          materialGrade={selectedItemForPieces.materialGrade}
          requiredLengthMM={selectedItemForPieces.lengthRequiredMM ?? selectedItemForPieces.quantityRequired}
          childParts={[{
            childPartName: selectedItemForPieces.materialName || "Material",
            pieceLengthMM: selectedItemForPieces.lengthRequiredMM ?? selectedItemForPieces.quantityRequired,
            piecesCount: selectedItemForPieces.numberOfPieces ?? 1,
            wastagePercent: 0,
          }]}
          preSelectedIds={
            // Local state (from this session's confirms) takes priority over server data
            (localPiecesMap.get(selectedItemForPieces.id) ?? []).map(p => p.id).length > 0
              ? (localPiecesMap.get(selectedItemForPieces.id) ?? []).map(p => p.id)
              : (selectedItemForPieces.selectedPieceIds ?? [])
          }
          onConfirm={handlePiecesConfirmed}
        />
      )}

      {/* Component Selection Dialog (purchased component items) */}
      {selectedItemForComponent && (
        <ComponentSelectionDialog
          open={componentDialogOpen}
          onOpenChange={(open) => {
            setComponentDialogOpen(open);
            if (!open) setSelectedItemForComponent(null);
          }}
          componentId={selectedItemForComponent.componentId!}
          componentName={selectedItemForComponent.componentName || selectedItemForComponent.componentCode || "Component"}
          componentCode={selectedItemForComponent.componentCode}
          requiredQuantity={selectedItemForComponent.quantityRequired}
          uom={selectedItemForComponent.uom}
          onConfirm={() => toast.success("Component confirmed — it will be deducted when issuing.")}
        />
      )}
    </div>
  );
}
