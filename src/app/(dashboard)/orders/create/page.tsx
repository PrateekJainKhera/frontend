"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { ArrowLeft, Plus, FileText, XCircle, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { toast } from 'sonner'
import { Priority, Product } from '@/types'
import { Customer } from '@/types/customer'
import { customerService } from '@/lib/api/customer'
import { orderService } from '@/lib/api/orders'
import { Separator } from '@/components/ui/separator'
import { CreateCustomerDialog } from '@/components/forms/create-customer-dialog'
import { ProductSearchDialog } from '@/components/dialogs/product-search-dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

// Order item type for multi-product orders
interface OrderItem {
  product: Product
  quantity: number
  dueDate: string
  priority: Priority
  remarks?: string
}

// Pending customer drawing file
interface PendingDrawing {
  file: File
  drawingType: string
  notes?: string
}

const DRAWING_TYPES = [
  { value: 'shaft', label: 'Shaft' },
  { value: 'tikki', label: 'Tikki' },
  { value: 'gear', label: 'Gear' },
  { value: 'ends', label: 'Ends' },
  { value: 'bearing', label: 'Bearing' },
  { value: 'patti', label: 'Patti' },
  { value: 'assembly', label: 'Assembly' },
  { value: 'other', label: 'Other' },
] as const

const formSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
})

type FormData = z.infer<typeof formSchema>

