"use client"

import { useState, useEffect } from 'react'
import { Plus, Search, Package, ListTree } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { mockProductTemplates } from '@/lib/mock-data'
import { simulateApiCall } from '@/lib/utils/mock-api'
import { ProductTemplate, RollerType } from '@/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function ProductTemplatesPage() {
  const [templates, setTemplates] = useState<ProductTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setLoading(true)
    const data = await simulateApiCall(mockProductTemplates, 800)
    setTemplates(data)
    setLoading(false)
  }

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.templateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.templateCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = typeFilter === 'all' || template.rollerType === typeFilter

    return matchesSearch && matchesType
  })

  const getRollerTypeBadge = (type: RollerType) => {
    const colors: Record<RollerType, string> = {
      [RollerType.MAGNETIC]: 'bg-blue-100 text-blue-800',
      [RollerType.ANILOX]: 'bg-green-100 text-green-800',
      [RollerType.RUBBER]: 'bg-purple-100 text-purple-800',
      [RollerType.PRINTING]: 'bg-orange-100 text-orange-800',
      [RollerType.IDLER]: 'bg-yellow-100 text-yellow-800',
      [RollerType.EMBOSSING]: 'bg-pink-100 text-pink-800',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="sr-only">Product Templates</h1>
        <Button asChild className="ml-auto">
          <Link href="/masters/product-templates/create">
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
            <CardTitle className="text-3xl text-primary">{templates.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Templates</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {templates.filter(t => t.isActive).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Roller Types</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {new Set(templates.map(t => t.rollerType)).size}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Search Templates</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, code, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Filter by Type</label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value={RollerType.MAGNETIC}>Magnetic Roller</SelectItem>
                <SelectItem value={RollerType.ANILOX}>Anilox Roller</SelectItem>
                <SelectItem value={RollerType.RUBBER}>Rubber Roller</SelectItem>
                <SelectItem value={RollerType.PRINTING}>Printing Roller</SelectItem>
                <SelectItem value={RollerType.IDLER}>Idler Roller</SelectItem>
                <SelectItem value={RollerType.EMBOSSING}>Embossing Roller</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <Link key={template.id} href={`/masters/product-templates/${template.id}`}>
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer hover:border-primary">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{template.templateName}</CardTitle>
                    <CardDescription className="text-xs mt-1">{template.templateCode}</CardDescription>
                  </div>
                  <Badge className={getRollerTypeBadge(template.rollerType)}>
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

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {template.childParts.length} Child Parts
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <ListTree className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground truncate">
                      {template.processTemplateName}
                    </span>
                  </div>
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
        <Card className="p-12">
          <div className="text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No templates found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || typeFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first product template'}
            </p>
            {!searchQuery && typeFilter === 'all' && (
              <Button asChild>
                <Link href="/masters/product-templates/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Template
                </Link>
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
