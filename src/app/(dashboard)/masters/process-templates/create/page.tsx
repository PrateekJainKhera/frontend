"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, GripVertical, Check, ChevronsUpDown } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { ProcessTemplateStep } from '@/types'
import { toast } from 'sonner'
import { processTemplateService } from '@/lib/api/process-templates'
import { processService, ProcessResponse } from '@/lib/api/processes'
import { rollerTypeService, RollerTypeResponse } from '@/lib/api/roller-types'
import { cn } from '@/lib/utils'

interface TemplateFormData {
  templateName: string
  description: string
  applicableTypes: string[]
  steps: ProcessTemplateStep[]
}

export default function CreateProcessTemplatePage() {
  const router = useRouter()
  const [formData, setFormData] = useState<TemplateFormData>({
    templateName: '',
    description: '',
    applicableTypes: [],
    steps: []
  })
  const [processes, setProcesses] = useState<ProcessResponse[]>([])
  const [loadingProcesses, setLoadingProcesses] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [processSearchOpen, setProcessSearchOpen] = useState<{ [key: number]: boolean }>({})
  const [rollerTypes, setRollerTypes] = useState<RollerTypeResponse[]>([])

  // Load processes + roller types from API
  useEffect(() => {
    const loadProcesses = async () => {
      setLoadingProcesses(true)
      try {
        const data = await processService.getAll()
        setProcesses(data)
      } catch (error) {
        console.error('Failed to load processes:', error)
        toast.error('Failed to load processes')
      } finally {
        setLoadingProcesses(false)
      }
    }
    loadProcesses()
    rollerTypeService.getAll().then(setRollerTypes).catch(console.error)
  }, [])

  const handleAddStep = () => {
    const newStep: ProcessTemplateStep = {
      id: Date.now(),
      templateId: 0, // Will be set when template is created
      stepNo: formData.steps.length + 1,
      processId: 0,
      processName: '',
      isMandatory: true,
      canBeParallel: false
    }
    setFormData({ ...formData, steps: [...formData.steps, newStep] })
  }

  const handleRemoveStep = (index: number) => {
    const updatedSteps = formData.steps.filter((_, i) => i !== index)
    // Renumber steps
    const renumberedSteps = updatedSteps.map((step, i) => ({ ...step, stepNo: i + 1 }))
    setFormData({ ...formData, steps: renumberedSteps })
  }

  const handleStepChange = (index: number, field: keyof ProcessTemplateStep, value: any) => {
    const updatedSteps = [...formData.steps]

    if (field === 'processId') {
      // Find the selected process to auto-fill details
      const selectedProcess = processes.find(p => p.id === Number(value))
      if (selectedProcess) {
        updatedSteps[index] = {
          ...updatedSteps[index],
          processId: selectedProcess.id,
          processName: selectedProcess.processName
        }
      }
    } else {
      updatedSteps[index] = { ...updatedSteps[index], [field]: value }
    }

    setFormData({ ...formData, steps: updatedSteps })
  }

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === formData.steps.length - 1)
    ) {
      return
    }

    const updatedSteps = [...formData.steps]
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    // Swap steps
    const temp = updatedSteps[index]
    updatedSteps[index] = updatedSteps[targetIndex]
    updatedSteps[targetIndex] = temp

    // Renumber
    const renumberedSteps = updatedSteps.map((step, i) => ({ ...step, stepNo: i + 1 }))
    setFormData({ ...formData, steps: renumberedSteps })
  }

  const toggleRollerType = (type: string) => {
    if (formData.applicableTypes.includes(type)) {
      setFormData({
        ...formData,
        applicableTypes: formData.applicableTypes.filter(t => t !== type)
      })
    } else {
      setFormData({
        ...formData,
        applicableTypes: [...formData.applicableTypes, type]
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.templateName.trim()) {
      toast.error('Please enter template name')
      return
    }
    if (formData.applicableTypes.length === 0) {
      toast.error('Please select at least one roller type')
      return
    }
    if (formData.steps.length === 0) {
      toast.error('Please add at least one process step')
      return
    }
    if (formData.steps.some(step => !step.processId)) {
      toast.error('Please select a process for all steps')
      return
    }

    setSubmitting(true)

    try {
      // Create template with steps
      await processTemplateService.createWithSteps({
        templateName: formData.templateName,
        description: formData.description || undefined,
        applicableTypes: formData.applicableTypes,
        steps: formData.steps.map(step => ({
          stepNo: step.stepNo,
          processId: step.processId,
          isMandatory: step.isMandatory,
          canBeParallel: step.canBeParallel
        })),
        isActive: true,
        createdBy: 'Admin'
      })

      toast.success('Process template created successfully!')
      router.push('/masters/process-templates')
    } catch (error) {
      console.error('Failed to create template:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create template')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/masters/processes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-primary">Create Process Template</h1>
          <p className="text-muted-foreground">Define a standard process flow</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Enter template name and description</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="templateName">Template Name *</Label>
              <Input
                id="templateName"
                placeholder="e.g., Standard Roller Manufacturing"
                value={formData.templateName}
                onChange={(e) => setFormData({ ...formData, templateName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe when to use this template..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Applicable Roller Types *</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {rollerTypes.map((rt) => (
                  <div key={rt.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={rt.typeName}
                      checked={formData.applicableTypes.includes(rt.typeName)}
                      onCheckedChange={() => toggleRollerType(rt.typeName)}
                    />
                    <label
                      htmlFor={rt.typeName}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {rt.typeName}
                    </label>
                  </div>
                ))}
              </div>
              {formData.applicableTypes.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {formData.applicableTypes.map(type => (
                    <Badge key={type} variant="secondary">{type}</Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Process Steps */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Process Steps</CardTitle>
                <CardDescription>Define the sequence of manufacturing processes</CardDescription>
              </div>
              <Button type="button" onClick={handleAddStep} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Step
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.steps.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No steps added yet. Click "Add Step" to begin.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.steps.map((step, index) => (
                  <Card key={step.id} className="border-2">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {/* Step header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-base px-3 py-1">
                              Step {step.stepNo}
                            </Badge>
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMoveStep(index, 'up')}
                                disabled={index === 0}
                              >
                                <GripVertical className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMoveStep(index, 'down')}
                                disabled={index === formData.steps.length - 1}
                              >
                                <GripVertical className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveStep(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>

                        {/* Process selection - SEARCHABLE DROPDOWN */}
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Process *</Label>
                            <Popover
                              open={processSearchOpen[index] || false}
                              onOpenChange={(open) => setProcessSearchOpen({ ...processSearchOpen, [index]: open })}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className={cn(
                                    "w-full justify-between text-left font-normal",
                                    !step.processId && "text-muted-foreground"
                                  )}
                                  disabled={loadingProcesses}
                                >
                                  <span className="truncate">
                                    {step.processId
                                      ? processes.find((p) => p.id === step.processId)?.processName
                                      : loadingProcesses ? "Loading processes..." : "Select process"}
                                  </span>
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-full sm:w-[500px] p-0" align="start">
                                <Command>
                                  <CommandInput placeholder="Search process..." className="h-9" />
                                  <CommandList className="max-h-[200px] sm:max-h-[300px]">
                                    <CommandEmpty>No process found.</CommandEmpty>
                                    <CommandGroup>
                                      {processes.map((process) => (
                                        <CommandItem
                                          value={`${process.processName} ${process.processCategoryName ?? ''} ${process.processCode}`}
                                          key={process.id}
                                          onSelect={() => {
                                            handleStepChange(index, 'processId', process.id.toString())
                                            setProcessSearchOpen({ ...processSearchOpen, [index]: false })
                                          }}
                                          className="cursor-pointer"
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              process.id === step.processId
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                          />
                                          <div className="flex flex-col">
                                            <span className="font-medium">{process.processName}</span>
                                            <span className="text-xs text-muted-foreground">
                                              {process.processCode} • {process.processCategoryName}
                                              {process.isOutsourced && " • Outsourced"}
                                            </span>
                                          </div>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </div>

                          {/* Options */}
                          <div className="flex gap-6">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`mandatory-${index}`}
                                checked={step.isMandatory}
                                onCheckedChange={(checked) => handleStepChange(index, 'isMandatory', checked)}
                              />
                              <label htmlFor={`mandatory-${index}`} className="text-sm cursor-pointer">
                                Mandatory Step
                              </label>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`parallel-${index}`}
                                checked={step.canBeParallel}
                                onCheckedChange={(checked) => handleStepChange(index, 'canBeParallel', checked)}
                              />
                              <label htmlFor={`parallel-${index}`} className="text-sm cursor-pointer">
                                Can Run in Parallel
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        {formData.steps.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Template Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Steps</p>
                  <p className="text-2xl font-bold">{formData.steps.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mandatory Steps</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formData.steps.filter(s => s.isMandatory).length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Parallel Steps</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formData.steps.filter(s => s.canBeParallel).length}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">Process Flow:</p>
                <div className="flex flex-wrap gap-2">
                  {formData.steps.map((step, index) => (
                    <div key={step.id} className="flex items-center">
                      <Badge variant={step.isMandatory ? "default" : "secondary"}>
                        {step.stepNo}. {step.processName || 'Not selected'}
                        {step.canBeParallel && " ⚡"}
                      </Badge>
                      {index < formData.steps.length - 1 && (
                        <span className="mx-2 text-muted-foreground">→</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild disabled={submitting}>
            <Link href="/masters/process-templates">Cancel</Link>
          </Button>
          <Button type="submit" disabled={submitting || loadingProcesses}>
            {submitting ? 'Creating...' : 'Create Template'}
          </Button>
        </div>
      </form>
    </div>
  )
}
