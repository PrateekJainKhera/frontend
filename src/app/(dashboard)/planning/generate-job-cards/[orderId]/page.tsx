"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package, AlertTriangle, CheckCircle2, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { orderService, OrderResponse } from '@/lib/api/orders'
import { productTemplateService, ProductTemplateResponse, ProductTemplateBOMItemResponse } from '@/lib/api/product-templates'
import { childPartTemplateService, ChildPartTemplateResponse } from '@/lib/api/child-part-templates'
import { processTemplateService, ProcessTemplateStepResponse } from '@/lib/api/process-templates'
import { jobCardService, CreateJobCardPayload } from '@/lib/api/job-cards'
import { formatDate } from '@/lib/utils/formatters'

interface ChildPartPlanningItem {
  bomItem: ProductTemplateBOMItemResponse
  childPartTemplate: ChildPartTemplateResponse | null
  processSteps: ProcessTemplateStepResponse[]
  materialAvailable: boolean
}

export default function GenerateJobCardsPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.orderId as string

  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<OrderResponse | null>(null)
  const [productTemplate, setProductTemplate] = useState<ProductTemplateResponse | null>(null)
  const [childPartItems, setChildPartItems] = useState<ChildPartPlanningItem[]>([])
  const [assemblyProcessSteps, setAssemblyProcessSteps] = useState<ProcessTemplateStepResponse[]>([])
  const [assemblyExpanded, setAssemblyExpanded] = useState(true) // Expanded by default
  const [expandedParts, setExpandedParts] = useState<Set<number>>(new Set()) // Track which child parts are expanded

  // Order-level overrides for material name/grade
  const [materialOverrides, setMaterialOverrides] = useState<Record<string, { materialName?: string; materialGrade?: string }>>({})

  useEffect(() => {
    loadData()
  }, [orderId])

  const loadData = async () => {
    setLoading(true)
    try {
      const orderData = await orderService.getById(Number(orderId))
      setOrder(orderData)

      if (!orderData.linkedProductTemplateId) {
        setLoading(false)
        return
      }

      const templateData = await productTemplateService.getById(orderData.linkedProductTemplateId)
      console.log('Product template loaded:', templateData)
      console.log('Product template processTemplateId:', templateData.processTemplateId)
      setProductTemplate(templateData)

      // Fetch each child part template
      const childPartTemplates = await Promise.all(
        templateData.bomItems.map(item => childPartTemplateService.getById(item.childPartTemplateId))
      )

      // Fetch process steps for each child part from their process templates
      const items: ChildPartPlanningItem[] = await Promise.all(
        templateData.bomItems.map(async (bomItem, idx) => {
          const childTemplate = childPartTemplates[idx]

          // Fetch process steps from process template
          let processSteps: ProcessTemplateStepResponse[] = []
          if (childTemplate?.processTemplateId) {
            try {
              processSteps = await processTemplateService.getStepsByTemplateId(childTemplate.processTemplateId)
            } catch (error) {
              console.error(`Failed to load process steps for ${childTemplate.templateName}:`, error)
            }
          }

          // Simulate material availability check
          const materialAvailable = Math.random() > 0.3

          return {
            bomItem,
            childPartTemplate: childTemplate,
            processSteps,
            materialAvailable,
          }
        })
      )

      setChildPartItems(items)

      // Fetch assembly process steps from product template's process template
      console.log('=== ASSEMBLY PROCESS DEBUGGING ===')
      console.log('Product template:', templateData.templateName)
      console.log('Process template ID:', templateData.processTemplateId)
      console.log('Process template name:', templateData.processTemplateName)

      if (templateData.processTemplateId) {
        try {
          console.log('Fetching assembly steps from process template ID:', templateData.processTemplateId)
          const assemblySteps = await processTemplateService.getStepsByTemplateId(templateData.processTemplateId)
          console.log('Assembly steps loaded successfully. Count:', assemblySteps.length)
          console.log('Assembly steps details:', assemblySteps)

          if (assemblySteps.length === 0) {
            toast.warning('No assembly steps configured', {
              description: `Process template "${templateData.processTemplateName}" has no steps defined.`,
              duration: 5000,
            })
          } else {
            toast.success(`Loaded ${assemblySteps.length} assembly step(s)`, {
              duration: 3000,
            })
          }

          setAssemblyProcessSteps(assemblySteps)
        } catch (error) {
          console.error('Failed to load assembly process steps:', error)
          toast.error('Assembly process not configured', {
            description: 'Product template needs assembly process steps configured in Master Data.',
            duration: 4000,
          })
          setAssemblyProcessSteps([])
        }
      } else {
        console.warn('Product template has no processTemplateId assigned')
        toast.warning('No assembly process', {
          description: 'Product template needs an assembly process template assigned.',
          duration: 4000,
        })
        setAssemblyProcessSteps([])
      }
      console.log('=== END ASSEMBLY PROCESS DEBUGGING ===')

    } catch (error) {
      toast.error('Failed to load order data', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        duration: 4000,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateJobCards = async () => {
    if (!order || !productTemplate) return

    // Check if all manufactured (non-purchased) child parts have processes
    const partsWithoutProcesses = childPartItems.filter(
      item => !item.childPartTemplate?.isPurchased && item.processSteps.length === 0
    )

    if (partsWithoutProcesses.length > 0) {
      toast.error('Cannot generate job cards', {
        description: `${partsWithoutProcesses.length} manufactured child part(s) are missing process steps. Please configure process templates.`,
        duration: 5000,
      })
      return
    }

    toast.loading('Generating job cards...')

    try {
      let jobCardCount = 0

      for (const item of childPartItems) {
        // Skip purchased parts - they go directly to assembly
        if (!item.childPartTemplate || item.childPartTemplate.isPurchased) continue
        if (item.processSteps.length === 0) continue

        for (const step of item.processSteps) {
          const jobCardNo = `JC-${order.orderNo}-${item.childPartTemplate.templateCode}-${String(step.stepNo).padStart(2, '0')}`

          const payload: CreateJobCardPayload = {
            jobCardNo,
            creationType: 'auto',
            orderId: order.id,
            orderNo: order.orderNo,
            drawingId: null,
            drawingNumber: item.childPartTemplate.drawingNumber || null,
            drawingRevision: item.childPartTemplate.drawingRevision || null,
            drawingName: null,
            drawingSelectionType: 'template',
            childPartName: item.bomItem.childPartTemplateName,
            childPartTemplateId: item.childPartTemplate.id,
            processId: step.processId,
            processName: step.processName || null,
            stepNo: step.stepNo,
            processTemplateId: item.childPartTemplate.processTemplateId,
            quantity: order.quantity * item.bomItem.quantity,
            priority: order.priority,
            manufacturingDimensions: null,
            createdBy: 'Admin',
            specialNotes: !item.materialAvailable ? 'Pending Material - Material shortage detected' : null,
          }

          await jobCardService.create(payload)
          jobCardCount++
        }
      }

      // Generate assembly job cards
      for (const step of assemblyProcessSteps) {
        const jobCardNo = `JC-${order.orderNo}-ASSY-${String(step.stepNo).padStart(2, '0')}`

        const payload: CreateJobCardPayload = {
          jobCardNo,
          creationType: 'auto',
          orderId: order.id,
          orderNo: order.orderNo,
          drawingId: null,
          drawingNumber: productTemplate.drawingNumber || null,
          drawingRevision: productTemplate.drawingRevision || null,
          drawingName: null,
          drawingSelectionType: 'template',
          childPartName: 'Final Assembly',
          childPartTemplateId: null,
          processId: step.processId,
          processName: step.processName || null,
          stepNo: step.stepNo,
          processTemplateId: productTemplate.processTemplateId,
          quantity: order.quantity,
          priority: order.priority,
          manufacturingDimensions: null,
          createdBy: 'Admin',
        }

        await jobCardService.create(payload)
        jobCardCount++
      }

      toast.dismiss()

      const materialIssuesCount = childPartItems.filter(item => !item.materialAvailable).length
      toast.success('Job Cards Generated Successfully!', {
        description: `${jobCardCount} job cards created for order ${order.orderNo}.${materialIssuesCount > 0 ? ` ${materialIssuesCount} job card(s) flagged as "Pending Material".` : ''}`,
        duration: 5000,
      })

      setTimeout(() => {
        router.push('/planning')
      }, 2000)
    } catch (error) {
      toast.dismiss()
      toast.error('Failed to generate job cards', {
        description: error instanceof Error ? error.message : 'An error occurred while generating job cards.',
        duration: 4000,
      })
    }
  }

  if (loading) {
    return (
      <div className="px-6 pb-6 space-y-4 max-w-5xl">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="px-6 pb-6 space-y-4 max-w-5xl">
        <Link href="/planning">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </Link>
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertDescription>Order not found</AlertDescription>
        </Alert>
      </div>
    )
  }

  const allMaterialsAvailable = childPartItems.every(item => item.materialAvailable)
  // Count process steps for manufactured parts (exclude purchased) + assembly steps
  const manufacturingSteps = childPartItems
    .filter(item => !item.childPartTemplate?.isPurchased)
    .reduce((sum, item) => sum + item.processSteps.length, 0)
  const totalProcessSteps = manufacturingSteps + assemblyProcessSteps.length
  const partsWithoutProcesses = childPartItems.filter(
    item => !item.childPartTemplate?.isPurchased && item.processSteps.length === 0
  )
  const purchasedParts = childPartItems.filter(item => item.childPartTemplate?.isPurchased)

  // Aggregate material requirements across all child parts
  const aggregatedMaterials = (() => {
    const map = new Map<string, {
      rawMaterialId: string
      materialName: string
      materialGrade: string
      unit: string
      totalRequired: number
      totalWithWastage: number
      wastagePercent: number
      hasShortage: boolean
      forChildParts: string[]
    }>()

    childPartItems.forEach(item => {
      if (!item.childPartTemplate || !item.childPartTemplate.materialRequirements) return
      const childQty = item.bomItem.quantity

      item.childPartTemplate.materialRequirements.forEach(req => {
        const key = String(req.rawMaterialId)
        const netRequired = req.quantityRequired * childQty * (order?.quantity ?? 1)
        const grossRequired = netRequired * (1 + req.wastagePercent / 100)

        const existing = map.get(key)
        if (existing) {
          existing.totalRequired += netRequired
          existing.totalWithWastage += grossRequired
          if (!existing.forChildParts.includes(item.bomItem.childPartTemplateName)) {
            existing.forChildParts.push(item.bomItem.childPartTemplateName)
          }
          if (!item.materialAvailable) existing.hasShortage = true
        } else {
          map.set(key, {
            rawMaterialId: key,
            materialName: req.rawMaterialName,
            materialGrade: req.materialGrade,
            unit: req.unit,
            totalRequired: netRequired,
            totalWithWastage: grossRequired,
            wastagePercent: req.wastagePercent,
            hasShortage: !item.materialAvailable,
            forChildParts: [item.bomItem.childPartTemplateName]
          })
        }
      })
    })

    return Array.from(map.values()).map(mat => ({
      ...mat,
      totalRequired: Math.round(mat.totalRequired * 100) / 100,
      totalWithWastage: Math.round(mat.totalWithWastage * 100) / 100,
      availableQty: mat.hasShortage
        ? Math.round(mat.totalWithWastage * 0.6 * 100) / 100
        : Math.round(mat.totalWithWastage * 1.5 * 100) / 100
    }))
  })()

  return (
    <div className="px-6 pb-6 space-y-4 max-w-5xl">
      {/* Back Button */}
      <Link href="/planning">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Planning
        </Button>
      </Link>

      {/* Order Summary */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">Generate Job Cards</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {order.customerName} • {order.productName}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-lg">{order.orderNo}</Badge>
              <Badge variant={order.priority === 'Urgent' ? 'destructive' : 'outline'}>
                {order.priority}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Quantity:</span>
              <span className="ml-2 font-medium">{order.quantity} pcs</span>
            </div>
            <div>
              <span className="text-muted-foreground">Due Date:</span>
              <span className="ml-2 font-medium">{formatDate(order.dueDate)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Child Parts:</span>
              <span className="ml-2 font-medium">{childPartItems.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Material Alert */}
      {!allMaterialsAvailable && (
        <Alert>
          <AlertTriangle className="h-5 w-5" />
          <AlertDescription>
            <p className="font-semibold">Material Shortage Detected</p>
            <p className="text-sm mt-1">
              Some materials are short. Job cards will be flagged as "Pending Material".
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Process Configuration Alert */}
      {partsWithoutProcesses.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription>
            <p className="font-semibold">Process Steps Missing</p>
            <p className="text-sm mt-1">
              {partsWithoutProcesses.length} child part(s) don't have process templates configured.
              Please configure process templates in Master Data.
            </p>
            <ul className="mt-2 text-xs space-y-1">
              {partsWithoutProcesses.map(item => (
                <li key={item.bomItem.id}>• {item.bomItem.childPartTemplateName}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Material Requirements */}
      {productTemplate && aggregatedMaterials.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Material Requirements</CardTitle>
            <CardDescription>
              Raw materials required for all child parts (includes wastage allowance)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Material</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Used For</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Required (incl. wastage)</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">In Stock</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {aggregatedMaterials.map((mat, idx) => {
                    const isShortage = mat.availableQty < mat.totalWithWastage
                    return (
                      <tr
                        key={mat.rawMaterialId}
                        className={`border-t ${isShortage ? 'bg-red-50' : idx % 2 === 1 ? 'bg-muted/30' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <input
                            className="font-medium bg-transparent border-b border-transparent hover:border-muted focus:border-primary focus:outline-none w-full text-sm"
                            value={materialOverrides[mat.rawMaterialId]?.materialName ?? mat.materialName}
                            onChange={(e) => setMaterialOverrides(prev => ({
                              ...prev,
                              [mat.rawMaterialId]: { ...prev[mat.rawMaterialId], materialName: e.target.value }
                            }))}
                          />
                          <input
                            className="text-xs text-muted-foreground bg-transparent border-b border-transparent hover:border-muted focus:border-primary focus:outline-none w-full mt-0.5"
                            value={materialOverrides[mat.rawMaterialId]?.materialGrade ?? mat.materialGrade}
                            onChange={(e) => setMaterialOverrides(prev => ({
                              ...prev,
                              [mat.rawMaterialId]: { ...prev[mat.rawMaterialId], materialGrade: e.target.value }
                            }))}
                          />
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {mat.forChildParts.join(', ')}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="font-medium">{mat.totalWithWastage} {mat.unit}</div>
                          <div className="text-xs text-muted-foreground">
                            Net {mat.totalRequired} {mat.unit} + {mat.wastagePercent}% wastage
                          </div>
                        </td>
                        <td className={`px-4 py-3 text-right font-medium ${isShortage ? 'text-red-600' : 'text-green-700'}`}>
                          {mat.availableQty} {mat.unit}
                        </td>
                        <td className="px-4 py-3">
                          {isShortage ? (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="mr-1 h-3 w-3" />
                              Short: {(mat.totalWithWastage - mat.availableQty).toFixed(2)} {mat.unit}
                            </Badge>
                          ) : (
                            <Badge className="bg-green-600 text-xs">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Available
                            </Badge>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Child Parts List */}
      <div className="space-y-2">
        <h2 className="font-medium text-sm text-muted-foreground px-1">Child Parts</h2>

        {childPartItems.map((item, itemIndex) => {
          const isPurchased = item.childPartTemplate?.isPurchased || false
          const processCount = item.processSteps.length
          const hasProcesses = processCount > 0
          const isExpanded = expandedParts.has(itemIndex)

          const toggleExpanded = () => {
            const newExpanded = new Set(expandedParts)
            if (isExpanded) {
              newExpanded.delete(itemIndex)
            } else {
              newExpanded.add(itemIndex)
            }
            setExpandedParts(newExpanded)
          }

          return (
            <div key={item.bomItem.id} className="space-y-2">
              {/* Child Part Header - Clickable to expand/collapse */}
              <div
                className={`flex items-center justify-between p-3 rounded-lg border bg-card cursor-pointer hover:bg-accent/50 transition-colors ${
                  isPurchased ? 'border-blue-200 bg-blue-50' : hasProcesses ? '' : 'border-red-200 bg-red-50'
                }`}
                onClick={toggleExpanded}
              >
                <div className="flex items-center gap-3">
                  {hasProcesses && !isPurchased ? (
                    isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )
                  ) : (
                    <div className="w-4" /> // Spacer for alignment
                  )}
                  <span className="font-medium">{item.bomItem.childPartTemplateName}</span>
                  <Badge variant="outline" className="text-xs">
                    Qty: {item.bomItem.quantity}
                  </Badge>
                  {item.childPartTemplate?.drawingNumber && (
                    <Badge variant="secondary" className="text-xs">
                      Dwg: {item.childPartTemplate.drawingNumber} Rev {item.childPartTemplate.drawingRevision || '-'}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {isPurchased ? (
                    <Badge className="bg-blue-600">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Purchased (Direct to Assembly)
                    </Badge>
                  ) : hasProcesses ? (
                    <Badge className="bg-green-600">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      {processCount} process{processCount !== 1 ? 'es' : ''}
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <AlertCircle className="mr-1 h-3 w-3" />
                      No processes
                    </Badge>
                  )}
                  {item.materialAvailable ? (
                    <Badge className="bg-green-600 text-xs">Material OK</Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs">Material Short</Badge>
                  )}
                </div>
              </div>

              {/* Child Part Process Steps - Expandable */}
              {isExpanded && hasProcesses && !isPurchased && (
                <div className="ml-7 space-y-2">
                  {item.processSteps.map((step, stepIdx) => (
                    <div
                      key={step.id || stepIdx}
                      className="flex items-center justify-between p-2.5 rounded-md border bg-white hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                          {step.stepNo}
                        </div>
                        <div className="font-medium text-sm">{step.processName || `Step ${step.stepNo}`}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {step.isMandatory && (
                          <Badge variant="outline" className="text-xs">
                            Mandatory
                          </Badge>
                        )}
                        {step.canBeParallel && (
                          <Badge variant="secondary" className="text-xs">
                            Parallel OK
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Assembly Process */}
      {assemblyProcessSteps.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-medium text-sm text-muted-foreground px-1">Assembly Process</h2>

          {/* Assembly Header - Clickable to expand/collapse */}
          <div
            className="flex items-center justify-between p-3 rounded-lg border bg-card border-purple-200 bg-purple-50 cursor-pointer hover:bg-purple-100 transition-colors"
            onClick={() => setAssemblyExpanded(!assemblyExpanded)}
          >
            <div className="flex items-center gap-3">
              {assemblyExpanded ? (
                <ChevronDown className="h-4 w-4 text-purple-600" />
              ) : (
                <ChevronRight className="h-4 w-4 text-purple-600" />
              )}
              <span className="font-medium">Final Assembly</span>
              <Badge variant="outline" className="text-xs">
                {productTemplate?.templateName}
              </Badge>
              {productTemplate?.drawingNumber && (
                <Badge variant="secondary" className="text-xs">
                  Dwg: {productTemplate.drawingNumber} Rev {productTemplate.drawingRevision || '-'}
                </Badge>
              )}
            </div>
            <Badge className="bg-purple-600">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              {assemblyProcessSteps.length} assembly step{assemblyProcessSteps.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          {/* Assembly Steps List - Expandable */}
          {assemblyExpanded && (
            <div className="ml-7 space-y-2 mt-2">
              {assemblyProcessSteps.map((step, idx) => (
                <div
                  key={step.id || idx}
                  className="flex items-center justify-between p-2.5 rounded-md border bg-white hover:bg-purple-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
                      {step.stepNo}
                    </div>
                    <div className="font-medium text-sm">{step.processName || `Step ${step.stepNo}`}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {step.isMandatory && (
                      <Badge variant="outline" className="text-xs">
                        Mandatory
                      </Badge>
                    )}
                    {step.canBeParallel && (
                      <Badge variant="secondary" className="text-xs">
                        Parallel OK
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Manufacturing Steps:</span>
              <span className="font-medium">{manufacturingSteps}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Assembly Steps:</span>
              <span className="font-medium">{assemblyProcessSteps.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm border-t pt-3">
              <span className="text-muted-foreground font-semibold">Total Job Cards:</span>
              <span className="font-semibold text-lg">{totalProcessSteps}</span>
            </div>
            {purchasedParts.length > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Purchased Parts:</span>
                <Badge className="bg-blue-600">{purchasedParts.length} (Direct to Assembly)</Badge>
              </div>
            )}
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
          </div>

          <div className="mt-6 flex gap-3">
            <Button
              onClick={handleGenerateJobCards}
              disabled={partsWithoutProcesses.length > 0}
              className="flex-1"
              size="lg"
            >
              <Package className="mr-2 h-4 w-4" />
              Generate {totalProcessSteps} Job Cards
            </Button>
            <Button variant="outline" onClick={() => router.push('/planning')}>
              Cancel
            </Button>
          </div>

          {partsWithoutProcesses.length > 0 && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Configure process templates for all child parts before generating job cards.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
