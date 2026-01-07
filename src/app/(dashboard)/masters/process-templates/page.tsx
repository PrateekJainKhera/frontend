"use client"

import { useState, useEffect } from 'react'
import { Plus, Search, Workflow } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { mockProcessTemplates } from '@/lib/mock-data'
import { simulateApiCall } from '@/lib/utils/mock-api'
import { ProcessTemplate } from '@/types'

export default function ProcessTemplatesPage() {
  const [templates, setTemplates] = useState<ProcessTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setLoading(true)
    const data = await simulateApiCall(mockProcessTemplates, 800)
    setTemplates(data)
    setLoading(false)
  }

  const filteredTemplates = templates.filter(
    (template) =>
      template.templateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="sr-only">Process Templates</h1>
        <Button asChild className="ml-auto">
          <Link href="/masters/process-templates/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Templates</CardDescription>
            <CardTitle className="text-3xl">{templates.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Avg Steps/Template</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {templates.length > 0
                ? Math.round(templates.reduce((sum, t) => sum + t.steps.length, 0) / templates.length)
                : 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Process Steps</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {templates.reduce((sum, t) => sum + t.steps.length, 0)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </Card>

      {/* Templates Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No templates found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Workflow className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{template.templateName}</CardTitle>
                  </div>
                </div>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Applicable Types */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Applicable To:</p>
                  <div className="flex flex-wrap gap-1">
                    {template.applicableTypes.map((type) => (
                      <Badge key={type} variant="outline" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Process Steps */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Process Flow ({template.steps.length} steps):
                  </p>
                  <div className="space-y-1">
                    {template.steps.slice(0, 4).map((step) => (
                      <div
                        key={step.id}
                        className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded"
                      >
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                          {step.stepNo}
                        </span>
                        <span className="flex-1 truncate">{step.processName}</span>
                        {step.isMandatory && (
                          <Badge variant="secondary" className="text-[10px] px-1 py-0">
                            Required
                          </Badge>
                        )}
                      </div>
                    ))}
                    {template.steps.length > 4 && (
                      <p className="text-xs text-muted-foreground text-center pt-1">
                        +{template.steps.length - 4} more steps
                      </p>
                    )}
                  </div>
                </div>

                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/masters/process-templates/${template.id}`}>
                    View Details
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
