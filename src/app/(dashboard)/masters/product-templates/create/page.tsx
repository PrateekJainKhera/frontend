"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { RollerType, ProductTemplateChildPart } from '@/types'
import { mockProcessTemplates } from '@/lib/mock-data'

interface ChildPartForm {
  tempId: string
  childPartName: string
  childPartCode: string
  quantity: number
  unit: string
  notes: string
  sequenceNo: number
}

export default function CreateProductTemplatePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  // Form state
  const [templateCode, setTemplateCode] = useState('')
  const [templateName, setTemplateName] = useState('')
  const [description, setDescription] = useState('')
  const [rollerType, setRollerType] = useState<RollerType | ''>('')
  const [processTemplateId, setProcessTemplateId] = useState('')
  const [childParts, setChildParts] = useState<ChildPartForm[]>([])

  // Add new child part
  const addChildPart = () => {
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
            <Button onClick={addChildPart} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Part
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {childParts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-4">No child parts added yet</p>
              <Button onClick={addChildPart} variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add First Part
              </Button>
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
    </div>
  )
}
