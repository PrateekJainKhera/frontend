"use client"
import { getCurrentUserName } from '@/lib/auth'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Check, ChevronsUpDown, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { childPartTemplateService } from '@/lib/api/child-part-templates'
import { rollerTypeService, RollerTypeResponse } from '@/lib/api/roller-types'
import { processTemplateService, ProcessTemplateResponse } from '@/lib/api/process-templates'
import { childPartTypeService, ChildPartTypeResponse } from '@/lib/api/child-part-types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function CreateChildPartTemplatePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [processTemplates, setProcessTemplates] = useState<ProcessTemplateResponse[]>([])
  const [processTemplateOpen, setProcessTemplateOpen] = useState(false)

  // Child part types from DB
  const [childPartTypes, setChildPartTypes] = useState<ChildPartTypeResponse[]>([])
  const [loadingTypes, setLoadingTypes] = useState(false)

  // Quick-add type dialog
  const [showAddTypeDialog, setShowAddTypeDialog] = useState(false)
  const [newTypeName, setNewTypeName] = useState('')
  const [isAddingType, setIsAddingType] = useState(false)

  // Form fields
  const [templateName, setTemplateName] = useState('')
  const [childPartType, setChildPartType] = useState('')
  const [applicableTypes, setApplicableTypes] = useState<string[]>([])
  const [description, setDescription] = useState('')
  const [processTemplateId, setProcessTemplateId] = useState<number | null>(null)

  // Auto-generate template code based on child part type
  const templateCode = childPartType ? `CPT-${childPartType}-${Date.now().toString().slice(-6)}` : ''

  // Technical notes
  const [technicalNotes, setTechnicalNotes] = useState('')

  // Purchase info
  const [isPurchased, setIsPurchased] = useState(false)

  const [rollerTypes, setRollerTypes] = useState<RollerTypeResponse[]>([])

  // Load Process Templates + Child Part Types + Roller Types
  useEffect(() => {
    loadProcessTemplates()
    loadChildPartTypes()
    rollerTypeService.getAll().then(setRollerTypes).catch(console.error)
  }, [])

  const loadChildPartTypes = async () => {
    setLoadingTypes(true)
    try {
      const types = await childPartTypeService.getAll()
      setChildPartTypes(types)
    } catch (error) {
      console.error('Failed to load child part types:', error)
    } finally {
      setLoadingTypes(false)
    }
  }

  const handleAddType = async () => {
    if (!newTypeName.trim()) {
      toast.error('Type name is required')
      return
    }
    setIsAddingType(true)
    try {
      await childPartTypeService.create({ typeName: newTypeName.trim(), createdBy: getCurrentUserName() })
      toast.success(`Type '${newTypeName.trim().toUpperCase()}' added`)
      await loadChildPartTypes()
      setChildPartType(newTypeName.trim().toUpperCase())
      setNewTypeName('')
      setShowAddTypeDialog(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add type')
    } finally {
      setIsAddingType(false)
    }
  }

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

  const toggleRollerType = (type: string) => {
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
        technicalNotes: technicalNotes.trim() || undefined,
        isPurchased: isPurchased,
        isActive: true,
        createdBy: getCurrentUserName()
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
                <div className="flex gap-2 items-center">
                  <select
                    id="childPartType"
                    value={childPartType}
                    onChange={(e) => setChildPartType(e.target.value)}
                    className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                    disabled={loadingTypes}
                  >
                    <option value="">{loadingTypes ? 'Loading...' : 'Select type...'}</option>
                    {childPartTypes.map((t) => (
                      <option key={t.id} value={t.typeName}>
                        {t.typeName}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowAddTypeDialog(true)}
                    title="Add new child part type"
                    className="shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Applicable Roller Types *</Label>
              <div className="flex gap-6">
                {rollerTypes.map((rt) => (
                  <div key={rt.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`roller-${rt.typeName}`}
                      checked={applicableTypes.includes(rt.typeName)}
                      onCheckedChange={() => toggleRollerType(rt.typeName)}
                    />
                    <label
                      htmlFor={`roller-${rt.typeName}`}
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      {rt.typeName}
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

      {/* Quick Add Child Part Type Dialog */}
      <Dialog open={showAddTypeDialog} onOpenChange={setShowAddTypeDialog}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Add Child Part Type</DialogTitle>
            <DialogDescription>Enter a name for the new child part type</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newTypeName">Type Name *</Label>
              <Input
                id="newTypeName"
                placeholder="e.g., FLANGE"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleAddType()
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">Will be saved in UPPERCASE</p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setShowAddTypeDialog(false); setNewTypeName('') }}
              disabled={isAddingType}
            >
              Cancel
            </Button>
            <Button onClick={handleAddType} disabled={isAddingType}>
              {isAddingType ? 'Adding...' : 'Add Type'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
