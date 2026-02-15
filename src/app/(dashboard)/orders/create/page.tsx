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
import { ProductSearchDialog } from '@/components/dialogs/product-search-dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

// Drawing Source options
const DRAWING_SOURCES = [
  { value: 'customer_provides', label: 'Customer Provides' },
  { value: 'create_new', label: 'Create New (In-house)' },
  { value: 'from_master', label: 'Select from Drawing Master' },
] as const

type DrawingSource = typeof DRAWING_SOURCES[number]['value']

// Order item type for multi-product orders
interface OrderItem {
  product: Product
  quantity: number
  dueDate: string
  priority: Priority
}

const formSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
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
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const [orderSource, setOrderSource] = useState<OrderSource>(OrderSource.DIRECT)
  const [createCustomerDialogOpen, setCreateCustomerDialogOpen] = useState(false)
  const [createProductDialogOpen, setCreateProductDialogOpen] = useState(false)
  const [productSearchDialogOpen, setProductSearchDialogOpen] = useState(false)
  const [drawingSource, setDrawingSource] = useState<DrawingSource | ''>('')
  const [selectedMasterDrawingIds, setSelectedMasterDrawingIds] = useState<number[]>([])

  // Multi-product order items
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])

  // Drawings to be uploaded after order creation (customer_provides)
  const [pendingDrawings, setPendingDrawings] = useState<Array<{
    file: File
    drawingName: string
    drawingType: string
  }>>([])
  const [newDrawingName, setNewDrawingName] = useState('')
  const [newDrawingType, setNewDrawingType] = useState('shaft')
  const [newDrawingFile, setNewDrawingFile] = useState<File | null>(null)

  // Master data loaded from API
  const [customers, setCustomers] = useState<Customer[]>([])
  const [drawings, setDrawings] = useState<DrawingResponse[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const [c, d] = await Promise.all([
          customerService.getAll(),
          drawingService.getAll(),
        ])
        setCustomers(c)
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

  // Filter agent customers only
  const agentCustomers = customers.filter(c => c.customerType === 'Agent')

  // Add product to order items
  const handleAddProduct = (product: Product) => {
    setOrderItems(prev => [
      ...prev,
      {
        product,
        quantity: 1,
        dueDate: getDefaultDueDate(),
        priority: Priority.MEDIUM,
      },
    ])
    setProductSearchDialogOpen(false)
  }

  // Remove product from order items
  const handleRemoveProduct = (productId: number) => {
    setOrderItems(prev => prev.filter(item => item.product.id !== productId))
    toast.info('Product removed from order')
  }

  // Update order item field
  const handleUpdateItem = (
    productId: number,
    field: 'quantity' | 'dueDate' | 'priority',
    value: number | string | Priority
  ) => {
    setOrderItems(prev =>
      prev.map(item =>
        item.product.id === productId
          ? { ...item, [field]: value }
          : item
      )
    )
  }

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
    // Validation: at least one product required
    if (orderItems.length === 0) {
      toast.error('Please add at least one product to the order')
      return
    }

    setIsSubmitting(true)
    toast.loading('Creating order...')

    try {
      // Build multi-product payload
      const payload: any = {
        customerId: Number(data.customerId),
        orderSource: data.orderSource,
        schedulingStrategy: data.schedulingStrategy,
        items: orderItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          dueDate: item.dueDate,
          priority: item.priority,
        })),
      }

      if (data.customerMachine) payload.customerMachine = data.customerMachine
      if (data.materialGradeRemark) payload.materialGradeRemark = data.materialGradeRemark
      if (data.agentCustomerId) payload.agentCustomerId = Number(data.agentCustomerId)
      if (data.drawingNotes) payload.drawingNotes = data.drawingNotes

      // Drawing source mapping
      if (data.drawingSource === 'from_master') {
        if (selectedMasterDrawingIds.length > 0) payload.primaryDrawingId = selectedMasterDrawingIds[0]
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

      // Upload pending drawings (customer_provides) if any
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

      // Link selected master drawings (from_master) if any
      if (selectedMasterDrawingIds.length > 0) {
        toast.loading(`Linking ${selectedMasterDrawingIds.length} drawing(s) from master...`)
        try {
          for (const drawingId of selectedMasterDrawingIds) {
            await drawingService.linkToOrder(drawingId, orderId)
          }
          toast.dismiss()
          toast.success(`${selectedMasterDrawingIds.length} drawing(s) linked to order!`)
        } catch (linkError) {
          toast.dismiss()
          toast.warning(`Order created but some drawings failed to link: ${linkError instanceof Error ? linkError.message : 'Unknown error'}`)
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
                            // Clear order items when customer changes
                            setOrderItems([])
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

                {/* Multi-Product Selection */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <FormLabel>Products *</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Search and add products to this order
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setProductSearchDialogOpen(true)}
                      disabled={!selectedCustomerId}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </Button>
                  </div>

                  {/* List of selected products */}
                  {orderItems.length === 0 ? (
                    <div className="p-8 text-center border border-dashed rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        {selectedCustomerId
                          ? 'No products added yet. Click "Add Product" to search and add products.'
                          : 'Please select a customer first'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orderItems.map((item, index) => (
                        <div
                          key={item.product.id}
                          className="p-4 border rounded-lg space-y-3 bg-card"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-semibold text-sm bg-primary/10 px-2 py-0.5 rounded">
                                  Item {String.fromCharCode(65 + index)}
                                </span>
                                <p className="font-semibold text-sm truncate">
                                  {item.product.partCode}
                                </p>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {item.product.modelName} • {item.product.rollerType} • {item.product.numberOfTeeth} teeth
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ⌀{item.product.diameter}mm × {item.product.length}mm • {item.product.materialGrade}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveProduct(item.product.id)}
                            >
                              <XCircle className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>

                          {/* Item-specific fields */}
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <Label className="text-xs">Quantity *</Label>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleUpdateItem(
                                    item.product.id,
                                    'quantity',
                                    Number(e.target.value)
                                  )
                                }
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Due Date *</Label>
                              <Input
                                type="date"
                                value={item.dueDate}
                                onChange={(e) =>
                                  handleUpdateItem(
                                    item.product.id,
                                    'dueDate',
                                    e.target.value
                                  )
                                }
                                min={new Date().toISOString().split('T')[0]}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Priority *</Label>
                              <Select
                                value={item.priority}
                                onValueChange={(value) =>
                                  handleUpdateItem(
                                    item.product.id,
                                    'priority',
                                    value as Priority
                                  )
                                }
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.values(Priority).map((priority) => (
                                    <SelectItem key={priority} value={priority}>
                                      {priority}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

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
                            setSelectedMasterDrawingIds([])
                            setPendingDrawings([])
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
                            <Label className="text-xs">Drawing Name *</Label>
                            <Input
                              placeholder="e.g. Shaft Drawing"
                              value={newDrawingName}
                              onChange={(e) => setNewDrawingName(e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Type *</Label>
                            <Select value={newDrawingType} onValueChange={setNewDrawingType}>
                              <SelectTrigger className="mt-1">
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
                          <div>
                            <Label className="text-xs">File *</Label>
                            <Input
                              type="file"
                              accept=".pdf,.png,.jpg,.jpeg,.dwg"
                              onChange={(e) => setNewDrawingFile(e.target.files?.[0] || null)}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={!newDrawingName.trim() || !newDrawingFile}
                          onClick={() => {
                            if (newDrawingFile && newDrawingName.trim()) {
                              handleAddDrawing(newDrawingFile, newDrawingName.trim(), newDrawingType)
                              setNewDrawingName('')
                              setNewDrawingFile(null)
                            }
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Drawing
                        </Button>
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

                  {/* Select from Drawing Master — multi-select */}
                  {drawingSource === 'from_master' && (
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200 space-y-3">
                      <p className="text-sm font-semibold text-purple-900">
                        📚 Select one or more drawings from Drawing Master
                      </p>

                      {drawings.filter(d => d.status === 'approved').length === 0 ? (
                        <p className="text-sm text-muted-foreground">No approved drawings available in master</p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2 bg-white">
                          {drawings
                            .filter(d => d.status === 'approved')
                            .map((drawing) => {
                              const isChecked = selectedMasterDrawingIds.includes(drawing.id)
                              return (
                                <label
                                  key={drawing.id}
                                  className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${isChecked ? 'bg-purple-100' : 'hover:bg-gray-50'}`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      setSelectedMasterDrawingIds(prev =>
                                        isChecked ? prev.filter(id => id !== drawing.id) : [...prev, drawing.id]
                                      )
                                    }}
                                    className="h-4 w-4 rounded border-gray-300 text-purple-600"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{drawing.drawingNumber} — {drawing.drawingName}</p>
                                    <p className="text-xs text-muted-foreground">
                                      <span className="capitalize">{drawing.drawingType}</span> • Rev {drawing.revision || '—'} • {drawing.fileName || 'No file'}
                                    </p>
                                  </div>
                                </label>
                              )
                            })}
                        </div>
                      )}

                      {selectedMasterDrawingIds.length > 0 && (
                        <p className="text-xs text-purple-700 font-medium">
                          {selectedMasterDrawingIds.length} drawing(s) selected — will be linked to this order
                        </p>
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
          {orderItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Products:</span>
                  <span className="font-semibold">{orderItems.length} item(s)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Quantity:</span>
                  <span className="font-semibold">
                    {orderItems.reduce((sum, item) => sum + item.quantity, 0)} pcs
                  </span>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="font-medium text-xs text-muted-foreground">Items:</p>
                  {orderItems.map((item, index) => (
                    <div key={item.product.id} className="flex justify-between text-xs">
                      <span className="truncate flex-1">
                        {String.fromCharCode(65 + index)}: {item.product.partCode}
                      </span>
                      <span className="font-medium ml-2">{item.quantity}x</span>
                    </div>
                  ))}
                </div>
                <Separator />
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

      {/* Product Search Dialog */}
      <ProductSearchDialog
        open={productSearchDialogOpen}
        onOpenChange={setProductSearchDialogOpen}
        onSelectProduct={handleAddProduct}
        excludedProductIds={orderItems.map(item => item.product.id)}
      />
    </div>
  )
}
