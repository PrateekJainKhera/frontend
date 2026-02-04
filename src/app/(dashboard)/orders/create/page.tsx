"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { ArrowLeft, Plus, FileText, Upload, Send } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
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
import { toast } from 'sonner'
import { simulateApiCall } from '@/lib/utils/mock-api'
import { mockCustomers, mockProducts, mockProcessTemplates, mockDrawings } from '@/lib/mock-data'
import { Drawing } from '@/lib/mock-data/drawings'
import { Priority, Product, OrderSource, SchedulingStrategy } from '@/types'
import { Separator } from '@/components/ui/separator'
import { CreateCustomerDialog } from '@/components/forms/create-customer-dialog'
import { CreateProductDialog } from '@/components/forms/create-product-dialog'
import { UploadDrawingDialog } from '@/components/forms/upload-drawing-dialog'
import { BulkUploadDrawingsDialog } from '@/components/forms/bulk-upload-drawings-dialog'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

// Drawing Source options
const DRAWING_SOURCES = [
  { value: 'customer_provides', label: 'Customer Provides' },
  { value: 'create_new', label: 'Create New (In-house)' },
  { value: 'from_master', label: 'Select from Drawing Master' },
] as const

type DrawingSource = typeof DRAWING_SOURCES[number]['value']

const formSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  productId: z.string().min(1, 'Product is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  priority: z.nativeEnum(Priority),
  dueDate: z.string().min(1, 'Due date is required'),
  orderSource: z.nativeEnum(OrderSource),
  agentCustomerId: z.string().optional(),
  schedulingStrategy: z.nativeEnum(SchedulingStrategy),
  // Drawing fields
  drawingSource: z.string().min(1, 'Drawing source is required'),
  drawingId: z.string().optional(),
  drawingNotes: z.string().optional(),
  // Machine and Grade fields
  customerMachine: z.string().optional(),
  materialGradeRemark: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

export default function CreateOrderPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const [orderSource, setOrderSource] = useState<OrderSource>(OrderSource.DIRECT)
  const [createCustomerDialogOpen, setCreateCustomerDialogOpen] = useState(false)
  const [createProductDialogOpen, setCreateProductDialogOpen] = useState(false)
  const [uploadDrawingDialogOpen, setUploadDrawingDialogOpen] = useState(false)
  const [bulkUploadDialogOpen, setBulkUploadDialogOpen] = useState(false)
  const [drawingSource, setDrawingSource] = useState<DrawingSource | ''>('')
  const [selectedDrawing, setSelectedDrawing] = useState<Drawing | null>(null)
  const [customerDrawingTiming, setCustomerDrawingTiming] = useState<'now' | 'later'>('now')
  const [customerDrawingsUploaded, setCustomerDrawingsUploaded] = useState(false)

  // Get default due date (today + 14 days)
  const getDefaultDueDate = () => {
    const date = new Date()
    date.setDate(date.getDate() + 14)
    return date.toISOString().split('T')[0]
  }

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: '',
      productId: '',
      quantity: 1,
      priority: Priority.MEDIUM,
      dueDate: getDefaultDueDate(),
      orderSource: OrderSource.DIRECT,
      agentCustomerId: '',
      schedulingStrategy: SchedulingStrategy.DUE_DATE,
      drawingSource: '',
      drawingId: '',
      drawingNotes: '',
      customerMachine: '',
      materialGradeRemark: '',
    },
  })

  // Filter products by selected customer
  const filteredProducts = selectedCustomerId
    ? mockProducts.filter(p => {
      const customer = mockCustomers.find(c => c.id === parseInt(selectedCustomerId))
      return customer && p.customerName === customer.customerName
    })
    : mockProducts

  // Filter agent customers only
  const agentCustomers = mockCustomers.filter(c => c.customerType === 'Agent')

  // Find linked process template
  const linkedTemplate = selectedProduct
    ? mockProcessTemplates.find(t =>
      t.id === selectedProduct.processTemplateId ||
      t.applicableTypes.includes(selectedProduct.rollerType)
    )
    : null

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    toast.loading('Creating order...')

    try {
      // Generate order number
      const orderNo = `ORD-2024-${String(Math.floor(Math.random() * 999) + 100).padStart(3, '0')}`

      // Simulate API call
      await simulateApiCall({ ...data, orderNo, template: linkedTemplate }, 1500)

      toast.dismiss()
      toast.success(`Order created successfully: ${orderNo}`)

      // Redirect to orders list
      router.push('/orders')
    } catch (error) {
      toast.dismiss()
      toast.error('Failed to create order')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/orders">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="sr-only">Create New Order</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
            <CardDescription>
              All fields with * are required. Selections must be from dropdowns only.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Customer Selection - DROPDOWN ONLY */}
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name *</FormLabel>
                      <div className="flex gap-2">
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value)
                            setSelectedCustomerId(value)
                            // Reset product selection when customer changes
                            form.setValue('productId', '')
                            setSelectedProduct(null)
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select customer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {mockCustomers.map((customer) => (
                              <SelectItem key={customer.id} value={customer.id.toString()}>
                                {customer.customerName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setCreateCustomerDialogOpen(true)}
                          title="Add New Customer"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormDescription>
                        ⚠️ Dropdown only - no free text allowed
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Product Selection - DROPDOWN ONLY (filtered by customer) */}
                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Part Code / Product *</FormLabel>
                      <div className="flex gap-2">
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value)
                            const product = mockProducts.find(p => p.id === Number(value))
                            setSelectedProduct(product || null)
                          }}
                          value={field.value}
                          disabled={!selectedCustomerId}
                        >
                          <FormControl>
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder={
                                selectedCustomerId
                                  ? "Select part code"
                                  : "Select customer first"
                              } />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {filteredProducts.map((product) => (
                              <SelectItem key={product.id} value={product.id.toString()}>
                                {product.partCode} - {product.modelName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setCreateProductDialogOpen(true)}
                          title="Add New Product"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormDescription>
                        ⚠️ Dropdown only - filtered by selected customer
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Product Details (Auto-display) */}
                {selectedProduct && (
                  <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
                    <p className="font-semibold text-primary">Selected Product Details:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-muted-foreground">Part Code:</span>
                        <span className="ml-2 font-mono font-semibold">{selectedProduct.partCode}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Roller Type:</span>
                        <span className="ml-2">{selectedProduct.rollerType}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Dimensions:</span>
                        <span className="ml-2">⌀{selectedProduct.diameter} × {selectedProduct.length}mm</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Material:</span>
                        <span className="ml-2">{selectedProduct.materialGrade}</span>
                      </div>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Drawing Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">Drawing Information</h3>
                  </div>

                  <FormField
                    control={form.control}
                    name="drawingSource"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Drawing Source *</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value)
                            setDrawingSource(value as DrawingSource)
                            // Reset drawing selection when source changes
                            form.setValue('drawingId', '')
                            setSelectedDrawing(null)
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select drawing source" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DRAWING_SOURCES.map((source) => (
                              <SelectItem key={source.value} value={source.value}>
                                {source.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Customer Provides Drawing */}
                  {drawingSource === 'customer_provides' && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-4">
                      <p className="text-sm font-semibold text-blue-900">
                        📄 Customer will provide the drawing
                      </p>

                      {/* Upload Timing Options */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">When will you upload the drawing?</Label>
                        <RadioGroup
                          value={customerDrawingTiming}
                          onValueChange={(value) => setCustomerDrawingTiming(value as 'now' | 'later')}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="now" id="upload-now" />
                            <Label htmlFor="upload-now" className="font-normal cursor-pointer">
                              Upload Now
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="later" id="upload-later" />
                            <Label htmlFor="upload-later" className="font-normal cursor-pointer">
                              Upload Later
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      {/* Upload Now Options */}
                      {customerDrawingTiming === 'now' && (
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setUploadDrawingDialogOpen(true)}
                            >
                              <Upload className="mr-2 h-4 w-4" />
                              Single Upload
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setBulkUploadDialogOpen(true)}
                            >
                              <Upload className="mr-2 h-4 w-4" />
                              Bulk Upload
                            </Button>
                          </div>

                          {/* Upload Status */}
                          {customerDrawingsUploaded && (
                            <div className="p-3 bg-green-100 rounded-lg border border-green-300">
                              <p className="text-sm font-semibold text-green-800">
                                ✅ Drawings uploaded successfully
                              </p>
                              <Button
                                type="button"
                                variant="default"
                                size="sm"
                                className="mt-2"
                                onClick={() => {
                                  toast.success('Drawings sent to Drawing Team for review!')
                                }}
                              >
                                <Send className="mr-2 h-4 w-4" />
                                Send to Drawing Team for Review
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Upload Later Message */}
                      {customerDrawingTiming === 'later' && (
                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <p className="text-sm text-amber-800">
                            ⏳ Drawing will be uploaded later. You can upload from the order details page after creating the order.
                          </p>
                        </div>
                      )}

                      <FormField
                        control={form.control}
                        name="drawingNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes / Instructions</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter any notes about the customer-provided drawing (e.g., expected delivery date, format, revisions needed, etc.)"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Create New Drawing */}
                  {drawingSource === 'create_new' && (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200 space-y-3">
                      <p className="text-sm font-semibold text-green-900">
                        🛠️ Drawing will be created in-house
                      </p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setUploadDrawingDialogOpen(true)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Create New Drawing
                        </Button>
                      </div>
                      <FormField
                        control={form.control}
                        name="drawingNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Requirements / Specifications</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter detailed requirements for the new drawing (dimensions, tolerances, special features, etc.)"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Select from Drawing Master */}
                  {drawingSource === 'from_master' && (
                    <div className="space-y-3">
                      <FormField
                        control={form.control}
                        name="drawingId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Select Drawing *</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value)
                                const drawing = mockDrawings.find(d => d.id === value)
                                setSelectedDrawing(drawing || null)
                              }}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select from approved drawings" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {mockDrawings
                                  .filter(d => d.status === 'approved')
                                  .map((drawing) => (
                                    <SelectItem key={drawing.id} value={drawing.id}>
                                      {drawing.drawingNumber} - {drawing.drawingName} (Rev {drawing.revision})
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Only approved drawings are shown
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Selected Drawing Preview */}
                      {selectedDrawing && (
                        <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
                          <p className="font-semibold text-primary">Selected Drawing Details:</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-muted-foreground">Drawing No:</span>
                              <span className="ml-2 font-mono font-semibold">{selectedDrawing.drawingNumber}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Revision:</span>
                              <span className="ml-2">{selectedDrawing.revision}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Part Type:</span>
                              <span className="ml-2 capitalize">{selectedDrawing.drawingType}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">File:</span>
                              <span className="ml-2 text-xs">{selectedDrawing.fileName}</span>
                            </div>
                          </div>
                          {selectedDrawing.description && (
                            <p className="text-xs text-muted-foreground mt-2">
                              <span className="font-medium">Description:</span> {selectedDrawing.description}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Customer Machine Details */}
                <FormField
                  control={form.control}
                  name="customerMachine"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Machine Details</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Flexo 8-Color, Rotogravure 6-Color, Offset Press 4-Color"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Specify which machine the customer uses (helps in product compatibility)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Quality Grade */}
                <FormField
                  control={form.control}
                  name="materialGradeRemark"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quality Grade</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select quality grade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="A">A Grade (Premium Quality)</SelectItem>
                          <SelectItem value="B">B Grade (Standard Quality)</SelectItem>
                          <SelectItem value="C">C Grade (Economy Quality)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Specify the quality grade of raw material for this order
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                {/* Order Source */}
                <FormField
                  control={form.control}
                  name="orderSource"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order Source *</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value)
                          setOrderSource(value as OrderSource)
                          // Reset agent selection if switching to Direct
                          if (value === OrderSource.DIRECT) {
                            form.setValue('agentCustomerId', '')
                          }
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select order source" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(OrderSource).map((source) => (
                            <SelectItem key={source} value={source}>
                              {source}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Agent Selection (shown only if orderSource is Agent) */}
                {orderSource === OrderSource.AGENT && (
                  <FormField
                    control={form.control}
                    name="agentCustomerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agent / Distributor *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select agent" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {agentCustomers.map((agent) => (
                              <SelectItem key={agent.id} value={agent.id.toString()}>
                                {agent.customerName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Commission will be calculated automatically
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                          min="1"
                          placeholder="Enter quantity"
                          value={field.value}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          onBlur={field.onBlur}
                          name={field.name}
                        />
                      </FormControl>
                      <FormDescription>
                        Number of units to produce
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Priority */}
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(Priority).map((priority) => (
                            <SelectItem key={priority} value={priority}>
                              {priority}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Due Date */}
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date *</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </FormControl>
                      <FormDescription>
                        Default: 14 days from today (editable for OEM orders)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Scheduling Strategy */}
                <FormField
                  control={form.control}
                  name="schedulingStrategy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scheduling Strategy *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select scheduling strategy" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(SchedulingStrategy).map((strategy) => (
                            <SelectItem key={strategy} value={strategy}>
                              {strategy}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Determines how this order will be prioritized in production
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/orders')}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? 'Creating Order...' : 'Create Order'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Process Template Preview (Auto-linked) */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Process Template</CardTitle>
              <CardDescription>Auto-linked production workflow</CardDescription>
            </CardHeader>
            <CardContent>
              {linkedTemplate ? (
                <div className="space-y-3">
                  <div className="p-3 bg-primary/10 rounded-md">
                    <p className="font-semibold text-sm text-primary">
                      {linkedTemplate.templateName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {linkedTemplate.description}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">
                      Process Flow ({linkedTemplate.steps.length} steps):
                    </p>
                    {linkedTemplate.steps.map((step) => (
                      <div
                        key={step.id}
                        className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded"
                      >
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                          {step.stepNo}
                        </span>
                        <span className="flex-1">{step.processName}</span>
                        {step.isMandatory && (
                          <span className="text-[10px] text-destructive font-semibold">
                            *
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-muted-foreground italic">
                    * Mandatory steps cannot be skipped
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Select a product to see the process template
                </p>
              )}
            </CardContent>
          </Card>

          {/* Order Summary */}
          {selectedProduct && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantity:</span>
                  <span className="font-semibold">{form.watch('quantity')} pcs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Priority:</span>
                  <span className="font-semibold">{form.watch('priority')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due Date:</span>
                  <span className="font-semibold">
                    {new Date(form.watch('dueDate')).toLocaleDateString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Est. Process Time:</span>
                  <span className="font-semibold">
                    {linkedTemplate
                      ? `${linkedTemplate.steps.length} steps`
                      : '-'}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Customer Dialog */}
      <CreateCustomerDialog
        open={createCustomerDialogOpen}
        onOpenChange={setCreateCustomerDialogOpen}
        onSuccess={() => {
          // In a real app, you would refresh customers list here
          toast.success('Customer created! Please refresh to see the new customer.')
        }}
      />

      {/* Create Product Dialog */}
      <CreateProductDialog
        open={createProductDialogOpen}
        onOpenChange={setCreateProductDialogOpen}
        onSuccess={() => {
          // In a real app, you would refresh products list here
          toast.success('Product created! Please refresh to see the new product.')
        }}
      />

      {/* Upload Drawing Dialog */}
      <UploadDrawingDialog
        open={uploadDrawingDialogOpen}
        onOpenChange={setUploadDrawingDialogOpen}
        onSuccess={() => {
          toast.success('Drawing uploaded successfully!')
          if (drawingSource === 'customer_provides') {
            setCustomerDrawingsUploaded(true)
          }
        }}
      />

      {/* Bulk Upload Drawings Dialog */}
      <BulkUploadDrawingsDialog
        open={bulkUploadDialogOpen}
        onOpenChange={setBulkUploadDialogOpen}
        onSuccess={() => {
          toast.success('Drawings uploaded successfully!')
          if (drawingSource === 'customer_provides') {
            setCustomerDrawingsUploaded(true)
          }
        }}
      />
    </div>
  )
}
