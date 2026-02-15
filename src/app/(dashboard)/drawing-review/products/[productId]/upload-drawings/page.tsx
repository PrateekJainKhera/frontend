'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Upload, CheckCircle2, FileText, Loader2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DrawingPreviewDialog } from '@/components/drawing-preview-dialog'
import { productService } from '@/lib/api/products'
import { productTemplateService, ProductTemplateResponse, ProductTemplateBOMItemResponse } from '@/lib/api/product-templates'
import { drawingService } from '@/lib/api/drawings'
import { Product } from '@/types/product'
import { formatDate } from '@/lib/utils/formatters'
import { toast } from 'sonner'

export default function DrawingUploadPage() {
  const params = useParams()
  const router = useRouter()
  const productId = parseInt(params.productId as string)

  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [product, setProduct] = useState<Product | null>(null)
  const [template, setTemplate] = useState<ProductTemplateResponse | null>(null)
  const [bomItems, setBomItems] = useState<ProductTemplateBOMItemResponse[]>([])

  // Track uploaded drawings
  const [assemblyDrawingId, setAssemblyDrawingId] = useState<number | null>(null)
  const [assemblyFile, setAssemblyFile] = useState<File | null>(null)
  const [childPartDrawings, setChildPartDrawings] = useState<Record<number, number>>({}) // childPartTemplateId -> drawingId
  const [childPartFiles, setChildPartFiles] = useState<Record<number, File>>({}) // childPartTemplateId -> File

  // Preview dialog state
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewFile, setPreviewFile] = useState<File | null>(null)
  const [previewTitle, setPreviewTitle] = useState('')
  const [previewDescription, setPreviewDescription] = useState('')

  useEffect(() => {
    loadData()
  }, [productId])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load product
      const productData = await productService.getById(productId)
      setProduct(productData)

      // If product already has assembly drawing, set it
      if (productData.assemblyDrawingId) {
        setAssemblyDrawingId(productData.assemblyDrawingId)
      }

      // Load product template to get child parts
      if (productData.productTemplateId) {
        const templateData = await productTemplateService.getById(productData.productTemplateId)
        setTemplate(templateData)
        setBomItems(templateData.bomItems || [])
      }

      // Load existing child part drawings
      const existingDrawings = await productService.getChildPartDrawings(productId)
      const drawingsMap: Record<number, number> = {}
      existingDrawings.forEach(d => {
        drawingsMap[d.childPartTemplateId] = d.drawingId
      })
      setChildPartDrawings(drawingsMap)
    } catch (err) {
      console.error('Failed to load data:', err)
      toast.error('Failed to load product details')
    }
    setLoading(false)
  }

  const handleAssemblyFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
      if (!validTypes.includes(file.type)) {
        toast.error('Invalid file type. Please upload PDF, PNG, or JPG')
        return
      }
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB')
        return
      }
      setAssemblyFile(file)
    }
  }

  const handleChildPartFileChange = (childPartTemplateId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
      if (!validTypes.includes(file.type)) {
        toast.error('Invalid file type. Please upload PDF, PNG, or JPG')
        return
      }
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB')
        return
      }
      setChildPartFiles(prev => ({ ...prev, [childPartTemplateId]: file }))
    }
  }

  const handleUploadAssemblyDrawing = async () => {
    if (!assemblyFile || !product) return

    setUploading(true)
    try {
      const drawingId = await drawingService.upload(assemblyFile, {
        drawingName: `${product.partCode} - Assembly Drawing`,
        drawingType: 'assembly',
        linkedProductId: productId,
        drawingNumber: '', // Auto-generated
        status: 'draft'
      })

      // Update product with assembly drawing ID
      await productService.update(productId, {
        id: productId,
        partCode: product.partCode,
        modelId: product.modelId,
        rollerType: product.rollerType,
        diameter: product.diameter,
        length: product.length,
        numberOfTeeth: product.numberOfTeeth,
        processTemplateId: product.processTemplateId,
        productTemplateId: product.productTemplateId,
        assemblyDrawingId: drawingId,
        surfaceFinish: product.surfaceFinish,
        hardness: product.hardness,
      })

      setAssemblyDrawingId(drawingId)
      toast.success('Assembly drawing uploaded successfully')
    } catch (err) {
      console.error('Failed to upload assembly drawing:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload drawing'
      toast.error(errorMessage)
    }
    setUploading(false)
  }

  const handleUploadChildPartDrawing = async (childPartTemplateId: number, childPartTemplateName: string) => {
    const file = childPartFiles[childPartTemplateId]
    if (!file || !product) return

    setUploading(true)
    try {
      const drawingId = await drawingService.upload(file, {
        drawingName: `${product.partCode} - ${childPartTemplateName}`,
        drawingType: 'other', // Or map child part type to drawing type
        linkedProductId: productId,
        drawingNumber: '', // Auto-generated
        status: 'draft'
      })

      // Link child part drawing to product in database
      await productService.linkChildPartDrawing(productId, {
        childPartTemplateId,
        drawingId,
        createdBy: 'Admin' // TODO: Get from auth context
      })

      setChildPartDrawings(prev => ({ ...prev, [childPartTemplateId]: drawingId }))
      toast.success(`${childPartTemplateName} drawing uploaded successfully`)
    } catch (err) {
      console.error('Failed to upload child part drawing:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload drawing'
      toast.error(errorMessage)
    }
    setUploading(false)
  }

  const handleSubmitForReview = async () => {
    if (!product) return

    setUploading(true)
    try {
      // Update product status to Approved (self-approve for now)
      await productService.updateDrawingReviewStatus(productId, {
        drawingReviewStatus: 'Approved',
        drawingReviewNotes: 'All drawings uploaded and verified',
        drawingReviewedBy: 'Admin' // TODO: From auth context
      })

      toast.success('Drawings submitted and approved successfully')
      router.push('/drawing-review')
    } catch (err) {
      console.error('Failed to submit for review:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit'
      toast.error(errorMessage)
    }
    setUploading(false)
  }

  const handlePreview = (file: File, title: string, description?: string) => {
    setPreviewFile(file)
    setPreviewTitle(title)
    setPreviewDescription(description || '')
    setPreviewOpen(true)
  }

  const allChildPartsUploaded = bomItems.length === 0 ||
    bomItems.every(cp => childPartDrawings[cp.childPartTemplateId])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertDescription className="h-12 w-12 text-orange-600 mb-4" />
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
              Upload Assembly & Child Part Drawings
            </p>
          </div>
        </div>
        <Badge variant={product.drawingReviewStatus === 'Approved' ? 'default' : 'secondary'}>
          {product.drawingReviewStatus}
        </Badge>
      </div>

      {/* Instructions Alert */}
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          Upload the assembly drawing and all child part drawings based on the product template.
          All drawings are required before submission.
        </AlertDescription>
      </Alert>

      {/* Product Specifications */}
      <Card>
        <CardHeader>
          <CardTitle>Product Specifications</CardTitle>
          <CardDescription>Basic product details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-muted-foreground">Part Code</Label>
              <p className="font-medium">{product.partCode}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Customer</Label>
              <p className="font-medium">{product.customerName}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Model</Label>
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
              <Label className="text-muted-foreground">Teeth</Label>
              <p className="font-medium">{product.numberOfTeeth}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Material</Label>
              <p className="font-medium">{product.materialGrade}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assembly Drawing Upload */}
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
          {assemblyDrawingId ? (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50 border-green-200">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Assembly Drawing Uploaded</p>
                  <p className="text-sm text-muted-foreground">Drawing ID: {assemblyDrawingId}</p>
                  {assemblyFile && (
                    <p className="text-sm text-muted-foreground">{assemblyFile.name}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {assemblyFile && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreview(
                      assemblyFile,
                      'Assembly Drawing Preview',
                      `${product?.partCode} - Assembly Drawing`
                    )}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setAssemblyDrawingId(null)}>
                  Change Drawing
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg">
                <Upload className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm font-medium mb-1">Select Assembly Drawing</p>
                <p className="text-xs text-muted-foreground mb-4">
                  PDF, PNG, or JPG (max 10MB)
                </p>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleAssemblyFileChange}
                  className="hidden"
                  id="assembly-file-input"
                />
                <label htmlFor="assembly-file-input">
                  <Button size="sm" asChild>
                    <span>
                      <Upload className="mr-2 h-4 w-4" />
                      Select File
                    </span>
                  </Button>
                </label>
              </div>
              {assemblyFile && (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{assemblyFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(assemblyFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(
                        assemblyFile,
                        'Assembly Drawing Preview',
                        `${product?.partCode} - Assembly Drawing`
                      )}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button onClick={handleUploadAssemblyDrawing} disabled={uploading}>
                      {uploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Child Part Drawings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Child Part Drawings
          </CardTitle>
          <CardDescription>
            Upload drawings for each child part ({bomItems.length} parts)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bomItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No child parts defined for this product template</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bomItems.map((bomItem) => {
                const hasDrawing = !!childPartDrawings[bomItem.childPartTemplateId]
                const hasFile = !!childPartFiles[bomItem.childPartTemplateId]

                return (
                  <div key={bomItem.childPartTemplateId} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium">{bomItem.childPartTemplateName}</h4>
                          {hasDrawing && (
                            <Badge variant="outline" className="border-green-500 text-green-700">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Uploaded
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Type: {bomItem.childPartType} | Qty: {bomItem.quantity}
                        </p>
                        {hasFile && !hasDrawing && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Selected: {childPartFiles[bomItem.childPartTemplateId].name}
                          </p>
                        )}
                        {hasDrawing && hasFile && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {childPartFiles[bomItem.childPartTemplateId].name}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {hasDrawing ? (
                          <>
                            {hasFile && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePreview(
                                  childPartFiles[bomItem.childPartTemplateId],
                                  `${bomItem.childPartTemplateName} Preview`,
                                  `${product?.partCode} - Child Part Drawing`
                                )}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                              </Button>
                            )}
                          </>
                        ) : (
                          <>
                            <input
                              type="file"
                              accept=".pdf,.png,.jpg,.jpeg"
                              onChange={(e) => handleChildPartFileChange(bomItem.childPartTemplateId, e)}
                              className="hidden"
                              id={`child-part-file-${bomItem.childPartTemplateId}`}
                            />
                            <label htmlFor={`child-part-file-${bomItem.childPartTemplateId}`}>
                              <Button size="sm" variant="outline" asChild>
                                <span>
                                  {hasFile ? 'Change File' : 'Select File'}
                                </span>
                              </Button>
                            </label>
                            {hasFile && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handlePreview(
                                    childPartFiles[bomItem.childPartTemplateId],
                                    `${bomItem.childPartTemplateName} Preview`,
                                    `${product?.partCode} - Child Part Drawing`
                                  )}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleUploadChildPartDrawing(bomItem.childPartTemplateId, bomItem.childPartTemplateName)}
                                  disabled={uploading}
                                >
                                  {uploading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Upload className="mr-2 h-4 w-4" />
                                      Upload
                                    </>
                                  )}
                                </Button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit for Review */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => router.push('/drawing-review')}>
          Save as Draft
        </Button>
        <Button
          onClick={handleSubmitForReview}
          disabled={!assemblyDrawingId || !allChildPartsUploaded || uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Submit & Approve
            </>
          )}
        </Button>
      </div>

      {!assemblyDrawingId && (
        <p className="text-sm text-muted-foreground text-center">
          Assembly drawing is required before submission
        </p>
      )}
      {!allChildPartsUploaded && bomItems.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          {bomItems.length - Object.keys(childPartDrawings).length} child part drawing(s) remaining
        </p>
      )}

      {/* Drawing Preview Dialog */}
      <DrawingPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        file={previewFile}
        title={previewTitle}
        description={previewDescription}
      />
    </div>
  )
}
