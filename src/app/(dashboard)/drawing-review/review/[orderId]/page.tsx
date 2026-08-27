'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, FileText, CheckCircle2, XCircle, Save, AlertTriangle, Eye, Check, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { orderService, OrderResponse } from '@/lib/api/orders'
import { productTemplateService, ProductTemplateResponse } from '@/lib/api/product-templates'
import { childPartTemplateService, ChildPartTemplateResponse } from '@/lib/api/child-part-templates'
import { drawingService, DrawingResponse, resolveDrawingFileUrl } from '@/lib/api/drawings'
import { formatDate } from '@/lib/utils/formatters'
import { DrawingPreviewDialog } from '@/components/drawing-preview-dialog'

export default function DrawingReviewDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.orderId as string

  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<OrderResponse | null>(null)
  const [productTemplates, setProductTemplates] = useState<ProductTemplateResponse[]>([])
  const [childPartTemplates, setChildPartTemplates] = useState<ChildPartTemplateResponse[]>([])
  const [drawings, setDrawings] = useState<DrawingResponse[]>([])

  const [reviewNotes, setReviewNotes] = useState('')
  const [selectedProductTemplateId, setSelectedProductTemplateId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Track which drawings have been reviewed/passed
  const [reviewedDrawings, setReviewedDrawings] = useState<Set<number>>(new Set())

  // Preview dialog
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewTitle, setPreviewTitle] = useState('')

  // Upload form state (for in-house drawing source)
  const [uploadName, setUploadName] = useState('')
  const [uploadType, setUploadType] = useState('shaft')
  const [uploadChildPartTemplateId, setUploadChildPartTemplateId] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    loadData()
  }, [orderId])

  const loadDrawingsForOrder = async (order: OrderResponse) => {
    const [orderDrawings, productDrawings] = await Promise.all([
      drawingService.getByOrderId(order.id).catch(() => []),
      order.productId ? drawingService.getByProductId(order.productId).catch(() => []) : Promise.resolve([]),
    ])
    const merged = [...orderDrawings]
    for (const d of productDrawings) {
      if (!merged.some(existing => existing.id === d.id)) merged.push(d)
    }
    return merged
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [orderData, templates, childTemplates] = await Promise.all([
        orderService.getById(Number(orderId)),
        productTemplateService.getAll(),
        childPartTemplateService.getAll(),
      ])
      setOrder(orderData)
      setProductTemplates(templates)
      setChildPartTemplates(childTemplates)
      setDrawings(await loadDrawingsForOrder(orderData))
      setReviewNotes(orderData.drawingReviewNotes || '')
      if (orderData.linkedProductTemplateId) {
        setSelectedProductTemplateId(String(orderData.linkedProductTemplateId))
      }
    } catch (err) {
      console.error('Failed to load data:', err)
    }
    setLoading(false)
  }

  const handleApprove = async () => {
    if (!selectedProductTemplateId || selectedProductTemplateId === 'new') {
      toast.error('Please select a Product Template before approving')
      return
    }
    setIsSubmitting(true)
    try {
      await orderService.approveDrawingReview(
        Number(orderId),
        'Admin',
        reviewNotes || null,
        Number(selectedProductTemplateId)
      )
      toast.success('Drawing approved! Order is now ready for Planning.')
      router.push('/drawing-review')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to approve drawing review')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRequestRevision = async () => {
    if (!reviewNotes.trim()) {
      toast.error('Please add notes explaining what needs to be revised')
      return
    }
    setIsSubmitting(true)
    try {
      await orderService.rejectDrawingReview(Number(orderId), 'Admin', reviewNotes)
      toast.success('Revision requested.')
      router.push('/drawing-review')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to request revision')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveDraft = () => {
    toast.info('Draft saved')
  }

  const handleUploadDrawing = async () => {
    if (!uploadFile || !uploadName.trim()) {
      toast.error('Please select a file and enter a drawing name')
      return
    }
    setIsUploading(true)
    try {
      await drawingService.upload(uploadFile, {
        drawingName: uploadName,
        drawingType: uploadType,
        status: 'draft',
        linkedProductId: order?.productId,
        linkedChildPartTemplateId: uploadType !== 'assembly' && uploadChildPartTemplateId
          ? Number(uploadChildPartTemplateId)
          : undefined
      })
      toast.success(`Drawing "${uploadName}" uploaded`)
      setUploadName('')
      setUploadType('shaft')
      setUploadChildPartTemplateId('')
      setUploadFile(null)
      // Reload drawings list
      if (order) setDrawings(await loadDrawingsForOrder(order))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const toggleDrawingReview = (drawingId: number) => {
    setReviewedDrawings(prev => {
      const newSet = new Set(prev)
      if (newSet.has(drawingId)) {
        newSet.delete(drawingId)
      } else {
        newSet.add(drawingId)
      }
      return newSet
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Badge variant="outline" className="border-gray-500 text-gray-700">Pending</Badge>
      case 'UnderReview':
        return <Badge variant="outline" className="border-blue-500 text-blue-700">Under Review</Badge>
      case 'Approved':
        return <Badge variant="outline" className="border-green-500 text-green-700">Approved</Badge>
      case 'Rejected':
        return <Badge variant="outline" className="border-red-500 text-red-700">Rejected</Badge>
      case 'RevisionRequired':
        return <Badge variant="outline" className="border-orange-500 text-orange-700">Revision Required</Badge>
      default:
        return null
    }
  }

  const getDrawingTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      shaft: 'bg-blue-100 text-blue-800',
      gear: 'bg-purple-100 text-purple-800',
      bearing: 'bg-green-100 text-green-800',
      assembly: 'bg-amber-100 text-amber-800',
      tikki: 'bg-pink-100 text-pink-800',
      ends: 'bg-cyan-100 text-cyan-800',
      patti: 'bg-indigo-100 text-indigo-800',
    }
    return <span className={`px-2 py-1 rounded text-xs font-medium ${colors[type] || 'bg-gray-100 text-gray-800'}`}>{type}</span>
  }

  // Get BOM items for the selected product template
  const selectedTemplate = selectedProductTemplateId && selectedProductTemplateId !== 'new'
    ? productTemplates.find(pt => pt.id === Number(selectedProductTemplateId))
    : null
  const bomItems = selectedTemplate?.bomItems || []

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <XCircle className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold">Order Not Found</h2>
        <p className="text-muted-foreground mt-2">The order you're looking for doesn't exist</p>
        <Button onClick={() => router.push('/drawing-review')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Drawing Review
        </Button>
      </div>
    )
  }

  const isApproved = order.drawingReviewStatus === 'Approved'

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/drawing-review')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Drawing Review</h1>
            <p className="text-muted-foreground">
              Order {order.orderNo} - {order.customerName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(order.drawingReviewStatus)}
          <Badge variant={order.priority === 'Urgent' ? 'destructive' : 'outline'}>
            {order.priority}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Review Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
              <CardDescription>Basic information about this order</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Order Number</Label>
                  <p className="font-medium">{order.orderNo}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Customer</Label>
                  <p className="font-medium">{order.customerName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Machine Model</Label>
                  <p className="font-medium">{order.productName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Roller Type</Label>
                  <p className="font-medium">{order.rollerType || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">No. of Teeth</Label>
                  <p className="font-medium">{(order.numberOfTeeth ?? 0) > 0 ? order.numberOfTeeth : 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Product Code</Label>
                  <p className="font-medium">{order.productCode || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Quantity</Label>
                  <p className="font-medium">{order.quantity} pcs</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Order Date</Label>
                  <p className="font-medium">{formatDate(order.orderDate)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Due Date</Label>
                  <p className="font-medium">{formatDate(order.dueDate)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Drawing Source</Label>
                  <p className="font-medium capitalize">{order.drawingSource || 'Not specified'}</p>
                </div>
              </div>
            </CardContent>
          </Card>


          {/* Drawings Table */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Order Drawings</CardTitle>
                <CardDescription>
                  Review drawings attached during order creation. Mark each drawing as reviewed/passed before approval.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload form — drawings attach to the PRODUCT (not this order), since every
                  order for that product reuses the same drawings. Available regardless of
                  review status, so a missing child-part drawing can be added at any time. */}
              <div className="border rounded-lg p-4 bg-green-50 border-green-200 space-y-3">
                  <p className="text-sm font-semibold text-green-900">
                    Upload / Attach Drawing to Product{order.productCode ? ` (${order.productCode})` : ''}
                  </p>
                  <p className="text-xs text-green-800">
                    This drawing is saved on the product, not just this order — it will show up on every order for this product.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <Label className="text-xs">Drawing Name *</Label>
                      <Input
                        placeholder="e.g. Shaft Drawing"
                        value={uploadName}
                        onChange={(e) => setUploadName(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Type *</Label>
                      <Select
                        value={uploadType}
                        onValueChange={(v) => { setUploadType(v); if (v === 'assembly') setUploadChildPartTemplateId('') }}
                      >
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
                      <Label className="text-xs">Child Part {uploadType === 'assembly' && '(n/a for Assembly)'}</Label>
                      <Select
                        value={uploadChildPartTemplateId}
                        onValueChange={setUploadChildPartTemplateId}
                        disabled={uploadType === 'assembly'}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select child part" />
                        </SelectTrigger>
                        <SelectContent>
                          {childPartTemplates.map(cpt => (
                            <SelectItem key={cpt.id} value={String(cpt.id)}>
                              {cpt.templateName} ({cpt.templateCode})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">File *</Label>
                      <Input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.dwg"
                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleUploadDrawing}
                    disabled={isUploading || !uploadFile || !uploadName.trim()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploading ? 'Uploading...' : 'Upload Drawing'}
                  </Button>
                </div>

              {drawings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p>No drawings attached to this order</p>
                  {order.drawingSource === 'company'
                    ? <p className="text-sm mt-1">Upload drawings using the form above</p>
                    : <p className="text-sm mt-1">Drawings should be uploaded during order creation</p>
                  }
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40px]">#</TableHead>
                        <TableHead>Drawing No</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Child Part</TableHead>
                        <TableHead>Revision</TableHead>
                        <TableHead>File</TableHead>
                        <TableHead className="w-[100px]">Review Status</TableHead>
                        <TableHead className="w-[80px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {drawings.map((drawing, idx) => {
                        const isReviewed = reviewedDrawings.has(drawing.id)
                        return (
                          <TableRow
                            key={drawing.id}
                            className="hover:bg-muted/50"
                          >
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell className="font-mono text-sm">{drawing.drawingNumber}</TableCell>
                            <TableCell className="font-medium">{drawing.drawingName}</TableCell>
                            <TableCell>{getDrawingTypeBadge(drawing.drawingType)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {drawing.drawingType === 'assembly'
                                ? <span className="italic">Assembly</span>
                                : drawing.linkedChildPartTemplateName || '—'}
                            </TableCell>
                            <TableCell className="text-sm">{drawing.revision || '—'}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {drawing.fileName ? (
                                drawing.fileUrl ? (
                                  <button onClick={() => { setPreviewUrl(resolveDrawingFileUrl(drawing.fileUrl!)); setPreviewTitle(drawing.drawingName || drawing.fileName || 'Drawing') }} className="flex items-center gap-1 text-blue-600 hover:underline text-left">
                                    <FileText className="h-3 w-3" />
                                    {drawing.fileName.length > 20 ? drawing.fileName.substring(0, 20) + '...' : drawing.fileName}
                                  </button>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    {drawing.fileName.length > 20 ? drawing.fileName.substring(0, 20) + '...' : drawing.fileName}
                                  </span>
                                )
                              ) : '—'}
                            </TableCell>
                            <TableCell>
                              {!isApproved && (
                                <Button
                                  size="sm"
                                  variant={isReviewed ? "default" : "outline"}
                                  className={isReviewed ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleDrawingReview(drawing.id)
                                  }}
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  {isReviewed ? 'Passed' : 'Mark'}
                                </Button>
                              )}
                              {isApproved && (
                                <Badge variant="default" className="bg-green-600 text-xs">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Passed
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {drawing.fileUrl ? (
                                <Button size="sm" variant="ghost" title="Open drawing" onClick={() => { setPreviewUrl(resolveDrawingFileUrl(drawing.fileUrl!)); setPreviewTitle(drawing.drawingName || drawing.fileName || 'Drawing') }}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button size="sm" variant="ghost" disabled title="No file attached">
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Template Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Product Template Selection</CardTitle>
              <CardDescription>
                Link existing template or create new one based on drawing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product-template">Product Template *</Label>
                <Select
                  value={selectedProductTemplateId}
                  onValueChange={setSelectedProductTemplateId}
                  disabled={isApproved}
                >
                  <SelectTrigger id="product-template">
                    <SelectValue placeholder="Select existing template or create new" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">+ Create New Template</SelectItem>
                    {productTemplates.map(template => (
                      <SelectItem key={template.id} value={String(template.id)}>
                        {template.templateName} - {template.templateCode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Select an existing template for standard products or create a new one for custom requirements
                </p>
              </div>

              {selectedTemplate && (
                <div className="space-y-2">
                  <Label>Child Parts (BOM Items)</Label>
                  <div className="border rounded-lg p-4 space-y-2">
                    {bomItems.length > 0 ? (
                      bomItems.map(item => (
                        <div key={item.id} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span>{item.childPartTemplateName}</span>
                          <Badge variant="secondary" className="text-xs">
                            {item.childPartType}
                          </Badge>
                          <span className="text-xs text-muted-foreground ml-auto">Qty: {item.quantity}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No child parts linked to this template</p>
                    )}
                  </div>
                  {selectedTemplate.processTemplateName && (
                    <p className="text-xs text-muted-foreground">
                      Assembly process: {selectedTemplate.processTemplateName}
                    </p>
                  )}
                </div>
              )}

              {selectedProductTemplateId === 'new' && (
                <div className="border rounded-lg p-4 bg-blue-50 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900">Create New Template</p>
                      <p className="text-sm text-blue-700 mt-1">
                        After approval, you'll be redirected to create a new product template based on this drawing.
                        You can define all child parts and processes there.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          {/* Review Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Review Notes</CardTitle>
              <CardDescription>Add comments or revision requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add review notes, clarifications needed, or revision instructions..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={6}
                  disabled={isApproved}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {!isApproved && (
            <Card>
              <CardHeader>
                <CardTitle>Review Actions</CardTitle>
                <CardDescription>Approve or request revision</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Warning if not all drawings reviewed */}
                {drawings.length > 0 && reviewedDrawings.size < drawings.length && (
                  <div className="border border-orange-200 rounded-lg p-3 bg-orange-50 flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-orange-900">Not all drawings reviewed</p>
                      <p className="text-xs text-orange-700 mt-1">
                        Please mark all drawings as reviewed/passed before approving ({reviewedDrawings.size}/{drawings.length} reviewed)
                      </p>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleApprove}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                  disabled={!selectedProductTemplateId || selectedProductTemplateId === 'new' || isSubmitting}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Approving...' : 'Approve & Release to Planning'}
                </Button>

                <Button
                  onClick={handleRequestRevision}
                  variant="outline"
                  className="w-full border-orange-500 text-orange-700 hover:bg-orange-50"
                  size="lg"
                  disabled={isSubmitting}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Request Revision
                </Button>

                <Button
                  onClick={handleSaveDraft}
                  variant="outline"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Draft
                </Button>
              </CardContent>
            </Card>
          )}

          {isApproved && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-900">Drawing Approved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Reviewed by: {order.drawingReviewedBy || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Date: {formatDate(order.drawingReviewedAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Template: {selectedTemplate?.templateName || 'Not linked'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <p className="text-muted-foreground">Status</p>
                <p className="font-medium">{order.drawingReviewStatus}</p>
              </div>
              <div className="text-sm">
                <p className="text-muted-foreground">Priority</p>
                <p className="font-medium">{order.priority}</p>
              </div>
              <div className="text-sm">
                <p className="text-muted-foreground">Total Drawings</p>
                <p className="font-medium">{drawings.length} attached</p>
              </div>
              <div className="text-sm">
                <p className="text-muted-foreground">Drawings Reviewed</p>
                <p className="font-medium">
                  {reviewedDrawings.size} / {drawings.length}
                  {reviewedDrawings.size === drawings.length && drawings.length > 0 && (
                    <CheckCircle2 className="inline-block h-4 w-4 ml-2 text-green-600" />
                  )}
                </p>
              </div>
              <div className="text-sm">
                <p className="text-muted-foreground">Planning Status</p>
                <p className="font-medium">{order.planningStatus}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <DrawingPreviewDialog
        open={!!previewUrl}
        onOpenChange={(v) => { if (!v) setPreviewUrl(null) }}
        url={previewUrl}
        title={previewTitle}
      />
    </div>
  )
}
