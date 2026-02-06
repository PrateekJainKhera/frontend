"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { materialRequisitionService, CreateMaterialRequisitionRequest } from "@/lib/api/material-requisitions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CreateRequisitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateRequisitionDialog({ open, onOpenChange, onSuccess }: CreateRequisitionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateMaterialRequisitionRequest>({
    requisitionNo: "",
    requisitionDate: new Date().toISOString().split('T')[0],
    jobCardNo: "",
    orderNo: "",
    customerName: "",
    priority: "Medium",
    dueDate: "",
    requestedBy: "",
    remarks: "",
    createdBy: "Current User",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.requisitionNo) {
      toast.error("Requisition number is required");
      return;
    }

    if (!formData.requisitionDate) {
      toast.error("Requisition date is required");
      return;
    }

    try {
      setLoading(true);

      // Convert dates to ISO format for API
      const requestData: CreateMaterialRequisitionRequest = {
        ...formData,
        requisitionDate: new Date(formData.requisitionDate).toISOString(),
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
        // Only include job card and order info if provided
        jobCardNo: formData.jobCardNo || undefined,
        orderNo: formData.orderNo || undefined,
        customerName: formData.customerName || undefined,
        requestedBy: formData.requestedBy || undefined,
        remarks: formData.remarks || undefined,
      };

      await materialRequisitionService.create(requestData);
      toast.success("Material requisition created successfully");

      // Reset form
      setFormData({
        requisitionNo: "",
        requisitionDate: new Date().toISOString().split('T')[0],
        jobCardNo: "",
        orderNo: "",
        customerName: "",
        priority: "Medium",
        dueDate: "",
        requestedBy: "",
        remarks: "",
        createdBy: "Current User",
      });

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create requisition");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreateMaterialRequisitionRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Material Requisition</DialogTitle>
          <DialogDescription>
            Create a new material requisition for production or maintenance
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Requisition Number */}
            <div className="space-y-2">
              <Label htmlFor="requisitionNo">
                Requisition No <span className="text-red-500">*</span>
              </Label>
              <Input
                id="requisitionNo"
                value={formData.requisitionNo}
                onChange={(e) => handleChange("requisitionNo", e.target.value)}
                placeholder="REQ-2024-001"
                required
              />
            </div>

            {/* Requisition Date */}
            <div className="space-y-2">
              <Label htmlFor="requisitionDate">
                Requisition Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="requisitionDate"
                type="date"
                value={formData.requisitionDate}
                onChange={(e) => handleChange("requisitionDate", e.target.value)}
                required
              />
            </div>

            {/* Job Card No (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="jobCardNo">Job Card No</Label>
              <Input
                id="jobCardNo"
                value={formData.jobCardNo}
                onChange={(e) => handleChange("jobCardNo", e.target.value)}
                placeholder="JC-2024-001 (optional)"
              />
              <p className="text-xs text-muted-foreground">
                Link to a job card from planning
              </p>
            </div>

            {/* Order No (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="orderNo">Order No</Label>
              <Input
                id="orderNo"
                value={formData.orderNo}
                onChange={(e) => handleChange("orderNo", e.target.value)}
                placeholder="ORD-2024-001 (optional)"
              />
            </div>

            {/* Customer Name (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => handleChange("customerName", e.target.value)}
                placeholder="Customer name (optional)"
              />
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleChange("priority", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Due Date (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleChange("dueDate", e.target.value)}
              />
            </div>

            {/* Requested By */}
            <div className="space-y-2">
              <Label htmlFor="requestedBy">Requested By</Label>
              <Input
                id="requestedBy"
                value={formData.requestedBy}
                onChange={(e) => handleChange("requestedBy", e.target.value)}
                placeholder="Your name"
              />
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              value={formData.remarks}
              onChange={(e) => handleChange("remarks", e.target.value)}
              placeholder="Additional notes or instructions..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Requisition
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
