"use client"

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Upload, Trash2, FileText, Loader2, RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { orderService, OrderResponse, OrderCustomerDrawing } from '@/lib/api/orders'
import { productService } from '@/lib/api/products'
import { ProductSearchDialog } from '@/components/dialogs/product-search-dialog'
import { Product } from '@/types'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils/formatters'

interface ItemFormState {
  id: number
  itemSequence: string
  productId: number
  productName: string
  partCode: string
  quantity: number
  dueDate: string
  priority: string
  remarks: string
  status: string
  productChanged: boolean
  // Product spec fields (editable)
  numberOfTeeth: string
  // Original values to detect changes
  _origNumberOfTeeth: string
  // Full product needed for update
  _product: Product | null
}

function specChanged(item: ItemFormState): boolean {
  return item.numberOfTeeth !== item._origNumberOfTeeth
}

export default function EditOrderPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = Number(params.id)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [order, setOrder] = useState<OrderResponse | null>(null)
  const [items, setItems] = useState<ItemFormState[]>([])
  const [drawings, setDrawings] = useState<OrderCustomerDrawing[]>([])
  const [uploadingDrawing, setUploadingDrawing] = useState(false)
  const [deletingDrawingId, setDeletingDrawingId] = useState<number | null>(null)
  const [changingProductIndex, setChangingProductIndex] = useState<number | null>(null)
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { load() }, [orderId])

  const buildItemState = (
    id: number, seq: string, productId: number, productName: string,
    partCode: string, quantity: number, dueDate: string, priority: string,
    remarks: string, status: string, product: Product | null
  ): ItemFormState => {
    const teeth = product?.numberOfTeeth ? String(product.numberOfTeeth) : ''
    return {
      id, itemSequence: seq, productId, productName, partCode,
      quantity, dueDate, priority, remarks, status,
      productChanged: false,
      numberOfTeeth: teeth,
      _origNumberOfTeeth: teeth,
      _product: product,
    }
  }

  const load = async () => {
    setLoading(true)
    try {
      const [ord, drw] = await Promise.all([
        orderService.getById(orderId),
        orderService.getCustomerDrawings(orderId),
      ])
      setOrder(ord)
      setDrawings(drw)

      if (ord.items && ord.items.length > 0) {
        const built = await Promise.all(ord.items.map(async item => {
          let product: Product | null = null
          try { product = await productService.getById(item.productId) } catch {}
          return buildItemState(
            item.id, item.itemSequence, item.productId,
            item.productName || '', item.partCode || '',
            item.quantity, item.dueDate ? item.dueDate.slice(0, 10) : '',
            item.priority || 'Medium', item.remarks || '', item.status, product
          )
        }))
        setItems(built)
      } else {
        let product: Product | null = null
        try { product = await productService.getById(ord.productId) } catch {}
        setItems([buildItemState(
          0, 'A', ord.productId, ord.productName || '', ord.productCode || '',
          ord.quantity, ord.dueDate ? ord.dueDate.slice(0, 10) : '',
          ord.priority || 'Medium', '', ord.status, product
        )])
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load order')
    } finally {
      setLoading(false)
    }
  }

  const updateItemField = (index: number, field: keyof ItemFormState, value: string | number | boolean | null) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  const handleDeleteItem = async (item: ItemFormState) => {
    if (!confirm(`Delete item ${item.itemSequence} (${item.partCode || item.productName})? This cannot be undone.`)) return
    setDeletingItemId(item.id)
    try {
      await orderService.deleteOrderItem(orderId, item.id)
      setItems(prev => prev.filter(i => i.id !== item.id))
      toast.success(`Item ${item.itemSequence} deleted`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete item')
    } finally {
      setDeletingItemId(null)
    }
  }

  const handleProductSelected = (product: Product) => {
    if (changingProductIndex === null) return
    const teeth = product.numberOfTeeth ? String(product.numberOfTeeth) : ''
    setItems(prev => prev.map((item, i) =>
      i === changingProductIndex ? {
        ...item,
        productId: product.id, productName: product.modelName, partCode: product.partCode,
        productChanged: true, _product: product,
        numberOfTeeth: teeth,
        _origNumberOfTeeth: teeth,
      } : item
    ))
    setChangingProductIndex(null)
    toast.success(`Product changed to ${product.partCode}`)
  }

  const handleSave = async () => {
    for (const item of items) {
      if (item.quantity < 1) {
        toast.error(`Quantity must be at least 1 for item ${item.itemSequence}`)
        return
      }
      if (!item.dueDate) {
        toast.error(`Due date is required for item ${item.itemSequence}`)
        return
      }
    }

    setSaving(true)
    try {
      const hasMultipleItems = order?.items && order.items.length > 0

      // Save order items
      if (hasMultipleItems) {
        await Promise.all(items.map(item =>
          orderService.updateOrderItem(orderId, item.id, {
            ...(item.productChanged && { productId: item.productId, productName: item.productName }),
            quantity: item.quantity,
            dueDate: new Date(item.dueDate).toISOString(),
            priority: item.priority,
            remarks: item.remarks,
            updatedBy: 'Admin',
          })
        ))
      } else {
        const item = items[0]
        if (order && item.quantity !== order.quantity) {
          await orderService.updateQuantity(orderId, item.quantity)
        }
      }

      // Save product specs for any item where specs changed
      await Promise.all(
        items
          .filter(item => specChanged(item) && item._product)
          .map(item => {
            const p = item._product!
            return productService.update(item.productId, {
              id: item.productId,
              partCode: p.partCode,
              customerName: p.customerName,
              modelId: p.modelId,
              rollerType: p.rollerType,
              diameter: p.diameter,
              length: p.length,
              materialGrade: p.materialGrade,
              numberOfTeeth: item.numberOfTeeth ? Number(item.numberOfTeeth) : p.numberOfTeeth,
              surfaceFinish: p.surfaceFinish,
              hardness: p.hardness,
              processTemplateId: p.processTemplateId,
              productTemplateId: p.productTemplateId,
              drawingNo: p.drawingNo,
              revisionNo: p.revisionNo,
              updatedBy: 'Admin',
            })
          })
      )

      toast.success('Order updated successfully')
      router.push(`/orders/${orderId}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setUploadingDrawing(true)
    try {
      const drawing = await orderService.uploadCustomerDrawing(orderId, file, 'customer')
      setDrawings(prev => [...prev, drawing])
      toast.success('Drawing uploaded')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload drawing')
    } finally {
      setUploadingDrawing(false)
    }
  }

  const handleDeleteDrawing = async (drawingId: number) => {
    setDeletingDrawingId(drawingId)
    try {
      await orderService.deleteCustomerDrawing(orderId, drawingId)
      setDrawings(prev => prev.filter(d => d.id !== drawingId))
      toast.success('Drawing deleted')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete drawing')
    } finally {
      setDeletingDrawingId(null)
    }
  }

  const fmtSize = (bytes?: number | null) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (loading) return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-64" />
      <Skeleton className="h-96" />
    </div>
  )

  if (!order) return (
    <div className="text-center py-12">
      <p className="text-muted-foreground">Order not found</p>
      <Button asChild className="mt-4"><Link href="/orders">Back to Orders</Link></Button>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/orders/${orderId}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Order</h1>
          <p className="text-muted-foreground text-sm">{order.orderNo} — {order.customerName}</p>
        </div>
      </div>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
          <CardDescription>Edit product specifications, quantity, due date, priority and remarks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {items.map((item, index) => (
            <div key={item.id || index} className="border rounded-lg p-4 space-y-4">

              {/* Item header */}
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="outline" className="font-mono text-base px-3 py-1 shrink-0">
                  {item.itemSequence}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold font-mono">{item.partCode || '—'}</p>
                  {item.productName && <p className="text-sm text-muted-foreground">{item.productName}</p>}
                  {item.productChanged && (
                    <p className="text-xs text-amber-600 font-medium mt-0.5">Product replaced — will be saved</p>
                  )}
                  {!item.productChanged && specChanged(item) && (
                    <p className="text-xs text-blue-600 font-medium mt-0.5">Specifications changed — will be saved</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={item.status === 'Completed' ? 'default' : item.status === 'In Progress' ? 'secondary' : 'outline'}>
                    {item.status}
                  </Badge>
                  {item.status !== 'Completed' && item.status !== 'In Progress' && (
                    <Button size="sm" variant="outline" onClick={() => setChangingProductIndex(index)}>
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                      Change Product
                    </Button>
                  )}
                  {item.status !== 'Completed' && item.status !== 'In Progress' && items.length > 1 && (
                    <Button
                      size="sm" variant="outline"
                      className="text-destructive hover:text-destructive hover:border-destructive"
                      onClick={() => handleDeleteItem(item)}
                      disabled={deletingItemId === item.id}
                    >
                      {deletingItemId === item.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <X className="h-3.5 w-3.5" />}
                    </Button>
                  )}
                </div>
              </div>

              {/* Product Specifications */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Product Specifications
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Number of Teeth</Label>
                    <Input
                      type="number"
                      min={0}
                      value={item.numberOfTeeth}
                      onChange={e => updateItemField(index, 'numberOfTeeth', e.target.value)}
                      placeholder="e.g. 92"
                      className={item.numberOfTeeth !== item._origNumberOfTeeth ? 'border-blue-400' : ''}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Order Fields */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Order Details
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={e => updateItemField(index, 'quantity', Number(e.target.value))}
                      disabled={item.status === 'Completed'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      value={item.dueDate}
                      onChange={e => updateItemField(index, 'dueDate', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={item.priority} onValueChange={v => updateItemField(index, 'priority', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Remarks</Label>
                    <Input
                      value={item.remarks}
                      onChange={e => updateItemField(index, 'remarks', e.target.value)}
                      placeholder="Optional notes"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Customer Drawings */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Drawings</CardTitle>
          <CardDescription>Upload or remove customer-provided drawing files</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {drawings.length === 0 && (
            <p className="text-sm text-muted-foreground">No drawings uploaded yet.</p>
          )}
          {drawings.map(drawing => (
            <div key={drawing.id} className="flex items-center justify-between border rounded-lg p-3">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{drawing.originalFileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {fmtSize(drawing.fileSize)} · {formatDate(drawing.uploadedAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" asChild>
                  <a href={drawing.downloadUrl} target="_blank" rel="noopener noreferrer">View</a>
                </Button>
                <Button
                  variant="outline" size="sm"
                  onClick={() => handleDeleteDrawing(drawing.id)}
                  disabled={deletingDrawingId === drawing.id}
                >
                  {deletingDrawingId === drawing.id
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Trash2 className="h-4 w-4 text-destructive" />}
                </Button>
              </div>
            </div>
          ))}
          <div>
            <input ref={fileInputRef} type="file" className="hidden"
              accept=".pdf,.dwg,.dxf,.jpg,.jpeg,.png" onChange={handleFileUpload} />
            <Button type="button" variant="outline"
              onClick={() => fileInputRef.current?.click()} disabled={uploadingDrawing}>
              {uploadingDrawing
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
                : <><Upload className="mr-2 h-4 w-4" /> Upload Drawing</>}
            </Button>
            <p className="text-xs text-muted-foreground mt-1">Accepted: PDF, DWG, DXF, JPG, PNG</p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" asChild>
          <Link href={`/orders/${orderId}`}>Cancel</Link>
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving
            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
            : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
        </Button>
      </div>

      {/* Product Search Dialog */}
      <ProductSearchDialog
        open={changingProductIndex !== null}
        onOpenChange={open => { if (!open) setChangingProductIndex(null) }}
        onSelectProduct={handleProductSelected}
      />
    </div>
  )
}
