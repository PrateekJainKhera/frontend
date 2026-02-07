'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { machineService, MachineResponse } from '@/lib/api/machines'

const formSchema = z.object({
  machineName: z.string().min(2, 'Machine name must be at least 2 characters'),
  machineType: z.string().optional(),
  location: z.string().optional(),
  department: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean(),
})

type FormData = z.infer<typeof formSchema>

interface MachineBasicInfoFormProps {
  machine: MachineResponse
  onSuccess: () => void
}

export function MachineBasicInfoForm({ machine, onSuccess }: MachineBasicInfoFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      machineName: machine.machineName,
      machineType: machine.machineType || '',
      location: machine.location || '',
      department: machine.department || '',
      status: machine.status || 'Available',
      notes: machine.notes || '',
      isActive: machine.isActive,
    },
  })

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    const loadingToast = toast.loading('Updating machine...')

    try {
      await machineService.update(machine.id, {
        id: machine.id,
        machineName: data.machineName,
        machineType: data.machineType || '',
        location: data.location || '',
        department: data.department,
        status: data.status,
        notes: data.notes,
        isActive: data.isActive,
      })

      toast.dismiss(loadingToast)
      toast.success('Machine updated successfully')
      onSuccess()
    } catch (error) {
      toast.dismiss(loadingToast)
      const message = error instanceof Error ? error.message : 'Failed to update machine'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Machine Code (Read-only) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Machine Code</label>
            <Input value={machine.machineCode} disabled className="bg-muted" />
          </div>

          {/* Machine Name */}
          <FormField
            control={form.control}
            name="machineName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Machine Name *</FormLabel>
                <FormControl>
                  <Input placeholder="CNC Machine 01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Machine Type */}
          <FormField
            control={form.control}
            name="machineType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Machine Type</FormLabel>
                <FormControl>
                  <Input placeholder="CNC Lathe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="In Use">In Use</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                    <SelectItem value="Under Repair">Under Repair</SelectItem>
                    <SelectItem value="Out of Service">Out of Service</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Location */}
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="Shop Floor A" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Department */}
          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <FormControl>
                  <Input placeholder="Production" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Notes */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Additional notes about this machine..."
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Is Active */}
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="md:col-span-2 flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Active</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Inactive machines will not be available for scheduling
                  </p>
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
