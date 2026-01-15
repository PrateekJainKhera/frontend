"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package, Layers, FileText, AlertTriangle, CheckCircle2, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  mockOrders,
  mockProducts,
  mockProductTemplates,
  mockChildPartTemplates,
  mockDrawings
} from '@/lib/mock-data'
import { simulateApiCall } from '@/lib/utils/mock-api'
import { Order, Product, ProductTemplate, ChildPartTemplate } from '@/types'
import type { Drawing } from '@/lib/mock-data/drawings'
import { formatDate } from '@/lib/utils/formatters'

interface ChildPartPlanningItem {
  childPart: ProductTemplate['childParts'][0]
  childPartTemplate: ChildPartTemplate | null
  selectedDrawing: Drawing | null
  autoSelectedDrawing: Drawing | null
  materialAvailable: boolean
  materialShortfall: {
    materialName: string
    required: number
    available: number
    shortfall: number
    unit: string
  } | null
}

export default function GenerateJobCardsPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.orderId as string

  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<Order | null>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [productTemplate, setProductTemplate] = useState<ProductTemplate | null>(null)
  const [childPartItems, setChildPartItems] = useState<ChildPartPlanningItem[]>([])

  // Change Drawing Dialog state
  const [changeDrawingDialogOpen, setChangeDrawingDialogOpen] = useState(false)
  const [selectedChildPartIndex, setSelectedChildPartIndex] = useState<number | null>(null)
  const [availableDrawings, setAvailableDrawings] = useState<Drawing[]>([])
  const [newSelectedDrawingId, setNewSelectedDrawingId] = useState<string>('')

  // Primary Drawing Selection Dialog state
  const [primaryDrawingDialogOpen, setPrimaryDrawingDialogOpen] = useState(false)
  const [selectedPrimaryDrawingId, setSelectedPrimaryDrawingId] = useState<string>('')
  const [primaryDrawingOptions, setPrimaryDrawingOptions] = useState<Drawing[]>([])

  useEffect(() => {
    loadData()
  }, [orderId])

  const loadData = async () => {
    setLoading(true)

    // Load order
    const orderData = await simulateApiCall(
      mockOrders.find(o => o.id === orderId) || null,
      500
    )

    if (!orderData) {
      setLoading(false)
      return
    }

    setOrder(orderData)

    // Load product
    const productData = mockProducts.find(p => p.id === orderData.productId)
    setProduct(productData || null)

    // Load product template (find by rollerType match)
    const templateData = mockProductTemplates.find(
      t => t.rollerType === productData?.rollerType
    )
    setProductTemplate(templateData || null)

    // Build child part planning items
    if (templateData) {
      const items: ChildPartPlanningItem[] = templateData.childParts.map(cp => {
        // Find child part template
        const childTemplate = mockChildPartTemplates.find(
          cpt => cpt.id === cp.childPartTemplateId
        )

        // Auto-select latest approved drawing for this child part
        const autoDrawing = mockDrawings
          .filter(d =>
            d.status === 'approved' &&
            d.drawingNumber === childTemplate?.drawingNumber
          )
          .sort((a, b) => {
            // Sort by revision (highest first) - simple alphabetical for now
            return b.revision.localeCompare(a.revision)
          })[0] || null

        // Simulate material availability check
        const materialAvailable = Math.random() > 0.3 // 70% available

        return {
          childPart: cp,
          childPartTemplate: childTemplate || null,
          selectedDrawing: autoDrawing,
          autoSelectedDrawing: autoDrawing,
          materialAvailable,
          materialShortfall: materialAvailable ? null : {
            materialName: childTemplate?.materialRequirements[0]?.rawMaterialName || 'Unknown Material',
            required: 100,
            available: 60,
            shortfall: 40,
            unit: childTemplate?.materialRequirements[0]?.unit || 'units'
          }
        }
      })

      setChildPartItems(items)
    }

    setLoading(false)
  }

  const handleGenerateJobCards = async () => {
    if (!order || !product || !productTemplate) return

    // Show loading toast
    toast.loading('Generating job cards...')

    try {
      // Simulate API call with delay
      await simulateApiCall(null, 1500)

      // Calculate total job cards to be generated
      const totalJobCards = childPartItems.reduce((sum, item) =>
        sum + (item.childPartTemplate?.processSteps.length || 0), 0
      )

      // Count material issues
      const materialIssuesCount = childPartItems.filter(item => !item.materialAvailable).length

      // Dismiss loading toast
      toast.dismiss()

      // Show success toast with details
      if (materialIssuesCount > 0) {
        toast.success(
          `Job Cards Generated Successfully!`,
          {
            description: `${totalJobCards} job cards created for order ${order.orderNo}. ${materialIssuesCount} job card(s) flagged as "Pending Material".`,
            duration: 5000,
          }
        )
      } else {
        toast.success(
          `Job Cards Generated Successfully!`,
          {
            description: `${totalJobCards} job cards created for order ${order.orderNo}. All materials are available.`,
            duration: 5000,
          }
        )
      }

      // Log the generation details (in real app, this would be API call)
      console.log('Job Cards Generated:', {
        orderId: order.id,
        orderNo: order.orderNo,
        totalJobCards,
        childParts: childPartItems.length,
        materialIssues: materialIssuesCount,
        jobCardDetails: childPartItems.map(item => ({
          childPartName: item.childPart.childPartName,
          drawingNumber: item.selectedDrawing?.drawingNumber,
          drawingRevision: item.selectedDrawing?.revision,
          materialAvailable: item.materialAvailable,
          processSteps: item.childPartTemplate?.processSteps.length || 0
        }))
      })

      // Redirect to planning dashboard after short delay
      setTimeout(() => {
        router.push('/planning')
      }, 2000)

    } catch (error) {
      toast.dismiss()
      toast.error('Failed to generate job cards', {
        description: 'An error occurred while generating job cards. Please try again.',
        duration: 4000,
      })
      console.error('Error generating job cards:', error)
    }
  }

  const handleOpenChangeDrawing = (index: number) => {
    const item = childPartItems[index]
    if (!item.childPartTemplate) return

    // Filter drawings by child part template's drawing number
    // Include both approved and obsolete for manual override
    const drawings = mockDrawings.filter(d =>
      d.drawingNumber === item.childPartTemplate?.drawingNumber
    ).sort((a, b) => {
      // Sort by status (approved first) then by revision (highest first)
      if (a.status === 'approved' && b.status !== 'approved') return -1
      if (a.status !== 'approved' && b.status === 'approved') return 1
      return b.revision.localeCompare(a.revision)
    })

    setAvailableDrawings(drawings)
    setSelectedChildPartIndex(index)
    setNewSelectedDrawingId(item.selectedDrawing?.id || '')
    setChangeDrawingDialogOpen(true)
  }

  const handleApplyDrawingChange = () => {
    if (selectedChildPartIndex === null) return

    const newDrawing = availableDrawings.find(d => d.id === newSelectedDrawingId)
    if (!newDrawing) return

    const updatedItems = [...childPartItems]
    updatedItems[selectedChildPartIndex].selectedDrawing = newDrawing

    setChildPartItems(updatedItems)
    setChangeDrawingDialogOpen(false)

    toast.success('Drawing updated successfully', {
      description: `Changed to ${newDrawing.drawingNumber} Rev ${newDrawing.revision}`,
      duration: 3000,
    })
  }

  const handleOpenPrimaryDrawingSelection = () => {
    // Filter drawings by product type or show all 'final' type drawings
    const drawings = mockDrawings.filter(d =>
      d.status === 'approved' &&
      (d.partType === 'final' || d.partType === 'roller')
    ).sort((a, b) => {
      // Sort by drawing number and revision
      const numCompare = a.drawingNumber.localeCompare(b.drawingNumber)
      if (numCompare !== 0) return numCompare
      return b.revision.localeCompare(a.revision)
    })

    setPrimaryDrawingOptions(drawings)
    setSelectedPrimaryDrawingId(order?.primaryDrawingId || '')
    setPrimaryDrawingDialogOpen(true)
  }

  const handleApplyPrimaryDrawing = () => {
    if (!order) return

    const selectedDrawing = primaryDrawingOptions.find(d => d.id === selectedPrimaryDrawingId)
    if (!selectedDrawing) return

    // Update order with primary drawing
    const updatedOrder = {
      ...order,
      primaryDrawingId: selectedDrawing.id,
      primaryDrawingNumber: selectedDrawing.drawingNumber,
      primaryDrawingRevision: selectedDrawing.revision,
      drawingSource: (selectedDrawing.linkedCustomerId ? 'customer' : 'company') as 'customer' | 'company'
    }

    setOrder(updatedOrder)
    setPrimaryDrawingDialogOpen(false)

    toast.success('Primary drawing assigned successfully', {
      description: `${selectedDrawing.drawingNumber} Rev ${selectedDrawing.revision} is now the primary drawing for this order`,
      duration: 4000,
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!order || !product) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertDescription>
            Order not found
          </AlertDescription>
        </Alert>
        <Link href="/planning">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Planning
          </Button>
        </Link>
      </div>
    )
  }

  const allMaterialsAvailable = childPartItems.every(item => item.materialAvailable)
  const someDrawingsSelected = childPartItems.every(item => item.selectedDrawing !== null)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/planning">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Generate Job Cards</h1>
            <p className="text-muted-foreground mt-1">
              Review child parts and generate job cards for order
            </p>
          </div>
        </div>
      </div>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Order Details</CardTitle>
              <CardDescription className="mt-1">Order information and product</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-lg">{order.orderNo}</Badge>
              <Badge variant={order.priority === 'Urgent' ? 'destructive' : 'outline'}>
                {order.priority}
              </Badge>
              {order.primaryDrawingNumber && (
                <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                  <FileText className="mr-1 h-3 w-3" />
                  Drawing: {order.primaryDrawingNumber} Rev {order.primaryDrawingRevision}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Customer:</span>
              <span className="ml-2 font-medium">{order.customer?.name}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Product:</span>
              <span className="ml-2 font-medium">{product.modelName}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Quantity:</span>
              <span className="ml-2 font-medium">{order.quantity} pcs</span>
            </div>
            <div>
              <span className="text-muted-foreground">Due Date:</span>
              <span className="ml-2 font-medium">{formatDate(order.dueDate)}</span>
            </div>
          </div>
          {order.primaryDrawingNumber && (
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-600">Primary Drawing Reference:</span>
                  <span className="text-muted-foreground">{order.primaryDrawingNumber} Rev {order.primaryDrawingRevision}</span>
                  {order.drawingSource && (
                    <Badge variant="outline" className="text-xs">
                      {order.drawingSource === 'customer' ? 'Customer Provided' : 'Company Drawing'}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleOpenPrimaryDrawingSelection}
                >
                  <Edit2 className="mr-2 h-3 w-3" />
                  Change Drawing
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Primary Drawing Selection - Show when no drawing assigned */}
      {!order.primaryDrawingNumber && (
        <Alert className="border-blue-200 bg-blue-50">
          <FileText className="h-5 w-5 text-blue-600" />
          <AlertDescription>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-blue-900">Primary Drawing Required</p>
                <p className="text-sm mt-1 text-blue-700">
                  Select a primary drawing for this order before generating job cards. The drawing will define the manufacturing specifications.
                </p>
              </div>
              <Button
                onClick={handleOpenPrimaryDrawingSelection}
                className="ml-4 bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                <FileText className="mr-2 h-4 w-4" />
                Select Drawing
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Material Availability Alert */}
      {!allMaterialsAvailable && (
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertDescription>
            <p className="font-semibold">Material Shortage Detected</p>
            <p className="text-sm mt-1">
              Some child parts have material shortages. Job cards will be generated with "Pending Material" status.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Child Parts Explosion */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Child Parts Breakdown
          </CardTitle>
          <CardDescription>
            Order → Child Parts → Process Steps → Job Cards
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!productTemplate ? (
            <Alert>
              <AlertTriangle className="h-5 w-5" />
              <AlertDescription>
                No product template found for this product. Cannot generate job cards.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {childPartItems.map((item, index) => (
                <div
                  key={item.childPart.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  {/* Child Part Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{item.childPart.childPartName}</p>
                          <Badge variant="outline" className="text-xs">
                            {item.childPart.childPartCode}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            Qty: {item.childPart.quantity}
                          </Badge>
                        </div>
                        {item.childPartTemplate && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.childPartTemplate.templateName} • {item.childPartTemplate.processSteps.length} process steps
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Material Status */}
                    {item.materialAvailable ? (
                      <Badge className="bg-green-600">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Material Available
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Material Shortage
                      </Badge>
                    )}
                  </div>

                  {/* Material Shortfall Details */}
                  {item.materialShortfall && (
                    <Alert variant="destructive" className="py-2">
                      <AlertDescription className="text-xs">
                        <strong>Shortfall:</strong> {item.materialShortfall.materialName} -
                        Need {item.materialShortfall.required} {item.materialShortfall.unit},
                        Available {item.materialShortfall.available} {item.materialShortfall.unit},
                        Short by {item.materialShortfall.shortfall} {item.materialShortfall.unit}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Separator />

                  {/* Drawing Selection */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Drawing Selection
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenChangeDrawing(index)}
                        disabled={!item.childPartTemplate}
                      >
                        <Edit2 className="mr-2 h-3 w-3" />
                        Change Drawing
                      </Button>
                    </div>

                    {item.selectedDrawing ? (
                      <div className="bg-muted/50 rounded-md p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{item.selectedDrawing.drawingNumber}</p>
                              <Badge variant="outline" className="text-xs">
                                Rev {item.selectedDrawing.revision}
                              </Badge>
                              {item.selectedDrawing.id === item.autoSelectedDrawing?.id && (
                                <Badge variant="secondary" className="text-xs">
                                  Auto-selected
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.selectedDrawing.drawingName}
                            </p>
                            {item.selectedDrawing.manufacturingDimensions && (
                              <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                                {item.selectedDrawing.manufacturingDimensions.materialGrade && (
                                  <div>
                                    <span className="text-muted-foreground">Material:</span>
                                    <span className="ml-1">{item.selectedDrawing.manufacturingDimensions.materialGrade}</span>
                                  </div>
                                )}
                                {item.selectedDrawing.manufacturingDimensions.finishedLength && (
                                  <div>
                                    <span className="text-muted-foreground">Length:</span>
                                    <span className="ml-1">{item.selectedDrawing.manufacturingDimensions.finishedLength}mm</span>
                                  </div>
                                )}
                                {item.selectedDrawing.manufacturingDimensions.finishedDiameter && (
                                  <div>
                                    <span className="text-muted-foreground">Diameter:</span>
                                    <span className="ml-1">Ø{item.selectedDrawing.manufacturingDimensions.finishedDiameter}mm</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          No approved drawing found for this child part
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  {/* Process Steps Preview */}
                  {item.childPartTemplate && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Process Steps ({item.childPartTemplate.processSteps.length})</p>
                      <div className="grid grid-cols-2 gap-2">
                        {item.childPartTemplate.processSteps.map((step) => (
                          <div
                            key={step.id}
                            className="bg-muted/30 rounded-md p-2 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary font-semibold text-xs">
                                {step.stepNumber}
                              </div>
                              <span className="font-medium">{step.processName}</span>
                            </div>
                            <p className="text-muted-foreground mt-1 ml-7">
                              {step.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generation Summary */}
      {productTemplate && (
        <Card>
          <CardHeader>
            <CardTitle>Job Cards to be Generated</CardTitle>
            <CardDescription>
              Summary of job cards that will be created
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Child Parts:</span>
                <span className="font-medium">{childPartItems.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Process Steps:</span>
                <span className="font-medium">
                  {childPartItems.reduce((sum, item) =>
                    sum + (item.childPartTemplate?.processSteps.length || 0), 0
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Job Cards:</span>
                <span className="font-medium">
                  {childPartItems.reduce((sum, item) =>
                    sum + (item.childPartTemplate?.processSteps.length || 0), 0
                  )}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Material Status:</span>
                {allMaterialsAvailable ? (
                  <Badge className="bg-green-600">All Available</Badge>
                ) : (
                  <Badge variant="destructive">
                    {childPartItems.filter(i => !i.materialAvailable).length} Shortage(s)
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Drawing Selection:</span>
                {someDrawingsSelected ? (
                  <Badge className="bg-green-600">All Selected</Badge>
                ) : (
                  <Badge variant="destructive">Missing Drawings</Badge>
                )}
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                onClick={handleGenerateJobCards}
                disabled={!someDrawingsSelected || !order.primaryDrawingNumber}
                className="flex-1"
              >
                <Package className="mr-2 h-4 w-4" />
                Generate Job Cards
              </Button>
              <Button variant="outline" onClick={() => router.push('/planning')}>
                Cancel
              </Button>
            </div>

            {!order.primaryDrawingNumber && (
              <Alert className="mt-4 border-blue-200 bg-blue-50">
                <FileText className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-xs text-blue-700">
                  Primary drawing must be selected before generating job cards.
                </AlertDescription>
              </Alert>
            )}

            {!allMaterialsAvailable && (
              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Job cards with material shortages will be created with "Pending Material" status.
                  Stores/Procurement will be notified automatically.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Change Drawing Dialog */}
      <Dialog open={changeDrawingDialogOpen} onOpenChange={setChangeDrawingDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Change Drawing</DialogTitle>
            <DialogDescription>
              Select a different drawing revision for this child part
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedChildPartIndex !== null && (
              <>
                {/* Current Child Part Info */}
                <div className="bg-muted/50 rounded-md p-3">
                  <p className="text-sm font-medium">
                    {childPartItems[selectedChildPartIndex].childPart.childPartName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {childPartItems[selectedChildPartIndex].childPartTemplate?.templateName}
                  </p>
                </div>

                {/* Drawing Selection */}
                <div className="space-y-2">
                  <Label>Select Drawing</Label>
                  {availableDrawings.length > 0 ? (
                    <Select
                      value={newSelectedDrawingId}
                      onValueChange={setNewSelectedDrawingId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a drawing revision" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDrawings.map((drawing) => (
                          <SelectItem key={drawing.id} value={drawing.id}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{drawing.drawingNumber}</span>
                              <span className="text-xs text-muted-foreground">Rev {drawing.revision}</span>
                              {drawing.status === 'approved' ? (
                                <Badge variant="outline" className="text-xs bg-green-50">Approved</Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs bg-red-50">
                                  {drawing.status === 'obsolete' ? 'Obsolete' : 'Draft'}
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        No drawings found for this child part
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Selected Drawing Details */}
                {newSelectedDrawingId && availableDrawings.find(d => d.id === newSelectedDrawingId) && (
                  <div className="border rounded-lg p-3 space-y-2">
                    <p className="text-sm font-medium">Drawing Details</p>
                    {(() => {
                      const drawing = availableDrawings.find(d => d.id === newSelectedDrawingId)
                      if (!drawing) return null
                      return (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Drawing Number:</span>
                              <span className="ml-2 font-medium">{drawing.drawingNumber}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Revision:</span>
                              <span className="ml-2 font-medium">{drawing.revision}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Status:</span>
                              <span className="ml-2">
                                <Badge variant={drawing.status === 'approved' ? 'outline' : 'secondary'} className="text-xs">
                                  {drawing.status}
                                </Badge>
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">File:</span>
                              <span className="ml-2 font-medium">{drawing.fileName}</span>
                            </div>
                          </div>
                          <div className="text-xs">
                            <span className="text-muted-foreground">Description:</span>
                            <p className="mt-1">{drawing.description}</p>
                          </div>
                          {drawing.notes && (
                            <div className="text-xs">
                              <span className="text-muted-foreground">Notes:</span>
                              <p className="mt-1 text-amber-700">{drawing.notes}</p>
                            </div>
                          )}
                          {drawing.manufacturingDimensions && (
                            <div className="text-xs">
                              <span className="text-muted-foreground">Key Dimensions:</span>
                              <div className="grid grid-cols-3 gap-2 mt-1">
                                {drawing.manufacturingDimensions.materialGrade && (
                                  <div>
                                    <span className="text-muted-foreground">Material:</span>
                                    <span className="ml-1">{drawing.manufacturingDimensions.materialGrade}</span>
                                  </div>
                                )}
                                {drawing.manufacturingDimensions.finishedLength && (
                                  <div>
                                    <span className="text-muted-foreground">Length:</span>
                                    <span className="ml-1">{drawing.manufacturingDimensions.finishedLength}mm</span>
                                  </div>
                                )}
                                {drawing.manufacturingDimensions.finishedDiameter && (
                                  <div>
                                    <span className="text-muted-foreground">Diameter:</span>
                                    <span className="ml-1">Ø{drawing.manufacturingDimensions.finishedDiameter}mm</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                )}

                {/* Warning for obsolete drawings */}
                {newSelectedDrawingId &&
                  availableDrawings.find(d => d.id === newSelectedDrawingId)?.status === 'obsolete' && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Warning: This drawing is marked as obsolete. Use with caution.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setChangeDrawingDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApplyDrawingChange}
              disabled={!newSelectedDrawingId}
            >
              Apply Change
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Primary Drawing Selection Dialog */}
      <Dialog open={primaryDrawingDialogOpen} onOpenChange={setPrimaryDrawingDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Primary Drawing</DialogTitle>
            <DialogDescription>
              Choose the primary manufacturing drawing for this order. This drawing will be the reference for all job cards.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Order Info */}
            <div className="bg-muted/50 rounded-md p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Order: {order?.orderNo}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Product: {product?.modelName} • Quantity: {order?.quantity} pcs
                  </p>
                </div>
                <Badge variant="outline">{order?.priority}</Badge>
              </div>
            </div>

            {/* Drawing Selection Grid */}
            <div className="space-y-2">
              <Label>Available Drawings</Label>
              {primaryDrawingOptions.length > 0 ? (
                <div className="grid gap-3">
                  {primaryDrawingOptions.map((drawing) => (
                    <button
                      key={drawing.id}
                      onClick={() => setSelectedPrimaryDrawingId(drawing.id)}
                      className={`text-left border rounded-lg p-4 transition-all hover:border-blue-300 hover:shadow-sm ${
                        selectedPrimaryDrawingId === drawing.id
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="space-y-2">
                        {/* Drawing Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-600" />
                            <div>
                              <p className="font-semibold text-sm">{drawing.drawingNumber}</p>
                              <p className="text-xs text-muted-foreground">{drawing.drawingName}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              Rev {drawing.revision}
                            </Badge>
                            {drawing.status === 'approved' && (
                              <Badge className="bg-green-600 text-xs">Approved</Badge>
                            )}
                            {selectedPrimaryDrawingId === drawing.id && (
                              <CheckCircle2 className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                        </div>

                        {/* Drawing Details */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Part Type:</span>
                            <span className="ml-2 capitalize">{drawing.partType}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">File:</span>
                            <span className="ml-2">{drawing.fileName}</span>
                          </div>
                          {drawing.linkedCustomerName && (
                            <div>
                              <span className="text-muted-foreground">Customer:</span>
                              <span className="ml-2">{drawing.linkedCustomerName}</span>
                            </div>
                          )}
                          {drawing.linkedProductName && (
                            <div>
                              <span className="text-muted-foreground">Product:</span>
                              <span className="ml-2">{drawing.linkedProductName}</span>
                            </div>
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-xs text-muted-foreground">{drawing.description}</p>

                        {/* Manufacturing Dimensions */}
                        {drawing.manufacturingDimensions && (
                          <div className="bg-white rounded-md p-2 mt-2">
                            <p className="text-xs font-medium mb-2">Manufacturing Dimensions:</p>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              {drawing.manufacturingDimensions.materialGrade && (
                                <div>
                                  <span className="text-muted-foreground">Material:</span>
                                  <span className="ml-1 font-medium">{drawing.manufacturingDimensions.materialGrade}</span>
                                </div>
                              )}
                              {drawing.manufacturingDimensions.finishedLength && (
                                <div>
                                  <span className="text-muted-foreground">Length:</span>
                                  <span className="ml-1 font-medium">{drawing.manufacturingDimensions.finishedLength}mm</span>
                                </div>
                              )}
                              {drawing.manufacturingDimensions.finishedDiameter && (
                                <div>
                                  <span className="text-muted-foreground">Diameter:</span>
                                  <span className="ml-1 font-medium">Ø{drawing.manufacturingDimensions.finishedDiameter}mm</span>
                                </div>
                              )}
                              {drawing.manufacturingDimensions.pipeOD && (
                                <div>
                                  <span className="text-muted-foreground">Pipe OD:</span>
                                  <span className="ml-1 font-medium">{drawing.manufacturingDimensions.pipeOD}mm</span>
                                </div>
                              )}
                              {drawing.manufacturingDimensions.pipeID && (
                                <div>
                                  <span className="text-muted-foreground">Pipe ID:</span>
                                  <span className="ml-1 font-medium">{drawing.manufacturingDimensions.pipeID}mm</span>
                                </div>
                              )}
                              {drawing.manufacturingDimensions.tolerance && (
                                <div>
                                  <span className="text-muted-foreground">Tolerance:</span>
                                  <span className="ml-1 font-medium">{drawing.manufacturingDimensions.tolerance}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Notes */}
                        {drawing.notes && (
                          <Alert className="py-2">
                            <AlertDescription className="text-xs text-amber-700">
                              <strong>Note:</strong> {drawing.notes}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    No approved drawings found. Please contact engineering to create or approve drawings for this product type.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setPrimaryDrawingDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApplyPrimaryDrawing}
              disabled={!selectedPrimaryDrawingId}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Set as Primary Drawing
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
