"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package, ListTree, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { mockProductTemplates, mockProcessTemplates } from '@/lib/mock-data'
import { simulateApiCall } from '@/lib/utils/mock-api'
import { ProductTemplate, RollerType } from '@/types'

export default function ProductTemplateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [template, setTemplate] = useState<ProductTemplate | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTemplate()
  }, [params.id])

  const loadTemplate = async () => {
    setLoading(true)
    const found = mockProductTemplates.find(t => t.id === params.id)
    const data = await simulateApiCall(found || null, 500)
    setTemplate(data)
    setLoading(false)
  }

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
              The product template you're looking for doesn't exist
            </p>
            <Button asChild>
              <Link href="/masters/product-templates">
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
            <Link href="/masters/product-templates">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary">{template.templateName}</h1>
            <p className="text-muted-foreground">{template.templateCode}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit
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
              <CardDescription>Basic details about this product template</CardDescription>
            </div>
            <Badge className={getRollerTypeBadge(template.rollerType)}>
              {template.rollerType}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {template.description && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
              <p className="text-sm">{template.description}</p>
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
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Last Updated</h3>
              <p className="text-sm">{new Date(template.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Child Parts BOM */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            <div>
              <CardTitle>Child Parts Required</CardTitle>
              <CardDescription>Bill of Materials for this roller type</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="pb-3 text-sm font-medium text-muted-foreground w-12">#</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Part Name</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Part Code</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Quantity</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Unit</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Notes</th>
                </tr>
              </thead>
              <tbody>
                {template.childParts
                  .sort((a, b) => a.sequenceNo - b.sequenceNo)
                  .map((part) => (
                    <tr key={part.id} className="border-b last:border-0">
                      <td className="py-3 text-sm text-muted-foreground">{part.sequenceNo}</td>
                      <td className="py-3 text-sm font-medium">{part.childPartName}</td>
                      <td className="py-3 text-sm text-muted-foreground">
                        {part.childPartCode || '-'}
                      </td>
                      <td className="py-3 text-sm">{part.quantity}</td>
                      <td className="py-3 text-sm text-muted-foreground">{part.unit}</td>
                      <td className="py-3 text-sm text-muted-foreground max-w-xs truncate">
                        {part.notes || '-'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Process Sequence */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ListTree className="h-5 w-5" />
            <div>
              <CardTitle>Manufacturing Process</CardTitle>
              <CardDescription>Linked process template for this roller</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-medium">{template.processTemplateName}</h3>
              <p className="text-sm text-muted-foreground">Process Template ID: {template.processTemplateId}</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/masters/process-templates/${template.processTemplateId}`}>
                View Details
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

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
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Created By</h3>
            <p className="text-sm">{template.createdBy || '-'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
