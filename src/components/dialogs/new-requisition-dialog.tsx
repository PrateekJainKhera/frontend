'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FileText, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface NewRequisitionDialogProps {
  open: boolean
  onClose: () => void
}

export function NewRequisitionDialog({ open, onClose }: NewRequisitionDialogProps) {
  const [formData, setFormData] = useState({
    jobCardNo: '',
    orderNo: '',
    materialName: '',
    materialGrade: '',
    materialType: 'rod',
    diameter: '',
    length: '',
    quantity: '',
    priority: 'Medium',
    dueDate: '',
    notes: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.jobCardNo.trim()) {
      toast.error('Job Card Number is required')
      return
    }
    if (!formData.materialName.trim()) {
      toast.error('Material Name is required')
      return
    }
    if (!formData.materialGrade.trim()) {
      toast.error('Material Grade is required')
      return
    }
    if (!formData.quantity || Number(formData.quantity) <= 0) {
      toast.error('Valid quantity is required')
      return
    }
    if (!formData.dueDate) {
      toast.error('Due date is required')
      return
    }

    // Simulate save
    const requisitionNo = `MR/2024-25/${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`

    toast.success('Material requisition created successfully', {
      description: `${requisitionNo} for ${formData.jobCardNo}`,
    })

    // Reset form
    setFormData({
      jobCardNo: '',
      orderNo: '',
      materialName: '',
      materialGrade: '',
      materialType: 'rod',
      diameter: '',
      length: '',
      quantity: '',
      priority: 'Medium',
      dueDate: '',
      notes: '',
    })

    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            New Material Requisition
          </DialogTitle>
          <DialogDescription>
            Create a material requisition for a job card
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Job Card Information */}
            <div>
              <h3 className="font-semibold text-sm mb-3">Job Card Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="jobCardNo">
                    Job Card No <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="jobCardNo"
                    placeholder="e.g., JC/2024-25/001"
                    value={formData.jobCardNo}
                    onChange={(e) =>
                      setFormData({ ...formData, jobCardNo: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="orderNo">Order No</Label>
                  <Input
                    id="orderNo"
                    placeholder="e.g., SO/2024-25/001"
                    value={formData.orderNo}
                    onChange={(e) =>
                      setFormData({ ...formData, orderNo: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Material Details */}
            <div>
              <h3 className="font-semibold text-sm mb-3">Material Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="materialName">
                    Material Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="materialName"
                    placeholder="e.g., Mild Steel Rod"
                    value={formData.materialName}
                    onChange={(e) =>
                      setFormData({ ...formData, materialName: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="materialGrade">
                    Material Grade <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="materialGrade"
                    placeholder="e.g., EN8"
                    value={formData.materialGrade}
                    onChange={(e) =>
                      setFormData({ ...formData, materialGrade: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="materialType">Material Type</Label>
                  <Select
                    value={formData.materialType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, materialType: value })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rod">Rod</SelectItem>
                      <SelectItem value="pipe">Pipe</SelectItem>
                      <SelectItem value="sheet">Sheet</SelectItem>
                      <SelectItem value="plate">Plate</SelectItem>
                      <SelectItem value="coil">Coil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="diameter">
                    Diameter (mm) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="diameter"
                    type="number"
                    placeholder="e.g., 50"
                    value={formData.diameter}
                    onChange={(e) =>
                      setFormData({ ...formData, diameter: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="length">
                    Required Length per piece (mm) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="length"
                    type="number"
                    placeholder="e.g., 6000"
                    value={formData.length}
                    onChange={(e) =>
                      setFormData({ ...formData, length: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="quantity">
                    Quantity (pieces) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="e.g., 10"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Priority and Due Date */}
            <div>
              <h3 className="font-semibold text-sm mb-3">Priority & Timeline</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) =>
                      setFormData({ ...formData, priority: value })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dueDate">
                    Due Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any special instructions or remarks..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Create Requisition
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
