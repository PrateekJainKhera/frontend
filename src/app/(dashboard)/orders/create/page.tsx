"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { ArrowLeft } from 'lucide-react'
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
import { mockCustomers, mockProducts, mockProcessTemplates, mockBOMs } from '@/lib/mock-data'
import { Priority, Product, OrderSource, SchedulingStrategy, ProductBOM } from '@/types'
import { calculateBOMRequirements } from '@/lib/utils/bom-calculations'
import { BOMTable } from '@/components/tables/bom-table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

const formSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  productId: z.string().min(1, 'Product is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  priority: z.nativeEnum(Priority),
  dueDate: z.string().min(1, 'Due date is required'),
  orderSource: z.nativeEnum(OrderSource),
  agentCustomerId: z.string().optional(),
  schedulingStrategy: z.nativeEnum(SchedulingStrategy),
})

type FormData = z.infer<typeof formSchema>

export default function CreateOrderPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const [productBOM, setProductBOM] = useState<ProductBOM | null>(null)
  const [orderSource, setOrderSource] = useState<OrderSource>(OrderSource.DIRECT)

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
    },
  })

  // Filter products by selected customer
  const filteredProducts = selectedCustomerId
    ? mockProducts.filter(p => {
        const customer = mockCustomers.find(c => c.id === selectedCustomerId)
        return customer && p.customerName === customer.name
      })
    : mockProducts

  // Filter agent customers only
  const agentCustomers = mockCustomers.filter(c => c.isAgent)

  // Find linked process template
  const linkedTemplate = selectedProduct
    ? mockProcessTemplates.find(t =>
        t.id === selectedProduct.processTemplateId ||
        t.applicableTypes.includes(selectedProduct.rollerType)
      )
    : null

  // Calculate BOM requirements if product and quantity are selected
  const quantity = form.watch('quantity')
  const bomRequirements = productBOM && quantity > 0
    ? calculateBOMRequirements(productBOM, quantity)
    : []

  // Check if materials are available
  const hasMaterialShortage = bomRequirements.some(item => item.shortfall > 0)

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
      router.push('/dashboard/orders')
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
          <Link href="/dashboard/orders">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create New Order</h1>
          <p className="text-muted-foreground">Punch a new production order</p>
        </div>
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
                          <SelectTrigger>
                            <SelectValue placeholder="Select customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {mockCustomers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value)
                          const product = mockProducts.find(p => p.id === value)
                          setSelectedProduct(product || null)
                          // Load BOM for selected product
                          const bom = mockBOMs.find(b => b.productId === value && b.isActive)
                          setProductBOM(bom || null)
                        }}
                        value={field.value}
                        disabled={!selectedCustomerId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={
                              selectedCustomerId
                                ? "Select part code"
                                : "Select customer first"
                            } />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredProducts.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.partCode} - {product.modelName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                              <SelectItem key={agent.id} value={agent.id}>
                                {agent.name}
                                <span className="text-xs text-muted-foreground ml-2">
                                  ({agent.commissionPercent}% commission)
                                </span>
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
                          {...field}
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

                {/* BOM Review Section */}
                {productBOM && quantity > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Bill of Materials Review</h3>
                      <Badge variant="outline" className="ml-auto">
                        {productBOM.bomItems.length} items
                      </Badge>
                    </div>

                    <Alert variant={hasMaterialShortage ? "destructive" : "default"}>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {hasMaterialShortage
                          ? `Material shortage detected! Some items are out of stock.`
                          : `All materials are available for production.`}
                      </AlertDescription>
                    </Alert>

                    <div className="rounded-lg border p-4 bg-muted/30">
                      <p className="text-sm font-semibold mb-3">Material Requirements (for {quantity} units):</p>
                      <BOMTable bomItems={bomRequirements} showStockInfo={true} />
                    </div>

                    {hasMaterialShortage && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          ⚠️ Orders with material shortages may experience production delays.
                          Please coordinate with procurement before confirming this order.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                {!productBOM && selectedProduct && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No BOM configured for this product. Please configure BOM in product master before creating orders.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/dashboard/orders')}
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
    </div>
  )
}
