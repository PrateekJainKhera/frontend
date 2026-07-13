'use client'
import { getCurrentUserName } from '@/lib/auth'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Upload, CheckCircle2, XCircle, AlertTriangle, FileText, SendHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { productService, ProductChildPartDrawingResponse } from '@/lib/api/products'
import { drawingService, DrawingResponse } from '@/lib/api/drawings'
import { Product } from '@/types/product'
import { formatDate } from '@/lib/utils/formatters'
import { toast } from 'sonner'
import { DrawingPreviewDialog } from '@/components/drawing-preview-dialog'

export default function ProductDrawingReviewPage() {
  const params = useParams()
  const router = useRouter()
  const productId = parseInt(params.productId as string)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [product, setProduct] = useState<Product | null>(null)

  // Drawing state
  const [assemblyDrawing, setAssemblyDrawing] = useState<DrawingResponse | null>(null)
  const [childPartDrawings, setChildPartDrawings] = useState<ProductChildPartDrawingResponse[]>([])

  // Preview dialog state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewTitle, setPreviewTitle] = useState('')

  // Form state
  const [reviewNotes, setReviewNotes] = useState('')

  useEffect(() => {
    loadProduct()
  }, [productId])

  const loadProduct = async () => {
    setLoading(true)
    try {
      const data = await productService.getById(productId)
      setProduct(data)
      setReviewNotes(data.drawingReviewNotes || '')

      // Load assembly drawing if exists
      if (data.assemblyDrawingId) {
        try {
          const assemblyDrawingData = await drawingService.getById(data.assemblyDrawingId)
          setAssemblyDrawing(assemblyDrawingData)
        } catch (err) {
          console.error('Failed to load assembly drawing:', err)
        }
      }

      // Load child part drawings
      try {
        const childDrawings = await productService.getChildPartDrawings(productId)
        setChildPartDrawings(childDrawings)
      } catch (err) {
        console.error('Failed to load child part drawings:', err)
      }
    } catch (err) {
      console.error('Failed to load product:', err)
      toast.error('Failed to load product details')
    }
    setLoading(false)
  }

  const handleReviewAction = async (status: string) => {
    if (!product) return
    setSubmitting(true)
    try {
      await productService.updateDrawingReviewStatus(productId, {
        drawingReviewStatus: status,
        drawingReviewNotes: reviewNotes,
        drawingReviewedBy: getCurrentUserName()
      })
      const msg = status === 'Approved' ? 'Drawing approved successfully'
        : status === 'Rejected' ? 'Drawing rejected'
        : 'Revision requested'
      toast.success(msg)
      router.push('/drawing-review')
    } catch (err) {
      console.error('Failed to update review status:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update review status'
      toast.error(errorMessage)
    }
    setSubmitting(false)
  }

  const handleRequestDrawing = async () => {
    if (!product) return

    setSubmitting(true)
    try {
      await productService.requestDrawing(productId, 'Admin') // TODO: Should come from auth context

      toast.success('Drawing request sent to drawing team successfully')
      await loadProduct() // Reload to get updated status
    } catch (err) {
      console.error('Failed to request drawing:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to request drawing'
      toast.error(errorMessage)
    }
    setSubmitting(false)
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

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertTriangle className="h-12 w-12 text-orange-600 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
        <p className="text-muted-foreground mb-4">The requested product could not be found.</p>
        <Button onClick={() => router.push('/drawing-review')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Drawing Review
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/drawing-review')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{product.partCode}</h1>
            <p className="text-muted-foreground mt-1">
              Product Drawing Review & Approval
            </p>
          </div>
        </div>
        {getStatusBadge(product.drawingReviewStatus)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Product Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Information */}
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
              <CardDescription>Basic product specifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Part Code</Label>
                  <p className="font-medium">{product.partCode}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Customer</Label>
                  <p className="font-medium">{product.customerName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Machine Model</Label>
                  <p className="font-medium">{product.modelName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Roller Type</Label>
                  <p className="font-medium">{product.rollerType}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Diameter</Label>
                  <p className="font-medium">{product.diameter} mm</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Length</Label>
                  <p className="font-medium">{product.length} mm</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Number of Teeth</Label>
                  <p className="font-medium">{product.numberOfTeeth || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Material Grade</Label>
                  <p className="font-medium">{product.materialGrade}</p>
                </div>
                {product.surfaceFinish && (
                  <div>
                    <Label className="text-muted-foreground">Surface Finish</Label>
                    <p className="font-medium">{product.surfaceFinish}</p>
                  </div>
                )}
                {product.hardness && (
                  <div>
                    <Label className="text-muted-foreground">Hardness</Label>
                    <p className="font-medium">{product.hardness}</p>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground">Created</Label>
                  <p className="font-medium">{formatDate(product.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created By</Label>
                  <p className="font-medium">{product.createdBy}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assembly Drawing Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Assembly Drawing
              </CardTitle>
              <CardDescription>
                Main product assembly drawing (required for production)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assemblyDrawing ? (
                <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50 border-green-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">{assemblyDrawing.fileName || assemblyDrawing.drawingName}</p>
                      <p className="text-sm text-muted-foreground">
                        {assemblyDrawing.drawingNumber && `Drawing: ${assemblyDrawing.drawingNumber} • `}
                        {assemblyDrawing.fileSize && `${assemblyDrawing.fileSize.toFixed(2)} KB`}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { if (assemblyDrawing.fileUrl) { setPreviewUrl(assemblyDrawing.fileUrl); setPreviewTitle(assemblyDrawing.fileName || assemblyDrawing.drawingName || 'Assembly Drawing') } }}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    View Drawing
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg">
                  <Upload className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium mb-1">No Assembly Drawing Uploaded</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Go to Upload Drawings page to upload the assembly drawing
                  </p>
                  <Button size="sm" onClick={() => router.push(`/drawing-review/products/${productId}/upload-drawings`)}>
                    <Upload className="mr-2 h-4 w-4" />
                    Go to Upload
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Provided Drawing (Optional) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Customer Provided Drawing
              </CardTitle>
              <CardDescription>
                Optional reference drawing provided by customer (not used for production)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {product.customerProvidedDrawingId ? (
                <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50 border-blue-200">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Reference Drawing Available</p>
                      <p className="text-sm text-muted-foreground">Drawing ID: {product.customerProvidedDrawingId}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <FileText className="mr-2 h-4 w-4" />
                    View Reference
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="text-sm">No customer reference drawing provided</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Child Part Drawings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Child Part Drawings ({childPartDrawings.length})
              </CardTitle>
              <CardDescription>
                Individual drawings for each child part in the product BOM
              </CardDescription>
            </CardHeader>
            <CardContent>
              {childPartDrawings.length > 0 ? (
                <div className="space-y-3">
                  {childPartDrawings.map((drawing) => (
                    <div key={drawing.id} className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-sm">{drawing.childPartTemplateName}</p>
                          <p className="text-xs text-muted-foreground">
                            {drawing.fileName} • {drawing.fileSize?.toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { if (drawing.fileUrl) { setPreviewUrl(drawing.fileUrl); setPreviewTitle(drawing.childPartTemplateName || drawing.fileName || 'Drawing') } }}
                      >
                        <FileText className="mr-1 h-3 w-3" />
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  <FileText className="h-12 w-12 mx-auto mb-3" />
                  <p className="text-sm font-medium mb-1">No child part drawings uploaded yet</p>
                  <p className="text-xs mb-4">Go to Upload Drawings page to upload child part drawings</p>
                  <Button size="sm" onClick={() => router.push(`/drawing-review/products/${productId}/upload-drawings`)}>
                    <Upload className="mr-2 h-4 w-4" />
                    Go to Upload
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Review Actions */}
        <div className="space-y-6">
          {/* Current Review Status */}
          <Card>
            <CardHeader>
              <CardTitle>Review Status</CardTitle>
              <CardDescription>Current drawing review status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Status</Label>
                {getStatusBadge(product.drawingReviewStatus)}
              </div>
              {product.drawingReviewedBy && (
                <div>
                  <Label className="text-muted-foreground">Reviewed By</Label>
                  <p className="font-medium">{product.drawingReviewedBy}</p>
                </div>
              )}
              {product.drawingReviewedAt && (
                <div>
                  <Label className="text-muted-foreground">Reviewed At</Label>
                  <p className="font-medium">{formatDate(product.drawingReviewedAt)}</p>
                </div>
              )}
              {product.drawingReviewNotes && (
                <div>
                  <Label className="text-muted-foreground">Notes</Label>
                  <p className="text-sm">{product.drawingReviewNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Review Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Review Actions</CardTitle>
              <CardDescription>
                {product.drawingReviewStatus === 'UnderReview'
                  ? 'Drawings uploaded — review and take action'
                  : product.drawingReviewStatus === 'Pending'
                  ? 'Waiting for drawing team to upload'
                  : 'Review completed'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {product.drawingReviewStatus === 'UnderReview' ? (
                <>
                  <div className="space-y-2">
                    <Label>Review Notes</Label>
                    <Textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Add notes about your review decision..."
                      rows={4}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => handleReviewAction('Approved')}
                      disabled={submitting}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      {submitting ? 'Processing...' : 'Approve Drawing'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleReviewAction('RevisionRequired')}
                      disabled={submitting}
                      className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                    >
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      Request Revision
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleReviewAction('Rejected')}
                      disabled={submitting}
                      className="w-full border-red-300 text-red-700 hover:bg-red-50"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject Drawing
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Approving will allow job card generation for this product
                  </p>
                </>
              ) : product.drawingReviewStatus === 'Pending' ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                    <AlertTriangle className="h-5 w-5 text-gray-400 shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      Drawings have not been uploaded yet. The drawing team needs to upload drawings first.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleRequestDrawing}
                    disabled={submitting}
                  >
                    <SendHorizontal className="mr-2 h-4 w-4" />
                    {submitting ? 'Requesting...' : 'Request Drawing from Team'}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    {product.drawingReviewStatus === 'Approved'
                      ? 'Drawing approved. Product is ready for planning.'
                      : product.drawingReviewStatus === 'Rejected'
                      ? 'Drawing rejected. Drawing team must re-upload.'
                      : 'Revision required. Drawing team must re-upload.'}
                  </p>
                </div>
              )}
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