export default function CreateOrderPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const [createCustomerDialogOpen, setCreateCustomerDialogOpen] = useState(false)
  const [productSearchDialogOpen, setProductSearchDialogOpen] = useState(false)

  // Multi-product order items
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])

  // Customer drawings section
  const [showDrawings, setShowDrawings] = useState(false)
  const [pendingDrawings, setPendingDrawings] = useState<PendingDrawing[]>([])
  const [newDrawingType, setNewDrawingType] = useState('other')
  const [newDrawingNotes, setNewDrawingNotes] = useState('')
  const [newDrawingFile, setNewDrawingFile] = useState<File | null>(null)

  // Master data
  const [customers, setCustomers] = useState<Customer[]>([])

  useEffect(() => {
    customerService.getAll()
      .then(setCustomers)
      .catch(err => console.error('Failed to load customers:', err))
  }, [])

  const getDefaultDueDate = () => {
    const date = new Date()
    date.setDate(date.getDate() + 14)
    return date.toISOString().split('T')[0]
  }

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { customerId: '' },
  })

  const handleAddProduct = (product: Product) => {
    setOrderItems(prev => [
      ...prev,
      { product, quantity: 1, dueDate: getDefaultDueDate(), priority: Priority.MEDIUM },
    ])
    setProductSearchDialogOpen(false)
  }

  const handleRemoveProduct = (productId: number) => {
    setOrderItems(prev => prev.filter(item => item.product.id !== productId))
  }

  const handleUpdateItem = (
    productId: number,
    field: 'quantity' | 'dueDate' | 'priority' | 'remarks',
    value: number | string | Priority
  ) => {
    setOrderItems(prev =>
      prev.map(item => item.product.id === productId ? { ...item, [field]: value } : item)
    )
  }

  const handleAddDrawing = () => {
    if (!newDrawingFile) return
    setPendingDrawings(prev => [...prev, {
      file: newDrawingFile,
      drawingType: newDrawingType,
      notes: newDrawingNotes.trim() || undefined,
    }])
    setNewDrawingFile(null)
    setNewDrawingNotes('')
    setNewDrawingType('other')
  }

  const handleRemoveDrawing = (index: number) => {
    setPendingDrawings(prev => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: FormData) => {
    if (orderItems.length === 0) {
      toast.error('Please add at least one product to the order')
      return
    }

    setIsSubmitting(true)
    toast.loading('Creating order...')

    try {
      const orderId = await orderService.create({
        customerId: Number(data.customerId),
        items: orderItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          dueDate: item.dueDate,
          priority: item.priority,
        })),
      })

      const created = await orderService.getById(orderId)
      toast.dismiss()
      toast.success(`Order ${created.orderNo} created`)

      // Upload customer drawings if any
      if (pendingDrawings.length > 0) {
        toast.loading(`Uploading ${pendingDrawings.length} drawing(s)...`)
        const results = await Promise.allSettled(
          pendingDrawings.map(d =>
            orderService.uploadCustomerDrawing(orderId, d.file, d.drawingType, d.notes)
          )
        )
        toast.dismiss()
        const failed = results.filter(r => r.status === 'rejected').length
        if (failed > 0) {
          toast.warning(`${pendingDrawings.length - failed} drawing(s) uploaded, ${failed} failed`)
        } else {
          toast.success(`${pendingDrawings.length} drawing(s) uploaded`)
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
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/orders">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">Create New Order</h1>
          <p className="text-sm text-muted-foreground">Select customer and add products</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
            <CardDescription>Fields marked * are required</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Customer */}
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer *</FormLabel>
                      <div className="flex gap-2">
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value)
                            setSelectedCustomerId(value)
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
                            {customers.map((c) => (
                              <SelectItem key={c.id} value={c.id.toString()}>
                                {c.customerName}
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Products */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <FormLabel>Products *</FormLabel>
                      <p className="text-sm text-muted-foreground">Add one or more products to this order</p>
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

                  {orderItems.length === 0 ? (
                    <div className="p-8 text-center border border-dashed rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        {selectedCustomerId
                          ? 'No products added yet. Click "Add Product" to search.'
                          : 'Select a customer first'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orderItems.map((item, index) => (
                        <div key={item.product.id} className="p-4 border rounded-lg space-y-3 bg-card">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-semibold text-sm bg-primary/10 px-2 py-0.5 rounded">
                                  Item {String.fromCharCode(65 + index)}
                                </span>
                                <p className="font-semibold text-sm truncate">{item.product.partCode}</p>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {item.product.modelName} • {item.product.rollerType} • {item.product.numberOfTeeth} teeth
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ⌀{item.product.diameter}mm × {item.product.length}mm
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

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <Label className="text-xs">Quantity *</Label>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => handleUpdateItem(item.product.id, 'quantity', Number(e.target.value))}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Due Date *</Label>
                              <Input
                                type="date"
                                value={item.dueDate}
                                onChange={(e) => handleUpdateItem(item.product.id, 'dueDate', e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Priority *</Label>
                              <Select
                                value={item.priority}
                                onValueChange={(v) => handleUpdateItem(item.product.id, 'priority', v as Priority)}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.values(Priority).map((p) => (
                                    <SelectItem key={p} value={p}>{p}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div>
                            <Label className="text-xs">Remarks (Optional)</Label>
                            <Textarea
                              placeholder="Special instructions for this product..."
                              value={item.remarks || ''}
                              onChange={(e) => handleUpdateItem(item.product.id, 'remarks', e.target.value)}
                              maxLength={500}
                              className="mt-1 resize-none"
                              rows={2}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Customer Drawings — Optional */}
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setShowDrawings(v => !v)}
                    className="flex items-center gap-2 w-full text-left"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Customer Drawings</span>
                    <span className="text-xs text-muted-foreground ml-1">(Optional)</span>
                    <span className="ml-auto">
                      {showDrawings ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </span>
                  </button>

                  {showDrawings && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-4">
                      <p className="text-xs text-blue-700">
                        Upload drawing files provided by the customer. Multiple files allowed.
                      </p>

                      {/* Add drawing row */}
                      <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] gap-3 items-end">
                        <div>
                          <Label className="text-xs">Type</Label>
                          <Select value={newDrawingType} onValueChange={setNewDrawingType}>
                            <SelectTrigger className="mt-1 w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {DRAWING_TYPES.map(t => (
                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                              ))}
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
                            key={pendingDrawings.length} // reset input after add
                          />
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={!newDrawingFile}
                          onClick={handleAddDrawing}
                          className="mb-0.5"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>

                      <div>
                        <Label className="text-xs">Notes (Optional)</Label>
                        <Input
                          placeholder="e.g. Rev 2, expected format, special instructions"
                          value={newDrawingNotes}
                          onChange={(e) => setNewDrawingNotes(e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      {/* List of staged drawings */}
                      {pendingDrawings.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-blue-900">
                            {pendingDrawings.length} file(s) staged for upload
                          </p>
                          {pendingDrawings.map((d, i) => (
                            <div key={i} className="flex items-center justify-between p-2 bg-white rounded border text-sm">
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                                <div className="min-w-0">
                                  <p className="truncate font-medium">{d.file.name}</p>
                                  <p className="text-xs text-muted-foreground capitalize">{d.drawingType}{d.notes ? ` • ${d.notes}` : ''}</p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveDrawing(i)}
                              >
                                <XCircle className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Submit */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/orders')}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="flex-1 sm:flex-none">
                    {isSubmitting ? 'Creating...' : 'Create Order'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Order Summary Sidebar */}
        <div className="space-y-4">
          {orderItems.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Products:</span>
                  <span className="font-semibold">{orderItems.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Qty:</span>
                  <span className="font-semibold">
                    {orderItems.reduce((s, i) => s + i.quantity, 0)} pcs
                  </span>
                </div>
                <Separator />
                {orderItems.map((item, index) => (
                  <div key={item.product.id} className="flex justify-between text-xs">
                    <span className="truncate flex-1 text-muted-foreground">
                      {String.fromCharCode(65 + index)}: {item.product.partCode}
                    </span>
                    <span className="font-medium ml-2">{item.quantity}x</span>
                  </div>
                ))}
                {pendingDrawings.length > 0 && (
                  <>
                    <Separator />
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Drawings:</span>
                      <span className="font-medium">{pendingDrawings.length} file(s)</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                After creating the order, each product's drawings will need to be reviewed and approved before production planning can begin.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <CreateCustomerDialog
        open={createCustomerDialogOpen}
        onOpenChange={setCreateCustomerDialogOpen}
        onSuccess={() => customerService.getAll().then(setCustomers)}
      />

      <ProductSearchDialog
        open={productSearchDialogOpen}
        onOpenChange={setProductSearchDialogOpen}
        onSelectProduct={handleAddProduct}
        excludedProductIds={orderItems.map(item => item.product.id)}
      />
    </div>
  )
}
