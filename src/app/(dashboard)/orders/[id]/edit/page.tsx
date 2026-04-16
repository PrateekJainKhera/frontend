"use client"

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Upload, Trash2, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { orderService, OrderResponse, OrderCustomerDrawing } from '@/lib/api/orders'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils/formatters'

interface ItemFormState {
  id: number
  itemSequence: string
  productName: string
  partCode: string
  quantity: number
  dueDate: string
  priority: string
  remarks: string
  status: string
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    load()
  }, [orderId])

  const load = async () => {
    setLoading(true)
    try {
      const [ord, drawings] = await Promise.all([
        orderService.getById(orderId),
        orderService.getCustomerDrawings(orderId),
      ])
      setOrder(ord)
      setDrawings(drawings)

      // Build item form states from order items
      if (ord.items && ord.items.length > 0) {
        setItems(ord.items.map(item => ({
          id: item.id,
          itemSequence: item.itemSequence,
          productName: item.productName || '',
          partCode: item.partCode || '',
          quantity: item.quantity,
          dueDate: item.dueDate ? item.dueDate.slice(0, 10) : '',
          priority: item.priority || 'Medium',
          remarks: item.remarks || '',
          status: item.status,
        })))
      } else {
        // Single-item order (legacy)
        setItems([{
          id: 0,
          itemSequence: 'A',
          productName: ord.productName || '',
          partCode: ord.productCode || '',
          quantity: ord.quantity,
          dueDate: ord.dueDate ? ord.dueDate.slice(0, 10) : '',
          priority: ord.priority || 'Medium',
          remarks: '',
          status: ord.status,
        }])
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load order')
    } finally {
      setLoading(false)
    }
  }

  const updateItemField = (index: number, field: keyof ItemFormState, value: string | number) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  const handleSave = async () => {
    // Validate
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
      // Update each item
      const hasMultipleItems = order?.items && order.items.length > 0

      if (hasMultipleItems) {
        await Promise.all(items.map(item =>
          orderService.updateOrderItem(orderId, item.id, {
            quantity: item.quantity,
            dueDate: new Date(item.dueDate).toISOString(),
            priority: item.priority,
            remarks: item.remarks,
            updatedBy: 'Admin',
          })
        ))
      } else {
        // Legacy single-item: use updateQuantity for quantity
        const item = items[0]
        if (order && item.quantity !== order.quantity) {
          await orderService.updateQuantity(orderId, item.quantity)
        }
      }

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
      toast.success('Drawing uploaded successfully')
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

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Order not found</p>
        <Button asChild className="mt-4">
          <Link href="/orders">Back to Orders</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/orders/${orderId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
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
          <CardDescription>Update quantity, due date, priority and remarks for each product</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {items.map((item, index) => (
            <div key={item.id || index} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="font-mono text-base px-3 py-1">
                  {item.itemSequence}
                </Badge>
                <div>
                  <p className="font-semibold">{item.partCode}</p>
                  {item.productName && <p className="text-sm text-muted-foreground">{item.productName}</p>}
                </div>
                <Badge variant={
                  item.status === 'Completed' ? 'default' :
                  item.status === 'In Progress' ? 'secondary' : 'outline'
                } className="ml-auto">
                  {item.status}
                </Badge>
              </div>

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
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
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
                    {formatFileSize(drawing.fileSize)} · {formatDate(drawing.uploadedAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" asChild>
                  <a href={drawing.downloadUrl} target="_blank" rel="noopener noreferrer">View</a>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
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
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.dwg,.dxf,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingDrawing}
            >
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
    </div>
  )
}
