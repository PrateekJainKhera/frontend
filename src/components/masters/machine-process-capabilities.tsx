'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Plus, Pencil, Trash2, CheckCircle2, XCircle, Check, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  processMachineCapabilityService,
  ProcessMachineCapabilityResponse,
} from '@/lib/api/process-machine-capability'
import { processService, ProcessResponse } from '@/lib/api/processes'

const capabilityFormSchema = z.object({
  processId: z.number().min(1, 'Process is required'),
  setupTimeHours: z.number().min(0, 'Setup time must be 0 or greater'),
  cycleTimePerPieceHours: z.number().min(0, 'Cycle time must be 0 or greater'),
  preferenceLevel: z.number().min(1).max(5),
  efficiencyRating: z.number().min(0).max(100),
  isPreferredMachine: z.boolean(),
  maxWorkpieceLength: z.number().optional(),
  maxWorkpieceDiameter: z.number().optional(),
  maxBatchSize: z.number().optional(),
  isActive: z.boolean(),
  remarks: z.string().optional(),
})

type CapabilityFormData = z.infer<typeof capabilityFormSchema>

interface MachineProcessCapabilitiesProps {
  machineId: number
  machineName: string
}

export function MachineProcessCapabilities({
  machineId,
  machineName,
}: MachineProcessCapabilitiesProps) {
  const [capabilities, setCapabilities] = useState<ProcessMachineCapabilityResponse[]>([])
  const [processes, setProcesses] = useState<ProcessResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCapability, setEditingCapability] = useState<ProcessMachineCapabilityResponse | null>(
    null
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CapabilityFormData>({
    resolver: zodResolver(capabilityFormSchema),
    defaultValues: {
      processId: 0,
      setupTimeHours: 0,
      cycleTimePerPieceHours: 0,
      preferenceLevel: 3,
      efficiencyRating: 100,
      isPreferredMachine: false,
      isActive: true,
      remarks: '',
    },
  })

  useEffect(() => {
    loadData()
  }, [machineId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [capabilitiesData, processesData] = await Promise.all([
        processMachineCapabilityService.getByMachineId(machineId),
        processService.getActive(),
      ])
      setCapabilities(capabilitiesData)
      setProcesses(processesData)
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load process capabilities')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingCapability(null)
    form.reset({
      processId: 0,
      setupTimeHours: 0,
      cycleTimePerPieceHours: 0,
      preferenceLevel: 3,
      efficiencyRating: 100,
      isPreferredMachine: false,
      isActive: true,
      remarks: '',
    })
    setDialogOpen(true)
  }

  const handleEdit = (capability: ProcessMachineCapabilityResponse) => {
    setEditingCapability(capability)
    form.reset({
      processId: capability.processId,
      setupTimeHours: capability.setupTimeHours,
      cycleTimePerPieceHours: capability.cycleTimePerPieceHours,
      preferenceLevel: capability.preferenceLevel,
      efficiencyRating: capability.efficiencyRating,
      isPreferredMachine: capability.isPreferredMachine,
      maxWorkpieceLength: capability.maxWorkpieceLength,
      maxWorkpieceDiameter: capability.maxWorkpieceDiameter,
      maxBatchSize: capability.maxBatchSize,
      isActive: capability.isActive,
      remarks: capability.remarks || '',
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this capability?')) return

    const loadingToast = toast.loading('Deleting capability...')
    try {
      await processMachineCapabilityService.delete(id)
      toast.dismiss(loadingToast)
      toast.success('Capability deleted successfully')
      await loadData()
    } catch (error) {
      toast.dismiss(loadingToast)
      const message = error instanceof Error ? error.message : 'Failed to delete capability'
      toast.error(message)
    }
  }

  const onSubmit = async (data: CapabilityFormData) => {
    setIsSubmitting(true)
    const loadingToast = toast.loading(
      editingCapability ? 'Updating capability...' : 'Adding capability...'
    )

    try {
      if (editingCapability) {
        await processMachineCapabilityService.update(editingCapability.id, {
          ...data,
          id: editingCapability.id,
          machineId,
          updatedBy: 'Admin',
        })
        toast.dismiss(loadingToast)
        toast.success('Capability updated successfully')
      } else {
        await processMachineCapabilityService.create({
          ...data,
          machineId,
          createdBy: 'Admin',
        })
        toast.dismiss(loadingToast)
        toast.success('Capability added successfully')
      }

      setDialogOpen(false)
      await loadData()
    } catch (error) {
      toast.dismiss(loadingToast)
      const message = error instanceof Error ? error.message : 'Failed to save capability'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading capabilities...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Process Capabilities</h3>
          <p className="text-sm text-muted-foreground">
            Manage which processes {machineName} can perform
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Capability
        </Button>
      </div>

      {capabilities.length === 0 ? (
        <div className="text-center py-8 border rounded-lg">
          <p className="text-muted-foreground">No process capabilities defined yet</p>
          <Button onClick={handleAdd} variant="outline" className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Add First Capability
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Process</TableHead>
                <TableHead>Setup Time (hrs)</TableHead>
                <TableHead>Cycle Time (hrs)</TableHead>
                <TableHead>Preference</TableHead>
                <TableHead>Efficiency</TableHead>
                <TableHead>Preferred</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {capabilities.map((capability) => (
                <TableRow key={capability.id}>
                  <TableCell className="font-medium">{capability.processName}</TableCell>
                  <TableCell>{capability.setupTimeHours}</TableCell>
                  <TableCell>{capability.cycleTimePerPieceHours}</TableCell>
                  <TableCell>
                    <Badge variant="outline">Level {capability.preferenceLevel}</Badge>
                  </TableCell>
                  <TableCell>{capability.efficiencyRating}%</TableCell>
                  <TableCell>
                    {capability.isPreferredMachine ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell>
                    {capability.isActive ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(capability)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(capability.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCapability ? 'Edit Process Capability' : 'Add Process Capability'}
            </DialogTitle>
            <DialogDescription>
              Configure how {machineName} can perform this process
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Process Selection - Searchable Combobox */}
                <FormField
                  control={form.control}
                  name="processId"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Process *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              disabled={!!editingCapability}
                              className={cn(
                                'w-full justify-between',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value > 0
                                ? processes.find((process) => process.id === field.value)
                                    ?.processName || 'Select a process'
                                : 'Select a process'}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search process..." />
                            <CommandEmpty>No process found.</CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-auto">
                              {processes.map((process) => (
                                <CommandItem
                                  key={process.id}
                                  value={`${process.processName} ${process.category}`}
                                  onSelect={() => {
                                    field.onChange(process.id)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      field.value === process.id ? 'opacity-100' : 'opacity-0'
                                    )}
                                  />
                                  {process.processName} ({process.category})
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Setup Time */}
                <FormField
                  control={form.control}
                  name="setupTimeHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Setup Time (hours) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.5"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Cycle Time */}
                <FormField
                  control={form.control}
                  name="cycleTimePerPieceHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cycle Time per Piece (hours) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.001"
                          placeholder="0.1"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Preference Level */}
                <FormField
                  control={form.control}
                  name="preferenceLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preference Level *</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">1 - Best Choice</SelectItem>
                          <SelectItem value="2">2 - Preferred</SelectItem>
                          <SelectItem value="3">3 - Standard</SelectItem>
                          <SelectItem value="4">4 - Alternative</SelectItem>
                          <SelectItem value="5">5 - Last Resort</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>1 = Best, 5 = Last Resort</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Efficiency Rating */}
                <FormField
                  control={form.control}
                  name="efficiencyRating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Efficiency Rating (%) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="100"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Max Workpiece Length */}
                <FormField
                  control={form.control}
                  name="maxWorkpieceLength"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Workpiece Length (mm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="500"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) =>
                            field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Max Workpiece Diameter */}
                <FormField
                  control={form.control}
                  name="maxWorkpieceDiameter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Workpiece Diameter (mm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="200"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) =>
                            field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Max Batch Size */}
                <FormField
                  control={form.control}
                  name="maxBatchSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Batch Size</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="100"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) =>
                            field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Remarks */}
                <FormField
                  control={form.control}
                  name="remarks"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Remarks</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Additional notes..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Is Preferred Machine */}
                <FormField
                  control={form.control}
                  name="isPreferredMachine"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Preferred Machine</FormLabel>
                        <FormDescription>This is the preferred machine for this process</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Is Active */}
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>Capability is active and can be scheduled</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? editingCapability
                      ? 'Updating...'
                      : 'Adding...'
                    : editingCapability
                    ? 'Update Capability'
                    : 'Add Capability'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
