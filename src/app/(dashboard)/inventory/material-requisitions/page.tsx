"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
  type MRT_PaginationState,
} from 'material-react-table';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import {
  FileText,
  Clock,
  CheckCircle,
  Package,
  Eye,
  ThumbsUp,
  XCircle,
  Plus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { materialRequisitionService, MaterialRequisitionResponse } from "@/lib/api/material-requisitions";
import { toast } from "sonner";
import { format } from "date-fns";
import { CreateRequisitionDialog } from "@/components/forms/create-requisition-dialog";

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

export default function MaterialRequisitionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [requisitions, setRequisitions] = useState<MaterialRequisitionResponse[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  useEffect(() => {
    loadRequisitions();
  }, []);

  const loadRequisitions = async () => {
    try {
      setLoading(true);
      const data = await materialRequisitionService.getAll();
      setRequisitions(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load requisitions");
    } finally {
      setLoading(false);
    }
  };

  const handleView = (req: MaterialRequisitionResponse) => {
    router.push(`/inventory/material-requisitions/${req.id}`);
  };

  const handleApprove = async (req: MaterialRequisitionResponse) => {
    try {
      await materialRequisitionService.approve(req.id, "Current User");
      toast.success("Requisition approved successfully");
      loadRequisitions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to approve requisition");
    }
  };

  const handleReject = async (req: MaterialRequisitionResponse) => {
    try {
      await materialRequisitionService.reject(req.id, "Current User", "Rejected by user");
      toast.success("Requisition rejected successfully");
      loadRequisitions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reject requisition");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return <Badge className="bg-yellow-600">Pending</Badge>;
      case "Approved":
        return <Badge className="bg-green-600">Approved</Badge>;
      case "Issued":
        return <Badge className="bg-blue-600">Issued</Badge>;
      case "Completed":
        return <Badge className="bg-gray-600">Completed</Badge>;
      case "Rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "Cancelled":
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Urgent":
        return <Badge variant="destructive">Urgent</Badge>;
      case "High":
        return <Badge className="bg-orange-600">High</Badge>;
      case "Medium":
        return <Badge className="bg-blue-600">Medium</Badge>;
      case "Low":
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const calculateStats = () => {
    const pending = requisitions.filter(r => r.status === "Pending");
    const approved = requisitions.filter(r => r.status === "Approved");
    const issued = requisitions.filter(r => r.status === "Issued");

    return {
      total: requisitions.length,
      pending: pending.length,
      approved: approved.length,
      issued: issued.length,
    };
  };

  const stats = calculateStats();

  // Filter requisitions based on active tab
  const filteredRequisitions = useMemo(() => {
    if (activeTab === "pending") {
      return requisitions.filter(r => r.status === "Pending");
    } else if (activeTab === "approved") {
      return requisitions.filter(r => r.status === "Approved");
    } else if (activeTab === "issued") {
      return requisitions.filter(r => r.status === "Issued");
    }
    return requisitions;
  }, [requisitions, activeTab]);

  // Define columns
  const columns = useMemo<MRT_ColumnDef<MaterialRequisitionResponse>[]>(
    () => [
      {
        accessorKey: 'requisitionNo',
        header: 'Requisition No',
        size: 150,
        Cell: ({ cell }) => (
          <span className="font-medium font-mono">
            {cell.getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'requisitionDate',
        header: 'Date',
        size: 120,
        Cell: ({ cell }) => (
          <span className="text-sm">
            {format(new Date(cell.getValue<string>()), "dd MMM yyyy")}
          </span>
        ),
      },
      {
        accessorKey: 'jobCardNo',
        header: 'Job Card',
        size: 130,
        Cell: ({ cell }) => {
          const value = cell.getValue<string>();
          return value ? (
            <span className="text-blue-600 font-medium">{value}</span>
          ) : (
            <span className="text-muted-foreground">-</span>
          );
        },
      },
      {
        accessorKey: 'orderNo',
        header: 'Order No',
        size: 130,
        Cell: ({ cell }) => (
          <span className="font-medium">{cell.getValue<string>() || "-"}</span>
        ),
      },
      {
        accessorKey: 'customerName',
        header: 'Customer',
        size: 180,
        Cell: ({ cell }) => (
          <span className="text-sm">{cell.getValue<string>() || "-"}</span>
        ),
      },
      {
        accessorKey: 'priority',
        header: 'Priority',
        size: 100,
        Cell: ({ row }) => getPriorityBadge(row.original.priority),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 110,
        Cell: ({ row }) => getStatusBadge(row.original.status),
      },
      {
        accessorKey: 'dueDate',
        header: 'Due Date',
        size: 120,
        Cell: ({ cell }) => {
          const value = cell.getValue<string>();
          return value ? (
            <span className="text-sm">{format(new Date(value), "dd MMM yyyy")}</span>
          ) : (
            <span className="text-muted-foreground">-</span>
          );
        },
      },
      {
        accessorKey: 'requestedBy',
        header: 'Requested By',
        size: 140,
        Cell: ({ cell }) => (
          <span className="text-sm text-muted-foreground">
            {cell.getValue<string>() || "-"}
          </span>
        ),
      },
    ],
    []
  );

  const table = useMaterialReactTable({
    columns,
    data: filteredRequisitions,
    enableColumnActions: true,
    enableColumnFilters: true,
    enableSorting: true,
    enableGlobalFilter: true,
    enableTopToolbar: true,
    enableBottomToolbar: true,
    enableRowActions: true,
    positionActionsColumn: 'last',
    enableColumnOrdering: true,

    onPaginationChange: setPagination,
    state: { pagination },
    muiPaginationProps: {
      rowsPerPageOptions: [10, 25, 50, 100],
      showFirstButton: true,
      showLastButton: true,
    },
    paginationDisplayMode: 'pages',

    muiSearchTextFieldProps: {
      placeholder: 'Search requisitions...',
      sx: { minWidth: '300px' },
      variant: 'outlined',
    },

    renderRowActions: ({ row }) => (
      <TooltipProvider>
        <div className="flex gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleView(row.original)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View Details</p>
            </TooltipContent>
          </Tooltip>

          {row.original.status === "Pending" && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleApprove(row.original)}
                    className="text-green-600 hover:text-green-700"
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Approve</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleReject(row.original)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reject</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      </TooltipProvider>
    ),
  });

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
        <h1 className="text-2xl font-bold">Material Requisitions</h1>
        <div className="flex gap-2">
          <Button onClick={loadRequisitions} variant="outline">
            Refresh
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Requisition
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requisitions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All material requisitions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">
              Ready for allocation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issued</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.issued}</div>
            <p className="text-xs text-muted-foreground">
              Materials issued
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
          <TabsTrigger value="issued">Issued ({stats.issued})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <ThemeProvider theme={muiTheme}>
            <MaterialReactTable table={table} />
          </ThemeProvider>
        </TabsContent>
      </Tabs>

      {/* Create Requisition Dialog */}
      <CreateRequisitionDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={loadRequisitions}
      />
    </div>
  );
}
