"use client"

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Save, Search, ExternalLink, Edit as EditIcon, MoveUp, MoveDown, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { RollerType, ProductTemplateChildPart } from '@/types'
import { mockProcessTemplates } from '@/lib/mock-data'
import { mockChildPartTemplates } from '@/lib/mock-data/child-part-templates'

interface ChildPartForm {
  tempId: string
  childPartName: string
  childPartCode: string
  quantity: number
  unit: string
  notes: string
  sequenceNo: number
  childPartTemplateId?: string
}

export default function CreateProductTemplatePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Form state
  const [templateCode, setTemplateCode] = useState('')
  const [templateName, setTemplateName] = useState('')
  const [description, setDescription] = useState('')
  const [rollerType, setRollerType] = useState<RollerType | ''>('')
  const [processTemplateId, setProcessTemplateId] = useState('')
  const [childParts, setChildParts] = useState<ChildPartForm[]>([])

  // Child part selection dialog state
  const [showDropdown, setShowDropdown] = useState(false)
  const [showTemplatePreview, setShowTemplatePreview] = useState(false)
  const [showCopyDialog, setShowCopyDialog] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Copy form state - stores full template data for editing
  const [copyFormData, setCopyFormData] = useState({
    templateCode: '',
    templateName: '',
    childPartType: '',
    description: '',
    drawingNumber: '',
    drawingRevision: '',
    length: '',
    diameter: '',
    outerDiameter: '',
    innerDiameter: '',
    thickness: '',
    dimensionUnit: 'mm',
    technicalNotes: '',
    materialRequirements: [] as any[],
    processSteps: [] as any[]
  })

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  // Handle template selection from dropdown
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId)
    setShowDropdown(false)
    setShowTemplatePreview(true)
  }

  // Add child part from template (Select button)
  const addChildPartFromTemplate = () => {
    if (!selectedTemplateId) return

    const template = mockChildPartTemplates.find(t => t.id === selectedTemplateId)
    if (!template) return

    const newPart: ChildPartForm = {
      tempId: `temp-${Date.now()}`,
      childPartName: template.templateName,
      childPartCode: template.templateCode,
      quantity: 1,
      unit: 'pcs',
      notes: template.description || '',
      sequenceNo: childParts.length + 1,
      childPartTemplateId: template.id
    }
    setChildParts([...childParts, newPart])
    setShowTemplatePreview(false)
    setSelectedTemplateId('')
    setSearchQuery('')
  }

  // Copy template (Copy button) - opens edit dialog with all template fields
  const copyTemplate = () => {
    if (!selectedTemplateId) return

    const template = mockChildPartTemplates.find(t => t.id === selectedTemplateId)
    if (!template) return

    // Populate form with all template data
    setCopyFormData({
      templateCode: template.templateCode,
      templateName: template.templateName,
      childPartType: template.childPartType,
      description: template.description || '',
      drawingNumber: template.drawingNumber || '',
      drawingRevision: template.drawingRevision || '',
      length: template.length?.toString() || '',
      diameter: template.diameter?.toString() || '',
      outerDiameter: template.outerDiameter?.toString() || '',
      innerDiameter: template.innerDiameter?.toString() || '',
      thickness: template.thickness?.toString() || '',
      dimensionUnit: template.dimensionUnit || 'mm',
      technicalNotes: template.technicalNotes || '',
      materialRequirements: template.materialRequirements?.map((mat, idx) => ({
        id: `mat-copy-${Date.now()}-${idx}`,
        rawMaterialName: mat.rawMaterialName,
        materialGrade: mat.materialGrade,
        quantityRequired: mat.quantityRequired.toString(),
        unit: mat.unit,
        wastagePercent: mat.wastagePercent?.toString() || '5'
      })) || [],
      processSteps: template.processSteps?.map((step, idx) => ({
        id: `step-copy-${Date.now()}-${idx}`,
        processName: step.processName,
        stepNumber: step.stepNumber,
        machineName: step.machineName || '',
        standardTimeHours: step.standardTimeHours.toString(),
        restTimeHours: step.restTimeHours?.toString() || '',
        description: step.description || ''
      })) || []
    })

    setShowTemplatePreview(false)
    setShowCopyDialog(true)
  }

  // Material requirement handlers for copy dialog
  const addCopyMaterial = () => {
    const newMaterial = {
      id: `mat-copy-${Date.now()}`,
      rawMaterialName: '',
      materialGrade: '',
      quantityRequired: '',
      unit: 'kg',
      wastagePercent: '5'
    }
    setCopyFormData({
      ...copyFormData,
      materialRequirements: [...copyFormData.materialRequirements, newMaterial]
    })
  }

  const removeCopyMaterial = (id: string) => {
    setCopyFormData({
      ...copyFormData,
      materialRequirements: copyFormData.materialRequirements.filter(m => m.id !== id)
    })
  }

  const updateCopyMaterial = (id: string, field: string, value: string) => {
    setCopyFormData({
      ...copyFormData,
      materialRequirements: copyFormData.materialRequirements.map(m =>
        m.id === id ? { ...m, [field]: value } : m
      )
    })
  }

  // Process step handlers for copy dialog
  const addCopyProcess = () => {
    const newStep = {
      id: `step-copy-${Date.now()}`,
      processName: '',
      stepNumber: copyFormData.processSteps.length + 1,
      machineName: '',
      standardTimeHours: '',
      restTimeHours: '',
      description: ''
    }
    setCopyFormData({
      ...copyFormData,
      processSteps: [...copyFormData.processSteps, newStep]
    })
  }

  const removeCopyProcess = (id: string) => {
    const filtered = copyFormData.processSteps.filter(s => s.id !== id)
    // Renumber steps
    const renumbered = filtered.map((step, index) => ({
      ...step,
      stepNumber: index + 1
    }))
    setCopyFormData({
      ...copyFormData,
      processSteps: renumbered
    })
  }

  const updateCopyProcess = (id: string, field: string, value: string | number) => {
    setCopyFormData({
      ...copyFormData,
      processSteps: copyFormData.processSteps.map(s =>
        s.id === id ? { ...s, [field]: value } : s
      )
    })
  }

  // Move process step up
  const moveCopyProcessUp = (id: string) => {
    const index = copyFormData.processSteps.findIndex(s => s.id === id)
    if (index <= 0) return // Already at top

    const steps = [...copyFormData.processSteps]
    const temp = steps[index]
    steps[index] = steps[index - 1]
    steps[index - 1] = temp

    // Renumber all steps
    const renumbered = steps.map((step, idx) => ({
      ...step,
      stepNumber: idx + 1
    }))

    setCopyFormData({
      ...copyFormData,
      processSteps: renumbered
    })
  }

  // Move process step down
  const moveCopyProcessDown = (id: string) => {
    const index = copyFormData.processSteps.findIndex(s => s.id === id)
    if (index >= copyFormData.processSteps.length - 1) return // Already at bottom

    const steps = [...copyFormData.processSteps]
    const temp = steps[index]
    steps[index] = steps[index + 1]
    steps[index + 1] = temp

    // Renumber all steps
    const renumbered = steps.map((step, idx) => ({
      ...step,
      stepNumber: idx + 1
    }))

    setCopyFormData({
      ...copyFormData,
      processSteps: renumbered
    })
  }

  // Save copied/edited template as child part
  const saveCopiedTemplate = () => {
    const newPart: ChildPartForm = {
      tempId: `temp-${Date.now()}`,
      childPartName: copyFormData.templateName,
      childPartCode: copyFormData.templateCode,
      quantity: 1,
      unit: 'pcs',
      notes: copyFormData.description,
      sequenceNo: childParts.length + 1
      // Note: No childPartTemplateId - this is a copy, not linked to original template
    }
    setChildParts([...childParts, newPart])
    setShowCopyDialog(false)
    setSelectedTemplateId('')
    setSearchQuery('')

    // Reset form
    setCopyFormData({
      templateCode: '',
      templateName: '',
      childPartType: '',
      description: '',
      drawingNumber: '',
      drawingRevision: '',
      length: '',
      diameter: '',
      outerDiameter: '',
      innerDiameter: '',
      thickness: '',
      dimensionUnit: 'mm',
      technicalNotes: '',
      materialRequirements: [],
      processSteps: []
    })
  }

  // Add new blank child part
  const addBlankChildPart = () => {
    const newPart: ChildPartForm = {
      tempId: `temp-${Date.now()}`,
      childPartName: '',
      childPartCode: '',
      quantity: 1,
      unit: 'pcs',
      notes: '',
      sequenceNo: childParts.length + 1
    }
    setChildParts([...childParts, newPart])
  }

  // Update child part
  const updateChildPart = (tempId: string, field: keyof ChildPartForm, value: any) => {
    setChildParts(childParts.map(part =>
      part.tempId === tempId ? { ...part, [field]: value } : part
    ))
  }

  // Remove child part
  const removeChildPart = (tempId: string) => {
    const filtered = childParts.filter(part => part.tempId !== tempId)
    // Re-sequence
    const resequenced = filtered.map((part, index) => ({
      ...part,
      sequenceNo: index + 1
    }))
    setChildParts(resequenced)
  }

  // Move child part up/down
  const moveChildPart = (tempId: string, direction: 'up' | 'down') => {
    const index = childParts.findIndex(p => p.tempId === tempId)
    if (index === -1) return

    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === childParts.length - 1) return

    const newIndex = direction === 'up' ? index - 1 : index + 1
    const reordered = [...childParts]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(newIndex, 0, moved)

    // Re-sequence
    const resequenced = reordered.map((part, idx) => ({
      ...part,
      sequenceNo: idx + 1
    }))
    setChildParts(resequenced)
  }

  // Form validation
  const validateForm = () => {
    if (!templateCode.trim()) return 'Template Code is required'
    if (!templateName.trim()) return 'Template Name is required'
    if (!rollerType) return 'Roller Type is required'
    if (!processTemplateId) return 'Process Template is required'
    if (childParts.length === 0) return 'At least one child part is required'

    for (const part of childParts) {
      if (!part.childPartName.trim()) return 'All child parts must have a name'
      if (part.quantity <= 0) return 'Child part quantity must be greater than 0'
    }

    return null
  }

  // Handle save
  const handleSave = async () => {
    const error = validateForm()
    if (error) {
      alert(error)
      return
    }

    setSaving(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    // In real app, this would save to backend
    console.log({
      templateCode,
      templateName,
      description,
      rollerType,
      processTemplateId,
      childParts
    })

    alert('Product Template created successfully!')
    router.push('/masters/product-templates')
  }

  const selectedProcessTemplate = mockProcessTemplates.find(t => t.id === processTemplateId)

  // Filter child part templates by roller type and search query
  const filteredChildPartTemplates = mockChildPartTemplates.filter(template => {
    // Filter by roller type if selected
    if (rollerType && template.rollerType !== rollerType) return false

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        template.templateName.toLowerCase().includes(query) ||
        template.templateCode.toLowerCase().includes(query) ||
        template.childPartType.toLowerCase().includes(query)
      )
    }

    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/masters/product-templates">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary">Create Product Template</h1>
            <p className="text-muted-foreground">Define a new roller template with child parts and process</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/masters/product-templates">Cancel</Link>
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Template'}
          </Button>
        </div>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Template identification and roller type</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="templateCode">Template Code *</Label>
              <Input
                id="templateCode"
                placeholder="e.g., TPL-MAG-STD"
                value={templateCode}
                onChange={(e) => setTemplateCode(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rollerType">Roller Type *</Label>
              <Select value={rollerType} onValueChange={(value) => setRollerType(value as RollerType)}>
                <SelectTrigger id="rollerType">
                  <SelectValue placeholder="Select roller type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={RollerType.MAGNETIC}>Magnetic Roller</SelectItem>
                  <SelectItem value={RollerType.ANILOX}>Anilox Roller</SelectItem>
                  <SelectItem value={RollerType.RUBBER}>Rubber Roller</SelectItem>
                  <SelectItem value={RollerType.PRINTING}>Printing Roller</SelectItem>
                  <SelectItem value={RollerType.IDLER}>Idler Roller</SelectItem>
                  <SelectItem value={RollerType.EMBOSSING}>Embossing Roller</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="templateName">Template Name *</Label>
            <Input
              id="templateName"
              placeholder="e.g., Magnetic Roller Standard"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe this product template..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Process Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Manufacturing Process</CardTitle>
          <CardDescription>Select the process template for this roller type</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="processTemplate">Process Template *</Label>
            <Select value={processTemplateId} onValueChange={setProcessTemplateId}>
              <SelectTrigger id="processTemplate">
                <SelectValue placeholder="Select process template" />
              </SelectTrigger>
              <SelectContent>
                {mockProcessTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.templateName} ({template.steps.length} steps)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProcessTemplate && (
            <div className="p-4 border rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">{selectedProcessTemplate.templateName}</h4>
              <p className="text-sm text-muted-foreground mb-3">
                {selectedProcessTemplate.description || 'No description'}
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedProcessTemplate.steps
                  .sort((a, b) => a.stepNo - b.stepNo)
                  .map((step) => (
                    <Badge key={step.id} variant="outline" className="text-xs">
                      {step.stepNo}. {step.processName}
                    </Badge>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Child Parts BOM */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Child Parts (BOM)</CardTitle>
              <CardDescription>Define the parts required for this roller</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative" ref={dropdownRef}>
                <Button onClick={() => setShowDropdown(!showDropdown)} size="sm" variant="outline">
                  <Search className="mr-2 h-4 w-4" />
                  Select from Template
                </Button>

                {/* Dropdown */}
                {showDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-96 bg-background border rounded-lg shadow-lg z-50 max-h-96 overflow-hidden flex flex-col">
                    <div className="p-3 border-b sticky top-0 bg-background">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search templates..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                          autoFocus
                        />
                      </div>
                      {rollerType && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Showing {filteredChildPartTemplates.length} templates for {rollerType}
                        </p>
                      )}
                    </div>

                    <div className="overflow-y-auto flex-1">
                      {!rollerType ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          Please select a Roller Type first
                        </div>
                      ) : filteredChildPartTemplates.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          No templates found
                        </div>
                      ) : (
                        filteredChildPartTemplates.map((template) => (
                          <div
                            key={template.id}
                            className="p-3 border-b hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => handleTemplateSelect(template.id)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-sm">{template.templateName}</p>
                                  <Badge variant="outline" className="text-xs">
                                    {template.childPartType}
                                  </Badge>
                                </div>
                                <p className="text-xs font-mono text-muted-foreground">
                                  {template.templateCode}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Button onClick={addBlankChildPart} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Create New Child Part
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {childParts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-4">No child parts added yet</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => setShowDropdown(!showDropdown)} variant="outline" size="sm">
                  <Search className="mr-2 h-4 w-4" />
                  Select from Template
                </Button>
                <Button onClick={addBlankChildPart} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Child Part
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {childParts.map((part, index) => (
                <div key={part.tempId} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">Part {part.sequenceNo}</Badge>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveChildPart(part.tempId, 'up')}
                        disabled={index === 0}
                      >
                        ↑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveChildPart(part.tempId, 'down')}
                        disabled={index === childParts.length - 1}
                      >
                        ↓
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeChildPart(part.tempId)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Part Name *</Label>
                      <Input
                        placeholder="e.g., Shaft"
                        value={part.childPartName}
                        onChange={(e) => updateChildPart(part.tempId, 'childPartName', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Part Code</Label>
                      <Input
                        placeholder="e.g., SHAFT-MAG"
                        value={part.childPartCode}
                        onChange={(e) => updateChildPart(part.tempId, 'childPartCode', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Quantity *</Label>
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={part.quantity}
                        onChange={(e) => updateChildPart(part.tempId, 'quantity', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit *</Label>
                      <Select
                        value={part.unit}
                        onValueChange={(value) => updateChildPart(part.tempId, 'unit', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                          <SelectItem value="kg">Kilogram (kg)</SelectItem>
                          <SelectItem value="g">Gram (g)</SelectItem>
                          <SelectItem value="m">Meter (m)</SelectItem>
                          <SelectItem value="cm">Centimeter (cm)</SelectItem>
                          <SelectItem value="L">Liter (L)</SelectItem>
                          <SelectItem value="mL">Milliliter (mL)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Input
                      placeholder="Additional information about this part..."
                      value={part.notes}
                      onChange={(e) => updateChildPart(part.tempId, 'notes', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      {(templateName || childParts.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>Review your product template before saving</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Template Name</p>
                <p className="font-medium">{templateName || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Roller Type</p>
                <p className="font-medium">{rollerType || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Child Parts</p>
                <p className="font-medium">{childParts.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Process Template</p>
                <p className="font-medium">{selectedProcessTemplate?.templateName || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Copy Template Edit Dialog - Comprehensive */}
      <Dialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-2xl">Edit Child Part Template</DialogTitle>
            <DialogDescription>
              Modify all template details before adding to your product. All fields are editable.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="copyTemplateCode">Template Code *</Label>
                    <Input
                      id="copyTemplateCode"
                      value={copyFormData.templateCode}
                      onChange={(e) => setCopyFormData({ ...copyFormData, templateCode: e.target.value })}
                      placeholder="e.g., CPT-MAG-SHAFT-001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="copyTemplateName">Template Name *</Label>
                    <Input
                      id="copyTemplateName"
                      value={copyFormData.templateName}
                      onChange={(e) => setCopyFormData({ ...copyFormData, templateName: e.target.value })}
                      placeholder="e.g., Magnetic Roller Shaft - Standard"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="copyDescription">Description</Label>
                  <Textarea
                    id="copyDescription"
                    value={copyFormData.description}
                    onChange={(e) => setCopyFormData({ ...copyFormData, description: e.target.value })}
                    placeholder="Describe the child part and its purpose"
                    rows={2}
                  />
                </div>
              </div>

              {/* Drawing Details */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase">Drawing Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="copyDrawingNumber">Drawing Number</Label>
                    <Input
                      id="copyDrawingNumber"
                      value={copyFormData.drawingNumber}
                      onChange={(e) => setCopyFormData({ ...copyFormData, drawingNumber: e.target.value })}
                      placeholder="e.g., DWG-MAG-SH-001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="copyDrawingRevision">Drawing Revision</Label>
                    <Input
                      id="copyDrawingRevision"
                      value={copyFormData.drawingRevision}
                      onChange={(e) => setCopyFormData({ ...copyFormData, drawingRevision: e.target.value })}
                      placeholder="e.g., Rev-02"
                    />
                  </div>
                </div>
              </div>

              {/* Dimensions */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase">Dimensions</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="copyLength">Length</Label>
                    <Input
                      id="copyLength"
                      type="number"
                      value={copyFormData.length}
                      onChange={(e) => setCopyFormData({ ...copyFormData, length: e.target.value })}
                      placeholder="1200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="copyDiameter">Diameter</Label>
                    <Input
                      id="copyDiameter"
                      type="number"
                      value={copyFormData.diameter}
                      onChange={(e) => setCopyFormData({ ...copyFormData, diameter: e.target.value })}
                      placeholder="50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="copyDimensionUnit">Unit</Label>
                    <Select
                      value={copyFormData.dimensionUnit}
                      onValueChange={(value) => setCopyFormData({ ...copyFormData, dimensionUnit: value })}
                    >
                      <SelectTrigger id="copyDimensionUnit">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mm">mm</SelectItem>
                        <SelectItem value="inch">inch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="copyOuterDiameter">Outer Diameter</Label>
                    <Input
                      id="copyOuterDiameter"
                      type="number"
                      value={copyFormData.outerDiameter}
                      onChange={(e) => setCopyFormData({ ...copyFormData, outerDiameter: e.target.value })}
                      placeholder="150"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="copyInnerDiameter">Inner Diameter</Label>
                    <Input
                      id="copyInnerDiameter"
                      type="number"
                      value={copyFormData.innerDiameter}
                      onChange={(e) => setCopyFormData({ ...copyFormData, innerDiameter: e.target.value })}
                      placeholder="52"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="copyThickness">Thickness</Label>
                    <Input
                      id="copyThickness"
                      type="number"
                      value={copyFormData.thickness}
                      onChange={(e) => setCopyFormData({ ...copyFormData, thickness: e.target.value })}
                      placeholder="12"
                    />
                  </div>
                </div>
              </div>

              {/* Material Requirements - Editable */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase">
                    Material Requirements ({copyFormData.materialRequirements.length})
                  </h3>
                  <Button type="button" size="sm" variant="outline" onClick={addCopyMaterial}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Material
                  </Button>
                </div>
                {copyFormData.materialRequirements.map((mat, index) => (
                  <div key={mat.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Material #{index + 1}</Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCopyMaterial(mat.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Material Name *</Label>
                        <Input
                          value={mat.rawMaterialName}
                          onChange={(e) => updateCopyMaterial(mat.id, 'rawMaterialName', e.target.value)}
                          placeholder="e.g., EN8 Steel Rod"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Grade *</Label>
                        <Input
                          value={mat.materialGrade}
                          onChange={(e) => updateCopyMaterial(mat.id, 'materialGrade', e.target.value)}
                          placeholder="e.g., EN8"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label>Quantity *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={mat.quantityRequired}
                          onChange={(e) => updateCopyMaterial(mat.id, 'quantityRequired', e.target.value)}
                          placeholder="1.3"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Unit *</Label>
                        <Select
                          value={mat.unit}
                          onValueChange={(value) => updateCopyMaterial(mat.id, 'unit', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kg">kg</SelectItem>
                            <SelectItem value="meter">meter</SelectItem>
                            <SelectItem value="pcs">pcs</SelectItem>
                            <SelectItem value="liter">liter</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Wastage %</Label>
                        <Input
                          type="number"
                          value={mat.wastagePercent}
                          onChange={(e) => updateCopyMaterial(mat.id, 'wastagePercent', e.target.value)}
                          placeholder="5"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {copyFormData.materialRequirements.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No materials added. Click "Add Material" to add one.
                  </p>
                )}
              </div>

              {/* Process Steps - Editable */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase">
                    Process Steps ({copyFormData.processSteps.length})
                  </h3>
                  <Button type="button" size="sm" variant="outline" onClick={addCopyProcess}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Process Step
                  </Button>
                </div>
                {copyFormData.processSteps
                  .sort((a, b) => a.stepNumber - b.stepNumber)
                  .map((step) => (
                    <div key={step.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                            {step.stepNumber}
                          </div>
                          <h4 className="font-medium">Step {step.stepNumber}</h4>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => moveCopyProcessUp(step.id)}
                            disabled={step.stepNumber === 1}
                            title="Move Up"
                          >
                            <MoveUp className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => moveCopyProcessDown(step.id)}
                            disabled={step.stepNumber === copyFormData.processSteps.length}
                            title="Move Down"
                          >
                            <MoveDown className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCopyProcess(step.id)}
                            className="text-destructive hover:text-destructive"
                            title="Delete Step"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Process Name *</Label>
                          <Input
                            value={step.processName}
                            onChange={(e) => updateCopyProcess(step.id, 'processName', e.target.value)}
                            placeholder="e.g., CNC Turning"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Machine Name</Label>
                          <Input
                            value={step.machineName}
                            onChange={(e) => updateCopyProcess(step.id, 'machineName', e.target.value)}
                            placeholder="e.g., CNC-01"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Standard Time (hours) *</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={step.standardTimeHours}
                            onChange={(e) => updateCopyProcess(step.id, 'standardTimeHours', e.target.value)}
                            placeholder="4.5"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Rest Time (hours)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={step.restTimeHours}
                            onChange={(e) => updateCopyProcess(step.id, 'restTimeHours', e.target.value)}
                            placeholder="2.0"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input
                          value={step.description}
                          onChange={(e) => updateCopyProcess(step.id, 'description', e.target.value)}
                          placeholder="e.g., Rough turning to near-net shape"
                        />
                      </div>
                    </div>
                  ))}
                {copyFormData.processSteps.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No process steps added. Click "Add Process Step" to add one.
                  </p>
                )}
              </div>

              {/* Technical Notes */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase">Technical Notes</h3>
                <div className="space-y-2">
                  <Label htmlFor="copyTechnicalNotes">Notes</Label>
                  <Textarea
                    id="copyTechnicalNotes"
                    value={copyFormData.technicalNotes}
                    onChange={(e) => setCopyFormData({ ...copyFormData, technicalNotes: e.target.value })}
                    placeholder="e.g., Material hardness: 45-50 HRC after heat treatment. Surface finish: Ra 0.8 μm"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t bg-muted/30 flex gap-3">
            <Button variant="outline" onClick={() => setShowCopyDialog(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={saveCopiedTemplate} className="flex-1" size="lg">
              <Plus className="mr-2 h-4 w-4" />
              Add to Product
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Preview Dialog */}
      <Dialog open={showTemplatePreview} onOpenChange={setShowTemplatePreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
          {selectedTemplateId && (() => {
            const template = mockChildPartTemplates.find(t => t.id === selectedTemplateId)
            if (!template) return null

            return (
              <>
                <DialogHeader className="px-6 pt-6 pb-4 border-b">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <DialogTitle className="text-2xl">{template.templateName}</DialogTitle>
                      <DialogDescription className="mt-2">
                        <span className="font-mono text-sm">{template.templateCode}</span>
                        <span className="mx-2">•</span>
                        <Badge variant="outline">{template.childPartType}</Badge>
                        <span className="mx-2">•</span>
                        <Badge variant="secondary">{template.rollerType}</Badge>
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-4">
                  <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground">Drawing Number</p>
                        <p className="text-sm">{template.drawingNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground">Revision</p>
                        <p className="text-sm">{template.drawingRevision}</p>
                      </div>
                      {template.length && (
                        <div>
                          <p className="text-sm font-semibold text-muted-foreground">Length</p>
                          <p className="text-sm">{template.length} {template.dimensionUnit}</p>
                        </div>
                      )}
                      {template.diameter && (
                        <div>
                          <p className="text-sm font-semibold text-muted-foreground">Diameter</p>
                          <p className="text-sm">{template.diameter} {template.dimensionUnit}</p>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {template.description && (
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground mb-2">Description</p>
                        <p className="text-sm">{template.description}</p>
                      </div>
                    )}

                    {/* Material Requirements */}
                    {template.materialRequirements && template.materialRequirements.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground mb-2">Material Requirements</p>
                        <div className="space-y-2">
                          {template.materialRequirements.map((mat) => (
                            <div key={mat.id} className="p-3 border rounded-lg">
                              <p className="font-medium text-sm">{mat.rawMaterialName}</p>
                              <p className="text-xs text-muted-foreground">
                                Grade: {mat.materialGrade} • Quantity: {mat.quantityRequired} {mat.unit}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Process Steps */}
                    {template.processSteps && template.processSteps.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground mb-2">
                          Process Steps ({template.processSteps.length} steps)
                        </p>
                        <div className="space-y-2">
                          {template.processSteps
                            .sort((a, b) => a.stepNumber - b.stepNumber)
                            .map((step) => (
                            <div key={step.id} className="p-3 border rounded-lg">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline" className="text-xs">
                                      Step {step.stepNumber}
                                    </Badge>
                                    <p className="font-medium text-sm">{step.processName}</p>
                                  </div>
                                  {step.machineName && (
                                    <p className="text-xs text-muted-foreground">Machine: {step.machineName}</p>
                                  )}
                                  {step.description && (
                                    <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                                  )}
                                </div>
                                <div className="text-right text-xs">
                                  <p className="font-medium">{step.standardTimeHours.toFixed(1)} hrs</p>
                                  {step.restTimeHours && (
                                    <p className="text-muted-foreground">+{step.restTimeHours.toFixed(1)} hrs rest</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          Total Standard Time: {template.totalStandardTimeHours.toFixed(1)} hours
                        </p>
                      </div>
                    )}

                    {/* Technical Notes */}
                    {template.technicalNotes && (
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground mb-2">Technical Notes</p>
                        <p className="text-sm">{template.technicalNotes}</p>
                      </div>
                    )}

                    {/* Quality Checkpoints */}
                    {template.qualityCheckpoints && template.qualityCheckpoints.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground mb-2">Quality Checkpoints</p>
                        <ul className="text-sm space-y-1">
                          {template.qualityCheckpoints.map((checkpoint, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-primary mt-0.5">✓</span>
                              <span>{checkpoint}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-6 py-4 border-t bg-muted/30 flex gap-3">
                  <Button onClick={copyTemplate} variant="outline" className="flex-1" size="lg">
                    <Plus className="mr-2 h-4 w-4" />
                    Copy Template
                  </Button>
                  <Button onClick={addChildPartFromTemplate} className="flex-1" size="lg">
                    Select Template
                  </Button>
                </div>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
