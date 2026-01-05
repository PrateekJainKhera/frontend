"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Factory, AlertCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { mockOrders, mockProcesses } from '@/lib/mock-data'
import { JobCardCreationType, JobCardStatus, Priority } from '@/types'
import { simulateApiCall } from '@/lib/utils/mock-api'
import { toast } from 'sonner'

const formSchema = z.object({
  creationType: z.enum(['AUTO_GENERATED', 'MANUAL', 'REWORK']),
  orderId: z.string().optional(),
  orderNo: z.string().optional(),
  processId: z.string().min(1, 'Process is required'),
  processName: z.string(),
  stepNo: z.number().min(1, 'Step number must be at least 1'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']),
  assignedMachineId: z.string().optional(),
  assignedMachineName: z.string().optional(),
  scheduledStartTime: z.date().optional(),
  workInstructions: z.string().optional(),
  qualityCheckpoints: z.string().optional(),
  specialNotes: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

export default function CreateJobCardPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<typeof mockOrders[0] | null>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      creationType: 'MANUAL',
      stepNo: 1,
      quantity: 1,
      priority: 'Medium',
    },
  })

  const creationType = form.watch('creationType')
  const orderId = form.watch('orderId')
  const processId = form.watch('processId')

  // Update selected order when orderId changes
  const handleOrderChange = (orderId: string) => {
    const order = mockOrders.find(o => o.id === orderId)
    setSelectedOrder(order || null)

    if (order) {
      form.setValue('orderNo', order.orderNo)
      form.setValue('quantity', order.quantity)
      form.setValue('priority', order.priority as Priority)
    }
  }

  // Update process name when process changes
  const handleProcessChange = (processId: string) => {
    const process = mockProcesses.find(p => p.id === processId)
    if (process) {
      form.setValue('processName', process.processName)
    }
  }

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true)
      toast.loading('Creating job card...')

      // Generate job card number
      const timestamp = Date.now()
      const jobCardNo = data.creationType === 'MANUAL'
        ? `JC-${timestamp}`
        : data.orderNo
        ? `JC-${data.orderNo}-${data.stepNo}`
        : `JC-${timestamp}`

      const jobCardData = {
        id: `jc-${timestamp}`,
        jobCardNo,
        creationType: data.creationType,
        orderId: data.orderId || null,
        orderNo: data.orderNo || null,
        processId: data.processId,
        processName: data.processName,
        stepNo: data.stepNo,
        quantity: data.quantity,
        completedQty: 0,
        rejectedQty: 0,
        reworkQty: 0,
        inProgressQty: 0,
        status: JobCardStatus.READY,
        priority: data.priority,
        assignedMachineId: data.assignedMachineId || null,
        assignedMachineName: data.assignedMachineName || null,
        dependsOnJobCardIds: [],
        blockedBy: [],
        customerName: selectedOrder?.customer?.name || 'N/A',
        customerCode: selectedOrder?.customer?.code || 'N/A',
        productName: selectedOrder?.product?.modelName || 'N/A',
        productCode: selectedOrder?.product?.partCode || 'N/A',
        workInstructions: data.workInstructions,
        qualityCheckpoints: data.qualityCheckpoints,
        specialNotes: data.specialNotes,
        scheduledStartTime: data.scheduledStartTime || null,
        actualStartTime: null,
        actualEndTime: null,
        estimatedSetupTimeMin: 15,
        estimatedCycleTimeMin: 30,
        estimatedTotalTimeMin: 15 + (30 * data.quantity),
        actualSetupTimeMin: null,
        actualCycleTimeMin: null,
        actualTotalTimeMin: null,
        allocatedMaterials: [],
        createdAt: new Date(),
        createdBy: 'user',
        updatedAt: new Date(),
        updatedBy: 'user',
      }

      // Simulate API call
      await simulateApiCall(jobCardData, 1500)

      toast.dismiss()
      toast.success(`Job card created successfully: ${jobCardNo}`)

      // Redirect to job cards list
      router.push('/production/job-cards')
    } catch (error) {
      toast.dismiss()
      toast.error('Failed to create job card')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/production/job-cards">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Job Card</h1>
          <p className="text-muted-foreground">Create a manual job card for production</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Job Card Type */}
              <Card>
                <CardHeader>
                  <CardTitle>Job Card Type</CardTitle>
                  <CardDescription>Select the type of job card to create</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="creationType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Creation Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="MANUAL">
                              <div className="flex flex-col items-start">
                                <span className="font-medium">Manual Job Card</span>
                                <span className="text-xs text-muted-foreground">For custom or ad-hoc jobs</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="REWORK">
                              <div className="flex flex-col items-start">
                                <span className="font-medium">Rework Job Card</span>
                                <span className="text-xs text-muted-foreground">For rework or correction jobs</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="AUTO_GENERATED">
                              <div className="flex flex-col items-start">
                                <span className="font-medium">Order-based Job Card</span>
                                <span className="text-xs text-muted-foreground">Linked to an order</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {creationType === 'AUTO_GENERATED' && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        For order-based job cards, it's recommended to use the "Generate Job Cards" feature from the order detail page for automatic creation with dependencies.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Order Selection (if order-based) */}
              {(creationType === 'AUTO_GENERATED' || creationType === 'REWORK') && (
                <Card>
                  <CardHeader>
                    <CardTitle>Order Details</CardTitle>
                    <CardDescription>Link this job card to an order</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="orderId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Order {creationType === 'AUTO_GENERATED' ? '*' : ''}</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value)
                              handleOrderChange(value)
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select order" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {mockOrders.map((order) => (
                                <SelectItem key={order.id} value={order.id}>
                                  <div className="flex flex-col items-start">
                                    <span className="font-medium">{order.orderNo}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {order.customer?.name} - {order.product?.modelName} ({order.quantity} units)
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {selectedOrder && (
                      <div className="rounded-lg border p-4 space-y-2 bg-muted/50">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Customer</p>
                            <p className="font-medium">{selectedOrder.customer?.name}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Product</p>
                            <p className="font-medium">{selectedOrder.product?.modelName}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Quantity</p>
                            <p className="font-medium">{selectedOrder.quantity} units</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Priority</p>
                            <Badge variant={selectedOrder.priority === 'Urgent' ? 'destructive' : 'outline'}>
                              {selectedOrder.priority}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Process Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Process Configuration</CardTitle>
                  <CardDescription>Define the production process for this job card</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="processId"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Process *</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value)
                              handleProcessChange(value)
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select process" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {mockProcesses.map((process) => (
                                <SelectItem key={process.id} value={process.id}>
                                  <div className="flex flex-col items-start">
                                    <span className="font-medium">{process.processName}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {process.processCode} - {process.category}
                                    </span>
                                  </div>
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
                      name="stepNo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Step Number *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="1"
                              value={field.value}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              onBlur={field.onBlur}
                              name={field.name}
                            />
                          </FormControl>
                          <FormDescription>
                            Sequence in production flow
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="Enter quantity"
                              value={field.value}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              onBlur={field.onBlur}
                              name={field.name}
                              disabled={!!selectedOrder}
                            />
                          </FormControl>
                          <FormDescription>
                            Number of units to produce
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Machine Assignment & Scheduling */}
              <Card>
                <CardHeader>
                  <CardTitle>Machine Assignment & Scheduling</CardTitle>
                  <CardDescription>Assign machine and schedule the job</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="assignedMachineName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Machine (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., CNC-01, SAW-02"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Assign to specific machine
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={!!selectedOrder}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Low">Low</SelectItem>
                              <SelectItem value="Medium">Medium</SelectItem>
                              <SelectItem value="High">High</SelectItem>
                              <SelectItem value="Urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Job card will be created in "Ready" status. You can start the job from the job cards list.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Work Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle>Work Instructions</CardTitle>
                  <CardDescription>Provide detailed instructions for the operator</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="workInstructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Work Instructions</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter detailed work instructions for the operator..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Step-by-step instructions for executing this job
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="qualityCheckpoints"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quality Checkpoints</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter quality checkpoints and inspection criteria..."
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Quality checks to perform during production
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="specialNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Special Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any special notes or precautions..."
                            className="min-h-[60px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Additional notes or warnings
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Submit Buttons */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/production/job-cards')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? 'Creating Job Card...' : 'Create Job Card'}
                </Button>
              </div>
            </div>

            {/* Summary Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Type</p>
                      <Badge variant="outline">
                        {creationType === 'MANUAL' ? 'Manual Job' : creationType === 'REWORK' ? 'Rework Job' : 'Order-based'}
                      </Badge>
                    </div>

                    {orderId && selectedOrder && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-muted-foreground">Order</p>
                          <p className="font-medium">{selectedOrder.orderNo}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Customer</p>
                          <p className="font-medium">{selectedOrder.customer?.name}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Product</p>
                          <p className="font-medium">{selectedOrder.product?.modelName}</p>
                        </div>
                      </>
                    )}

                    {processId && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-muted-foreground">Process</p>
                          <p className="font-medium">
                            {mockProcesses.find(p => p.id === processId)?.processName || 'N/A'}
                          </p>
                        </div>
                      </>
                    )}

                    <Separator />
                    <div>
                      <p className="text-muted-foreground">Step Number</p>
                      <p className="font-medium">Step {form.watch('stepNo')}</p>
                    </div>

                    <div>
                      <p className="text-muted-foreground">Quantity</p>
                      <p className="font-medium">{form.watch('quantity')} units</p>
                    </div>

                    <div>
                      <p className="text-muted-foreground">Priority</p>
                      <Badge variant={form.watch('priority') === 'Urgent' ? 'destructive' : 'outline'}>
                        {form.watch('priority')}
                      </Badge>
                    </div>

                    {form.watch('assignedMachineName') && (
                      <div>
                        <p className="text-muted-foreground">Machine</p>
                        <p className="font-medium">{form.watch('assignedMachineName')}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Factory className="h-4 w-4" />
                    Quick Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li>• For order-based jobs, use auto-generation from order page</li>
                    <li>• Manual jobs are ideal for urgent or custom work</li>
                    <li>• Rework jobs help track correction work</li>
                    <li>• Clear instructions reduce production errors</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
