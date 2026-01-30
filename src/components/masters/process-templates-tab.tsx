"use client"

import { useState, useEffect } from 'react'
import { Plus, Search, Workflow } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { processTemplateService, ProcessTemplateResponse } from '@/lib/api/process-templates'
import { toast } from 'sonner'

export function ProcessTemplatesTab() {
  const [templates, setTemplates] = useState<ProcessTemplateResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const data = await processTemplateService.getAll()
      setTemplates(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load process templates'
      toast.error(message)
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }

  const filteredTemplates = templates.filter(
    (template) =>
      template.templateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          <CardHeader className="pb-3">
            <CardDescription>Total Templates</CardDescription>
            <CardTitle className="text-3xl">{templates.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          <CardHeader className="pb-3">
            <CardDescription>Active Templates</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {templates.filter(t => t.isActive).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          <CardHeader className="pb-3">
            <CardDescription>Applicable Types</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {[...new Set(templates.flatMap(t => t.applicableTypes))].length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search */}
      <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-4">
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
            <Card key={template.id} className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-lg transition-shadow">
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
                    {template.applicableTypes.map((type, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Status:</p>
                  <Badge variant={template.isActive ? "default" : "secondary"} className="text-xs">
                    {template.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>

                {/* Metadata */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Created: {new Date(template.createdAt).toLocaleDateString()}</p>
                  {template.createdBy && <p>By: {template.createdBy}</p>}
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

      {/* Floating Action Button */}
      <Button asChild>
        <Link
          href="/masters/process-templates/create"
          className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50 flex items-center justify-center"
        >
          <Plus className="h-6 w-6" />
        </Link>
      </Button>
    </div>
  )
}
