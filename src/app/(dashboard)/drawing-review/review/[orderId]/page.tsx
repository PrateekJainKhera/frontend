'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, FileText, CheckCircle2, XCircle, Save, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { mockOrders } from '@/lib/mock-data'
import { mockProductTemplates } from '@/lib/mock-data/product-templates'
import { mockChildPartTemplates } from '@/lib/mock-data/child-part-templates'
import { simulateApiCall } from '@/lib/utils/mock-api'
import { Order, DrawingReviewStatus } from '@/types'
import { formatDate } from '@/lib/utils/formatters'

export default function DrawingReviewDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.orderId as string

  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<Order | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [selectedProductTemplateId, setSelectedProductTemplateId] = useState('')
  const [selectedChildPartTemplateIds, setSelectedChildPartTemplateIds] = useState<string[]>([])

  useEffect(() => {
    loadData()
  }, [orderId])

  const loadData = async () => {
    setLoading(true)
    const ordersData = await simulateApiCall(mockOrders, 500)
    const foundOrder = ordersData.find(o => o.id === orderId)

    if (foundOrder) {
      setOrder(foundOrder)
      setReviewNotes(foundOrder.drawingReviewNotes || '')
      setSelectedProductTemplateId(foundOrder.linkedProductTemplateId || '')
      setSelectedChildPartTemplateIds(foundOrder.linkedChildPartTemplateIds || [])
    }

    setLoading(false)
  }

  const handleApprove = () => {
    if (!selectedProductTemplateId) {
      alert('Please select a Product Template before approving')
      return
    }

    // In real app, this would call API
    console.log('Approving drawing review:', {
      orderId,
      status: DrawingReviewStatus.APPROVED,
      productTemplateId: selectedProductTemplateId,
      childPartTemplateIds: selectedChildPartTemplateIds,
      notes: reviewNotes
    })

    alert('Drawing approved! Order is now ready for Planning.')
    router.push('/drawing-review')
  }

  const handleRequestRevision = () => {
    if (!reviewNotes.trim()) {
      alert('Please add notes explaining what needs to be revised')
      return
    }

    // In real app, this would call API
    console.log('Requesting revision:', {
      orderId,
      status: DrawingReviewStatus.NEEDS_REVISION,
      notes: reviewNotes
    })

    alert('Revision requested. Customer/sales will be notified.')
    router.push('/drawing-review')
  }

  const handleSaveDraft = () => {
    // In real app, this would call API
    console.log('Saving draft:', {
      orderId,
      status: DrawingReviewStatus.IN_REVIEW,
      productTemplateId: selectedProductTemplateId,
      childPartTemplateIds: selectedChildPartTemplateIds,
      notes: reviewNotes
    })

    alert('Draft saved successfully')
  }

  const getStatusBadge = (status: DrawingReviewStatus) => {
    switch (status) {
      case DrawingReviewStatus.PENDING:
        return <Badge variant="outline" className="border-gray-500 text-gray-700">Pending</Badge>
      case DrawingReviewStatus.IN_REVIEW:
        return <Badge variant="outline" className="border-blue-500 text-blue-700">In Review</Badge>
      case DrawingReviewStatus.APPROVED:
        return <Badge variant="outline" className="border-green-500 text-green-700">Approved</Badge>
      case DrawingReviewStatus.NEEDS_REVISION:
        return <Badge variant="outline" className="border-orange-500 text-orange-700">Needs Revision</Badge>
    }
  }

  // Get child part templates for selected product template
  const availableChildPartTemplates = selectedProductTemplateId
    ? mockChildPartTemplates.filter(cpt =>
        mockProductTemplates
          .find(pt => pt.id === selectedProductTemplateId)
          ?.childParts?.some(linked => linked.childPartTemplateId === cpt.id)
      )
    : []

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

  const isApproved = order.drawingReviewStatus === DrawingReviewStatus.APPROVED

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
              Order {order.orderNo} - {order.customer?.name}
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
                  <p className="font-medium">{order.customer?.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Product</Label>
                  <p className="font-medium">{order.product?.modelName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Roller Type</Label>
                  <p className="font-medium">{order.product?.rollerType || 'N/A'}</p>
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
                {order.primaryDrawingNumber && (
                  <>
                    <div>
                      <Label className="text-muted-foreground">Drawing Number</Label>
                      <p className="font-medium">{order.primaryDrawingNumber}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Drawing Revision</Label>
                      <p className="font-medium">{order.primaryDrawingRevision}</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Drawing Viewer */}
          <Card>
            <CardHeader>
              <CardTitle>Drawing Preview</CardTitle>
              <CardDescription>Customer provided drawing for review</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-8 bg-muted/30 flex flex-col items-center justify-center min-h-96">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  {order.primaryDrawingNumber ? (
                    <>
                      Drawing: {order.primaryDrawingNumber}<br />
                      Revision: {order.primaryDrawingRevision}<br />
                      <span className="text-xs">PDF/CAD viewer would appear here</span>
                    </>
                  ) : (
                    'No drawing attached'
                  )}
                </p>
                {order.primaryDrawingNumber && (
                  <Button variant="outline" className="mt-4">
                    Download Drawing
                  </Button>
                )}
              </div>
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
                    {mockProductTemplates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.templateName} - {template.templateCode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Select an existing template for standard products or create a new one for custom requirements
                </p>
              </div>

              {selectedProductTemplateId && selectedProductTemplateId !== 'new' && (
                <div className="space-y-2">
                  <Label>Included Child Part Templates</Label>
                  <div className="border rounded-lg p-4 space-y-2">
                    {availableChildPartTemplates.length > 0 ? (
                      availableChildPartTemplates.map(cpt => (
                        <div key={cpt.id} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span>{cpt.templateName}</span>
                          <Badge variant="secondary" className="text-xs">
                            {cpt.childPartType}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No child parts linked to this template</p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You can override these child parts after approval if needed
                  </p>
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
                <Button
                  onClick={handleApprove}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                  disabled={!selectedProductTemplateId}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve & Release to Planning
                </Button>

                <Button
                  onClick={handleRequestRevision}
                  variant="outline"
                  className="w-full border-orange-500 text-orange-700 hover:bg-orange-50"
                  size="lg"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Request Revision
                </Button>

                <Button
                  onClick={handleSaveDraft}
                  variant="outline"
                  className="w-full"
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
                    <span>Reviewed by: {order.reviewedBy}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Date: {order.reviewedAt ? formatDate(order.reviewedAt) : 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Template: {order.linkedProductTemplateId || 'Not linked'}</span>
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
                <p className="text-muted-foreground">Drawing Source</p>
                <p className="font-medium capitalize">{order.drawingSource || 'Not specified'}</p>
              </div>
              {order.planningStatus && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Planning Status</p>
                  <p className="font-medium">{order.planningStatus}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
