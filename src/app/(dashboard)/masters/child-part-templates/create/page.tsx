"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Check, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { RollerType } from '@/types'
import { childPartTemplateService } from '@/lib/api/child-part-templates'
import { processTemplateService, ProcessTemplateResponse } from '@/lib/api/process-templates'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Simplified Child Part Types
const CHILD_PART_TYPES = [
  'SHAFT',
  'SLEEVE',
  'TIKKI',
  'GEAR',
  'ENDS',
  'PIPE',
  'BEARING',
  'PATTI',
  'MAGNET',
  'OTHER'
] as const

export default function CreateChildPartTemplatePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [processTemplates, setProcessTemplates] = useState<ProcessTemplateResponse[]>([])
  const [processTemplateOpen, setProcessTemplateOpen] = useState(false)

  // Form fields
  const [templateName, setTemplateName] = useState('')
  const [childPartType, setChildPartType] = useState('')
  const [applicableTypes, setApplicableTypes] = useState<RollerType[]>([])
  const [description, setDescription] = useState('')
  const [processTemplateId, setProcessTemplateId] = useState<number | null>(null)

  // Auto-generate template code based on child part type
  const templateCode = childPartType ? `CPT-${childPartType}-${Date.now().toString().slice(-6)}` : ''

  // Optional: Basic dimensions for reference
  const [length, setLength] = useState('')
  const [diameter, setDiameter] = useState('')
  const [innerDiameter, setInnerDiameter] = useState('')
  const [outerDiameter, setOuterDiameter] = useState('')
  const [thickness, setThickness] = useState('')
  const [dimensionUnit, setDimensionUnit] = useState('mm')

  // Optional: Drawing reference (just ID/number, not full details)
  const [drawingReference, setDrawingReference] = useState('')

  // Technical notes
  const [technicalNotes, setTechnicalNotes] = useState('')

  // Purchase info
  const [isPurchased, setIsPurchased] = useState(false)

  const allRollerTypes: RollerType[] = [
    RollerType.PRINTING,
    RollerType.MAGNETIC,
  ]

  // Load Process Templates
  useEffect(() => {
    loadProcessTemplates()
  }, [])

  const loadProcessTemplates = async () => {
    setLoadingTemplates(true)
    try {
      const templates = await processTemplateService.getAll()
      setProcessTemplates(templates)
    } catch (error) {
      console.error('Failed to load process templates:', error)
      toast.error('Failed to load process templates')
    } finally {
      setLoadingTemplates(false)
    }
  }

  const toggleRollerType = (type: RollerType) => {
    if (applicableTypes.includes(type)) {
      setApplicableTypes(applicableTypes.filter(t => t !== type))
    } else {
      setApplicableTypes([...applicableTypes, type])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!templateName.trim()) {
      toast.error('Please enter template name')
      return
    }
    if (!childPartType) {
      toast.error('Please select child part type')
      return
    }
    if (applicableTypes.length === 0) {
      toast.error('Please select at least one applicable roller type')
      return
    }
    if (!isPurchased && !processTemplateId) {
      toast.error('Please select a process template for manufactured parts')
      return
    }

    setLoading(true)

    try {
      await childPartTemplateService.create({
        templateName: templateName.trim(),
        templateCode: templateCode.trim() || undefined,
        childPartType,
        rollerType: applicableTypes.join(','), // Store as comma-separated string
        processTemplateId: processTemplateId || undefined,
        description: description.trim() || undefined,
        length: length ? parseFloat(length) : undefined,
        diameter: diameter ? parseFloat(diameter) : undefined,
        innerDiameter: innerDiameter ? parseFloat(innerDiameter) : undefined,
        outerDiameter: outerDiameter ? parseFloat(outerDiameter) : undefined,
        thickness: thickness ? parseFloat(thickness) : undefined,
        dimensionUnit: dimensionUnit || 'mm',
        drawingNumber: drawingReference.trim() || undefined,
        technicalNotes: technicalNotes.trim() || undefined,
        isPurchased: isPurchased,
        isActive: true,
        createdBy: 'Admin'
      })

      toast.success('Child part template created successfully!')
      router.push('/masters/products')
    } catch (error) {
      console.error('Failed to create template:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create template')
    } finally {
      setLoading(false)
    }
  }

  const selectedTemplate = processTemplates.find(t => t.id === processTemplateId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/masters/child-part-templates">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-primary">Create Child Part Template</h1>
          <p className="text-muted-foreground">Define a new child part specification</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Define the child part template details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="templateName">Template Name *</Label>
                <Input
                  id="templateName"
                  placeholder="e.g., Standard Shaft"
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
                <p className="text-xs text-muted-foreground">Auto-generated based on part type</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="childPartType">Child Part Type *</Label>
                <select
                  id="childPartType"
                  value={childPartType}
                  onChange={(e) => setChildPartType(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  required
                >
                  <option value="">Select type...</option>
                  {CHILD_PART_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="drawingReference">Drawing Reference</Label>
                <Input
                  id="drawingReference"
                  placeholder="e.g., DWG-001"
                  value={drawingReference}
                  onChange={(e) => setDrawingReference(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Reference to drawing number from Drawings Master</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Applicable Roller Types *</Label>
              <div className="flex gap-6">
                {allRollerTypes.map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`roller-${type}`}
                      checked={applicableTypes.includes(type)}
                      onCheckedChange={() => toggleRollerType(type)}
                    />
                    <label
                      htmlFor={`roller-${type}`}
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      {type}
                    </label>
                  </div>
                ))}
              </div>
              {applicableTypes.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {applicableTypes.map(type => (
                    <Badge key={type} variant="secondary">{type}</Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe this child part..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Manufacturing Process */}
        <Card>
          <CardHeader>
            <CardTitle>Manufacturing Process</CardTitle>
            <CardDescription>Select how this part is manufactured</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPurchased"
                checked={isPurchased}
                onCheckedChange={(checked) => setIsPurchased(checked as boolean)}
              />
              <label
                htmlFor="isPurchased"
                className="text-sm font-medium leading-none cursor-pointer"
              >
                This is a purchased part (not manufactured in-house)
              </label>
            </div>

            {!isPurchased && (
              <div className="space-y-2">
                <Label>Process Template *</Label>
                <Popover open={processTemplateOpen} onOpenChange={setProcessTemplateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between text-left font-normal",
                        !processTemplateId && "text-muted-foreground"
                      )}
                      disabled={loadingTemplates}
                    >
                      <span className="truncate">
                        {processTemplateId
                          ? selectedTemplate?.templateName
                          : loadingTemplates
                            ? "Loading templates..."
                            : "Select process template"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search process template..." />
                      <CommandList className="max-h-[300px]">
                        <CommandEmpty>No process template found.</CommandEmpty>
                        <CommandGroup>
                          {processTemplates.map((template) => (
                            <CommandItem
                              value={template.templateName}
                              key={template.id}
                              onSelect={() => {
                                setProcessTemplateId(template.id)
                                setProcessTemplateOpen(false)
                              }}
                              className="cursor-pointer"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  template.id === processTemplateId
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">{template.templateName}</span>
                                {template.description && (
                                  <span className="text-xs text-muted-foreground">
                                    {template.description}
                                  </span>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">
                  Select the manufacturing route to use for this part
                </p>
              </div>
            )}

            {isPurchased && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  ℹ️ Purchased parts don't need a process template. They will be procured from suppliers.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dimensions (Optional) */}
        <Card>
          <CardHeader>
            <CardTitle>Dimensions (Optional)</CardTitle>
            <CardDescription>Physical specifications for reference</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="length">Length</Label>
                <Input
                  id="length"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 180"
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
                  placeholder="e.g., 25"
                  value={diameter}
                  onChange={(e) => setDiameter(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="outerDiameter">Outer Diameter</Label>
                <Input
                  id="outerDiameter"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 60"
                  value={outerDiameter}
                  onChange={(e) => setOuterDiameter(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="innerDiameter">Inner Diameter</Label>
                <Input
                  id="innerDiameter"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 51"
                  value={innerDiameter}
                  onChange={(e) => setInnerDiameter(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="thickness">Thickness</Label>
                <Input
                  id="thickness"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 4.5"
                  value={thickness}
                  onChange={(e) => setThickness(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dimensionUnit">Unit</Label>
                <select
                  id="dimensionUnit"
                  value={dimensionUnit}
                  onChange={(e) => setDimensionUnit(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="mm">mm</option>
                  <option value="cm">cm</option>
                  <option value="inch">inch</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Technical Notes (Optional)</CardTitle>
            <CardDescription>Additional specifications and notes</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              id="technicalNotes"
              placeholder="Enter technical specifications, tolerances, surface finish requirements, etc."
              value={technicalNotes}
              onChange={(e) => setTechnicalNotes(e.target.value)}
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild disabled={loading}>
            <Link href="/masters/child-part-templates">Cancel</Link>
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
