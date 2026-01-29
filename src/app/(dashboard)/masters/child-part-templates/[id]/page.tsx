"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package, Wrench, Edit, Trash2, FileText, Ruler } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { mockChildPartTemplates } from '@/lib/mock-data'
import { simulateApiCall } from '@/lib/utils/mock-api'
import { ChildPartTemplate, ChildPartType, RollerType } from '@/types'

export default function ChildPartTemplateDetailPage() {
  const params = useParams()
  const [template, setTemplate] = useState<ChildPartTemplate | null>(null)
  const [loading, setLoading] = useState(true)

  const loadTemplate = async () => {
    setLoading(true)
    const found = mockChildPartTemplates.find(t => t.id === params.id)
    const data = await simulateApiCall(found || null, 500)
    setTemplate(data)
    setLoading(false)
  }

  useEffect(() => {
    loadTemplate()
  }, [params.id])

  const getChildPartTypeBadge = (type: ChildPartType) => {
    const colors: Record<ChildPartType, string> = {
      [ChildPartType.SHAFT]: 'bg-blue-100 text-blue-800',
      [ChildPartType.CORE]: 'bg-purple-100 text-purple-800',
      [ChildPartType.SLEEVE]: 'bg-green-100 text-green-800',
      [ChildPartType.END_DISK]: 'bg-orange-100 text-orange-800',
      [ChildPartType.HOUSING]: 'bg-yellow-100 text-yellow-800',
      [ChildPartType.COVER]: 'bg-pink-100 text-pink-800',
      [ChildPartType.OTHER]: 'bg-gray-100 text-gray-800',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const getRollerTypeBadge = (type: RollerType) => {
    const colors: Record<RollerType, string> = {
      [RollerType.MAGNETIC]: 'bg-blue-500 text-white',
      [RollerType.PRINTING]: 'bg-orange-500 text-white',
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
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Standard Time</h3>
              <div className="flex items-center gap-2">
                <Ruler className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{template.totalStandardTimeHours.toFixed(1)} hours</span>
              </div>
            </div>
          </div>
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

      {/* Raw Materials Required */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            <div>
              <CardTitle>Raw Materials Required</CardTitle>
              <CardDescription>Materials needed to manufacture this part</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Material Name</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Grade</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Quantity</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Unit</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Wastage %</th>
                </tr>
              </thead>
              <tbody>
                {template.materialRequirements.map((material) => (
                  <tr key={material.id} className="border-b last:border-0">
                    <td className="py-3 text-sm font-medium">{material.rawMaterialName}</td>
                    <td className="py-3 text-sm text-muted-foreground">{material.materialGrade}</td>
                    <td className="py-3 text-sm">{material.quantityRequired}</td>
                    <td className="py-3 text-sm text-muted-foreground">{material.unit}</td>
                    <td className="py-3 text-sm text-muted-foreground">{material.wastagePercent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Manufacturing Process Steps */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            <div>
              <CardTitle>Manufacturing Process Steps</CardTitle>
              <CardDescription>Sequential steps to manufacture this child part</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="pb-3 text-sm font-medium text-muted-foreground w-12">Step</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Process Name</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Machine</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Standard Time</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Rest Time</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Description</th>
                </tr>
              </thead>
              <tbody>
                {template.processSteps
                  .sort((a, b) => a.stepNumber - b.stepNumber)
                  .map((step) => (
                    <tr key={step.id} className="border-b last:border-0">
                      <td className="py-3 text-sm text-muted-foreground">{step.stepNumber}</td>
                      <td className="py-3 text-sm font-medium">{step.processName}</td>
                      <td className="py-3 text-sm text-muted-foreground">{step.machineName || '-'}</td>
                      <td className="py-3 text-sm">{step.standardTimeHours.toFixed(1)} hrs</td>
                      <td className="py-3 text-sm text-muted-foreground">
                        {step.restTimeHours ? `${step.restTimeHours.toFixed(1)} hrs` : '-'}
                      </td>
                      <td className="py-3 text-sm text-muted-foreground max-w-xs truncate">
                        {step.description || '-'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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

      {/* Quality Checkpoints */}
      {template.qualityCheckpoints && template.qualityCheckpoints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Quality Checkpoints</CardTitle>
            <CardDescription>Critical quality inspection points</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2">
              {template.qualityCheckpoints.map((checkpoint, index) => (
                <li key={index} className="text-sm text-muted-foreground">{checkpoint}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
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
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Updated By</h3>
            <p className="text-sm">{template.updatedBy || '-'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
