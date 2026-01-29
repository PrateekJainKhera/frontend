"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { mockMaterialCategories } from '@/lib/mock-data'
import { MaterialCategory } from '@/types'
import { simulateApiCall } from '@/lib/utils/mock-api'

export default function ViewMaterialCategoryPage() {
  const params = useParams()
  const [category, setCategory] = useState<MaterialCategory | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCategory()
  }, [params.id])

  const loadCategory = async () => {
    setLoading(true)
    // Simulate API call
    const allCategories = await simulateApiCall(mockMaterialCategories, 800)
    const found = allCategories.find((c) => c.id === Number(params.id))
    setCategory(found || null)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!category) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/masters/material-categories">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Category Not Found</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center py-8">
              The requested material category could not be found.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/masters/material-categories">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{category.categoryName}</h1>
            <p className="text-muted-foreground">{category.categoryCode}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/masters/material-categories/${category.id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Button variant="destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Category details and identification</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Category Code</p>
              <p className="font-medium">{category.categoryCode}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Category Name</p>
              <p className="font-medium">{category.categoryName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Quality</p>
              <p className="font-medium">{category.quality}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-muted-foreground">Description</p>
              <p className="font-medium">{category.description || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Classification */}
      <Card>
        <CardHeader>
          <CardTitle>Classification</CardTitle>
          <CardDescription>Type and measurement details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Default UOM</p>
              <Badge variant="outline" className="mt-1">
                {category.defaultUOM.toUpperCase()}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Material Type</p>
              <Badge
                variant={category.materialType === 'raw_material' ? 'default' : 'secondary'}
                className="mt-1"
              >
                {category.materialType === 'raw_material' ? 'Raw Material' : 'Component'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
          <CardDescription>Current active status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant={category.isActive ? 'default' : 'destructive'}>
              {category.isActive ? 'Active' : 'Inactive'}
            </Badge>
            <p className="text-sm text-muted-foreground">
              {category.isActive
                ? 'This category is currently active'
                : 'This category is currently inactive'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
          <CardDescription>Creation and modification details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Created At</p>
              <p className="font-medium">{new Date(category.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="font-medium">{new Date(category.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
