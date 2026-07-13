'use client'
import { getCurrentUserName } from '@/lib/auth'

import { useState, useEffect } from 'react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Settings, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { machineService } from '@/lib/api/machines'
import { processCategoryService } from '@/lib/api/process-categories'
import { machineTypeService, MachineTypeResponse } from '@/lib/api/machine-types'
import { ProcessCategory } from '@/types/process-category'

interface AddMachineDialogProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AddMachineDialog({ open, onClose, onSuccess }: AddMachineDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [processCategories, setProcessCategories] = useState<ProcessCategory[]>([])
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([])
  const [machineTypes, setMachineTypes] = useState<MachineTypeResponse[]>([])
  const [showAddTypeDialog, setShowAddTypeDialog] = useState(false)
  const [newTypeName, setNewTypeName] = useState('')
  const [isAddingType, setIsAddingType] = useState(false)
  const [formData, setFormData] = useState({
    machineName: '',
    type: '',
    location: '',
    department: '',
    status: 'Idle',
    notes: '',
    dailyCapacityHours: 8.0,
    maxLengthMM: '' as string | number,
  })

  useEffect(() => {
    if (open) {
      processCategoryService.getAll()
        .then(categories => setProcessCategories(categories.filter(c => c.isActive)))
        .catch(error => console.error('Failed to load process categories:', error))
      machineTypeService.getAll()
        .then(setMachineTypes)
        .catch(error => console.error('Failed to load machine types:', error))
    }
  }, [open])

  const handleAddType = async () => {
    if (!newTypeName.trim()) {
      toast.error('Type name is required')
      return
    }
    setIsAddingType(true)
    try {
      await machineTypeService.create({ name: newTypeName.trim(), createdBy: getCurrentUserName() })
      toast.success(`Machine type '${newTypeName.trim()}' added`)
      const updated = await machineTypeService.getAll()
      setMachineTypes(updated)
      setFormData(prev => ({ ...prev, type: newTypeName.trim() }))
      setNewTypeName('')
      setShowAddTypeDialog(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add machine type')
    } finally {
      setIsAddingType(false)
    }
  }

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
        dailyCapacityHours: formData.dailyCapacityHours,
        maxLengthMM: formData.maxLengthMM !== '' ? Number(formData.maxLengthMM) : undefined,
        processCategoryIds: selectedCategoryIds,
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
        dailyCapacityHours: 8.0,
        maxLengthMM: '',
      })
      setSelectedCategoryIds([])

      onClose()
      onSuccess?.()
    } catch (err) {
      toast.error((err as Error).message || 'Failed to add machine')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
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
                  <div className="flex gap-2 mt-1">
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {machineTypes.map((t) => (
                          <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowAddTypeDialog(true)}
                      title="Add new machine type"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
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

            {/* Capacity & Categories */}
            <div>
              <h3 className="font-semibold text-sm mb-3">Capacity & Process Categories</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="dailyCapacity">
                    Daily Capacity (Hours) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="dailyCapacity"
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="24"
                    placeholder="e.g., 8.0"
                    value={formData.dailyCapacityHours}
                    onChange={(e) =>
                      setFormData({ ...formData, dailyCapacityHours: parseFloat(e.target.value) || 8.0 })
                    }
                    className="mt-1 max-w-xs"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Available working hours per day for this machine
                  </p>
                </div>

                <div>
                  <Label htmlFor="maxLengthMM">Max Material Length (mm)</Label>
                  <Input
                    id="maxLengthMM"
                    type="number"
                    step="any"
                    min="0"
                    placeholder="e.g., 3000 (leave blank if no limit)"
                    value={formData.maxLengthMM}
                    onChange={(e) =>
                      setFormData({ ...formData, maxLengthMM: e.target.value })
                    }
                    className="mt-1 max-w-xs"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum length of material this machine can process (optional)
                  </p>
                </div>

                <div>
                  <Label>Process Categories</Label>
                  <div className="mt-2 grid grid-cols-2 gap-3 max-h-48 overflow-y-auto border rounded-md p-3">
                    {processCategories.length === 0 ? (
                      <p className="text-sm text-muted-foreground col-span-2">
                        No process categories available
                      </p>
                    ) : (
                      processCategories.map((category) => (
                        <div key={category.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`category-${category.id}`}
                            checked={selectedCategoryIds.includes(category.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedCategoryIds([...selectedCategoryIds, category.id])
                              } else {
                                setSelectedCategoryIds(
                                  selectedCategoryIds.filter((id) => id !== category.id)
                                )
                              }
                            }}
                          />
                          <Label
                            htmlFor={`category-${category.id}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {category.categoryName}
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select the process categories this machine can handle
                  </p>
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

    {/* Quick Add Machine Type Dialog */}
    <Dialog open={showAddTypeDialog} onOpenChange={setShowAddTypeDialog}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle>Add Machine Type</DialogTitle>
          <DialogDescription>Enter a name for the new machine type</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="newTypeName">Type Name *</Label>
            <Input
              id="newTypeName"
              placeholder="e.g., CNC Lathe"
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleAddType()
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => { setShowAddTypeDialog(false); setNewTypeName('') }}
            disabled={isAddingType}
          >
            Cancel
          </Button>
          <Button onClick={handleAddType} disabled={isAddingType || !newTypeName.trim()}>
            {isAddingType ? 'Adding...' : 'Add Type'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  )
}
