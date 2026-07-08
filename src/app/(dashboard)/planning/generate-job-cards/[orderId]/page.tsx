"use client"

import React, { useState, useEffect, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package, AlertTriangle, CheckCircle2, AlertCircle, ChevronDown, ChevronRight, Save, Pencil, Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { orderService, OrderResponse, OrderItemResponse } from '@/lib/api/orders'
import { productService, ProductChildPartDrawingResponse } from '@/lib/api/products'
import { Product } from '@/types/product'
import { productTemplateService, ProductTemplateResponse, ProductTemplateBOMItemResponse } from '@/lib/api/product-templates'
import { childPartTemplateService, ChildPartTemplateResponse } from '@/lib/api/child-part-templates'
import { processTemplateService, ProcessTemplateStepResponse } from '@/lib/api/process-templates'
import { jobCardService, CreateJobCardPayload, JobCardMaterialRequirementRequest } from '@/lib/api/job-cards'
import { materialService, MaterialResponse } from '@/lib/api/materials'
import { componentService, ComponentResponse } from '@/lib/api/components'
import { inventoryService, InventoryResponse } from '@/lib/api/inventory'
import { materialRequisitionService, CreateMaterialRequisitionRequest } from '@/lib/api/material-requisitions'
import { materialPieceService, MaterialPieceResponse } from '@/lib/api/material-pieces'
import { drawingService, DrawingResponse } from '@/lib/api/drawings'
import { productDefaultMaterialService, ProductDefaultMaterialResponse } from '@/lib/api/product-default-materials'
import { PieceSelectionDialog } from '@/components/planning/PieceSelectionDialog'
import { formatDate } from '@/lib/utils/formatters'
import { MaterialCombobox } from '@/components/planning/material-combobox'
import { Eye, Download, FileText } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

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
  const searchParams = useSearchParams()
  const orderId = params.orderId as string

  // Read itemId and itemSequence directly from URL params (avoid race condition with useEffect)
  const itemIdParam = searchParams.get('itemId')
  const itemSequenceParam = searchParams.get('itemSequence')
  const [itemId] = useState<number | null>(() => itemIdParam ? Number(itemIdParam) : null)
  const [itemSequence] = useState<string | null>(() => itemSequenceParam)
  const [productId, setProductId] = useState<number | null>(null)

  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<OrderResponse | null>(null)
  const [currentOrderItem, setCurrentOrderItem] = useState<OrderItemResponse | null>(null)
  const [productTemplate, setProductTemplate] = useState<ProductTemplateResponse | null>(null)
  const [childPartItems, setChildPartItems] = useState<ChildPartPlanningItem[]>([])
  const [assemblyProcessSteps, setAssemblyProcessSteps] = useState<ProcessTemplateStepResponse[]>([])
  const [assemblyExpanded, setAssemblyExpanded] = useState(true) // Expanded by default
  const [expandedParts, setExpandedParts] = useState<Set<number>>(new Set()) // Track which child parts are expanded

  // Material edits per child part (key: childPartTemplateId)
  const [materialEdits, setMaterialEdits] = useState<Record<number, EditableMaterialRequirement[]>>({})

  // Available materials from Material Master
  const [availableMaterials, setAvailableMaterials] = useState<MaterialResponse[]>([])

  // Available components from Component Master (Masters_Components)
  const [availableComponents, setAvailableComponents] = useState<ComponentResponse[]>([])

  // Inventory data - Map of materialId to InventoryResponse
  const [inventoryData, setInventoryData] = useState<Map<number, InventoryResponse>>(new Map())
  // Actual available raw-material stock (mm) summed from Stores_MaterialPieces (Available pieces).
  // This is the source of truth for raw materials — Inventory_Stock only reflects GRN aggregates.
  const [materialPieceStock, setMaterialPieceStock] = useState<Map<number, number>>(new Map())

  // Component inventory data - Map of componentId to InventoryResponse
  const [componentInventoryData, setComponentInventoryData] = useState<Map<number, InventoryResponse>>(new Map())

  // Product default materials loaded from DB
  const [productDefaultMaterials, setProductDefaultMaterials] = useState<ProductDefaultMaterialResponse[]>([])
  const [isSavingDefaults, setIsSavingDefaults] = useState(false)

  // Track unsaved changes and saving state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Inline qty edit
  const [editingQty, setEditingQty] = useState(false)
  const [editQtyValue, setEditQtyValue] = useState('')
  const [savingQty, setSavingQty] = useState(false)
  const [generating, setGenerating] = useState(false)
  const qtyInputRef = useRef<HTMLInputElement>(null)

  // Piece selection dialog state
  const [pieceSelectionOpen, setPieceSelectionOpen] = useState(false)
  const [selectedMaterialForPieces, setSelectedMaterialForPieces] = useState<{
    materialId: number
    materialName: string
    materialGrade?: string
    requiredLengthMM: number
    aggregatedMaterialIndex: number
    childParts: Array<{ childPartName: string; pieceLengthMM: number; piecesCount: number; wastageMM: number }>
  } | null>(null)

  // Store selected pieces per material (key: materialId or aggregatedMaterialIndex)
  const [selectedPiecesPerMaterial, setSelectedPiecesPerMaterial] = useState<
    Map<number, Array<{ piece: MaterialPieceResponse; quantityMM: number }>>
  >(new Map())

  // Product drawings
  const [productData, setProductData] = useState<Product | null>(null)
  const [assemblyDrawing, setAssemblyDrawing] = useState<DrawingResponse | null>(null)
  const [childPartDrawings, setChildPartDrawings] = useState<ProductChildPartDrawingResponse[]>([])

  // Drawing viewer modal state
  const [viewingDrawing, setViewingDrawing] = useState<{
    fileName: string
    fileType: string
    fileUrl: string
  } | null>(null)

  useEffect(() => {
    loadData()
    loadMaterials()
  }, [orderId, itemId, itemSequence])

  const loadData = async () => {
    setLoading(true)
    try {
      const orderData = await orderService.getById(Number(orderId))
      setOrder(orderData)

      let productTemplateId: number | null = null
      let currentProductId: number | null = null

      // Multi-product order: get product from OrderItem
      if (itemId && orderData.items && orderData.items.length > 0) {
        const orderItem = orderData.items.find(item => item.id === itemId)
        if (orderItem) {
          currentProductId = orderItem.productId
          setProductId(currentProductId)
          setCurrentOrderItem(orderItem) // Store the current item for display

          // Load product to get ProductTemplateId
          const productData = await productService.getById(currentProductId)
          productTemplateId = productData.productTemplateId ?? null

          console.log(`Multi-product order: Item ${itemSequence}, ProductId: ${currentProductId}, ProductTemplateId: ${productTemplateId}`)
        } else {
          toast.error('Order item not found')
          setLoading(false)
          return
        }
      }
      // Legacy single-product order: use order.linkedProductTemplateId
      else {
        productTemplateId = orderData.linkedProductTemplateId ?? null
        currentProductId = orderData.productId
        setProductId(currentProductId)
        setCurrentOrderItem(null) // No specific item for legacy orders
        console.log(`Legacy order: ProductTemplateId: ${productTemplateId}`)
      }

      if (!productTemplateId) {
        toast.warning('No product template linked', {
          description: 'Product needs a template assigned in Master Data'
        })
        setLoading(false)
        return
      }

      const templateData = await productTemplateService.getById(productTemplateId)
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

          // Material availability will be checked after inventory loads
          const materialAvailable = true // Will be updated after inventory loads

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

      // Load product default materials from DB
      if (currentProductId) {
        try {
          const defaults = await productDefaultMaterialService.getByProductId(currentProductId)
          setProductDefaultMaterials(defaults)
        } catch (error) {
          console.warn('No default materials found for product:', error)
        }
      }

      // Load product drawings (assembly + child parts)
      if (currentProductId) {
        try {
          const productData = await productService.getById(currentProductId)
          setProductData(productData)

          // Load assembly drawing if available
          if (productData.assemblyDrawingId) {
            try {
              const assemblyDrawingData = await drawingService.getById(productData.assemblyDrawingId)
              setAssemblyDrawing(assemblyDrawingData)
            } catch (error) {
              console.warn('Failed to load assembly drawing:', error)
            }
          }

          // Load child part drawings
          try {
            const childPartDrawingsData = await productService.getChildPartDrawings(currentProductId)
            setChildPartDrawings(childPartDrawingsData)
          } catch (error) {
            console.warn('Failed to load child part drawings:', error)
          }
        } catch (error) {
          console.error('Failed to load product drawings:', error)
        }
      }

    } catch (error) {
      toast.error('Failed to load order data', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        duration: 4000,
      })
    } finally {
      setLoading(false)
    }
  }

  const startQtyEdit = () => {
    const currentQty = currentOrderItem ? currentOrderItem.quantity : order?.quantity ?? 1
    setEditQtyValue(String(currentQty))
    setEditingQty(true)
    setTimeout(() => qtyInputRef.current?.select(), 0)
  }

  const cancelQtyEdit = () => {
    setEditingQty(false)
    setEditQtyValue('')
  }

  const saveQty = async () => {
    const newQty = parseInt(editQtyValue)
    if (isNaN(newQty) || newQty < 1) { toast.error('Quantity must be at least 1'); return }
    const currentQty = currentOrderItem ? currentOrderItem.quantity : order?.quantity ?? 1
    if (newQty === currentQty) { cancelQtyEdit(); return }
    setSavingQty(true)
    try {
      await orderService.updateQuantity(Number(orderId), newQty, currentOrderItem?.id)
      toast.success(`Quantity updated to ${newQty}`)
      setEditingQty(false)
      setEditQtyValue('')
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update quantity')
    } finally {
      setSavingQty(false)
    }
  }

  const loadMaterials = async () => {
    try {
      const [materials, components] = await Promise.all([
        materialService.getAll(),
        componentService.getAll(),
      ])
      setAvailableMaterials(materials)
      setAvailableComponents(components)

      // Load inventory data for all materials
      await loadInventoryData(materials)

      // Load component inventory data
      await loadComponentInventoryData()
    } catch (error) {
      console.error('Failed to load materials:', error)
      toast.error('Failed to load materials from master data')
    }
  }

  const loadInventoryData = async (materials: MaterialResponse[]) => {
    try {
      const inventoryMap = new Map<number, InventoryResponse>()
      const pieceStockMap = new Map<number, number>()

      // Fetch inventory + actual piece stock for each material
      await Promise.all(
        materials.map(async (material) => {
          // Inventory_Stock (GRN aggregate) — used as fallback only
          try {
            const inventory = await inventoryService.getByMaterialId(material.id)
            if (inventory) {
              inventoryMap.set(material.id, inventory)
            }
          } catch (error) {
            // Material not in inventory yet, skip
            console.log(`No inventory data for material ${material.id}`)
          }

          // MaterialPieces available stock (mm) — the source of truth for raw materials
          try {
            const availableMM = await materialPieceService.getAvailableStock(material.id)
            pieceStockMap.set(material.id, availableMM)
          } catch (error) {
            // Piece stock fetch failed — will fall back to Inventory_Stock
            console.log(`No piece stock for material ${material.id}`)
          }
        })
      )

      setInventoryData(inventoryMap)
      setMaterialPieceStock(pieceStockMap)
    } catch (error) {
      console.error('Failed to load inventory data:', error)
      // Don't show error to user - just won't show stock levels
    }
  }

  // Available raw-material stock (mm): prefer MaterialPieces sum; fall back to Inventory_Stock.
  const getAvailableStockMM = (
    materialId: number,
    matchingMaterial: MaterialResponse | undefined,
    inventory: InventoryResponse | null | undefined
  ): number => {
    if (materialPieceStock.has(materialId)) {
      return materialPieceStock.get(materialId)!
    }
    if (!inventory) return 0
    if (inventory.uom === 'kg' && matchingMaterial) {
      return convertWeightToLength(inventory.availableQuantity, matchingMaterial)
    }
    return inventory.availableQuantity
  }

  const loadComponentInventoryData = async () => {
    try {
      // Get all inventory items
      const allInventory = await inventoryService.getAll()

      // Filter for components (UOM is not mm or kg)
      const componentInventory = allInventory.filter(
        item => item.uom !== 'mm' && item.uom !== 'kg'
      )

      // Create map of componentId (materialId in inventory) to inventory data
      const componentMap = new Map<number, InventoryResponse>()
      componentInventory.forEach(inventory => {
        componentMap.set(inventory.materialId, inventory)
      })

      setComponentInventoryData(componentMap)
    } catch (error) {
      console.error('Failed to load component inventory data:', error)
      // Don't show error to user - just won't show stock levels
    }
  }

  // Convert weight (kg) to length (mm) based on material specifications
  const convertWeightToLength = (weightKg: number, material: MaterialResponse): number => {
    if (!material || weightKg <= 0) return 0

    const { shape, diameter, innerDiameter, density } = material

    // Calculate cross-sectional area in cm²
    let areaCm2 = 0

    if (shape === 'Rod' || shape === 'Forged') {
      // Area = π × r²
      // diameter is in mm, convert to cm by dividing by 10
      const radiusCm = (diameter / 10) / 2
      areaCm2 = Math.PI * Math.pow(radiusCm, 2)
    } else if (shape === 'Pipe') {
      // Area = π × (R² - r²)
      const outerRadiusCm = (diameter / 10) / 2
      const innerRadiusCm = ((innerDiameter || 0) / 10) / 2
      areaCm2 = Math.PI * (Math.pow(outerRadiusCm, 2) - Math.pow(innerRadiusCm, 2))
    } else if (shape === 'Sheet') {
      // For sheets, we can't really convert weight to length without thickness
      // Return 0 or handle differently
      return 0
    }

    if (areaCm2 <= 0 || density <= 0) return 0

    // Convert weight to length
    // Formula: Length (mm) = Weight (kg) × 1,000,000 / (Density (g/cm³) × Area (cm²))
    const lengthMm = (weightKg * 1000000) / (density * areaCm2)

    return lengthMm
  }

  // Handle opening piece selection dialog
  const handleSelectPieces = (
    materialId: number,
    materialName: string,
    materialGrade: string | undefined,
    requiredLengthMM: number,
    aggregatedMaterialIndex: number,
    childParts: Array<{ childPartName: string; pieceLengthMM: number; piecesCount: number; wastageMM: number }>
  ) => {
    setSelectedMaterialForPieces({
      materialId,
      materialName,
      materialGrade,
      childParts,
      requiredLengthMM,
      aggregatedMaterialIndex
    })
    setPieceSelectionOpen(true)
  }

  // Handle piece selection confirmation
  const handlePieceSelectionConfirm = (selectedPieces: Array<{ piece: MaterialPieceResponse; quantityMM: number }>) => {
    if (!selectedMaterialForPieces) return

    const newMap = new Map(selectedPiecesPerMaterial)
    newMap.set(selectedMaterialForPieces.aggregatedMaterialIndex, selectedPieces)
    setSelectedPiecesPerMaterial(newMap)

    toast.success(`Selected ${selectedPieces.length} piece(s) for ${selectedMaterialForPieces.materialName}`)
  }

  // Check material availability based on real inventory
  const checkMaterialAvailability = (childPartTemplateId: number): boolean => {
    if (!order) return true

    const materials = getChildPartMaterials(childPartTemplateId, '')

    // Check if all materials for this child part are available
    for (const material of materials) {
      const matchingMaterial = availableMaterials.find(
        m => m.materialName === material.rawMaterialName &&
             (m.grade === material.materialGrade || (!m.grade && !material.materialGrade))
      )

      if (!matchingMaterial) continue

      const inventory = inventoryData.get(matchingMaterial.id)
      // Skip only if we have neither piece stock nor inventory data for this material
      if (!inventory && !materialPieceStock.has(matchingMaterial.id)) continue

      const childPart = childPartItems.find(item => item.childPartTemplate?.id === childPartTemplateId)
      if (!childPart) continue

      const itemQuantity = currentOrderItem ? currentOrderItem.quantity : order.quantity
      const requiredQty = material.requiredQuantity * (itemQuantity * childPart.bomItem.quantity)
      // Wastage is now in mm, not percentage — multiply by piece count
      const totalWithWastage = requiredQty + (material.wastageMM || 0) * itemQuantity * childPart.bomItem.quantity

      // Available stock from MaterialPieces (source of truth), fallback to Inventory_Stock
      const availableQty = getAvailableStockMM(matchingMaterial.id, matchingMaterial, inventory)

      if (availableQty < totalWithWastage) {
        return false
      }
    }

    return true
  }

  const saveMaterialEdits = async () => {
    setIsSaving(true)
    try {
      // Save to localStorage for this order session
      const saveKey = `planning_materials_${orderId}`
      localStorage.setItem(saveKey, JSON.stringify(materialEdits))

      setHasUnsavedChanges(false)
      toast.success('Material changes saved for this order')
    } catch (error) {
      console.error('Failed to save material edits:', error)
      toast.error('Failed to save material changes')
    } finally {
      setIsSaving(false)
    }
  }

  const saveAsProductDefaults = async () => {
    if (!productId) return
    setIsSavingDefaults(true)
    try {
      // Collect all current materials across all child parts
      const allMaterials: Array<{
        childPartTemplateId?: number | null
        rawMaterialId?: number | null
        rawMaterialName: string
        materialGrade?: string
        requiredQuantity: number
        unit: string
        wastageMM?: number
      }> = []

      for (const [childPartTemplateId, materials] of Object.entries(materialEdits)) {
        for (const mat of materials) {
          if (mat.rawMaterialName) {
            allMaterials.push({
              childPartTemplateId: Number(childPartTemplateId),
              rawMaterialId: mat.rawMaterialId,
              rawMaterialName: mat.rawMaterialName,
              materialGrade: mat.materialGrade,
              requiredQuantity: mat.requiredQuantity,
              unit: mat.unit,
              wastageMM: mat.wastageMM,
            })
          }
        }
      }

      await productDefaultMaterialService.saveDefaults(productId, {
        materials: allMaterials,
        updatedBy: 'Admin'
      })

      // Refresh defaults in state
      const updated = await productDefaultMaterialService.getByProductId(productId)
      setProductDefaultMaterials(updated)

      toast.success('Saved as product defaults', {
        description: 'These materials will auto-fill for future orders of this product'
      })
    } catch (error) {
      console.error('Failed to save product defaults:', error)
      toast.error('Failed to save product defaults')
    } finally {
      setIsSavingDefaults(false)
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

    // Check if product has saved defaults for this child part
    const savedDefaults = productDefaultMaterials.filter(d => d.childPartTemplateId === childPartTemplateId)
    if (savedDefaults.length > 0) {
      return savedDefaults.map((d, idx) => ({
        tempId: `default-${childPartTemplateId}-${idx}`,
        childPartTemplateId,
        childPartName,
        rawMaterialId: d.rawMaterialId,
        rawMaterialName: d.rawMaterialName,
        materialGrade: d.materialGrade,
        requiredQuantity: d.requiredQuantity,
        unit: d.unit,
        wastageMM: d.wastageMM,
        source: 'Default',
        confirmedBy: 'Admin'
      }))
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
      wastageMM: mr.wastageMM,
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
      wastageMM: 5,
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
      rawMaterialId?: number
      materialName: string
      materialGrade: string
      unit: string
      childParts: Array<{
        childPartName: string
        requiredQty: number
        wastageMM: number
        totalQty: number
        pieceLengthMM: number   // per-piece length WITH wastage
        piecesCount: number     // total number of pieces to cut
      }>
      totalRequired: number
    }> = {}

    // Use item-specific quantity for multi-product orders
    const itemQuantity = currentOrderItem ? currentOrderItem.quantity : (order?.quantity || 1)

    childPartItems.forEach(item => {
      if (!item.childPartTemplate || item.childPartTemplate.isPurchased) return

      const materials = getChildPartMaterials(item.childPartTemplate.id, item.bomItem.childPartTemplateName)

      materials.forEach(material => {
        const piecesCount = itemQuantity * item.bomItem.quantity
        const scaledQty = material.requiredQuantity * piecesCount
        // Wastage is now in mm, not percentage — multiply by piece count
        const totalWithWastage = scaledQty + (material.wastageMM || 0) * piecesCount
        const pieceLengthMM = material.requiredQuantity + (material.wastageMM || 0)

        const key = `${material.rawMaterialId || material.rawMaterialName}-${material.materialGrade || 'NoGrade'}`

        if (!aggregated[key]) {
          aggregated[key] = {
            rawMaterialId: material.rawMaterialId || undefined,
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
          wastageMM: material.wastageMM || 0,
          totalQty: totalWithWastage,
          pieceLengthMM,
          piecesCount,
        })

        aggregated[key].totalRequired += totalWithWastage
      })
    })

    return Object.values(aggregated)
  }

  const getAggregatedPurchasedParts = () => {
    const aggregated: Record<string, {
      componentId?: number
      componentName: string
      partNumber?: string
      unit: string
      usedFor: string[]
      totalRequired: number
    }> = {}

    // Use item-specific quantity for multi-product orders
    const itemQuantity = currentOrderItem ? currentOrderItem.quantity : (order?.quantity || 1)

    childPartItems.forEach(item => {
      // Only process purchased parts
      if (!item.childPartTemplate || !item.childPartTemplate.isPurchased) return

      const requiredQty = itemQuantity * item.bomItem.quantity
      const key = item.childPartTemplate.templateCode

      if (!aggregated[key]) {
        aggregated[key] = {
          componentId: item.childPartTemplate.id,
          componentName: item.bomItem.childPartTemplateName,
          partNumber: item.childPartTemplate.templateCode,
          unit: 'PCS', // Default unit for purchased parts
          usedFor: [],
          totalRequired: 0
        }
      }

      aggregated[key].usedFor.push(`${order?.productName || 'Product'}`)
      aggregated[key].totalRequired += requiredQty
    })

    return Object.values(aggregated)
  }

  const handleGenerateJobCards = async () => {
    if (!order || !productTemplate) return

    // Prevent double-submit: a second click while the create-loop is running would
    // re-create the same deterministic job card numbers → 400 "already exists".
    if (generating) return

    // For multi-product orders, ensure a specific item is selected
    if (order.items && order.items.length > 0 && !currentOrderItem) {
      toast.error('No Order Item Selected', {
        description: 'This is a multi-product order. Please select a specific item (Order-A, Order-B, etc.) from the Planning dashboard.',
        duration: 6000,
      })
      return
    }

    // NOTE: Drawing review is now at ORDER ITEM level for multi-product orders
    // The backend will validate each job card's order item drawing status
    // This allows independent approval and planning per product

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

    setGenerating(true)
    toast.loading('Generating job cards...')

    try {
      let jobCardCount = 0
      // Store job cards with their material requirements for requisition
      const jobCardsWithMaterials: Array<{
        jobCardId: number
        jobCardNo: string
        processId: number
        processName: string
        childPartName: string
        materials: Array<{
          rawMaterialId: number | null | undefined
          rawMaterialName: string
          materialGrade: string | undefined
          requiredQuantity: number
          lengthPerPiece: number
          numberOfPieces: number
          unit: string
        }>
      }> = []

      for (const item of childPartItems) {
        // Skip purchased parts - they go directly to assembly
        if (!item.childPartTemplate || item.childPartTemplate.isPurchased) continue
        if (item.processSteps.length === 0) continue

        for (const step of item.processSteps) {
          // Include item sequence in job card number for multi-product orders
          const itemSeqSuffix = currentOrderItem ? `-${currentOrderItem.itemSequence}` : ''
          const jobCardNo = `JC-${order.orderNo}${itemSeqSuffix}-${item.childPartTemplate.templateCode}-${String(step.stepNo).padStart(2, '0')}`

          // Use item-specific quantity for multi-product orders
          const itemQuantity = currentOrderItem ? currentOrderItem.quantity : order.quantity
          const itemPriority = currentOrderItem ? currentOrderItem.priority : order.priority

          // Get edited materials for first step only
          const materialRequirements = step.stepNo === 1
            ? getChildPartMaterials(item.childPartTemplate.id, item.bomItem.childPartTemplateName).map(mr => ({
                rawMaterialId: mr.rawMaterialId,
                rawMaterialName: mr.rawMaterialName,
                materialGrade: mr.materialGrade,
                requiredQuantity: mr.requiredQuantity * (itemQuantity * item.bomItem.quantity),
                lengthPerPiece: mr.requiredQuantity, // Per-piece requirement (e.g., 300mm)
                numberOfPieces: itemQuantity * item.bomItem.quantity, // Total pieces (e.g., 2)
                unit: mr.unit,
                wastageMM: mr.wastageMM,
                source: mr.source,
                confirmedBy: 'Admin'
              }))
            : undefined

          const isMaterialAvailable = checkMaterialAvailability(item.childPartTemplate.id)

          const payload: CreateJobCardPayload = {
            jobCardNo,
            creationType: 'auto',
            orderId: order.id,
            orderNo: order.orderNo,
            orderItemId: currentOrderItem?.id || null,
            itemSequence: currentOrderItem?.itemSequence || null,
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
            quantity: itemQuantity * item.bomItem.quantity,
            priority: itemPriority,
            manufacturingDimensions: null,
            createdBy: 'Admin',
            specialNotes: !isMaterialAvailable ? 'Pending Material - Material shortage detected' : null,
            materialRequirements
          }

          const jobCardId = await jobCardService.create(payload)
          jobCardCount++

          // Store job card info with materials for requisition (only for first step with materials)
          if (materialRequirements && materialRequirements.length > 0) {
            jobCardsWithMaterials.push({
              jobCardId,
              jobCardNo,
              processId: step.processId,
              processName: step.processName || 'Unknown Process',
              childPartName: item.bomItem.childPartTemplateName,
              materials: materialRequirements.map(mr => ({
                rawMaterialId: mr.rawMaterialId,
                rawMaterialName: mr.rawMaterialName,
                materialGrade: mr.materialGrade,
                requiredQuantity: mr.requiredQuantity,
                lengthPerPiece: mr.lengthPerPiece,
                numberOfPieces: mr.numberOfPieces,
                unit: mr.unit
              }))
            })
          }
        }
      }

      // Generate assembly job cards
      const itemQuantity = currentOrderItem ? currentOrderItem.quantity : order.quantity
      const itemPriority = currentOrderItem ? currentOrderItem.priority : order.priority

      for (const step of assemblyProcessSteps) {
        // Include item sequence in job card number for multi-product orders
        const itemSeqSuffix = currentOrderItem ? `-${currentOrderItem.itemSequence}` : ''
        const jobCardNo = `JC-${order.orderNo}${itemSeqSuffix}-ASSY-${String(step.stepNo).padStart(2, '0')}`

        const payload: CreateJobCardPayload = {
          jobCardNo,
          creationType: 'auto',
          orderId: order.id,
          orderNo: order.orderNo,
          orderItemId: currentOrderItem?.id || null,
          itemSequence: currentOrderItem?.itemSequence || null,
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
          quantity: itemQuantity,
          priority: itemPriority,
          manufacturingDimensions: null,
          createdBy: 'Admin',
        }

        await jobCardService.create(payload)
        jobCardCount++
      }

      // Update order item planning status to "Planned"
      try {
        if (itemId) {
          await orderService.updateItemPlanningStatus(itemId, 'Planned')
        } else {
          // Legacy single-product order: fall back to order-level update
          await orderService.update(order.id, {
            id: order.id,
            orderDate: order.orderDate,
            dueDate: order.dueDate,
            adjustedDueDate: order.adjustedDueDate || undefined,
            customerId: order.customerId,
            productId: order.productId,
            quantity: order.quantity,
            status: order.status,
            priority: order.priority,
            planningStatus: 'Planned',
            delayReason: order.delayReason || undefined,
            version: order.version,
            updatedBy: 'Admin'
          })
        }
      } catch (error) {
        console.error('Failed to update planning status:', error)
        // Continue anyway - job cards are created
      }

      // Create Material Requisition for the order with items
      try {
        const requisitionNo = `REQ-${order.orderNo}-${Date.now()}`
        const requisitionDate = new Date().toISOString()

        // Build a map of materialId to selected piece IDs from the aggregated materials
        const materialIdToPieceIds = new Map<number, number[]>()
        const materialIdToPieceQuantities = new Map<number, number[]>() // NEW: Store quantities
        const aggregatedMaterials = getAggregatedMaterials()

        aggregatedMaterials.forEach((material, idx) => {
          const selectedPieces = selectedPiecesPerMaterial.get(idx)
          if (selectedPieces && selectedPieces.length > 0) {
            const pieceIds = selectedPieces.map(sp => sp.piece.id)
            const quantities = selectedPieces.map(sp => sp.quantityMM) // NEW: Extract quantities

            // Find the actual material ID from availableMaterials
            const matchingMaterial = material.rawMaterialId
              ? availableMaterials.find(m => m.id === material.rawMaterialId)
              : availableMaterials.find(
                  m => m.materialName === material.materialName &&
                       (m.grade === material.materialGrade || (!m.grade && !material.materialGrade))
                )

            if (matchingMaterial) {
              materialIdToPieceIds.set(matchingMaterial.id, pieceIds)
              materialIdToPieceQuantities.set(matchingMaterial.id, quantities) // NEW: Store quantities
            }
          }
        })

        // Create requisition items from job cards with material requirements
        const requisitionItems = []
        let lineNo = 1

        // Add materials from job cards (with job card context)
        for (const jobCard of jobCardsWithMaterials) {
          for (const material of jobCard.materials) {
            const materialId = material.rawMaterialId || 0
            const selectedPieceIds = materialIdToPieceIds.get(materialId)
            const selectedPieceQuantities = materialIdToPieceQuantities.get(materialId) // NEW: Get quantities

            requisitionItems.push({
              lineNo: lineNo++,
              materialId,
              materialCode: '',
              materialName: material.rawMaterialName,
              materialGrade: material.materialGrade || '',
              quantityRequired: material.requiredQuantity,
              lengthRequiredMM: material.lengthPerPiece, // Per-piece requirement (e.g., 300mm)
              numberOfPieces: material.numberOfPieces, // Total pieces (e.g., 2)
              uom: material.unit,
              jobCardId: jobCard.jobCardId,
              jobCardNo: jobCard.jobCardNo,
              processId: jobCard.processId,
              processName: jobCard.processName,
              selectedPieceIds: selectedPieceIds, // Include pre-selected pieces
              selectedPieceQuantities: selectedPieceQuantities, // NEW: Include cut quantities
              remarks: `For ${jobCard.childPartName} - ${jobCard.processName}${selectedPieceIds ? ` (${selectedPieceIds.length} piece(s) pre-selected)` : ''}`
            })
          }
        }

        // Add purchased components (these don't have job cards as they go to assembly)
        const aggregatedPurchasedParts = getAggregatedPurchasedParts()
        for (const part of aggregatedPurchasedParts) {
          // Match to Masters_Components by name to get the correct componentId
          // (child part template IDs differ from component master IDs)
          const matchedComponent = availableComponents.find(
            c => c.componentName.toLowerCase() === part.componentName.toLowerCase()
          )
          requisitionItems.push({
            lineNo: lineNo++,
            componentId: matchedComponent?.id ?? part.componentId,
            componentCode: matchedComponent?.partNumber ?? part.partNumber,
            componentName: part.componentName,
            quantityRequired: part.totalRequired,
            uom: matchedComponent?.unit ?? part.unit,
            remarks: `Purchased component for: ${part.usedFor.join(', ')}`
          })
        }

        const requisitionPayload: CreateMaterialRequisitionRequest = {
          requisitionNo,
          requisitionDate,
          orderId: order.id,
          orderNo: order.orderNo,
          orderItemId: currentOrderItem?.id || undefined,
          itemSequence: currentOrderItem?.itemSequence || undefined,
          customerName: order.customerName || undefined,
          priority: (currentOrderItem ? currentOrderItem.priority : order.priority) || 'Medium',
          dueDate: currentOrderItem ? currentOrderItem.dueDate : order.dueDate,
          requestedBy: 'Planning',
          remarks: `Auto-generated from job card planning for order ${order.orderNo}${currentOrderItem ? `-${currentOrderItem.itemSequence}` : ''}`,
          createdBy: 'Admin',
          items: requisitionItems
        }

        await materialRequisitionService.create(requisitionPayload)
        console.log(`✓ Material requisition created: ${requisitionNo} with ${requisitionItems.length} item(s)`)
      } catch (error) {
        console.error('Failed to create material requisition:', error)
        toast.warning('Job cards created but failed to create material requisition', {
          description: 'You may need to create material requisition manually',
          duration: 5000,
        })
      }

      toast.dismiss()

      const materialIssuesCount = childPartItems.filter(item =>
        item.childPartTemplate &&
        !item.childPartTemplate.isPurchased &&
        !checkMaterialAvailability(item.childPartTemplate.id)
      ).length
      toast.success('Job Cards Generated Successfully!', {
        description: `${jobCardCount} job cards created for order ${order.orderNo}. Material requisition created.${materialIssuesCount > 0 ? ` ${materialIssuesCount} job card(s) flagged as "Pending Material".` : ''}`,
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
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="px-3 sm:px-6 pb-6 space-y-4 max-w-5xl w-full">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="px-3 sm:px-6 pb-6 space-y-4 max-w-5xl w-full">
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

  // Check material availability using real inventory data
  const allMaterialsAvailable = childPartItems.every(item => {
    if (!item.childPartTemplate || item.childPartTemplate.isPurchased) return true
    return checkMaterialAvailability(item.childPartTemplate.id)
  })
  // Count process steps for manufactured parts (exclude purchased) + assembly steps
  const manufacturingSteps = childPartItems
    .filter(item => !item.childPartTemplate?.isPurchased)
    .reduce((sum, item) => sum + item.processSteps.length, 0)
  const totalProcessSteps = manufacturingSteps + assemblyProcessSteps.length
  const partsWithoutProcesses = childPartItems.filter(
    item => !item.childPartTemplate?.isPurchased && item.processSteps.length === 0
  )
  const purchasedParts = childPartItems.filter(item => item.childPartTemplate?.isPurchased)

  // Use item-level drawing review status for multi-product orders; fall back to order-level
  const effectiveDrawingStatus = currentOrderItem?.drawingReviewStatus ?? order.drawingReviewStatus

  return (
    <div className="px-3 sm:px-6 pb-6 space-y-4 max-w-5xl w-full">
      {/* Back Button */}
      <Link href="/planning">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Planning
        </Button>
      </Link>

      {/* Order Summary */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
            <div>
              <CardTitle className="text-lg sm:text-xl">Generate Job Cards</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {order.customerName} • {order.productName}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-sm sm:text-lg">
                {order.orderNo}{currentOrderItem ? `-${currentOrderItem.itemSequence}` : ''}
              </Badge>
              <Badge variant={(currentOrderItem ? currentOrderItem.priority : order.priority) === 'Urgent' ? 'destructive' : 'outline'}>
                {currentOrderItem ? currentOrderItem.priority : order.priority}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Quantity:</span>
              {editingQty ? (
                <span className="ml-2 inline-flex items-center gap-1">
                  <input
                    ref={qtyInputRef}
                    type="number"
                    min={1}
                    value={editQtyValue}
                    onChange={e => setEditQtyValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveQty(); if (e.key === 'Escape') cancelQtyEdit() }}
                    disabled={savingQty}
                    className="w-20 h-7 rounded border border-input bg-background px-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                  <button onClick={saveQty} disabled={savingQty} className="h-7 w-7 flex items-center justify-center rounded text-green-600 hover:bg-green-50 disabled:opacity-50" title="Save">
                    <Check className="h-4 w-4" />
                  </button>
                  <button onClick={cancelQtyEdit} disabled={savingQty} className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:bg-muted" title="Cancel">
                    <X className="h-4 w-4" />
                  </button>
                </span>
              ) : (
                <span className="ml-2 inline-flex items-center gap-1">
                  <span className="font-medium">{currentOrderItem ? currentOrderItem.quantity : order.quantity} pcs</span>
                  <button onClick={startQtyEdit} className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted" title="Edit quantity">
                    <Pencil className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
            <div>
              <span className="text-muted-foreground">Due Date:</span>
              <span className="ml-2 font-medium">{formatDate(currentOrderItem ? currentOrderItem.dueDate : order.dueDate)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Child Parts:</span>
              <span className="ml-2 font-medium">{childPartItems.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Product:</span>
              <span className="ml-2 font-medium">{currentOrderItem?.productName ?? order.productName ?? '—'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">No. of Teeth:</span>
              <span className="ml-2 font-medium">
                {(currentOrderItem?.numberOfTeeth ?? order.numberOfTeeth)
                  ? `${currentOrderItem?.numberOfTeeth ?? order.numberOfTeeth}T`
                  : '—'}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Drawing Review:</span>
              <Badge
                variant={effectiveDrawingStatus === 'Approved' ? 'default' : 'destructive'}
                className={effectiveDrawingStatus === 'Approved' ? 'bg-green-600' : ''}
              >
                {effectiveDrawingStatus}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Drawings */}
      {(assemblyDrawing || childPartDrawings.length > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Product Drawings
            </CardTitle>
            <CardDescription>
              View or download approved drawings for this product
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Part Name</TableHead>
                    <TableHead>Drawing Number</TableHead>
                    <TableHead>File Name</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Assembly Drawing */}
                  {assemblyDrawing && (
                    <TableRow>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          Assembly Drawing
                        </div>
                      </TableCell>
                      <TableCell>{assemblyDrawing.drawingNumber || '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {assemblyDrawing.fileName || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (assemblyDrawing.fileUrl && assemblyDrawing.fileType) {
                                setViewingDrawing({
                                  fileName: assemblyDrawing.fileName || assemblyDrawing.drawingName,
                                  fileType: assemblyDrawing.fileType,
                                  fileUrl: assemblyDrawing.fileUrl,
                                })
                              }
                            }}
                            disabled={!assemblyDrawing.fileUrl}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (assemblyDrawing.fileUrl) {
                                const link = document.createElement('a')
                                link.href = assemblyDrawing.fileUrl
                                link.download = assemblyDrawing.fileName || assemblyDrawing.drawingName
                                document.body.appendChild(link)
                                link.click()
                                document.body.removeChild(link)
                              }
                            }}
                            disabled={!assemblyDrawing.fileUrl}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Child Part Drawings */}
                  {childPartDrawings.length > 0 && (
                    <>
                      <TableRow className="bg-muted/50">
                        <TableCell colSpan={4} className="font-medium text-sm">
                          Child Part Drawings
                        </TableCell>
                      </TableRow>
                      {childPartDrawings.map((drawing) => (
                        <TableRow key={drawing.id}>
                          <TableCell>{drawing.childPartTemplateName || 'Unknown Part'}</TableCell>
                          <TableCell>{drawing.drawingNumber || '-'}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {drawing.fileName || '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (drawing.fileUrl && drawing.fileType) {
                                    setViewingDrawing({
                                      fileName: drawing.fileName || drawing.drawingName || 'Drawing',
                                      fileType: drawing.fileType,
                                      fileUrl: drawing.fileUrl,
                                    })
                                  }
                                }}
                                disabled={!drawing.fileUrl}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (drawing.fileUrl) {
                                    const link = document.createElement('a')
                                    link.href = drawing.fileUrl
                                    link.download = drawing.fileName || drawing.drawingName || 'drawing'
                                    document.body.appendChild(link)
                                    link.click()
                                    document.body.removeChild(link)
                                  }
                                }}
                                disabled={!drawing.fileUrl}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  )}

                  {/* Empty State */}
                  {!assemblyDrawing && childPartDrawings.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No drawings available for this product
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Drawing Review Alert */}
      {effectiveDrawingStatus !== 'Approved' && (
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription>
            <strong>Drawing Review Required:</strong> This order cannot proceed to planning until the drawing is reviewed and approved.
            Current status: <strong>{effectiveDrawingStatus}</strong>
            {effectiveDrawingStatus === 'Pending' && ' - Awaiting review'}
            {effectiveDrawingStatus === 'UnderReview' && ' - Currently under review'}
            {effectiveDrawingStatus === 'Rejected' && ' - Drawing has been rejected, revisions needed'}
            {effectiveDrawingStatus === 'RevisionRequired' && ' - Revisions required before approval'}
          </AlertDescription>
        </Alert>
      )}

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
                className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg border bg-card cursor-pointer hover:bg-accent/50 transition-colors ${
                  isPurchased ? 'border-blue-200 bg-blue-50' : hasProcesses ? '' : 'border-red-200 bg-red-50'
                }`}
                onClick={toggleExpanded}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  {hasProcesses && !isPurchased ? (
                    isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )
                  ) : (
                    <div className="w-4 flex-shrink-0" />
                  )}
                  <span className="font-medium text-sm sm:text-base">{item.bomItem.childPartTemplateName}</span>
                  <Badge variant="outline" className="text-xs">Qty: {item.bomItem.quantity}</Badge>
                  {item.childPartTemplate?.drawingNumber && (
                    <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
                      Dwg: {item.childPartTemplate.drawingNumber} Rev {item.childPartTemplate.drawingRevision || '-'}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap ml-6 sm:ml-0">
                  {isPurchased ? (
                    <Badge className="bg-blue-600 text-xs">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Purchased
                    </Badge>
                  ) : hasProcesses ? (
                    <Badge className="bg-green-600 text-xs">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      {processCount} process{processCount !== 1 ? 'es' : ''}
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-xs">
                      <AlertCircle className="mr-1 h-3 w-3" />
                      No processes
                    </Badge>
                  )}
                  {item.childPartTemplate && !isPurchased && (() => {
                    const isAvailable = checkMaterialAvailability(item.childPartTemplate.id)
                    return isAvailable ? (
                      <Badge className="bg-green-600 text-xs">Material OK</Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs">Material Short</Badge>
                    )
                  })()}
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
                        className="flex items-center justify-between gap-2 p-2.5 rounded-md border bg-white hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-green-100 text-green-700 text-xs font-semibold flex-shrink-0">
                            {step.stepNo}
                          </div>
                          <div className="font-medium text-sm truncate">{step.processName || `Step ${step.stepNo}`}</div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                          {step.isMandatory && (
                            <Badge variant="outline" className="text-xs">Mandatory</Badge>
                          )}
                          {step.canBeParallel && (
                            <Badge variant="secondary" className="text-xs">Parallel</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Editable Material Requirements */}
                  {item.childPartTemplate && !isPurchased && (() => {
                    const materials = getChildPartMaterials(item.childPartTemplate.id, item.bomItem.childPartTemplateName)

                    return (
                      <div className="p-3 rounded-md border border-blue-200 bg-blue-50/50">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Package className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            <span className="font-semibold text-sm text-blue-900">Material Requirements</span>
                            <Badge variant="secondary" className="text-xs">
                              {materials.length} material{materials.length !== 1 ? 's' : ''}
                            </Badge>
                            {productDefaultMaterials.some(d => d.childPartTemplateId === item.childPartTemplate?.id) && !materialEdits[item.childPartTemplate!.id] && (
                              <Badge variant="outline" className="text-xs border-blue-400 text-blue-700">From Defaults</Badge>
                            )}
                            {hasUnsavedChanges && (
                              <Badge variant="destructive" className="text-xs animate-pulse">Unsaved</Badge>
                            )}
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => addMaterial(item.childPartTemplate!.id, item.bomItem.childPartTemplateName)}
                            >
                              + Add Material
                            </Button>
                            {productId && materials.length > 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs border-blue-400 text-blue-700 hover:bg-blue-50"
                                onClick={saveAsProductDefaults}
                                disabled={isSavingDefaults}
                                title="Save current materials as defaults for this product"
                              >
                                <Save className="h-3 w-3 mr-1" />
                                {isSavingDefaults ? 'Saving...' : 'Save as Defaults'}
                              </Button>
                            )}
                            {hasUnsavedChanges && (
                              <Button
                                size="sm"
                                variant="default"
                                className="h-7 text-xs bg-green-600 hover:bg-green-700"
                                onClick={saveMaterialEdits}
                                disabled={isSaving}
                              >
                                {isSaving ? 'Saving...' : 'Save'}
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
                                  <th className="text-right p-2 font-semibold text-blue-900">Size</th>
                                  <th className="text-left p-2 font-semibold text-blue-900">Unit</th>
                                  <th className="text-right p-2 font-semibold text-blue-900">Wastage (mm)</th>
                                  <th className="text-right p-2 font-semibold text-blue-900">Total</th>
                                  <th className="text-center p-2 font-semibold text-blue-900 w-16">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {materials.map((material) => {
                                  const itemQuantity = currentOrderItem ? currentOrderItem.quantity : (order?.quantity || 1)
                                  const scaledQty = material.requiredQuantity * itemQuantity * item.bomItem.quantity
                                  // Wastage is now in mm, not percentage — multiply by piece count
                                  const totalWithWastage = scaledQty + (material.wastageMM || 0) * itemQuantity * item.bomItem.quantity

                                  return (
                                    <tr key={material.tempId} className="border-b border-blue-100 bg-white">
                                      <td className="p-2 align-top">
                                        <MaterialCombobox
                                          materials={availableMaterials}
                                          selectedId={material.rawMaterialId}
                                          selectedName={material.rawMaterialName}
                                          onSelectMaterial={(id) => selectMaterialFromMaster(item.childPartTemplate!.id, material.tempId, id)}
                                          onSelectCustom={() => updateMaterial(item.childPartTemplate!.id, material.tempId, { rawMaterialId: null, rawMaterialName: '' })}
                                        />
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
                                      <td className="p-2 align-top">
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
                                      <td className="p-2 align-top text-right">
                                        <input
                                          type="number"
                                          value={material.requiredQuantity}
                                          onChange={(e) => updateMaterial(item.childPartTemplate!.id, material.tempId, { requiredQuantity: parseFloat(e.target.value) || 0 })}
                                          className="w-16 px-2 py-1 text-xs border rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                        <div className="text-gray-500 text-xs mt-0.5">× {itemQuantity} × {item.bomItem.quantity}</div>
                                      </td>
                                      <td className="p-2 align-top">
                                        <input
                                          type="text"
                                          value={material.unit}
                                          onChange={(e) => updateMaterial(item.childPartTemplate!.id, material.tempId, { unit: e.target.value })}
                                          className="w-14 px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                          placeholder="unit"
                                        />
                                      </td>
                                      <td className="p-2 align-top text-right">
                                        <input
                                          type="number"
                                          value={material.wastageMM ?? 0}
                                          onChange={(e) => updateMaterial(item.childPartTemplate!.id, material.tempId, { wastageMM: parseFloat(e.target.value) || 0 })}
                                          className="w-14 px-2 py-1 text-xs border rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                        <div className="text-gray-500 text-xs mt-0.5">× {itemQuantity} × {item.bomItem.quantity}</div>
                                      </td>
                                      <td className="p-2 text-right align-top">
                                        <div className="font-semibold text-gray-900 py-1">
                                          {totalWithWastage.toFixed(2)}
                                        </div>
                                        <div className="text-gray-500 text-xs">
                                          {material.unit}
                                        </div>
                                      </td>
                                      <td className="p-2 text-center align-top">
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
                      <th className="text-center p-3 font-semibold text-amber-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aggregatedMaterials.map((material, idx) => {
                      // Get actual inventory data - match by ID first, then by name and grade
                      const matchingMaterial = material.rawMaterialId
                        ? availableMaterials.find(m => m.id === material.rawMaterialId)
                        : availableMaterials.find(
                            m => m.materialName === material.materialName &&
                                 (m.grade === material.materialGrade || (!m.grade && !material.materialGrade))
                          )

                      // Debug logging
                      if (!matchingMaterial) {
                        console.warn(`Could not find matching material for: ${material.materialName} (Grade: ${material.materialGrade}, ID: ${material.rawMaterialId})`)
                      }

                      const inventory = matchingMaterial ? inventoryData.get(matchingMaterial.id) : null

                      // Available stock from MaterialPieces (source of truth), fallback to Inventory_Stock
                      const inStock = matchingMaterial
                        ? getAvailableStockMM(matchingMaterial.id, matchingMaterial, inventory)
                        : 0

                      const isShortage = inStock < material.totalRequired
                      const hasInventoryData = inventory != null || (matchingMaterial ? materialPieceStock.has(matchingMaterial.id) : false)

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
                                  Net {childPart.requiredQty.toFixed(0)} + {childPart.wastageMM}% wastage
                                </div>
                              </td>
                              {cpIdx === 0 && (
                                <>
                                  <td className="p-3 text-right font-semibold align-top" rowSpan={material.childParts.length + 1}>
                                    {hasInventoryData ? (
                                      <>
                                        {inStock.toFixed(2)} {material.unit}
                                        {inventory && inventory.uom === 'kg' && (
                                          <div className="text-xs text-gray-500 font-normal mt-1">
                                            ({inventory.availableQuantity.toFixed(2)} kg)
                                          </div>
                                        )}
                                        {inventory?.isLowStock && !isShortage && (
                                          <div className="text-xs text-yellow-600 font-normal mt-1">
                                            Low Stock
                                          </div>
                                        )}
                                      </>
                                    ) : (
                                      <span className="text-gray-400 text-sm">No data</span>
                                    )}
                                  </td>
                                  <td className="p-3 text-center align-top" rowSpan={material.childParts.length + 1}>
                                    {!hasInventoryData ? (
                                      <Badge variant="outline" className="text-xs border-gray-400 text-gray-600">
                                        Not in inventory
                                      </Badge>
                                    ) : isShortage ? (
                                      <Badge variant="destructive" className="text-xs">
                                        ⚠ Short: {(material.totalRequired - inStock).toFixed(2)} {material.unit}
                                      </Badge>
                                    ) : (
                                      <Badge className="bg-green-600 text-xs">
                                        ✓ Available
                                      </Badge>
                                    )}
                                  </td>
                                  <td className="p-3 text-center align-top" rowSpan={material.childParts.length + 1}>
                                    {matchingMaterial && hasInventoryData && (
                                      <div className="flex flex-col gap-2 items-center">
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                size="icon"
                                                variant={selectedPiecesPerMaterial.has(idx) ? "default" : "outline"}
                                                className="h-8 w-8 relative"
                                                onClick={() => handleSelectPieces(
                                                  matchingMaterial.id,
                                                  material.materialName,
                                                  material.materialGrade,
                                                  material.totalRequired,
                                                  idx,
                                                  material.childParts.map(cp => ({
                                                    childPartName: cp.childPartName,
                                                    pieceLengthMM: cp.pieceLengthMM,
                                                    piecesCount: cp.piecesCount,
                                                    wastageMM: cp.wastageMM,
                                                  }))
                                                )}
                                              >
                                                <Package className="h-4 w-4" />
                                                {selectedPiecesPerMaterial.has(idx) && (
                                                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center">
                                                    {selectedPiecesPerMaterial.get(idx)?.length}
                                                  </span>
                                                )}
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <div className="text-xs">
                                                {selectedPiecesPerMaterial.has(idx) ? (
                                                  <>
                                                    <div className="font-medium">
                                                      {selectedPiecesPerMaterial.get(idx)?.length} piece(s) selected
                                                    </div>
                                                    <div className="text-muted-foreground">
                                                      Total: {selectedPiecesPerMaterial.get(idx)?.reduce((sum, sp) => sum + sp.quantityMM, 0).toFixed(0)} mm
                                                    </div>
                                                  </>
                                                ) : (
                                                  <div>Select material pieces</div>
                                                )}
                                              </div>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      </div>
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
                            <td colSpan={3}></td>
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
                  <strong>Live Inventory Data:</strong> Stock quantities shown are from the current inventory system.
                  Actual material availability will be verified during material issue.
                  Materials marked as "Short" will flag job cards as "Pending Material".
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )
      })()}

      {/* Purchased Parts Requirements Summary */}
      {!loading && order && childPartItems.length > 0 && (() => {
        const aggregatedPurchasedParts = getAggregatedPurchasedParts()

        return aggregatedPurchasedParts.length > 0 && (
          <Card className="border-2 border-blue-200 bg-blue-50/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-base">Purchased Parts Requirements Summary</CardTitle>
              </div>
              <CardDescription>
                Purchased components required for assembly (SKF bearings, magnets, sleeves, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-blue-300">
                      <th className="text-left p-3 font-semibold text-blue-900">Component Name</th>
                      <th className="text-left p-3 font-semibold text-blue-900">Part Number</th>
                      <th className="text-left p-3 font-semibold text-blue-900">Used For</th>
                      <th className="text-right p-3 font-semibold text-blue-900">Quantity Required</th>
                      <th className="text-right p-3 font-semibold text-blue-900">In Stock</th>
                      <th className="text-center p-3 font-semibold text-blue-900">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aggregatedPurchasedParts.map((part, idx) => {
                      // Get inventory data for this component - match by name since IDs might not align
                      let inventory: InventoryResponse | null = null

                      // First try to match by component ID
                      if (part.componentId) {
                        inventory = componentInventoryData.get(part.componentId) || null  // Convert undefined to null
                      }

                      // If not found by ID, try to match by component name
                      if (!inventory) {
                        for (const inv of componentInventoryData.values()) {
                          if (inv.materialName.toLowerCase().trim() === part.componentName.toLowerCase().trim()) {
                            inventory = inv
                            console.log(`✓ Matched component by name: "${part.componentName}" → Found in inventory with ${inv.availableQuantity} ${inv.uom}`)
                            break
                          }
                        }
                      }

                      // Debug logging for unmatched components
                      if (!inventory) {
                        console.warn(`Could not find inventory for component: ${part.componentName} (ID: ${part.componentId})`)
                      }

                      const inStock = inventory?.availableQuantity || 0
                      const isShortage = inStock < part.totalRequired
                      const hasInventoryData = inventory !== null

                      return (
                        <tr key={idx} className={`border-b ${isShortage ? 'bg-red-50' : 'bg-white'}`}>
                          <td className="p-3 font-medium">
                            {part.componentName}
                          </td>
                          <td className="p-3 text-gray-700">
                            {part.partNumber || '-'}
                          </td>
                          <td className="p-3 text-gray-700 text-sm">
                            {part.usedFor.join(', ')}
                          </td>
                          <td className="p-3 text-right font-medium">
                            {part.totalRequired.toFixed(0)} {part.unit}
                          </td>
                          <td className="p-3 text-right font-semibold">
                            {hasInventoryData ? (
                              <>
                                {inStock.toFixed(0)} {part.unit}
                                {inventory?.isLowStock && !isShortage && (
                                  <div className="text-xs text-yellow-600 font-normal mt-1">
                                    Low Stock
                                  </div>
                                )}
                              </>
                            ) : (
                              <span className="text-gray-400 text-sm">No stock</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {!hasInventoryData || inStock === 0 ? (
                              <Badge variant="destructive" className="text-xs">
                                ⚠ Need to Purchase
                              </Badge>
                            ) : isShortage ? (
                              <Badge variant="destructive" className="text-xs">
                                ⚠ Short: {(part.totalRequired - inStock).toFixed(0)} {part.unit}
                              </Badge>
                            ) : (
                              <Badge className="bg-green-600 text-xs">
                                ✓ Available
                              </Badge>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <Alert className="mt-4 border-blue-300 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-xs">
                  <strong>Component Inventory:</strong> Stock quantities are from component inventory.
                  Components marked as "Need to Purchase" or "Short" will be included in material requisitions.
                  Purchase orders should be created for components not in stock.
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
                  {childPartItems.filter(item =>
                    item.childPartTemplate &&
                    !item.childPartTemplate.isPurchased &&
                    !checkMaterialAvailability(item.childPartTemplate.id)
                  ).length} Shortage(s)
                </Badge>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleGenerateJobCards}
              disabled={effectiveDrawingStatus !== 'Approved' || partsWithoutProcesses.length > 0 || generating}
              className="flex-1"
              size="lg"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Job Cards...
                </>
              ) : (
                <>
                  <Package className="mr-2 h-4 w-4" />
                  Generate {totalProcessSteps} Job Cards
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => router.push('/planning')} className="sm:w-auto">
              Cancel
            </Button>
          </div>

          {effectiveDrawingStatus !== 'Approved' && (
            <Alert className="mt-4" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Drawing must be reviewed and approved before job cards can be generated. Current status: <strong>{effectiveDrawingStatus}</strong>
              </AlertDescription>
            </Alert>
          )}

          {effectiveDrawingStatus === 'Approved' && partsWithoutProcesses.length > 0 && (
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
          title="Save material changes for this order"
        >
          <Save className="h-6 w-6" />
        </Button>
      )}


      {/* Piece Selection Dialog */}
      {selectedMaterialForPieces && (
        <PieceSelectionDialog
          open={pieceSelectionOpen}
          onOpenChange={setPieceSelectionOpen}
          materialId={selectedMaterialForPieces.materialId}
          materialName={selectedMaterialForPieces.materialName}
          materialGrade={selectedMaterialForPieces.materialGrade}
          requiredLengthMM={selectedMaterialForPieces.requiredLengthMM}
          childParts={selectedMaterialForPieces.childParts}
          preSelectedIds={(selectedPiecesPerMaterial.get(selectedMaterialForPieces.aggregatedMaterialIndex) ?? []).map(sp => sp.piece.id)}
          onConfirm={handlePieceSelectionConfirm}
        />
      )}

      {/* Drawing Viewer Modal */}
      <Dialog open={viewingDrawing !== null} onOpenChange={(open) => !open && setViewingDrawing(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>View Drawing</DialogTitle>
            <DialogDescription>
              {viewingDrawing?.fileName}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {viewingDrawing && (
              <div className="w-full h-full min-h-[500px] bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden">
                {viewingDrawing.fileType === 'pdf' ? (
                  <iframe
                    src={viewingDrawing.fileUrl}
                    className="w-full h-full min-h-[500px]"
                    title={viewingDrawing.fileName}
                  />
                ) : (
                  <div className="flex items-center justify-center p-4 h-full">
                    <img
                      src={viewingDrawing.fileUrl}
                      alt={viewingDrawing.fileName}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
