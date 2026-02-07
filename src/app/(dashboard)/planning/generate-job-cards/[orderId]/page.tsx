"use client"

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package, AlertTriangle, CheckCircle2, AlertCircle, ChevronDown, ChevronRight, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { orderService, OrderResponse } from '@/lib/api/orders'
import { productTemplateService, ProductTemplateResponse, ProductTemplateBOMItemResponse } from '@/lib/api/product-templates'
import { childPartTemplateService, ChildPartTemplateResponse } from '@/lib/api/child-part-templates'
import { processTemplateService, ProcessTemplateStepResponse } from '@/lib/api/process-templates'
import { jobCardService, CreateJobCardPayload, JobCardMaterialRequirementRequest } from '@/lib/api/job-cards'
import { materialService, MaterialResponse } from '@/lib/api/materials'
import { formatDate } from '@/lib/utils/formatters'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface ChildPartPlanningItem {
  bomItem: ProductTemplateBOMItemResponse
  childPartTemplate: ChildPartTemplateResponse | null
  processSteps: ProcessTemplateStepResponse[]
  materialAvailable: boolean
}

interface EditableMaterialRequirement extends JobCardMaterialRequirementRequest {
  tempId: string // Temporary ID for tracking edits
  childPartTemplateId: number
  childPartName: string
  materialType?: string // From Material Master
  materialShape?: string // From Material Master
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

  // Material edits per child part (key: childPartTemplateId)
  const [materialEdits, setMaterialEdits] = useState<Record<number, EditableMaterialRequirement[]>>({})

  // Available materials from Material Master
  const [availableMaterials, setAvailableMaterials] = useState<MaterialResponse[]>([])

  // Track unsaved changes and saving state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadData()
    loadMaterials()
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

  const loadMaterials = async () => {
    try {
      const materials = await materialService.getAll()
      setAvailableMaterials(materials)
    } catch (error) {
      console.error('Failed to load materials:', error)
      toast.error('Failed to load materials from master data')
    }
  }

  const saveMaterialEdits = async () => {
    setIsSaving(true)
    try {
      // Save to localStorage (can be replaced with API call later)
      const saveKey = `planning_materials_${orderId}`
      localStorage.setItem(saveKey, JSON.stringify(materialEdits))

      setHasUnsavedChanges(false)
      toast.success('Material changes saved successfully', {
        description: 'Changes saved to this order (templates unchanged)'
      })
    } catch (error) {
      console.error('Failed to save material edits:', error)
      toast.error('Failed to save material changes')
    } finally {
      setIsSaving(false)
    }
  }

  const loadSavedMaterialEdits = () => {
    try {
      const saveKey = `planning_materials_${orderId}`
      const saved = localStorage.getItem(saveKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        setMaterialEdits(parsed)
        console.log('Loaded saved material edits:', parsed)
      }
    } catch (error) {
      console.error('Failed to load saved material edits:', error)
    }
  }

  // Load saved edits when child parts are loaded
  useEffect(() => {
    if (childPartItems.length > 0) {
      loadSavedMaterialEdits()
    }
  }, [childPartItems.length])

  // Material management functions
  const getChildPartMaterials = (childPartTemplateId: number, childPartName: string): EditableMaterialRequirement[] => {
    // If we have edits for this child part, return them
    if (materialEdits[childPartTemplateId]) {
      return materialEdits[childPartTemplateId]
    }

    // Otherwise, load from template
    const childPart = childPartItems.find(item => item.childPartTemplate?.id === childPartTemplateId)
    if (!childPart?.childPartTemplate?.materialRequirements) {
      return []
    }

    // Convert template materials to editable format
    return childPart.childPartTemplate.materialRequirements.map((mr, idx) => ({
      tempId: `${childPartTemplateId}-${idx}`,
      childPartTemplateId,
      childPartName,
      rawMaterialId: mr.rawMaterialId,
      rawMaterialName: mr.rawMaterialName,
      materialGrade: mr.materialGrade,
      requiredQuantity: mr.quantityRequired,
      unit: mr.unit,
      wastagePercent: mr.wastagePercent,
      source: 'Template',
      confirmedBy: 'Admin'
    }))
  }

