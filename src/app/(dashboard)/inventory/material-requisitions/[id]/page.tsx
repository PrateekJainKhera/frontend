"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Calendar, User, Package, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { materialRequisitionService, MaterialRequisitionResponse, MaterialRequisitionItemResponse } from "@/lib/api/material-requisitions";
import { toast } from "sonner";
import { format } from "date-fns";

export default function MaterialRequisitionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requisitionId = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [requisition, setRequisition] = useState<MaterialRequisitionResponse | null>(null);
  const [items, setItems] = useState<MaterialRequisitionItemResponse[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

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
            <>
              <Button
                onClick={handleApprove}
                disabled={actionLoading}
                className="gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Approve
              </Button>
              <Button
                onClick={handleReject}
                disabled={actionLoading}
                variant="destructive"
                className="gap-2"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </Button>
            </>
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
            List of materials required with job card and child part details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Line</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Required Qty</TableHead>
                <TableHead>UOM</TableHead>
                <TableHead>Job Card</TableHead>
                <TableHead>Process</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    No items found. Items will be loaded once API endpoint is available.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.lineNo}</TableCell>
                    <TableCell>
                      <div className="font-medium">{item.materialName || "-"}</div>
                      <div className="text-xs text-muted-foreground">{item.materialCode || ""}</div>
                    </TableCell>
                    <TableCell className="text-sm">{item.materialGrade || "-"}</TableCell>
                    <TableCell className="font-medium">{item.quantityRequired}</TableCell>
                    <TableCell>{item.uom || "-"}</TableCell>
                    <TableCell>
                      {item.jobCardNo ? (
                        <span className="text-sm font-medium text-blue-600">{item.jobCardNo}</span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{item.processName || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={item.status === "Pending" ? "secondary" : "default"}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                      {item.remarks || "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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
