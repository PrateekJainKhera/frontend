"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Process } from '@/types'
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
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { simulateApiCall } from '@/lib/utils/mock-api'

const formSchema = z.object({
  processCode: z.string().min(2, 'Process code must be at least 2 characters'),
  processName: z.string().min(2, 'Process name must be at least 2 characters'),
  category: z.string().min(1, 'Category is required'),
  defaultMachine: z.string().optional(),
  standardTimeMin: z.number().positive('Standard time must be positive'),
  skillRequired: z.string().min(1, 'Skill level is required'),
  isOutsourced: z.boolean(),
})

type FormData = z.infer<typeof formSchema>

interface EditProcessDialogProps {
  process: Process
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditProcessDialog({
  process,
  open,
  onOpenChange,
  onSuccess,
}: EditProcessDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      processCode: process.processCode,
      processName: process.processName,
      category: process.category,
      defaultMachine: process.defaultMachine || '',
      standardTimeMin: process.standardTimeMin,
      skillRequired: process.skillRequired,
      isOutsourced: process.isOutsourced,
    },
  })

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      await simulateApiCall({ ...process, ...data }, 1000)
      toast.success('Process updated successfully')
      onSuccess()
    } catch (error) {
      toast.error('Failed to update process')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Process</DialogTitle>
          <DialogDescription>
            Update process information. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="processCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Process Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., PROC-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="processName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Process Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter process name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Machining, Finishing" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="skillRequired"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skill Required *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Basic, Expert" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="defaultMachine"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Machine</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter default machine" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Optional: Preferred machine for this process
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="standardTimeMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Standard Time (minutes) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Enter time in minutes"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isOutsourced"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Outsourced Process</FormLabel>
                    <FormDescription>
                      Enable if this process is handled by external vendor/contractor
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
