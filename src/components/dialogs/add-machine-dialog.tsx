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
import { machineService } from '@/lib/api/machines'

interface AddMachineDialogProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AddMachineDialog({ open, onClose, onSuccess }: AddMachineDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    machineName: '',
    type: '',
    location: '',
    department: '',
    status: 'Idle',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

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

    setIsSubmitting(true)
    try {
      await machineService.create({
        machineName: formData.machineName,
        machineType: formData.type,
        location: formData.location,
        department: formData.department || undefined,
        status: formData.status,
        notes: formData.notes || undefined,
      })

      toast.success('Machine added successfully', {
        description: `Machine: ${formData.machineName}`,
      })

      setFormData({
        machineName: '',
        type: '',
        location: '',
        department: '',
        status: 'Idle',
        notes: '',
      })

      onClose()
      onSuccess?.()
    } catch (err) {
      toast.error((err as Error).message || 'Failed to add machine')
    } finally {
      setIsSubmitting(false)
    }
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
            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Machine
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
