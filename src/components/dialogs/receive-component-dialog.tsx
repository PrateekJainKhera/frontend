"use client"

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { componentService, ComponentResponse } from '@/lib/api/components'
import { inventoryService } from '@/lib/api/inventory'
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
import { toast } from 'sonner'
import { format } from 'date-fns'

const formSchema = z.object({
  componentId: z.number().min(1, 'Please select a component'),
  quantity: z.number().min(0.001, 'Quantity must be greater than 0'),
  unitCost: z.number().optional(),
  supplierName: z.string().optional(),
  invoiceNo: z.string().optional(),
  invoiceDate: z.string().optional(),
  poNo: z.string().optional(),
  poDate: z.string().optional(),
  receiptDate: z.string(),
  storageLocation: z.string().optional(),
  remarks: z.string().optional(),
  receivedBy: z.string().min(2, 'Received by is required'),
})

type FormData = z.infer<typeof formSchema>

interface ReceiveComponentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ReceiveComponentDialog({
  open,
  onOpenChange,
  onSuccess,
}: ReceiveComponentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [components, setComponents] = useState<ComponentResponse[]>([])
  const [loadingComponents, setLoadingComponents] = useState(false)
  const [selectedComponent, setSelectedComponent] = useState<ComponentResponse | null>(null)
  const [componentSearchQuery, setComponentSearchQuery] = useState('')

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      componentId: 0,
      quantity: 0,
      unitCost: undefined,
      supplierName: '',
      invoiceNo: '',
      invoiceDate: '',
      poNo: '',
      poDate: '',
      receiptDate: format(new Date(), 'yyyy-MM-dd'),
      storageLocation: 'Main Warehouse',
      remarks: '',
      receivedBy: '',
    },
  })

  useEffect(() => {
    if (open) {
      loadComponents()
    }
  }, [open])

  const loadComponents = async () => {
    setLoadingComponents(true)
    try {
      const data = await componentService.getAll()
      setComponents(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load components'
      toast.error(message)
    } finally {
      setLoadingComponents(false)
    }
  }

  const handleComponentChange = (componentId: string) => {
    const component = components.find(c => c.id === parseInt(componentId))
    setSelectedComponent(component || null)
    form.setValue('componentId', parseInt(componentId))

    // Auto-fill some fields from component master
    if (component) {
      form.setValue('unitCost', component.unitCost || undefined)
      if (component.supplierName) {
        form.setValue('supplierName', component.supplierName)
      }
    }
  }

  const onSubmit = async (data: FormData) => {
    if (!selectedComponent) {
      toast.error('Please select a component')
      return
    }

    setIsSubmitting(true)
    try {
      const requestData = {
        componentId: data.componentId,
        componentName: selectedComponent.componentName,
        partNumber: selectedComponent.partNumber || undefined,
        quantity: data.quantity,
        unit: selectedComponent.unit,
        unitCost: data.unitCost || undefined,
        supplierName: data.supplierName || undefined,
        invoiceNo: data.invoiceNo || undefined,
        invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : undefined,
        poNo: data.poNo || undefined,
        poDate: data.poDate ? new Date(data.poDate) : undefined,
        receiptDate: new Date(data.receiptDate),
        storageLocation: data.storageLocation || 'Main Warehouse',
        remarks: data.remarks || undefined,
        receivedBy: data.receivedBy,
      }
      console.log('Sending component receipt request:', requestData)
      await inventoryService.receiveComponent(requestData)
      toast.success(`Component received successfully!`)
      form.reset()
      setSelectedComponent(null)
      setComponentSearchQuery('')
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Component receipt error:', error)
      const message = error instanceof Error ? error.message : 'Failed to receive component'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Receive Purchased Component</DialogTitle>
          <DialogDescription>
            Record the receipt of purchased components into inventory
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Component Selection */}
              <FormField
                control={form.control}
                name="componentId"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Component *</FormLabel>
                    <Select
                      value={field.value?.toString()}
                      onValueChange={handleComponentChange}
                      disabled={loadingComponents}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a component..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <div className="p-2 border-b sticky top-0 bg-background">
                          <Input
                            placeholder="Search components..."
                            value={componentSearchQuery}
                            onChange={(e) => setComponentSearchQuery(e.target.value)}
                            className="h-8"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                          {components
                            .filter((component) =>
                              component.partNumber.toLowerCase().includes(componentSearchQuery.toLowerCase()) ||
                              component.componentName.toLowerCase().includes(componentSearchQuery.toLowerCase()) ||
                              component.manufacturer?.toLowerCase().includes(componentSearchQuery.toLowerCase())
                            )
                            .map((component) => (
                              <SelectItem key={component.id} value={component.id.toString()}>
                                {component.partNumber} - {component.componentName}
                              </SelectItem>
                            ))}
                          {components.filter((component) =>
                            component.partNumber.toLowerCase().includes(componentSearchQuery.toLowerCase()) ||
                            component.componentName.toLowerCase().includes(componentSearchQuery.toLowerCase()) ||
                            component.manufacturer?.toLowerCase().includes(componentSearchQuery.toLowerCase())
                          ).length === 0 && (
                            <div className="p-2 text-sm text-muted-foreground text-center">
                              No components found
                            </div>
                          )}
                        </div>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Show component details if selected */}
              {selectedComponent && (
                <div className="md:col-span-2 p-3 bg-muted rounded-md text-sm space-y-1">
                  <p><strong>Category:</strong> {selectedComponent.category}</p>
                  <p><strong>Manufacturer:</strong> {selectedComponent.manufacturer || 'N/A'}</p>
                  <p><strong>Unit:</strong> {selectedComponent.unit}</p>
                  <p><strong>Standard Cost:</strong> ₹{selectedComponent.unitCost?.toFixed(2) || 'N/A'}</p>
                </div>
              )}

              {/* Quantity */}
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.001"
                        placeholder="Enter quantity"
                        value={field.value || ''}
                        onChange={(e) => {
                          const val = e.target.value
                          field.onChange(val === '' ? 0 : parseFloat(val))
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Unit Cost */}
              <FormField
                control={form.control}
                name="unitCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Cost (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Enter unit cost"
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const val = e.target.value
                          field.onChange(val === '' ? undefined : parseFloat(val))
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Receipt Date */}
              <FormField
                control={form.control}
                name="receiptDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Receipt Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Storage Location */}
              <FormField
                control={form.control}
                name="storageLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Storage Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Main Warehouse" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Supplier Name */}
              <FormField
                control={form.control}
                name="supplierName"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Supplier Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter supplier name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Invoice No */}
              <FormField
                control={form.control}
                name="invoiceNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice No</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter invoice number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Invoice Date */}
              <FormField
                control={form.control}
                name="invoiceDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* PO No */}
              <FormField
                control={form.control}
                name="poNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PO No</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter PO number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* PO Date */}
              <FormField
                control={form.control}
                name="poDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PO Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Received By */}
              <FormField
                control={form.control}
                name="receivedBy"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Received By *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name of receiver" {...field} />
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
                      <Textarea
                        placeholder="Enter any additional notes..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                {isSubmitting ? 'Receiving...' : 'Receive Component'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
