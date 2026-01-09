"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Plus, Trash2, Package, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { mockChildPartTemplates } from '@/lib/mock-data'
import { simulateApiCall } from '@/lib/utils/mock-api'
import { ChildPartTemplate, ChildPartType, RollerType } from '@/types'

interface MaterialRequirement {
  id: string
  rawMaterialName: string
  materialGrade: string
  quantityRequired: string
  unit: string
  wastagePercent: string
}

interface ProcessStep {
  id: string
  processName: string
  stepNumber: number
  machineName: string
  standardTimeHours: string
  restTimeHours: string
  description: string
}

export default function EditChildPartTemplatePage() {
  const params = useParams()
  const router = useRouter()
  const [template, setTemplate] = useState<ChildPartTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [materialRequirements, setMaterialRequirements] = useState<MaterialRequirement[]>([])
  const [processSteps, setProcessSteps] = useState<ProcessStep[]>([])

  const loadTemplate = async () => {
    setLoading(true)
    const found = mockChildPartTemplates.find(t => t.id === params.id)
    const data = await simulateApiCall(found || null, 500)
    setTemplate(data)

    if (data) {
      // Load material requirements
      setMaterialRequirements(data.materialRequirements.map(m => ({
        id: m.id,
        rawMaterialName: m.rawMaterialName,
        materialGrade: m.materialGrade,
        quantityRequired: m.quantityRequired.toString(),
        unit: m.unit,
        wastagePercent: m.wastagePercent.toString()
      })))

      // Load process steps
      setProcessSteps(data.processSteps.map(s => ({
        id: s.id,
        processName: s.processName,
        stepNumber: s.stepNumber,
        machineName: s.machineName || '',
        standardTimeHours: s.standardTimeHours.toString(),
        restTimeHours: s.restTimeHours?.toString() || '',
        description: s.description || ''
      })))
    }

    setLoading(false)
  }

  useEffect(() => {
    loadTemplate()
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Redirect to detail page
    router.push(`/masters/child-part-templates/${params.id}`)
  }

  const addMaterialRequirement = () => {
    const newMaterial: MaterialRequirement = {
      id: `mat-${Date.now()}`,
      rawMaterialName: '',
      materialGrade: '',
      quantityRequired: '',
      unit: 'kg',
      wastagePercent: '5'
    }
    setMaterialRequirements([...materialRequirements, newMaterial])
  }

  const removeMaterialRequirement = (id: string) => {
    setMaterialRequirements(materialRequirements.filter(m => m.id !== id))
  }

  const updateMaterialRequirement = (id: string, field: keyof MaterialRequirement, value: string) => {
    setMaterialRequirements(materialRequirements.map(m =>
      m.id === id ? { ...m, [field]: value } : m
    ))
  }

  const addProcessStep = () => {
    const newStep: ProcessStep = {
      id: `step-${Date.now()}`,
      processName: '',
      stepNumber: processSteps.length + 1,
      machineName: '',
      standardTimeHours: '',
      restTimeHours: '',
      description: ''
    }
    setProcessSteps([...processSteps, newStep])
  }

  const removeProcessStep = (id: string) => {
    const filtered = processSteps.filter(s => s.id !== id)
    // Renumber steps
    const renumbered = filtered.map((step, index) => ({
      ...step,
      stepNumber: index + 1
    }))
    setProcessSteps(renumbered)
  }

  const updateProcessStep = (id: string, field: keyof ProcessStep, value: string | number) => {
    setProcessSteps(processSteps.map(s =>
      s.id === id ? { ...s, [field]: value } : s
    ))
  }

  const totalStandardTime = processSteps.reduce((sum, step) =>
    sum + (parseFloat(step.standardTimeHours) || 0), 0
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!template) {
    return (
      <div className="space-y-6">
        <Card className="p-12">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Template not found</h3>
            <p className="text-muted-foreground mb-4">
              The child part template you're looking for doesn't exist
            </p>
            <Button asChild>
              <Link href="/masters/child-part-templates">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Templates
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/masters/child-part-templates/${params.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-primary">Edit Child Part Template</h1>
          <p className="text-muted-foreground">{template.templateCode}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>General details about the child part template</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="templateCode">Template Code *</Label>
                  <Input id="templateCode" defaultValue={template.templateCode} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="templateName">Template Name *</Label>
                  <Input id="templateName" defaultValue={template.templateName} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="childPartType">Child Part Type *</Label>
                  <Select defaultValue={template.childPartType} required>
                    <SelectTrigger id="childPartType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ChildPartType.SHAFT}>Shaft</SelectItem>
                      <SelectItem value={ChildPartType.CORE}>Core</SelectItem>
                      <SelectItem value={ChildPartType.SLEEVE}>Sleeve</SelectItem>
                      <SelectItem value={ChildPartType.END_DISK}>End Disk</SelectItem>
                      <SelectItem value={ChildPartType.HOUSING}>Housing</SelectItem>
                      <SelectItem value={ChildPartType.COVER}>Cover</SelectItem>
                      <SelectItem value={ChildPartType.OTHER}>Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rollerType">Roller Type *</Label>
                  <Select defaultValue={template.rollerType} required>
                    <SelectTrigger id="rollerType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={RollerType.MAGNETIC}>Magnetic Roller</SelectItem>
                      <SelectItem value={RollerType.PRINTING}>Printing Roller</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  defaultValue={template.description}
                  placeholder="Describe the child part and its purpose"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Drawing Details */}
          <Card>
            <CardHeader>
              <CardTitle>Drawing Details</CardTitle>
              <CardDescription>Technical drawing information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="drawingNumber">Drawing Number</Label>
                  <Input id="drawingNumber" defaultValue={template.drawingNumber} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="drawingRevision">Drawing Revision</Label>
                  <Input id="drawingRevision" defaultValue={template.drawingRevision} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dimensions */}
          <Card>
            <CardHeader>
              <CardTitle>Dimensions</CardTitle>
              <CardDescription>Physical dimensions of the part</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="length">Length</Label>
                  <Input id="length" type="number" defaultValue={template.length} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diameter">Diameter</Label>
                  <Input id="diameter" type="number" defaultValue={template.diameter} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dimensionUnit">Unit</Label>
                  <Select defaultValue={template.dimensionUnit}>
                    <SelectTrigger id="dimensionUnit">
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
                  <Label htmlFor="outerDiameter">Outer Diameter</Label>
                  <Input id="outerDiameter" type="number" defaultValue={template.outerDiameter} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="innerDiameter">Inner Diameter</Label>
                  <Input id="innerDiameter" type="number" defaultValue={template.innerDiameter} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="thickness">Thickness</Label>
                  <Input id="thickness" type="number" defaultValue={template.thickness} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Material Requirements */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  <div>
                    <CardTitle>Raw Materials Required</CardTitle>
                    <CardDescription>Materials needed to manufacture this child part</CardDescription>
                  </div>
                </div>
                <Button type="button" size="sm" onClick={addMaterialRequirement}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Material
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {materialRequirements.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No materials added yet. Click "Add Material" to get started.
                </p>
              ) : (
                <div className="space-y-4">
                  {materialRequirements.map((material, index) => (
                    <div key={material.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Material #{index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMaterialRequirement(material.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Material Name *</Label>
                          <Input
                            value={material.rawMaterialName}
                            onChange={(e) => updateMaterialRequirement(material.id, 'rawMaterialName', e.target.value)}
                            placeholder="e.g., EN8 Steel Rod"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Grade *</Label>
                          <Input
                            value={material.materialGrade}
                            onChange={(e) => updateMaterialRequirement(material.id, 'materialGrade', e.target.value)}
                            placeholder="e.g., EN8"
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Quantity Required *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={material.quantityRequired}
                            onChange={(e) => updateMaterialRequirement(material.id, 'quantityRequired', e.target.value)}
                            placeholder="1.3"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Unit *</Label>
                          <Select
                            value={material.unit}
                            onValueChange={(value) => updateMaterialRequirement(material.id, 'unit', value)}
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
                            value={material.wastagePercent}
                            onChange={(e) => updateMaterialRequirement(material.id, 'wastagePercent', e.target.value)}
                            placeholder="5"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Process Steps */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  <div>
                    <CardTitle>Manufacturing Process Steps</CardTitle>
                    <CardDescription>
                      Sequential steps to manufacture this child part
                      {processSteps.length > 0 && ` (Total time: ${totalStandardTime.toFixed(1)} hours)`}
                    </CardDescription>
                  </div>
                </div>
                <Button type="button" size="sm" onClick={addProcessStep}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Step
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {processSteps.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No process steps added yet. Click "Add Step" to define the manufacturing process.
                </p>
              ) : (
                <div className="space-y-4">
                  {processSteps
                    .sort((a, b) => a.stepNumber - b.stepNumber)
                    .map((step) => (
                      <div key={step.id} className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                              {step.stepNumber}
                            </div>
                            <h4 className="font-medium">Step {step.stepNumber}</h4>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeProcessStep(step.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Process Name *</Label>
                            <Input
                              value={step.processName}
                              onChange={(e) => updateProcessStep(step.id, 'processName', e.target.value)}
                              placeholder="e.g., CNC Turning"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Machine Name</Label>
                            <Input
                              value={step.machineName}
                              onChange={(e) => updateProcessStep(step.id, 'machineName', e.target.value)}
                              placeholder="e.g., CNC-01"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Standard Time (hours) *</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={step.standardTimeHours}
                              onChange={(e) => updateProcessStep(step.id, 'standardTimeHours', e.target.value)}
                              placeholder="4.5"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Rest Time (hours)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={step.restTimeHours}
                              onChange={(e) => updateProcessStep(step.id, 'restTimeHours', e.target.value)}
                              placeholder="2.0"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Input
                            value={step.description}
                            onChange={(e) => updateProcessStep(step.id, 'description', e.target.value)}
                            placeholder="e.g., Rough turning to near-net shape"
                          />
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Technical Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Technical Specifications</CardTitle>
              <CardDescription>Additional technical information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="technicalNotes">Technical Notes</Label>
                <Textarea
                  id="technicalNotes"
                  defaultValue={template.technicalNotes}
                  placeholder="e.g., Material hardness: 45-50 HRC after heat treatment. Surface finish: Ra 0.8 μm"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" asChild>
              <Link href={`/masters/child-part-templates/${params.id}`}>Cancel</Link>
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
