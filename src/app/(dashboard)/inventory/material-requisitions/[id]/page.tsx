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
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { materialRequisitionService, MaterialRequisitionResponse, MaterialRequisitionItemResponse } from "@/lib/api/material-requisitions";
import { materialPieceService, MaterialPieceResponse } from "@/lib/api/material-pieces";
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
        accessorKey: 'materialName',
        header: 'Material',
        size: 200,
        Cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.materialName || "-"}</div>
            <div className="text-xs text-muted-foreground">{row.original.materialCode || ""}</div>
          </div>
        ),
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
        size: 200,
        Cell: ({ row }) => {
          const pieces = piecesMap.get(row.original.id) || [];
          return pieces.length > 0 ? (
            <div className="flex flex-wrap gap-1">
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
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">No pieces selected</span>
          );
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
    [piecesMap]
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
          {requisition.status === "Pending" && (
            <TooltipProvider>
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
            </TooltipProvider>
          )}
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
    </div>
  );
}
