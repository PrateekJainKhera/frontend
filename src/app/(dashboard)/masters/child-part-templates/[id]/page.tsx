"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package, Wrench, Edit, Trash2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { childPartTemplateService, ChildPartTemplateResponse } from '@/lib/api/child-part-templates'
import { processTemplateService, ProcessTemplateResponse, ProcessTemplateWithStepsResponse } from '@/lib/api/process-templates'
import { toast } from 'sonner'

export default function ChildPartTemplateDetailPage() {
  const params = useParams()
  const [template, setTemplate] = useState<ChildPartTemplateResponse | null>(null)
  const [processTemplate, setProcessTemplate] = useState<ProcessTemplateResponse | null>(null)
  const [processTemplateWithSteps, setProcessTemplateWithSteps] = useState<ProcessTemplateWithStepsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const loadTemplate = async () => {
    setLoading(true)
    try {
      const data = await childPartTemplateService.getById(Number(params.id))
      setTemplate(data)

      // Load process template if linked
      if (data.processTemplateId) {
        try {
          const processData = await processTemplateService.getById(data.processTemplateId)
          setProcessTemplate(processData)

          // Try to load full template with steps
          try {
            const fullProcessData = await processTemplateService.getTemplateWithSteps(data.processTemplateId)
            setProcessTemplateWithSteps(fullProcessData)
          } catch (error) {
            console.error('Failed to load process template steps:', error)
            setProcessTemplateWithSteps(null)
          }
        } catch (error) {
          console.error('Failed to load process template:', error)
          setProcessTemplate(null)
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load template'
      toast.error(message)
      setTemplate(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTemplate()
  }, [params.id])

  const getChildPartTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      'Shaft': 'bg-blue-100 text-blue-800',
      'Core': 'bg-purple-100 text-purple-800',
      'Sleeve': 'bg-green-100 text-green-800',
      'End Disk': 'bg-orange-100 text-orange-800',
      'Housing': 'bg-yellow-100 text-yellow-800',
      'Cover': 'bg-pink-100 text-pink-800',
      'Other': 'bg-gray-100 text-gray-800',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const getRollerTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      'MAGNETIC': 'bg-blue-500 text-white',
      'PRINTING': 'bg-orange-500 text-white',
    }
    return colors[type] || 'bg-gray-500 text-white'
  }

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
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/masters/child-part-templates">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary">{template.templateName}</h1>
            <p className="text-muted-foreground">{template.templateCode}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/masters/child-part-templates/${params.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button variant="outline" className="text-destructive hover:bg-destructive hover:text-destructive-foreground">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Template Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Template Information</CardTitle>
              <CardDescription>Basic details about this child part template</CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge className={getChildPartTypeBadge(template.childPartType)}>
                {template.childPartType}
              </Badge>
              <Badge className={getRollerTypeBadge(template.rollerType)}>
                {template.rollerType}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {template.description && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
              <p className="text-sm">{template.description}</p>
            </div>
          )}

          {template.drawingNumber && (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Drawing: {template.drawingNumber} {template.drawingRevision && `(${template.drawingRevision})`}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
              <Badge variant={template.isActive ? "default" : "secondary"}>
                {template.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Part Type</h3>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {template.isPurchased ? 'Purchased Part' : 'Manufactured Part'}
                </span>
              </div>
            </div>
          </div>

          {template.processTemplateId && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Process Template Linked (ID: {template.processTemplateId})
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dimensions */}
      <Card>
        <CardHeader>
          <CardTitle>Dimensions</CardTitle>
          <CardDescription>Physical specifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {template.length && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Length</h3>
                <p className="text-sm font-medium">{template.length} {template.dimensionUnit}</p>
              </div>
            )}
            {template.diameter && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Diameter</h3>
                <p className="text-sm font-medium">{template.diameter} {template.dimensionUnit}</p>
              </div>
            )}
            {template.outerDiameter && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Outer Diameter</h3>
                <p className="text-sm font-medium">{template.outerDiameter} {template.dimensionUnit}</p>
              </div>
            )}
            {template.innerDiameter && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Inner Diameter</h3>
                <p className="text-sm font-medium">{template.innerDiameter} {template.dimensionUnit}</p>
              </div>
            )}
            {template.thickness && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Thickness</h3>
                <p className="text-sm font-medium">{template.thickness} {template.dimensionUnit}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Manufacturing Process Information */}
      {!template.isPurchased && template.processTemplateId && processTemplate && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                <div>
                  <CardTitle>Manufacturing Process Template</CardTitle>
                  <CardDescription>{processTemplate.templateName}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {processTemplate.description && (
                  <p className="text-sm text-muted-foreground">{processTemplate.description}</p>
                )}
                {processTemplate.applicableTypes && processTemplate.applicableTypes.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Applicable Types</p>
                    <div className="flex gap-1 flex-wrap">
                      {processTemplate.applicableTypes.map((type, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Process Steps Table */}
          {processTemplateWithSteps && processTemplateWithSteps.steps && processTemplateWithSteps.steps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Manufacturing Process Steps</CardTitle>
                <CardDescription>Sequential steps defined in the process template</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left">
                        <th className="pb-3 text-sm font-medium text-muted-foreground w-12">Step</th>
                        <th className="pb-3 text-sm font-medium text-muted-foreground">Process Name</th>
                        <th className="pb-3 text-sm font-medium text-muted-foreground">Mandatory</th>
                        <th className="pb-3 text-sm font-medium text-muted-foreground">Can Be Parallel</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processTemplateWithSteps.steps
                        .sort((a, b) => a.stepNo - b.stepNo)
                        .map((step) => (
                          <tr key={step.id} className="border-b last:border-0">
                            <td className="py-3 text-sm text-muted-foreground">{step.stepNo}</td>
                            <td className="py-3 text-sm font-medium">{step.processName || `Process ${step.processId}`}</td>
                            <td className="py-3 text-sm">
                              <Badge variant={step.isMandatory ? "default" : "secondary"} className="text-xs">
                                {step.isMandatory ? "Yes" : "No"}
                              </Badge>
                            </td>
                            <td className="py-3 text-sm">
                              <Badge variant={step.canBeParallel ? "default" : "secondary"} className="text-xs">
                                {step.canBeParallel ? "Yes" : "No"}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {template.isPurchased && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              <div>
                <CardTitle>Purchased Part</CardTitle>
                <CardDescription>This part is purchased from suppliers</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                This is a purchased part and does not require internal manufacturing.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Technical Notes */}
      {template.technicalNotes && (
        <Card>
          <CardHeader>
            <CardTitle>Technical Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{template.technicalNotes}</p>
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Created At</h3>
            <p className="text-sm">{new Date(template.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Last Updated</h3>
            <p className="text-sm">{new Date(template.updatedAt).toLocaleString()}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Created By</h3>
            <p className="text-sm">{template.createdBy || '-'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