  const updateMaterial = (childPartTemplateId: number, tempId: string, updates: Partial<EditableMaterialRequirement>) => {
    const materials = materialEdits[childPartTemplateId] || getChildPartMaterials(childPartTemplateId, '')
    const updated = materials.map(m => m.tempId === tempId ? { ...m, ...updates, source: 'Manual' } : m)
    setMaterialEdits({ ...materialEdits, [childPartTemplateId]: updated })
    setHasUnsavedChanges(true)
  }

  const selectMaterialFromMaster = (childPartTemplateId: number, tempId: string, materialId: number) => {
    const selectedMaterial = availableMaterials.find(m => m.id === materialId)
    if (!selectedMaterial) return

    const materials = materialEdits[childPartTemplateId] || getChildPartMaterials(childPartTemplateId, '')
    const updated = materials.map(m => m.tempId === tempId ? {
      ...m,
      rawMaterialId: selectedMaterial.id,
      rawMaterialName: selectedMaterial.materialName,
      materialGrade: selectedMaterial.grade,
      materialType: selectedMaterial.materialType,
      materialShape: selectedMaterial.shape,
      unit: 'mm', // Default unit for raw materials
      source: 'Manual'
    } : m)
    setMaterialEdits({ ...materialEdits, [childPartTemplateId]: updated })
    setHasUnsavedChanges(true)
  }

  const addMaterial = (childPartTemplateId: number, childPartName: string) => {
    const materials = materialEdits[childPartTemplateId] || getChildPartMaterials(childPartTemplateId, childPartName)
    const newMaterial: EditableMaterialRequirement = {
      tempId: `${childPartTemplateId}-new-${Date.now()}`,
      childPartTemplateId,
      childPartName,
      rawMaterialName: '',
      materialGrade: '',
      requiredQuantity: 0,
      unit: 'pcs',
      wastagePercent: 0,
      source: 'Manual',
      confirmedBy: 'Admin'
    }
    setMaterialEdits({ ...materialEdits, [childPartTemplateId]: [...materials, newMaterial] })
    setHasUnsavedChanges(true)
  }

  const removeMaterial = (childPartTemplateId: number, tempId: string) => {
    const materials = materialEdits[childPartTemplateId] || []
    const filtered = materials.filter(m => m.tempId !== tempId)
    setMaterialEdits({ ...materialEdits, [childPartTemplateId]: filtered })
    setHasUnsavedChanges(true)
  }

