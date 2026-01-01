"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Order } from '@/types'
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
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { simulateApiCall } from '@/lib/utils/mock-api'
import { format } from 'date-fns'
import { AlertCircle } from 'lucide-react'

const formSchema = z.object({
  newDueDate: z.string().min(1, 'New due date is required'),
  reason: z.string().min(1, 'Reason is required'),
  customReason: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface RescheduleOrderDialogProps {
  order: Order
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const RESCHEDULE_REASONS = [
  'Material Shortage',
  'Machine Breakdown',
  'Customer Request',
  'Capacity Overload',
  'Quality Issue',
  'Power Outage',
  'Other',
]

export function RescheduleOrderDialog({
  order,
  open,
  onOpenChange,
  onSuccess,
}: RescheduleOrderDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCustomReason, setShowCustomReason] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newDueDate: format(order.dueDate, 'yyyy-MM-dd'),
      reason: '',
      customReason: '',
      notes: '',
    },
  })

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      const finalReason = data.reason === 'Other' ? data.customReason : data.reason

      const rescheduleData = {
        id: `rsch-${Date.now()}`,
        orderId: order.id,
        oldDueDate: order.dueDate,
        newDueDate: data.newDueDate,
        reason: finalReason || data.reason,
        rescheduledBy: 'user-current',
        rescheduledByName: 'Current User',
        rescheduledAt: new Date(),
      }

      await simulateApiCall(rescheduleData, 1000)

      toast.success('Order rescheduled successfully')
      form.reset()
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to reschedule order')
    } finally {
      setIsSubmitting(false)
    }
  }

  const currentDueDate = order.adjustedDueDate || order.dueDate
  const newDueDate = form.watch('newDueDate')
  const selectedReason = form.watch('reason')

  const daysDifference = newDueDate
    ? Math.ceil((new Date(newDueDate).getTime() - currentDueDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Reschedule Order</DialogTitle>
          <DialogDescription>
            Update the due date for order {order.orderNo}
          </DialogDescription>
        </DialogHeader>

        {!order.canReschedule && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This order cannot be rescheduled because production has already started (job cards are active).
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Current Due Date Display */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Current Due Date</p>
                  <p className="text-lg font-semibold">
                    {format(currentDueDate, 'PPP')}
                  </p>
                </div>
                {daysDifference !== 0 && newDueDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Change</p>
                    <p className={`text-lg font-semibold ${daysDifference > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                      {daysDifference > 0 ? '+' : ''}{daysDifference} days
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* New Due Date */}
            <FormField
              control={form.control}
              name="newDueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Due Date *</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reason Dropdown */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason *</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value)
                      setShowCustomReason(value === 'Other')
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select reason for rescheduling" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {RESCHEDULE_REASONS.map((reason) => (
                        <SelectItem key={reason} value={reason}>
                          {reason}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Custom Reason (if Other is selected) */}
            {showCustomReason && (
              <FormField
                control={form.control}
                name="customReason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specify Reason *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter custom reason" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Additional Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional information about this reschedule..."
                      className="min-h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Warning for significant delays */}
            {daysDifference > 2 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This reschedule extends the due date by more than 2 days. Customer notification may be required.
                </AlertDescription>
              </Alert>
            )}

            {/* Reschedule History */}
            {order.rescheduleHistory && order.rescheduleHistory.length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="text-sm font-semibold mb-3">Reschedule History</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {order.rescheduleHistory.map((history) => (
                    <div key={history.id} className="p-3 bg-muted rounded text-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{history.reason}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(history.oldDueDate, 'PP')} → {format(history.newDueDate, 'PP')}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground text-right">
                          <p>{history.rescheduledByName}</p>
                          <p>{format(history.rescheduledAt, 'PP')}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !order.canReschedule}>
                {isSubmitting ? 'Rescheduling...' : 'Reschedule Order'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
