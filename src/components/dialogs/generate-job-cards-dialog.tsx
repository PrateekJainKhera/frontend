"use client"

import { useState, useEffect } from 'react'
import { Factory, CheckCircle, AlertTriangle, Clock, ArrowRight } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Order, ProcessTemplate, JobCard } from '@/types'
import { generateJobCardsFromOrder, calculateTotalEstimatedTime, getJobCardSummary } from '@/lib/utils/job-card-generator'
import { toast } from 'sonner'

interface GenerateJobCardsDialogProps {
  order: Order
  processTemplate: ProcessTemplate | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (jobCards: JobCard[]) => void
}

export function GenerateJobCardsDialog({
  order,
  processTemplate,
  open,
  onOpenChange,
  onSuccess
}: GenerateJobCardsDialogProps) {
  const [selectedSteps, setSelectedSteps] = useState<number[]>([])
  const [autoAssignMachines, setAutoAssignMachines] = useState(true)
  const [schedulingStrategy, setSchedulingStrategy] = useState<'ASAP' | 'JIT' | 'MANUAL'>('ASAP')
  const [previewJobCards, setPreviewJobCards] = useState<JobCard[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  // Initialize selected steps when template changes
  useEffect(() => {
    if (processTemplate) {
      // Select all mandatory steps by default
      const mandatorySteps = processTemplate.steps
        .filter(step => step.isMandatory)
        .map(step => step.stepNo)
      setSelectedSteps(mandatorySteps)
    }
  }, [processTemplate])

  // Generate preview when configuration changes
  useEffect(() => {
    if (processTemplate && selectedSteps.length > 0) {
      try {
        const preview = generateJobCardsFromOrder({
          order,
          processTemplate,
          config: {
            autoAssignMachines,
            selectedSteps,
            schedulingStrategy
          }
        })
        setPreviewJobCards(preview)
      } catch (error) {
        console.error('Error generating preview:', error)
        setPreviewJobCards([])
      }
    } else {
      setPreviewJobCards([])
    }
  }, [order, processTemplate, selectedSteps, autoAssignMachines, schedulingStrategy])

  const toggleStep = (stepNo: number, isMandatory: boolean) => {
    if (isMandatory) {
      // Cannot deselect mandatory steps
      return
    }

    if (selectedSteps.includes(stepNo)) {
      setSelectedSteps(selectedSteps.filter(s => s !== stepNo))
    } else {
      setSelectedSteps([...selectedSteps, stepNo].sort())
    }
  }

  const handleGenerate = async () => {
    if (!processTemplate || selectedSteps.length === 0) {
      toast.error('Please select at least one process step')
      return
    }

    setIsGenerating(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))

      // In real app, this would call API
      const generatedJobCards = generateJobCardsFromOrder({
        order,
        processTemplate,
        config: {
          autoAssignMachines,
          selectedSteps,
          schedulingStrategy
        }
      })

      toast.success(`Successfully created ${generatedJobCards.length} job cards!`)
      onSuccess?.(generatedJobCards)
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to generate job cards')
      console.error(error)
    } finally {
      setIsGenerating(false)
    }
  }

  const summary = previewJobCards.length > 0 ? getJobCardSummary(previewJobCards) : null
  const totalTime = summary ? summary.totalEstimatedTime : 0
  const totalHours = (totalTime / 60).toFixed(1)

  if (!processTemplate) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cannot Generate Job Cards</DialogTitle>
            <DialogDescription>
              This product does not have a process template assigned.
            </DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please assign a process template to this product in the Masters section before generating job cards.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Factory className="h-5 w-5" />
            Generate Job Cards for Order {order.orderNo}
          </DialogTitle>
          <DialogDescription>
            Create job cards for each process step. Review and configure before generating.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Process Template Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Process Template</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{processTemplate.templateName}</p>
                  {processTemplate.description && (
                    <p className="text-sm text-muted-foreground">{processTemplate.description}</p>
                  )}
                </div>
                <Badge variant="outline">{processTemplate.steps.length} Steps</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Select Process Steps */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Select Process Steps</CardTitle>
              <CardDescription>Choose which steps to generate job cards for</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {processTemplate.steps.map(step => (
                  <div
                    key={step.stepNo}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={selectedSteps.includes(step.stepNo)}
                      onCheckedChange={() => toggleStep(step.stepNo, step.isMandatory)}
                      disabled={step.isMandatory}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Step {step.stepNo}: {step.processName}</span>
                        {step.isMandatory && (
                          <Badge variant="destructive" className="text-xs">Mandatory</Badge>
                        )}
                        {step.canBeParallel && (
                          <Badge variant="secondary" className="text-xs">Parallel</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Configuration */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-assign Machines</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically assign suitable machines to each job card
                  </p>
                </div>
                <Switch
                  checked={autoAssignMachines}
                  onCheckedChange={setAutoAssignMachines}
                />
              </div>

              <div className="space-y-2">
                <Label>Scheduling Strategy</Label>
                <Select value={schedulingStrategy} onValueChange={(value: any) => setSchedulingStrategy(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ASAP">ASAP (Start immediately)</SelectItem>
                    <SelectItem value="JIT">JIT (Just-in-time scheduling)</SelectItem>
                    <SelectItem value="MANUAL">Manual (Schedule later)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Material Check - Mock for now */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Material Availability</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">All materials available</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Material requirements will be allocated when job cards are created.
              </p>
            </CardContent>
          </Card>

          {/* Preview */}
          {previewJobCards.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Preview Job Cards</CardTitle>
                <CardDescription>
                  {previewJobCards.length} job card{previewJobCards.length !== 1 ? 's' : ''} will be created
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job Card No</TableHead>
                      <TableHead>Process</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Est. Time</TableHead>
                      <TableHead>Dependencies</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewJobCards.map((jc) => (
                      <TableRow key={jc.id}>
                        <TableCell className="font-mono text-sm">{jc.jobCardNo}</TableCell>
                        <TableCell>{jc.processName}</TableCell>
                        <TableCell>
                          <Badge variant={jc.status === 'Ready' ? 'default' : 'secondary'}>
                            {jc.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-3 w-3" />
                            {(jc.estimatedTotalTimeMin / 60).toFixed(1)}h
                          </div>
                        </TableCell>
                        <TableCell>
                          {jc.dependsOnJobCardIds.length > 0 ? (
                            <span className="text-xs text-muted-foreground">
                              {jc.dependsOnJobCardIds.join(', ')}
                            </span>
                          ) : (
                            <Badge variant="outline" className="text-xs">None</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Summary */}
                <div className="mt-4 pt-4 border-t space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total estimated time:</span>
                    <span className="font-semibold">{totalHours} hours</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Quantity per job card:</span>
                    <span className="font-semibold">{order.quantity} units</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Priority:</span>
                    <Badge>{order.priority}</Badge>
                  </div>
                </div>

                {/* Process Flow Visualization */}
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium mb-3">Process Flow:</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {previewJobCards.map((jc, index) => (
                      <div key={jc.id} className="flex items-center">
                        <Badge variant={jc.status === 'Ready' ? 'default' : 'secondary'}>
                          {jc.stepNo}. {jc.processName}
                        </Badge>
                        {index < previewJobCards.length - 1 && (
                          <ArrowRight className="h-4 w-4 mx-2 text-muted-foreground" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={selectedSteps.length === 0 || isGenerating}
          >
            {isGenerating ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Factory className="mr-2 h-4 w-4" />
                Generate {previewJobCards.length} Job Card{previewJobCards.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
