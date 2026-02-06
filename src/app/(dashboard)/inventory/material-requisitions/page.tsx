"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Clock,
  CheckCircle,
  Package,
  Search,
  Plus,
  MoreVertical
} from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { materialRequisitionService, MaterialRequisitionResponse } from "@/lib/api/material-requisitions";
import { toast } from "sonner";
import { format } from "date-fns";
import { CreateRequisitionDialog } from "@/components/forms/create-requisition-dialog";

export default function MaterialRequisitionsPage() {
  const [loading, setLoading] = useState(true);
  const [requisitions, setRequisitions] = useState<MaterialRequisitionResponse[]>([]);
  const [filteredRequisitions, setFilteredRequisitions] = useState<MaterialRequisitionResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    loadRequisitions();
  }, []);

  useEffect(() => {
    filterRequisitions();
  }, [requisitions, searchTerm, activeTab]);

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

  const filterRequisitions = () => {
    let filtered = requisitions;

    // Filter by tab
    if (activeTab === "pending") {
      filtered = filtered.filter(r => r.status === "Pending");
    } else if (activeTab === "approved") {
      filtered = filtered.filter(r => r.status === "Approved");
    } else if (activeTab === "issued") {
      filtered = filtered.filter(r => r.status === "Issued");
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.requisitionNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.jobCardNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.orderNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRequisitions(filtered);
  };

  const handleApprove = async (id: number) => {
    try {
      await materialRequisitionService.approve(id, "Current User");
      toast.success("Requisition approved successfully");
      loadRequisitions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to approve requisition");
    }
  };

  const handleReject = async (id: number) => {
    try {
      await materialRequisitionService.reject(id, "Current User", "Rejected by user");
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
    const urgent = requisitions.filter(r => r.priority === "Urgent" && r.status !== "Completed");

    return {
      total: requisitions.length,
      pending: pending.length,
      approved: approved.length,
      issued: issued.length,
      urgent: urgent.length,
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

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by requisition no, job card, order, or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
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
          <Card>
            <CardHeader>
              <CardTitle>Requisitions</CardTitle>
              <CardDescription>
                Manage material requisitions and allocations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Requisition No</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Job Card</TableHead>
                    <TableHead>Order No</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequisitions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-muted-foreground">
                        No requisitions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRequisitions.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell className="font-medium">{req.requisitionNo}</TableCell>
                        <TableCell>{format(new Date(req.requisitionDate), "dd MMM yyyy")}</TableCell>
                        <TableCell>
                          {req.jobCardNo ? (
                            <span className="text-blue-600">{req.jobCardNo}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{req.orderNo || "-"}</TableCell>
                        <TableCell>{req.customerName || "-"}</TableCell>
                        <TableCell>{getPriorityBadge(req.priority)}</TableCell>
                        <TableCell>{getStatusBadge(req.status)}</TableCell>
                        <TableCell>
                          {req.dueDate ? format(new Date(req.dueDate), "dd MMM yyyy") : "-"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {req.requestedBy || "-"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem>View Details</DropdownMenuItem>
                              {req.status === "Pending" && (
                                <>
                                  <DropdownMenuItem onClick={() => handleApprove(req.id)}>
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleReject(req.id)}>
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                              {req.status === "Approved" && (
                                <>
                                  <DropdownMenuItem>Allocate Materials</DropdownMenuItem>
                                  <DropdownMenuItem>View Allocated Pieces</DropdownMenuItem>
                                </>
                              )}
                              {req.status === "Issued" && (
                                <DropdownMenuItem>View Issuance History</DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>Edit</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* Create Requisition Dialog */}
      <CreateRequisitionDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={loadRequisitions}
      />
    </div>
  );
}