  // Aggregate all materials for summary table
  const getAggregatedMaterials = () => {
    const aggregated: Record<string, {
      materialName: string
      materialGrade: string
      unit: string
      childParts: Array<{
        childPartName: string
        requiredQty: number
        wastagePercent: number
        totalQty: number
      }>
      totalRequired: number
    }> = {}

    childPartItems.forEach(item => {
      if (!item.childPartTemplate || item.childPartTemplate.isPurchased) return

      const materials = getChildPartMaterials(item.childPartTemplate.id, item.bomItem.childPartTemplateName)

      materials.forEach(material => {
        const scaledQty = material.requiredQuantity * (order?.quantity || 1) * item.bomItem.quantity
        const totalWithWastage = scaledQty * (1 + (material.wastagePercent || 0) / 100)

        const key = `${material.rawMaterialName}-${material.materialGrade || 'NoGrade'}`

        if (!aggregated[key]) {
          aggregated[key] = {
            materialName: material.rawMaterialName,
            materialGrade: material.materialGrade || '',
            unit: material.unit,
            childParts: [],
            totalRequired: 0
          }
        }

        aggregated[key].childParts.push({
          childPartName: item.bomItem.childPartTemplateName,
          requiredQty: scaledQty,
          wastagePercent: material.wastagePercent || 0,
          totalQty: totalWithWastage
        })

        aggregated[key].totalRequired += totalWithWastage
      })
    })

    return Object.values(aggregated)
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

          // Get edited materials for first step only
          const materialRequirements = step.stepNo === 1
            ? getChildPartMaterials(item.childPartTemplate.id, item.bomItem.childPartTemplateName).map(mr => ({
                rawMaterialId: mr.rawMaterialId,
                rawMaterialName: mr.rawMaterialName,
                materialGrade: mr.materialGrade,
                requiredQuantity: mr.requiredQuantity * (order.quantity * item.bomItem.quantity),
                unit: mr.unit,
                wastagePercent: mr.wastagePercent,
                source: mr.source,
                confirmedBy: 'Admin'
              }))
            : undefined

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
            materialRequirements
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

      // Update order planning status to "Planned"
      try {
        await orderService.update(order.id, {
          id: order.id,
          planningStatus: 'Planned',
          updatedBy: 'Admin'
        })
      } catch (error) {
        console.error('Failed to update order status:', error)
        // Continue anyway - job cards are created
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
                <div className="ml-7 space-y-3">
                  {/* Process Steps */}
                  <div className="space-y-2">
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

                  {/* Editable Material Requirements */}
                  {item.childPartTemplate && (() => {
                    const materials = getChildPartMaterials(item.childPartTemplate.id, item.bomItem.childPartTemplateName)
                    const hasMaterials = materials.length > 0 || item.childPartTemplate.materialRequirements?.length === 0

                    return hasMaterials && (
                      <div className="p-3 rounded-md border border-blue-200 bg-blue-50/50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-blue-600" />
                            <span className="font-semibold text-sm text-blue-900">
                              Material Requirements
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {materials.length} material{materials.length !== 1 ? 's' : ''}
                            </Badge>
                            {hasUnsavedChanges && (
                              <Badge variant="destructive" className="text-xs animate-pulse">
                                Unsaved
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => addMaterial(item.childPartTemplate!.id, item.bomItem.childPartTemplateName)}
                            >
                              + Add Material
                            </Button>
                            {hasUnsavedChanges && (
                              <Button
                                size="sm"
                                variant="default"
                                className="h-7 text-xs bg-green-600 hover:bg-green-700"
                                onClick={saveMaterialEdits}
                                disabled={isSaving}
                              >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                              </Button>
                            )}
                          </div>
                        </div>

                        {materials.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-blue-200">
                                  <th className="text-left p-2 font-semibold text-blue-900">Material</th>
                                  <th className="text-left p-2 font-semibold text-blue-900">Grade</th>
                                  <th className="text-right p-2 font-semibold text-blue-900">Qty/Unit</th>
                                  <th className="text-right p-2 font-semibold text-blue-900">Wastage%</th>
                                  <th className="text-right p-2 font-semibold text-blue-900">Total</th>
                                  <th className="text-center p-2 font-semibold text-blue-900 w-16">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {materials.map((material) => {
                                  const scaledQty = material.requiredQuantity * (order?.quantity || 1) * item.bomItem.quantity
                                  const totalWithWastage = scaledQty * (1 + (material.wastagePercent || 0) / 100)

                                  return (
                                    <tr key={material.tempId} className="border-b border-blue-100 bg-white">
                                      <td className="p-2">
                                        <Select
                                          value={material.rawMaterialId?.toString() || ''}
                                          onValueChange={(value) => {
                                            if (value === 'custom') {
                                              updateMaterial(item.childPartTemplate!.id, material.tempId, { rawMaterialId: null, rawMaterialName: '' })
                                            } else {
                                              selectMaterialFromMaster(item.childPartTemplate!.id, material.tempId, parseInt(value))
                                            }
                                          }}
                                        >
                                          <SelectTrigger className="h-8 text-xs">
                                            <SelectValue placeholder="Select material">
                                              {material.rawMaterialName || 'Select material'}
                                            </SelectValue>
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="custom">
                                              <span className="text-blue-600 font-medium">+ Custom Material</span>
                                            </SelectItem>
                                            {availableMaterials.map((mat) => (
                                              <SelectItem key={mat.id} value={mat.id.toString()}>
                                                <div className="flex flex-col">
                                                  <span className="font-medium">{mat.materialName}</span>
                                                  <span className="text-xs text-gray-500">{mat.materialType} • {mat.shape} • {mat.grade}</span>
                                                </div>
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        {!material.rawMaterialId && (
                                          <input
                                            type="text"
                                            value={material.rawMaterialName}
                                            onChange={(e) => updateMaterial(item.childPartTemplate!.id, material.tempId, { rawMaterialName: e.target.value })}
                                            className="w-full px-2 py-1 text-xs border rounded mt-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="Enter custom material name"
                                          />
                                        )}
                                        {material.rawMaterialId && material.materialType && (
                                          <div className="flex gap-1 mt-1">
                                            <Badge variant="outline" className="text-xs px-1 py-0 h-4">{material.materialType}</Badge>
                                            <Badge variant="outline" className="text-xs px-1 py-0 h-4">{material.materialShape}</Badge>
                                          </div>
                                        )}
                                      </td>
                                      <td className="p-2">
                                        <input
                                          type="text"
                                          value={material.materialGrade || ''}
                                          onChange={(e) => updateMaterial(item.childPartTemplate!.id, material.tempId, { materialGrade: e.target.value })}
                                          className={`w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${material.rawMaterialId ? 'bg-gray-50' : ''}`}
                                          placeholder="Grade"
                                          readOnly={!!material.rawMaterialId}
                                          title={material.rawMaterialId ? 'Auto-filled from material master' : 'Enter grade manually'}
                                        />
                                      </td>
                                      <td className="p-2">
                                        <div className="flex gap-1">
                                          <input
                                            type="number"
                                            value={material.requiredQuantity}
                                            onChange={(e) => updateMaterial(item.childPartTemplate!.id, material.tempId, { requiredQuantity: parseFloat(e.target.value) || 0 })}
                                            className="w-16 px-2 py-1 text-xs border rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                                          />
                                          <input
                                            type="text"
                                            value={material.unit}
                                            onChange={(e) => updateMaterial(item.childPartTemplate!.id, material.tempId, { unit: e.target.value })}
                                            className="w-12 px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="unit"
                                          />
                                        </div>
                                        <div className="text-gray-500 text-xs mt-0.5">× {order?.quantity || 1} × {item.bomItem.quantity}</div>
                                      </td>
                                      <td className="p-2">
                                        <input
                                          type="number"
                                          value={material.wastagePercent || 0}
                                          onChange={(e) => updateMaterial(item.childPartTemplate!.id, material.tempId, { wastagePercent: parseFloat(e.target.value) || 0 })}
                                          className="w-14 px-2 py-1 text-xs border rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                      </td>
                                      <td className="p-2 text-right">
                                        <div className="font-semibold text-gray-900">
                                          {totalWithWastage.toFixed(2)}
                                        </div>
                                        <div className="text-gray-500 text-xs">
                                          {material.unit}
                                        </div>
                                      </td>
                                      <td className="p-2 text-center">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                          onClick={() => removeMaterial(item.childPartTemplate!.id, material.tempId)}
                                        >
                                          ×
                                        </Button>
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-500 text-xs">
                            No materials defined. Click "Add Material" to add requirements.
                          </div>
                        )}

                        <div className="mt-2 text-xs text-blue-700">
                          ℹ️ Materials attached to first job card step • Edits don't modify templates
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Material Requirements Summary Table */}
      {!loading && order && childPartItems.length > 0 && (() => {
        const aggregatedMaterials = getAggregatedMaterials()

        return aggregatedMaterials.length > 0 && (
          <Card className="border-2 border-amber-200 bg-amber-50/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <CardTitle className="text-base">Material Requirements Summary</CardTitle>
              </div>
              <CardDescription>
                Raw materials required for all child parts (includes wastage allowance)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-amber-300">
                      <th className="text-left p-3 font-semibold text-amber-900">Material</th>
                      <th className="text-left p-3 font-semibold text-amber-900">Used For</th>
                      <th className="text-right p-3 font-semibold text-amber-900">Required (incl. wastage)</th>
                      <th className="text-right p-3 font-semibold text-amber-900">In Stock</th>
                      <th className="text-center p-3 font-semibold text-amber-900">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aggregatedMaterials.map((material, idx) => {
                      // Note: For demo, showing mock inventory. In production, fetch from inventory API
                      const mockInStock = material.totalRequired * 0.6 // Mock: 60% available
                      const isShortage = mockInStock < material.totalRequired

                      return (
                        <React.Fragment key={idx}>
                          {material.childParts.map((childPart, cpIdx) => (
                            <tr key={`${idx}-${cpIdx}`} className={`border-b ${isShortage ? 'bg-red-50' : 'bg-white'}`}>
                              {cpIdx === 0 && (
                                <>
                                  <td className="p-3 font-medium align-top" rowSpan={material.childParts.length + 1}>
                                    <div>{material.materialName}</div>
                                    {material.materialGrade && (
                                      <div className="text-xs text-gray-500 mt-1">{material.materialGrade}</div>
                                    )}
                                  </td>
                                </>
                              )}
                              <td className="p-3 text-gray-700 text-sm">{childPart.childPartName}</td>
                              <td className="p-3 text-right">
                                <div className="font-medium">{childPart.totalQty.toFixed(2)} {material.unit}</div>
                                <div className="text-xs text-gray-500">
                                  Net {childPart.requiredQty.toFixed(0)} + {childPart.wastagePercent}% wastage
                                </div>
                              </td>
                              {cpIdx === 0 && (
                                <>
                                  <td className="p-3 text-right font-semibold align-top" rowSpan={material.childParts.length + 1}>
                                    {mockInStock.toFixed(2)} {material.unit}
                                  </td>
                                  <td className="p-3 text-center align-top" rowSpan={material.childParts.length + 1}>
                                    {isShortage ? (
                                      <Badge variant="destructive" className="text-xs">
                                        ⚠ Short: {(material.totalRequired - mockInStock).toFixed(2)} {material.unit}
                                      </Badge>
                                    ) : (
                                      <Badge className="bg-green-600 text-xs">
                                        ✓ Available
                                      </Badge>
                                    )}
                                  </td>
                                </>
                              )}
                            </tr>
                          ))}
                          {/* Total row for this material */}
                          <tr className="bg-amber-100 border-b-2 border-amber-300 font-semibold">
                            <td className="p-3 text-right" colSpan={1}>
                              <span className="text-amber-900">TOTAL</span>
                            </td>
                            <td className="p-3 text-right text-amber-900">
                              {material.totalRequired.toFixed(2)} {material.unit}
                            </td>
                            <td colSpan={2}></td>
                          </tr>
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <Alert className="mt-4 border-amber-300 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-xs">
                  <strong>Note:</strong> Inventory availability shown is indicative. Actual stock will be verified during material issue.
                  Materials marked as "Short" will flag job cards as "Pending Material".
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )
      })()}

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

      {/* Floating Save Button */}
      {hasUnsavedChanges && (
        <Button
          onClick={saveMaterialEdits}
          disabled={isSaving}
          className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-2xl hover:shadow-xl transition-all z-50 bg-green-600 hover:bg-green-700"
          size="icon"
          title="Save material changes"
        >
          <Save className="h-6 w-6" />
        </Button>
      )}
    </div>
  )
}
