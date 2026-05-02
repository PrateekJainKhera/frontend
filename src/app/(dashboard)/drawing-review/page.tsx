'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { FileText, CheckCircle2, Clock, AlertTriangle, Eye, Upload, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { productService } from '@/lib/api/products'
import { Product } from '@/types/product'
import { formatDate } from '@/lib/utils/formatters'

export default function DrawingReviewDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await productService.getAll()
      setProducts(data)
    } catch (err) {
      console.error('Failed to load products:', err)
    }
    setLoading(false)
  }

  const visibleProducts = useMemo(() => {
    const q = searchQuery.toLowerCase()
    if (!q) return products
    return products.filter(p =>
      p.partCode.toLowerCase().includes(q) ||
      (p.customerName ?? '').toLowerCase().includes(q) ||
      (p.modelName ?? '').toLowerCase().includes(q) ||
      (p.rollerType ?? '').toLowerCase().includes(q) ||
      String(p.numberOfTeeth ?? '').includes(q)
    )
  }, [products, searchQuery])

  // Filter products by drawing review status
  const pendingReviewProducts = visibleProducts.filter(product =>
    product.drawingReviewStatus === 'Pending'
  )

  const underReviewProducts = visibleProducts.filter(product =>
    product.drawingReviewStatus === 'UnderReview'
  )

  const revisionRequiredProducts = visibleProducts.filter(product =>
    product.drawingReviewStatus === 'RevisionRequired'
  )

  const rejectedProducts = visibleProducts.filter(product =>
    product.drawingReviewStatus === 'Rejected'
  )

  const approvedProducts = visibleProducts.filter(product =>
    product.drawingReviewStatus === 'Approved'
  )

  // Stats
  const stats = {
    totalPending: pendingReviewProducts.length,
    underReview: underReviewProducts.length,
    revisionRequired: revisionRequiredProducts.length + rejectedProducts.length,
    approved: approvedProducts.length
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Badge variant="outline" className="border-gray-500 text-gray-700">Pending</Badge>
      case 'UnderReview':
        return <Badge variant="outline" className="border-blue-500 text-blue-700">Under Review</Badge>
      case 'Approved':
        return <Badge variant="outline" className="border-green-500 text-green-700">Approved</Badge>
      case 'Rejected':
        return <Badge variant="outline" className="border-red-500 text-red-700">Rejected</Badge>
      case 'RevisionRequired':
        return <Badge variant="outline" className="border-orange-500 text-orange-700">Revision Required</Badge>
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Product Drawing Review</h1>
          <p className="text-muted-foreground mt-1">
            Manage and approve product drawings before production planning
          </p>
        </div>
        <div className="relative shrink-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search part code, customer, model..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex h-9 w-64 rounded-md border border-input bg-background px-3 py-1 pl-8 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <AlertTriangle className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPending}</div>
            <p className="text-xs text-muted-foreground">Awaiting drawing upload</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.underReview}</div>
            <p className="text-xs text-muted-foreground">Currently reviewing</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.revisionRequired}</div>
            <p className="text-xs text-muted-foreground">Revision/Rejected</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">Ready for planning</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Review Products */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Products Pending Drawing Review</CardTitle>
              <CardDescription>
                Products awaiting drawing upload and linkage
              </CardDescription>
            </div>
            <Badge variant="outline">
              {pendingReviewProducts.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {pendingReviewProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-600" />
              <p>All products have been reviewed!</p>
              <p className="text-sm mt-1">No products awaiting drawing review</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingReviewProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold">{product.partCode}</p>
                      {getStatusBadge(product.drawingReviewStatus)}
                    </div>
                    <div className="grid grid-cols-5 gap-4 mt-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Customer:</span>
                        <span className="ml-2">{product.customerName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Model:</span>
                        <span className="ml-2">{product.modelName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Type:</span>
                        <span className="ml-2">{product.rollerType}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">No. of Teeth:</span>
                        <span className="ml-2">{product.numberOfTeeth > 0 ? product.numberOfTeeth : '—'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Created:</span>
                        <span className="ml-2">{formatDate(product.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <Link href={`/drawing-review/products/${product.id}/upload-drawings`}>
                    <Button>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Drawing
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Under Review Products */}
      {underReviewProducts.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Products Under Review</CardTitle>
                <CardDescription>
                  Currently being reviewed by engineering team
                </CardDescription>
              </div>
              <Badge variant="outline">
                {underReviewProducts.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {underReviewProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold">{product.partCode}</p>
                      {getStatusBadge(product.drawingReviewStatus)}
                    </div>
                    <div className="grid grid-cols-4 gap-4 mt-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Customer:</span>
                        <span className="ml-2">{product.customerName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Model:</span>
                        <span className="ml-2">{product.modelName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Type:</span>
                        <span className="ml-2">{product.rollerType}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">No. of Teeth:</span>
                        <span className="ml-2">{product.numberOfTeeth > 0 ? product.numberOfTeeth : '—'}</span>
                      </div>
                      {product.drawingReviewNotes && (
                        <div className="col-span-4">
                          <span className="text-muted-foreground">Notes:</span>
                          <span className="ml-2 text-xs">{product.drawingReviewNotes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Link href={`/drawing-review/products/${product.id}`}>
                    <Button variant="outline">
                      <Eye className="mr-2 h-4 w-4" />
                      Review & Approve
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revision Required / Rejected Products */}
      {(revisionRequiredProducts.length > 0 || rejectedProducts.length > 0) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Products Needing Attention</CardTitle>
                <CardDescription>
                  Drawings require modifications or have been rejected
                </CardDescription>
              </div>
              <Badge variant="destructive">
                {revisionRequiredProducts.length + rejectedProducts.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...revisionRequiredProducts, ...rejectedProducts].map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold">{product.partCode}</p>
                      {getStatusBadge(product.drawingReviewStatus)}
                    </div>
                    <div className="grid grid-cols-4 gap-4 mt-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Customer:</span>
                        <span className="ml-2">{product.customerName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Model:</span>
                        <span className="ml-2">{product.modelName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Type:</span>
                        <span className="ml-2">{product.rollerType}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">No. of Teeth:</span>
                        <span className="ml-2">{product.numberOfTeeth > 0 ? product.numberOfTeeth : '—'}</span>
                      </div>
                      {product.drawingReviewNotes && (
                        <div className="col-span-4">
                          <span className="text-muted-foreground">Revision Notes:</span>
                          <span className="ml-2 text-xs text-orange-700">{product.drawingReviewNotes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Link href={`/drawing-review/products/${product.id}`}>
                    <Button variant="outline">
                      View Details
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recently Approved Products */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recently Approved Products</CardTitle>
              <CardDescription>
                Drawings approved and ready for production planning
              </CardDescription>
            </div>
            <Badge variant="outline">
              {approvedProducts.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {approvedProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3" />
              <p>No approved products yet</p>
              <p className="text-sm mt-1">Review and approve products above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {approvedProducts.slice(0, 10).map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold">{product.partCode}</p>
                      <Badge variant="outline">{product.customerName}</Badge>
                      {getStatusBadge(product.drawingReviewStatus)}
                      {product.assemblyDrawingId && (
                        <Badge variant="secondary" className="text-xs">
                          Drawings Linked
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-4 mt-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Model:</span>
                        <span className="ml-2">{product.modelName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Type:</span>
                        <span className="ml-2">{product.rollerType}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">No. of Teeth:</span>
                        <span className="ml-2">{product.numberOfTeeth > 0 ? product.numberOfTeeth : '—'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Reviewed By:</span>
                        <span className="ml-2">{product.drawingReviewedBy || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/drawing-review/products/${product.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
