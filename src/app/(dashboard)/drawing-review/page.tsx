'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { FileText, CheckCircle2, Clock, AlertTriangle, Eye, Upload, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { productService } from '@/lib/api/products'
import { Product } from '@/types/product'
import { formatDate } from '@/lib/utils/formatters'

export default function DrawingReviewDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRollerType, setFilterRollerType] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')

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

  const rollerTypes = useMemo(() =>
    [...new Set(products.map(p => p.rollerType).filter(Boolean))].sort() as string[]
  , [products])

  const visibleProducts = useMemo(() => {
    let result = [...products]

    // Text search
    const q = searchQuery.toLowerCase()
    if (q) {
      result = result.filter(p =>
        p.partCode.toLowerCase().includes(q) ||
        (p.customerName ?? '').toLowerCase().includes(q) ||
        (p.modelName ?? '').toLowerCase().includes(q) ||
        (p.rollerType ?? '').toLowerCase().includes(q) ||
        String(p.numberOfTeeth ?? '').includes(q)
      )
    }

    // Roller type filter
    if (filterRollerType) {
      result = result.filter(p => p.rollerType === filterRollerType)
    }

    // Date from filter
    if (filterDateFrom) {
      const from = new Date(filterDateFrom)
      result = result.filter(p => new Date(p.createdAt) >= from)
    }

    // Sort newest first; use id as tiebreaker when dates are equal (higher id = newer row)
    result.sort((a, b) => {
      const da = new Date(a.createdAt).getTime()
      const db = new Date(b.createdAt).getTime()
      if (!isNaN(db - da) && db !== da) return db - da
      return b.id - a.id
    })

    return result
  }, [products, searchQuery, filterRollerType, filterDateFrom])

  const hasFilters = !!(searchQuery || filterRollerType || filterDateFrom)

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

  // Shared product row renderer
  const renderRow = (product: Product) => {
    const isPending = product.drawingReviewStatus === 'Pending'
    const isUnderReview = product.drawingReviewStatus === 'UnderReview'
    const isApproved = product.drawingReviewStatus === 'Approved'
    const needsAttention = product.drawingReviewStatus === 'RevisionRequired' || product.drawingReviewStatus === 'Rejected'

    return (
      <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <p className="font-semibold font-mono">{product.partCode}</p>
            {getStatusBadge(product.drawingReviewStatus)}
            {isApproved && product.assemblyDrawingId && (
              <Badge variant="secondary" className="text-xs">Drawings Linked</Badge>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-x-6 gap-y-1 mt-2 text-sm">
            <div><span className="text-muted-foreground">Customer: </span>{product.customerName}</div>
            <div><span className="text-muted-foreground">Model: </span>{product.modelName}</div>
            <div><span className="text-muted-foreground">Type: </span>{product.rollerType}</div>
            <div><span className="text-muted-foreground">Teeth: </span>{product.numberOfTeeth > 0 ? product.numberOfTeeth : '—'}</div>
            <div><span className="text-muted-foreground">Created: </span>{formatDate(product.createdAt)}</div>
            {(needsAttention || isUnderReview) && product.drawingReviewNotes && (
              <div className="col-span-2 md:col-span-5">
                <span className={`text-xs ${needsAttention ? 'text-orange-700' : 'text-muted-foreground'}`}>
                  Notes: {product.drawingReviewNotes}
                </span>
              </div>
            )}
            {isApproved && product.drawingReviewedBy && (
              <div className="col-span-2 md:col-span-5 text-xs text-muted-foreground">
                Reviewed by: {product.drawingReviewedBy}
              </div>
            )}
          </div>
        </div>
        <div className="ml-4 shrink-0">
          {isPending ? (
            <Link href={`/drawing-review/products/${product.id}/upload-drawings`}>
              <Button size="sm">
                <Upload className="mr-2 h-4 w-4" />
                Upload Drawing
              </Button>
            </Link>
          ) : isUnderReview ? (
            <Link href={`/drawing-review/products/${product.id}`}>
              <Button size="sm" variant="outline">
                <Eye className="mr-2 h-4 w-4" />
                Review & Approve
              </Button>
            </Link>
          ) : (
            // Approved / Rejected / Revision Required — allow viewing AND changing the drawing.
            // Re-uploading + re-submitting moves it back to "Under Review" for re-approval.
            <div className="flex items-center gap-2">
              <Link href={`/drawing-review/products/${product.id}`}>
                <Button size="sm" variant="outline">
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Button>
              </Link>
              <Link href={`/drawing-review/products/${product.id}/upload-drawings`}>
                <Button size="sm" variant={isApproved ? 'outline' : 'default'}>
                  <Upload className="mr-2 h-4 w-4" />
                  {isApproved ? 'Change Drawing' : 'Re-upload'}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    )
  }

  const emptyState = (icon: React.ReactNode, msg: string) => (
    <div className="text-center py-12 text-muted-foreground">
      <div className="flex justify-center mb-3">{icon}</div>
      <p className="text-sm">{msg}</p>
    </div>
  )

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">

        {/* Row 1: Tabs + Search (matches masters/products pattern) */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList className="grid grid-cols-5 max-w-2xl">
            <TabsTrigger value="all">All ({visibleProducts.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({stats.totalPending})</TabsTrigger>
            <TabsTrigger value="under-review">Under Review ({stats.underReview})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
            <TabsTrigger value="attention">Needs Attention ({stats.revisionRequired})</TabsTrigger>
          </TabsList>

          {/* Search bar — same style as masters/products */}
          <div className="flex items-center gap-2 bg-background border-2 border-border rounded-lg px-4 py-1 shadow-sm flex-1 max-w-sm">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              placeholder="Search part code, customer, model..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="border-0 shadow-none focus:outline-none h-8 px-0 text-sm flex-1 placeholder:text-muted-foreground/40 bg-transparent"
            />
          </div>
        </div>

        {/* Row 2: Extra filters */}
        <div className="flex flex-wrap items-center gap-2">
          <Select value={filterRollerType || 'all'} onValueChange={v => setFilterRollerType(v === 'all' ? '' : v)}>
            <SelectTrigger className="h-9 w-44">
              <SelectValue placeholder="All Roller Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roller Types</SelectItem>
              {rollerTypes.map(rt => (
                <SelectItem key={rt} value={rt}>{rt}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1.5">
            <label className="text-sm text-muted-foreground shrink-0">From</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={e => setFilterDateFrom(e.target.value)}
              className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 gap-1.5 text-muted-foreground border border-dashed"
              onClick={() => { setSearchQuery(''); setFilterRollerType(''); setFilterDateFrom('') }}
            >
              <X className="h-3.5 w-3.5" />
              Clear filters
            </Button>
          )}
        </div>

        {/* All */}
        <TabsContent value="all" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              {visibleProducts.length === 0
                ? emptyState(<FileText className="h-12 w-12 opacity-30" />, 'No products found')
                : <div className="space-y-3">{visibleProducts.map(renderRow)}</div>
              }
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending */}
        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              {pendingReviewProducts.length === 0
                ? emptyState(<CheckCircle2 className="h-12 w-12 text-green-500 opacity-60" />, 'All products have been reviewed — none pending')
                : <div className="space-y-3">{pendingReviewProducts.map(renderRow)}</div>
              }
            </CardContent>
          </Card>
        </TabsContent>

        {/* Under Review */}
        <TabsContent value="under-review" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              {underReviewProducts.length === 0
                ? emptyState(<Clock className="h-12 w-12 opacity-30" />, 'No products currently under review')
                : <div className="space-y-3">{underReviewProducts.map(renderRow)}</div>
              }
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approved */}
        <TabsContent value="approved" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              {approvedProducts.length === 0
                ? emptyState(<FileText className="h-12 w-12 opacity-30" />, 'No approved products yet')
                : <div className="space-y-3">{approvedProducts.map(renderRow)}</div>
              }
            </CardContent>
          </Card>
        </TabsContent>

        {/* Needs Attention */}
        <TabsContent value="attention" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              {(revisionRequiredProducts.length + rejectedProducts.length) === 0
                ? emptyState(<AlertTriangle className="h-12 w-12 opacity-30" />, 'No products needing attention')
                : <div className="space-y-3">{[...revisionRequiredProducts, ...rejectedProducts].map(renderRow)}</div>
              }
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  )
}
