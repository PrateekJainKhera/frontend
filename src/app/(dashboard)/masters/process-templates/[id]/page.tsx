"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Workflow, AlertCircle, Edit, Package } from 'lucide-react'
import Link from 'next/link'
import { mockProcessTemplates, mockChildPartTemplates } from '@/lib/mock-data'
import { simulateApiCall } from '@/lib/utils/mock-api'
import { ProcessTemplate, ChildPartTemplate } from '@/types'

export default function ProcessTemplateDetailPage() {
  const params = useParams()
  const templateId = params.id as string

  const [template, setTemplate] = useState<ProcessTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [relatedChildParts, setRelatedChildParts] = useState<ChildPartTemplate[]>([])

  useEffect(() => {
    loadTemplate()
  }, [templateId])

  const loadTemplate = async () => {
    setLoading(true)
    try {
      // Simulate API call to fetch template by ID
      const data = await simulateApiCall(mockProcessTemplates, 800)
      const foundTemplate = data.find(t => t.id === templateId)
      setTemplate(foundTemplate || null)

      // Find child part templates that use processes from this template
      if (foundTemplate) {
        const processIds = foundTemplate.steps.map(step => step.processId)
        const childParts = mockChildPartTemplates.filter(cpt =>
          cpt.processSteps.some(step => processIds.includes(step.processId))
        )
        setRelatedChildParts(childParts)
      }
    } catch (error) {
      setTemplate(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!template) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link href="/masters/process-templates">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Templates
          </Link>
        </Button>

        <Card className="p-12 text-center">
          <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Template Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The process template you're looking for doesn't exist.
          </p>
          <Button asChild>
            <Link href="/masters/process-templates">
              View All Templates
            </Link>
          </Button>
        </Card>
      </div>
    )
  }

  const mandatorySteps = template.steps.filter(step => step.isMandatory).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/masters/process-templates">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
              <Workflow className="h-8 w-8 text-primary" />
              {template.templateName}
            </h1>
            <p className="text-muted-foreground">{template.description}</p>
          </div>
        </div>
        <Button>
          <Edit className="mr-2 h-4 w-4" />
          Edit Template
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Steps</CardDescription>
            <CardTitle className="text-3xl text-primary">{template.steps.length}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Mandatory Steps</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{mandatorySteps}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Applicable Types</CardDescription>
            <CardTitle className="text-3xl text-purple-600">
              {template.applicableTypes.length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Applicable Roller Types */}
      <Card>
        <CardHeader>
          <CardTitle>Applicable Roller Types</CardTitle>
          <CardDescription>
            This template can be used for the following roller types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {template.applicableTypes.map((type) => (
              <Badge key={type} variant="outline" className="text-sm px-3 py-1">
                {type}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Process Flow */}
      <Card>
        <CardHeader>
          <CardTitle>Process Flow ({template.steps.length} Steps)</CardTitle>
          <CardDescription>
            Sequential process steps for manufacturing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {template.steps.map((step, index) => (
              <div key={step.id}>
                <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                  {/* Step Number */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                    {step.stepNo}
                  </div>

                  {/* Step Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{step.processName}</h3>
                      {step.isMandatory && (
                        <Badge variant="default" className="text-xs">
                          Required
                        </Badge>
                      )}
                      {step.canBeParallel && (
                        <Badge variant="secondary" className="text-xs">
                          Can Be Parallel
                        </Badge>
                      )}
                    </div>

                    <div className="text-sm text-muted-foreground">
                      Process ID: <span className="font-mono">{step.processId}</span>
                    </div>
                  </div>
                </div>

                {/* Arrow between steps */}
                {index < template.steps.length - 1 && (
                  <div className="flex items-center justify-center py-2">
                    <div className="h-8 w-0.5 bg-border" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Related Child Parts */}
      {relatedChildParts.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              <div>
                <CardTitle>Child Parts Using These Processes</CardTitle>
                <CardDescription>
                  Child part templates that use one or more processes from this template
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedChildParts.map((childPart) => (
                <Link
                  key={childPart.id}
                  href={`/masters/child-part-templates/${childPart.id}`}
                  className="block"
                >
                  <div className="border rounded-lg p-4 hover:border-primary hover:shadow-md transition-all cursor-pointer">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-sm line-clamp-2">{childPart.templateName}</h4>
                      <Badge variant="outline" className="text-xs ml-2 shrink-0">
                        {childPart.childPartType}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{childPart.templateCode}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{childPart.processSteps.length} process steps</span>
                      <span>•</span>
                      <span>{childPart.totalStandardTimeHours.toFixed(1)} hrs</span>
                    </div>
                    {childPart.description && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {childPart.description}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
