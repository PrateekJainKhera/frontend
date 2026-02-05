"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { ArrowLeft, Plus, FileText, Upload, Send, XCircle } from 'lucide-react'
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
import { Priority, Product, OrderSource, SchedulingStrategy } from '@/types'
import { Customer } from '@/types/customer'
import { customerService } from '@/lib/api/customer'
import { productService } from '@/lib/api/products'
import { drawingService, DrawingResponse } from '@/lib/api/drawings'
import { orderService } from '@/lib/api/orders'
import { Separator } from '@/components/ui/separator'
import { CreateCustomerDialog } from '@/components/forms/create-customer-dialog'
import { CreateProductDialog } from '@/components/forms/create-product-dialog'
import { Textarea } from '@/components/ui/textarea'
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
  const [drawingSource, setDrawingSource] = useState<DrawingSource | ''>('')
  const [selectedDrawing, setSelectedDrawing] = useState<DrawingResponse | null>(null)

  // Drawings to be uploaded after order creation
  const [pendingDrawings, setPendingDrawings] = useState<Array<{
    file: File
    drawingName: string
    drawingType: string
  }>>([])

  // Master data loaded from API
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [drawings, setDrawings] = useState<DrawingResponse[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const [c, p, d] = await Promise.all([
          customerService.getAll(),
          productService.getAll(),
          drawingService.getAll(),
        ])
        setCustomers(c)
        setProducts(p)
        setDrawings(d)
      } catch (err) {
        console.error('Failed to load master data:', err)
      }
    }
    load()
  }, [])

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
    ? products.filter(p => {
      const customer = customers.find(c => c.id === Number(selectedCustomerId))
      return customer && p.customerName === customer.customerName
    })
    : products

  // Filter agent customers only
  const agentCustomers = customers.filter(c => c.customerType === 'Agent')

  // Handle adding a drawing
  const handleAddDrawing = (file: File, drawingName: string, drawingType: string) => {
    setPendingDrawings(prev => [...prev, { file, drawingName, drawingType }])
    toast.success(`Drawing "${drawingName}" added`)
  }

  // Handle removing a drawing
  const handleRemoveDrawing = (index: number) => {
    setPendingDrawings(prev => prev.filter((_, i) => i !== index))
    toast.info('Drawing removed')
  }

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    toast.loading('Creating order...')

    try {
      const payload: any = {
        dueDate: data.dueDate,
        customerId: Number(data.customerId),
        productId: Number(data.productId),
        quantity: data.quantity,
        priority: data.priority,
        orderSource: data.orderSource,
        schedulingStrategy: data.schedulingStrategy,
      }

      if (data.customerMachine) payload.customerMachine = data.customerMachine
      if (data.materialGradeRemark) payload.materialGradeRemark = data.materialGradeRemark
      if (data.agentCustomerId) payload.agentCustomerId = Number(data.agentCustomerId)
      if (data.drawingNotes) payload.drawingNotes = data.drawingNotes

      // Drawing source mapping
      if (data.drawingSource === 'from_master' && data.drawingId) {
        payload.primaryDrawingId = Number(data.drawingId)
        payload.drawingSource = 'company'
      } else if (data.drawingSource === 'customer_provides') {
        payload.drawingSource = 'customer'
      } else if (data.drawingSource === 'create_new') {
        payload.drawingSource = 'company'
      }

      const orderId = await orderService.create(payload)
      const created = await orderService.getById(orderId)

      toast.dismiss()
      toast.success(`Order created successfully: ${created.orderNo}`)

      // Upload pending drawings if any
      if (pendingDrawings.length > 0) {
        toast.loading(`Uploading ${pendingDrawings.length} drawing(s)...`)
        try {
          for (const drawing of pendingDrawings) {
            await drawingService.upload(drawing.file, {
              drawingName: drawing.drawingName,
              drawingType: drawing.drawingType,
              status: 'draft',
              linkedOrderId: orderId
            })
          }
          toast.dismiss()
          toast.success(`Order and ${pendingDrawings.length} drawing(s) uploaded successfully!`)
        } catch (drawingError) {
          toast.dismiss()
          toast.warning(`Order created but some drawings failed to upload: ${drawingError instanceof Error ? drawingError.message : 'Unknown error'}`)
        }
      }

      router.push('/orders')
    } catch (error) {
      toast.dismiss()
      toast.error(error instanceof Error ? error.message : 'Failed to create order')
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
                            {customers.map((customer) => (
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
                            const product = products.find(p => p.id === Number(value))
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

                  {/* Multi-Drawing Upload Section */}
                  {drawingSource === 'customer_provides' && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-4">
                      <p className="text-sm font-semibold text-blue-900">
                        📄 Upload Multiple Drawings (Shaft, Tikki, Gear, Ends, Bearing, Patti, Assembly)
                      </p>

                      {/* Upload Form */}
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <Label htmlFor="drawing-file" className="text-xs">Select Drawing File *</Label>
                            <Input
                              id="drawing-file"
                              type="file"
                              accept=".pdf,.png,.jpg,.jpeg,.dwg"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  const drawingNameInput = document.getElementById('temp-drawing-name') as HTMLInputElement
                                  const drawingTypeSelect = document.getElementById('temp-drawing-type') as HTMLSelectElement
                                  if (drawingNameInput?.value && drawingTypeSelect?.value) {
                                    handleAddDrawing(file, drawingNameInput.value, drawingTypeSelect.value)
                                    e.target.value = ''
                                    drawingNameInput.value = ''
                                  } else {
                                    toast.error('Please enter drawing name and select type first')
                                    e.target.value = ''
                                  }
                                }
                              }}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="temp-drawing-name" className="text-xs">Drawing Name *</Label>
                            <Input
                              id="temp-drawing-name"
                              placeholder="e.g., Shaft Drawing"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="temp-drawing-type" className="text-xs">Type *</Label>
                            <Select defaultValue="shaft">
                              <SelectTrigger id="temp-drawing-type" className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="shaft">Shaft</SelectItem>
                                <SelectItem value="tikki">Tikki</SelectItem>
                                <SelectItem value="gear">Gear</SelectItem>
                                <SelectItem value="ends">Ends</SelectItem>
                                <SelectItem value="bearing">Bearing</SelectItem>
                                <SelectItem value="patti">Patti</SelectItem>
                                <SelectItem value="assembly">Assembly</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Add each drawing one by one. Select file after entering name and type.
                        </p>
                      </div>

                      {/* List of Pending Drawings */}
                      {pendingDrawings.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold">Drawings to be uploaded ({pendingDrawings.length}):</Label>
                          <div className="space-y-2">
                            {pendingDrawings.map((drawing, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                                <div className="flex items-center gap-3">
                                  <FileText className="h-4 w-4 text-blue-600" />
                                  <div>
                                    <p className="text-sm font-medium">{drawing.drawingName}</p>
                                    <p className="text-xs text-muted-foreground">
                                      Type: <span className="capitalize">{drawing.drawingType}</span> • {drawing.file.name}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveDrawing(index)}
                                >
                                  <XCircle className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            ))}
                          </div>
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
                      <p className="text-sm text-green-800">
                        Technical drawings will be prepared by our in-house design team based on the specifications provided below.
                      </p>
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
                                const drawing = drawings.find(d => d.id === Number(value))
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
                                {drawings
                                  .filter(d => d.status === 'approved')
                                  .map((drawing) => (
                                    <SelectItem key={drawing.id} value={drawing.id.toString()}>
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

        {/* Order Summary */}
        <div className="space-y-6">
          {selectedProduct && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Product:</span>
                  <span className="font-semibold">{selectedProduct.partCode}</span>
                </div>
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
                  <span className="text-muted-foreground">Order Source:</span>
                  <span className="font-semibold">{form.watch('orderSource')}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Drawing Review Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Next Step</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                After order creation, the drawing will need to be reviewed and approved before production planning begins.
              </p>
            </CardContent>
          </Card>
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
    </div>
  )
}
