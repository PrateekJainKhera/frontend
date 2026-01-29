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
import { Settings, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface AddMachineDialogProps {
  open: boolean
  onClose: () => void
}

export function AddMachineDialog({ open, onClose }: AddMachineDialogProps) {
  const [formData, setFormData] = useState({
    machineCode: '',
    machineName: '',
    type: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    location: '',
    department: '',
    status: 'Idle',
    purchaseCost: '',
    hourlyRate: '',
    notes: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.machineCode.trim()) {
      toast.error('Machine code is required')
      return
    }
    if (!formData.machineName.trim()) {
      toast.error('Machine name is required')
      return
    }
    if (!formData.type) {
      toast.error('Machine type is required')
      return
    }
    if (!formData.location.trim()) {
      toast.error('Location is required')
      return
    }

    // Simulate save
    toast.success('Machine added successfully', {
      description: `${formData.machineCode} - ${formData.machineName}`,
    })

    // Reset form
    setFormData({
      machineCode: '',
      machineName: '',
      type: '',
      manufacturer: '',
      model: '',
      serialNumber: '',
      location: '',
      department: '',
      status: 'Idle',
      purchaseCost: '',
      hourlyRate: '',
      notes: '',
    })

    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Add New Machine
          </DialogTitle>
          <DialogDescription>
            Add a new machine to the factory inventory
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="font-semibold text-sm mb-3">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="machineCode">
                    Machine Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="machineCode"
                    placeholder="e.g., LAT-001"
                    value={formData.machineCode}
                    onChange={(e) =>
                      setFormData({ ...formData, machineCode: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="machineName">
                    Machine Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="machineName"
                    placeholder="e.g., Heavy Duty Lathe #1"
                    value={formData.machineName}
                    onChange={(e) =>
                      setFormData({ ...formData, machineName: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="type">
                    Machine Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Lathe">Lathe</SelectItem>
                      <SelectItem value="CNC_Lathe">CNC Lathe</SelectItem>
                      <SelectItem value="Milling">Milling</SelectItem>
                      <SelectItem value="CNC_Mill">CNC Mill</SelectItem>
                      <SelectItem value="Drilling">Drilling</SelectItem>
                      <SelectItem value="Grinding">Grinding</SelectItem>
                      <SelectItem value="Boring">Boring</SelectItem>
                      <SelectItem value="Welding">Welding</SelectItem>
                      <SelectItem value="Cutting">Cutting</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Idle">Idle</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Breakdown">Breakdown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Manufacturer Details */}
            <div>
              <h3 className="font-semibold text-sm mb-3">Manufacturer Details</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input
                    id="manufacturer"
                    placeholder="e.g., HMT"
                    value={formData.manufacturer}
                    onChange={(e) =>
                      setFormData({ ...formData, manufacturer: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    placeholder="e.g., NH-26"
                    value={formData.model}
                    onChange={(e) =>
                      setFormData({ ...formData, model: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="serialNumber">Serial Number</Label>
                  <Input
                    id="serialNumber"
                    placeholder="e.g., HMT-NH26-2018-001"
                    value={formData.serialNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, serialNumber: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <h3 className="font-semibold text-sm mb-3">Location</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">
                    Location <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="location"
                    placeholder="e.g., Shop Floor A"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    placeholder="e.g., Turning Section"
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Financial */}
            <div>
              <h3 className="font-semibold text-sm mb-3">Financial</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="purchaseCost">Purchase Cost (₹)</Label>
                  <Input
                    id="purchaseCost"
                    type="number"
                    placeholder="e.g., 2500000"
                    value={formData.purchaseCost}
                    onChange={(e) =>
                      setFormData({ ...formData, purchaseCost: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="hourlyRate">Hourly Rate (₹)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    placeholder="e.g., 350"
                    value={formData.hourlyRate}
                    onChange={(e) =>
                      setFormData({ ...formData, hourlyRate: e.target.value })
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
                placeholder="Additional information about the machine..."
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
              Add Machine
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
