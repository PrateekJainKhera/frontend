"use client"

import { useState, useEffect } from 'react'
import { Plus, Search, Wrench, Package, FileText, Ruler } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { childPartTemplateService, ChildPartTemplateResponse } from '@/lib/api/child-part-templates'
import { toast } from 'sonner'
import { ChildPartType, RollerType } from '@/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function ChildPartTemplatesTab() {
  const [templates, setTemplates] = useState<ChildPartTemplateResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [rollerTypeFilter, setRollerTypeFilter] = useState<string>('all')

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const data = await childPartTemplateService.getAll()
      setTemplates(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load child part templates'
      toast.error(message)
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTemplates()
  }, [])

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.templateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.templateCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.drawingNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = typeFilter === 'all' || template.childPartType === typeFilter
    const matchesRollerType = rollerTypeFilter === 'all' || template.rollerType === rollerTypeFilter

    return matchesSearch && matchesType && matchesRollerType
  })

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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          <CardHeader className="pb-3">
            <CardDescription>Total Templates</CardDescription>
            <CardTitle className="text-3xl text-primary">{templates.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          <CardHeader className="pb-3">
            <CardDescription>Active Templates</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {templates.filter(t => t.isActive).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          <CardHeader className="pb-3">
            <CardDescription>Child Part Types</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {new Set(templates.map(t => t.childPartType)).size}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Search Templates</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, code, drawing..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Child Part Type</label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
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
          <div>
            <label className="text-sm font-medium mb-2 block">Roller Type</label>
            <Select value={rollerTypeFilter} onValueChange={setRollerTypeFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rollers</SelectItem>
                <SelectItem value={RollerType.MAGNETIC}>Magnetic Roller</SelectItem>
                <SelectItem value={RollerType.PRINTING}>Printing Roller</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <Link key={template.id} href={`/masters/child-part-templates/${template.id}`}>
            <Card className="h-full border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-lg transition-shadow cursor-pointer hover:border-primary">
              <CardHeader className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{template.templateName}</CardTitle>
                    <CardDescription className="text-xs mt-1 truncate">{template.templateCode}</CardDescription>
                  </div>
                  <div className="flex-shrink-0 w-20">
                    <Badge className={`${getChildPartTypeBadge(template.childPartType)} text-[10px] px-2 py-0.5 block truncate`}>
                      {template.childPartType}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getRollerTypeBadge(template.rollerType)} variant="outline">
                    {template.rollerType}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {template.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {template.description}
                  </p>
                )}

                {template.drawingNumber && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground truncate">
                      {template.drawingNumber} {template.drawingRevision && `(${template.drawingRevision})`}
                    </span>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {template.isPurchased ? 'Purchased Part' : 'Manufactured Part'}
                    </span>
                  </div>
                  {template.processTemplateId && (
                    <div className="flex items-center gap-2 text-sm">
                      <Wrench className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Process Template Linked
                      </span>
                    </div>
                  )}
                  {(template.length || template.diameter) && (
                    <div className="flex items-center gap-2 text-sm">
                      <Ruler className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {template.length && `L: ${template.length}${template.dimensionUnit}`}
                        {template.length && template.diameter && ' × '}
                        {template.diameter && `Ø ${template.diameter}${template.dimensionUnit}`}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <Badge variant={template.isActive ? "default" : "secondary"}>
                    {template.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(template.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-12">
          <div className="text-center">
            <Wrench className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No templates found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || typeFilter !== 'all' || rollerTypeFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first child part template'}
            </p>
            {!searchQuery && typeFilter === 'all' && rollerTypeFilter === 'all' && (
              <Button asChild>
                <Link href="/masters/child-part-templates/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Template
                </Link>
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Floating Action Button */}
      <Button asChild>
        <Link
          href="/masters/child-part-templates/create"
          className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50 flex items-center justify-center"
        >
          <Plus className="h-6 w-6" />
        </Link>
      </Button>
    </div>
  )
}
