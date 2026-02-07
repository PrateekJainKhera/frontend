"use client"

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Check, ChevronsUpDown } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ProcessCategory } from '@/types/enums'
import { toast } from 'sonner'
import { processService } from '@/lib/api/processes'
import { machineService, MachineResponse } from '@/lib/api/machines'
import { cn } from '@/lib/utils'

const formSchema = z.object({
  processName: z.string().min(2, 'Process name is required'),
  category: z.nativeEnum(ProcessCategory, { message: 'Category is required' }),
  defaultMachine: z.string().optional(),
  defaultMachineId: z.number().optional(),
  defaultSetupTimeHours: z.number().min(0, 'Setup time cannot be negative').optional(),
  defaultCycleTimePerPieceHours: z.number().min(0, 'Cycle time cannot be negative').optional(),
  standardTimeMin: z.number().min(0, 'Setup time cannot be negative'),
  restTimeHours: z.number().min(0, 'Rest time cannot be negative').optional(),
  description: z.string().optional(),
  isOutsourced: z.boolean(),
})

type FormData = z.infer<typeof formSchema>

interface AddProcessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AddProcessDialog({ open, onOpenChange, onSuccess }: AddProcessDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [machines, setMachines] = useState<MachineResponse[]>([])
  const [machinesLoading, setMachinesLoading] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      processName: '',
      defaultMachine: '',
      description: '',
      standardTimeMin: 0,
      restTimeHours: 0,
      defaultSetupTimeHours: 0.5,
      defaultCycleTimePerPieceHours: 0.1,
      isOutsourced: false,
    },
  })

  // Load machines when dialog opens
  useEffect(() => {
    if (open) {
      loadMachines()
    }
  }, [open])

  const loadMachines = async () => {
    setMachinesLoading(true)
    try {
      const data = await machineService.getAll()
      setMachines(data.filter(m => m.isActive))
    } catch (error) {
      console.error('Failed to load machines:', error)
      toast.error('Failed to load machines')
    } finally {
      setMachinesLoading(false)
    }
  }

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)

    try {
      await processService.create({
        processName: data.processName,
        category: data.category,
        defaultMachine: data.defaultMachine || null,
        defaultMachineId: data.defaultMachineId || null,
        defaultSetupTimeHours: data.defaultSetupTimeHours || 0.5,
        defaultCycleTimePerPieceHours: data.defaultCycleTimePerPieceHours || 0.1,
        standardSetupTimeMin: data.standardTimeMin,
        restTimeHours: data.restTimeHours || 0,
        description: data.description || null,
        isOutsourced: data.isOutsourced,
        isActive: true,
        createdBy: 'Admin'
      })

      toast.success('Process added successfully!')
      onOpenChange(false)
      form.reset()

      // Refresh parent data
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('Failed to create process:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create process')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Process</DialogTitle>
          <DialogDescription>
            Add a new manufacturing process. Process code will be auto-generated.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="processName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Process Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., CNC Turning" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(ProcessCategory).map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="defaultMachineId"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Default Machine</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            disabled={machinesLoading}
                            className={cn(
                              'w-full justify-between',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value && field.value > 0
                              ? machines.find((machine) => machine.id === field.value)
                                  ?.machineName || 'Select machine'
                              : machinesLoading ? 'Loading machines...' : 'Select machine'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search machine..." />
                          <CommandEmpty>No machine found.</CommandEmpty>
                          <CommandGroup className="max-h-64 overflow-auto">
                            {machines.map((machine) => (
                              <CommandItem
                                key={machine.id}
                                value={`${machine.machineName} ${machine.machineCode}`}
                                onSelect={() => {
                                  field.onChange(machine.id)
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    field.value === machine.id ? 'opacity-100' : 'opacity-0'
                                  )}
                                />
                                {machine.machineName} ({machine.machineCode})
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

              <FormField
                control={form.control}
                name="defaultSetupTimeHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Setup Time (hours)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="0.5"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="defaultCycleTimePerPieceHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Cycle Time/Piece (hours)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.1"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="standardTimeMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Setup Time (minutes) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="1"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="restTimeHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rest Time (hours)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isOutsourced"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Outsourced Process
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        This process is handled by external vendors
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter process description..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add Process'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
