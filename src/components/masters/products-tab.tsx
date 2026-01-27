"use client"

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { mockProducts } from '@/lib/mock-data'
import { simulateApiCall } from '@/lib/utils/mock-api'
import { Product } from '@/types'
import { ProductsDataGrid } from '@/components/tables/products-data-grid'
import { CreateProductDialog } from '@/components/forms/create-product-dialog'

interface ProductsTabProps {
  searchQuery?: string
}

export function ProductsTab({ searchQuery = '' }: ProductsTabProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    setLoading(true)
    const data = await simulateApiCall(mockProducts, 800)
    setProducts(data)
    setLoading(false)
  }

  const filteredProducts = products.filter(
    (product) =>
      product.partCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.modelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.rollerType.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get unique roller types for stats
  const rollerTypes = [...new Set(products.map(p => p.rollerType))]

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardDescription>Total Products</CardDescription>
            <CardTitle className="text-2xl">{products.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardDescription>Roller Types</CardDescription>
            <CardTitle className="text-2xl text-blue-600">{rollerTypes.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardDescription>With Drawings</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {products.filter(p => p.drawingNo).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardDescription>Search Results</CardDescription>
            <CardTitle className="text-2xl">{filteredProducts.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Data Grid Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : (
        <ProductsDataGrid products={filteredProducts} onUpdate={loadProducts} />
      )}

      {/* Create Dialog */}
      <CreateProductDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={loadProducts}
      />

      {/* Floating Action Button */}
      <Button
        onClick={() => setIsCreateDialogOpen(true)}
        className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  )
}
