"use client"

import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Eye } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { mockMaterialCategories } from '@/lib/mock-data'
import { MaterialCategory } from '@/types'
import { simulateApiCall } from '@/lib/utils/mock-api'

export default function MaterialCategoriesPage() {
  const [categories, setCategories] = useState<MaterialCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    setLoading(true)
    const data = await simulateApiCall(mockMaterialCategories, 800)
    setCategories(data)
    setLoading(false)
  }

  const filteredCategories = categories.filter(
    (category) =>
      category.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.categoryCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeCount = categories.filter(c => c.isActive).length
  const rawMaterialCount = categories.filter(c => c.materialType === 'raw_material').length
  const componentCount = categories.filter(c => c.materialType === 'component').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="sr-only">Material Categories</h1>
        <Link href="/masters/material-categories/create" className="ml-auto">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Categories</CardDescription>
            <CardTitle className="text-3xl">{categories.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-3xl text-green-600">{activeCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Raw Materials</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{rawMaterialCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Components</CardDescription>
            <CardTitle className="text-3xl text-purple-600">{componentCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, code, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category Code</TableHead>
                  <TableHead>Category Name</TableHead>
                  <TableHead>Quality</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Default UOM</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No categories found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.categoryCode}</TableCell>
                      <TableCell>{category.categoryName}</TableCell>
                      <TableCell>{category.quality}</TableCell>
                      <TableCell className="max-w-xs truncate">{category.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{category.defaultUOM.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={category.materialType === 'raw_material' ? 'default' : 'secondary'}
                        >
                          {category.materialType === 'raw_material' ? 'Raw Material' : 'Component'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={category.isActive ? 'default' : 'destructive'}
                        >
                          {category.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/masters/material-categories/${category.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/masters/material-categories/${category.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
