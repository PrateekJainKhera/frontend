"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Plus, Trash2, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RollerType } from '@/types'
import { productTemplateService, ProductTemplateBOMItemRequest } from '@/lib/api/product-templates'
import { processTemplateService, ProcessTemplateResponse } from '@/lib/api/process-templates'
import { childPartTemplateService, ChildPartTemplateResponse } from '@/lib/api/child-part-templates'
import { toast } from 'sonner'

interface BOMItemForm {
  tempId: string
  childPartTemplateId: number | null
  quantity: number
  notes: string
  sequenceNumber: number
}

export default function CreateProductTemplatePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingProcessTemplates, setLoadingProcessTemplates] = useState(false)
  const [loadingChildPartTemplates, setLoadingChildPartTemplates] = useState(false)

  // API Data
  const [processTemplates, setProcessTemplates] = useState<ProcessTemplateResponse[]>([])
  const [childPartTemplates, setChildPartTemplates] = useState<ChildPartTemplateResponse[]>([])

  // Form fields
  const [templateName, setTemplateName] = useState('')
  const [rollerType, setRollerType] = useState<string>('')
  const [processTemplateId, setProcessTemplateId] = useState<number | null>(null)
  const [description, setDescription] = useState('')
  const [drawingNumber, setDrawingNumber] = useState('')
  const [drawingRevision, setDrawingRevision] = useState('')

  // Dimensions
  const [length, setLength] = useState('')
  const [diameter, setDiameter] = useState('')
  const [coreDiameter, setCoreDiameter] = useState('')
  const [shaftDiameter, setShaftDiameter] = useState('')
  const [weight, setWeight] = useState('')
  const [dimensionUnit, setDimensionUnit] = useState('mm')

  // Technical Information
  const [technicalNotes, setTechnicalNotes] = useState('')
  const [qualityCheckpoints, setQualityCheckpoints] = useState('')

  // BOM Items
  const [bomItems, setBomItems] = useState<BOMItemForm[]>([])

  // Auto-generate template code based on roller type
  const templateCode = rollerType ? `PT-${rollerType.substring(0, 3)}-${Date.now().toString().slice(-6)}` : ''

  // Load Assembly Process Templates when roller type changes
  useEffect(() => {
    if (rollerType) {
      loadProcessTemplates()
      loadChildPartTemplates()
    }
  }, [rollerType])

  const loadProcessTemplates = async () => {
    setLoadingProcessTemplates(true)
    try {
      // Get all process templates and filter for assembly type
      const templates = await processTemplateService.getAll()
      // Filter for assembly templates (those with "Assembly" or "Assembling" in the name)
      const assemblyTemplates = templates.filter(t =>
        t.templateName.toLowerCase().includes('assembl')
      )
      setProcessTemplates(assemblyTemplates)
    } catch (error) {
      console.error('Failed to load process templates:', error)
      toast.error('Failed to load process templates')
    } finally {
      setLoadingProcessTemplates(false)
    }
  }

  const loadChildPartTemplates = async () => {
    setLoadingChildPartTemplates(true)
    try {
      // Load all active child part templates
      const allTemplates = await childPartTemplateService.getActiveTemplates()
      console.log('All templates loaded:', allTemplates.length)
      console.log('First template roller type:', allTemplates[0]?.rollerType)
      console.log('Looking for roller type:', rollerType)

      // Filter by roller type on the frontend (handles comma-separated roller types)
      const filteredTemplates = allTemplates.filter(template => {
        // rollerType in template can be comma-separated like "MAGNETIC,PRINTING"
        const templateRollerTypes = template.rollerType.split(',').map(t => t.trim())
        console.log('Template:', template.templateName, 'has types:', templateRollerTypes)
        return templateRollerTypes.includes(rollerType)
      })

      console.log('Filtered child part templates:', filteredTemplates.length, 'for roller type:', rollerType)
      setChildPartTemplates(filteredTemplates)
    } catch (error) {
      console.error('Failed to load child part templates:', error)
      toast.error('Failed to load child part templates')
      setChildPartTemplates([])
    } finally {
      setLoadingChildPartTemplates(false)
    }
  }

  const addBOMItem = () => {
    const newItem: BOMItemForm = {
      tempId: `temp-${Date.now()}`,
      childPartTemplateId: null,
      quantity: 1,
      notes: '',
      sequenceNumber: bomItems.length + 1
    }
    setBomItems([...bomItems, newItem])
  }

  const removeBOMItem = (tempId: string) => {
    const updatedItems = bomItems.filter(item => item.tempId !== tempId)
    // Re-sequence
    const resequenced = updatedItems.map((item, index) => ({
      ...item,
      sequenceNumber: index + 1
    }))
    setBomItems(resequenced)
  }

  const updateBOMItem = (tempId: string, field: keyof BOMItemForm, value: any) => {
    setBomItems(bomItems.map(item =>
      item.tempId === tempId ? { ...item, [field]: value } : item
    ))
  }

  const getChildPartName = (childPartTemplateId: number | null) => {
    if (!childPartTemplateId) return 'Select child part'
    const template = childPartTemplates.find(t => t.id === childPartTemplateId)
    return template ? `${template.templateName} (${template.templateCode})` : 'Unknown'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!templateName.trim()) {
      toast.error('Please enter product template name')
      return
    }
    if (!rollerType) {
      toast.error('Please select roller type')
      return
    }
    if (!processTemplateId) {
      toast.error('Please select an assembly process template')
      return
    }
    if (bomItems.length === 0) {
      toast.error('Please add at least one child part to the BOM')
      return
    }

    // Validate all BOM items have child part selected
    const invalidBOMItems = bomItems.filter(item => !item.childPartTemplateId)
    if (invalidBOMItems.length > 0) {
      toast.error('Please select a child part for all BOM items')
      return
    }

    setLoading(true)

    try {
      const bomItemsData: ProductTemplateBOMItemRequest[] = bomItems.map(item => ({
        childPartTemplateId: item.childPartTemplateId!,
        quantity: item.quantity,
        notes: item.notes.trim() || undefined,
        sequenceNumber: item.sequenceNumber
      }))

      await productTemplateService.create({
        templateName: templateName.trim(),
        templateCode: templateCode.trim() || undefined,
        rollerType,
        processTemplateId: processTemplateId,
        description: description.trim() || undefined,
        drawingNumber: drawingNumber.trim() || undefined,
        drawingRevision: drawingRevision.trim() || undefined,
        length: length ? parseFloat(length) : undefined,
        diameter: diameter ? parseFloat(diameter) : undefined,
        coreDiameter: coreDiameter ? parseFloat(coreDiameter) : undefined,
        shaftDiameter: shaftDiameter ? parseFloat(shaftDiameter) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        dimensionUnit: dimensionUnit || 'mm',
        technicalNotes: technicalNotes.trim() || undefined,
        qualityCheckpoints: qualityCheckpoints.trim() || undefined,
        isActive: true,
        createdBy: 'Admin',
        bomItems: bomItemsData
      })

      toast.success('Product template created successfully!')
      router.push('/masters/products')
    } catch (error) {
      console.error('Failed to create template:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create template')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/masters/products">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-primary">Create Product Template</h1>
          <p className="text-muted-foreground">Define a new product specification with BOM</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Define the product template details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="templateName">Product Template Name *</Label>
                <Input
                  id="templateName"
                  placeholder="e.g., Magnetic Roller 500mm Standard"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="templateCode">Template Code (Auto-generated)</Label>
                <Input
                  id="templateCode"
                  value={templateCode}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Auto-generated based on roller type</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rollerType">Roller Type *</Label>
                <Select value={rollerType} onValueChange={setRollerType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select roller type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Magnetic Roller">Magnetic Roller</SelectItem>
                    <SelectItem value="Printing Roller">Printing Roller</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="processTemplate">Assembly Process Template *</Label>
                <Select
                  value={processTemplateId?.toString() || ''}
                  onValueChange={(value) => setProcessTemplateId(parseInt(value))}
                  disabled={!rollerType || loadingProcessTemplates}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !rollerType ? 'Select roller type first' :
                      loadingProcessTemplates ? 'Loading...' :
                      'Select assembly process'
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {processTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id.toString()}>
                        {template.templateName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Assembly process for this product
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="drawingNumber">Drawing Number</Label>
                <Input
                  id="drawingNumber"
                  placeholder="e.g., DRG-MAG-500-001"
                  value={drawingNumber}
                  onChange={(e) => setDrawingNumber(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="drawingRevision">Drawing Revision</Label>
                <Input
                  id="drawingRevision"
                  placeholder="e.g., Rev A"
                  value={drawingRevision}
                  onChange={(e) => setDrawingRevision(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe this product..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Bill of Materials (BOM) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Bill of Materials (BOM)</CardTitle>
                <CardDescription>Select child parts required for this product</CardDescription>
              </div>
              <Button
                type="button"
                onClick={addBOMItem}
                disabled={!rollerType || loadingChildPartTemplates}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Child Part
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!rollerType && (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Please select a roller type first to add child parts</p>
              </div>
            )}

            {rollerType && bomItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No child parts added yet</p>
                <p className="text-sm">Click "Add Child Part" to start building the BOM</p>
              </div>
            )}

            {bomItems.length > 0 && (
              <div className="space-y-4">
                {bomItems.map((item, index) => (
                  <Card key={item.tempId} className="border-2">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Badge variant="outline" className="mt-2">
                          #{item.sequenceNumber}
                        </Badge>
                        <div className="flex-1 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2 space-y-2">
                              <Label>Child Part Template *</Label>
                              <Select
                                value={item.childPartTemplateId?.toString() || ''}
                                onValueChange={(value) => updateBOMItem(item.tempId, 'childPartTemplateId', parseInt(value))}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select child part" />
                                </SelectTrigger>
                                <SelectContent position="popper" className="w-[--radix-select-trigger-width] max-h-[300px] overflow-auto">
                                  {childPartTemplates.length === 0 ? (
                                    <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                                      {loadingChildPartTemplates ? 'Loading...' : 'No child part templates found'}
                                    </div>
                                  ) : (
                                    childPartTemplates.map((template) => (
                                      <SelectItem key={template.id} value={template.id.toString()}>
                                        <div className="flex items-center gap-2">
                                          <Badge variant="secondary" className="text-xs">
                                            {template.childPartType}
                                          </Badge>
                                          <span>{template.templateName}</span>
                                          <span className="text-muted-foreground text-xs">
                                            ({template.templateCode})
                                          </span>
                                        </div>
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>Quantity *</Label>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateBOMItem(item.tempId, 'quantity', parseInt(e.target.value) || 1)}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Notes</Label>
                            <Input
                              placeholder="e.g., Install with bearing grease"
                              value={item.notes}
                              onChange={(e) => updateBOMItem(item.tempId, 'notes', e.target.value)}
                            />
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeBOMItem(item.tempId)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dimensions */}
        <Card>
          <CardHeader>
            <CardTitle>Final Product Dimensions (Optional)</CardTitle>
            <CardDescription>Physical specifications of the assembled product</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="length">Length</Label>
                <Input
                  id="length"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 500"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="diameter">Diameter</Label>
                <Input
                  id="diameter"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 60"
                  value={diameter}
                  onChange={(e) => setDiameter(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="coreDiameter">Core Diameter</Label>
                <Input
                  id="coreDiameter"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 50"
                  value={coreDiameter}
                  onChange={(e) => setCoreDiameter(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shaftDiameter">Shaft Diameter</Label>
                <Input
                  id="shaftDiameter"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 25"
                  value={shaftDiameter}
                  onChange={(e) => setShaftDiameter(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 8.5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dimensionUnit">Unit</Label>
                <Select value={dimensionUnit} onValueChange={setDimensionUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mm">mm</SelectItem>
                    <SelectItem value="cm">cm</SelectItem>
                    <SelectItem value="inch">inch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Information */}
        <Card>
          <CardHeader>
            <CardTitle>Technical Information (Optional)</CardTitle>
            <CardDescription>Additional specifications and quality requirements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="technicalNotes">Technical Notes</Label>
              <Textarea
                id="technicalNotes"
                placeholder="Enter technical specifications, assembly requirements, tolerances, etc."
                value={technicalNotes}
                onChange={(e) => setTechnicalNotes(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="qualityCheckpoints">Quality Checkpoints</Label>
              <Textarea
                id="qualityCheckpoints"
                placeholder="Enter quality inspection points, one per line"
                value={qualityCheckpoints}
                onChange={(e) => setQualityCheckpoints(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Enter each checkpoint on a new line
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild disabled={loading}>
            <Link href="/masters/products">Cancel</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Creating...' : 'Create Template'}
          </Button>
        </div>
      </form>
    </div>
  )
}
