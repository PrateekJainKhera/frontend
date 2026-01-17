"use client"

import { useState, useEffect } from 'react'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { mockProducts } from '@/lib/mock-data'
import { simulateApiCall } from '@/lib/utils/mock-api'
import { Product } from '@/types'
import { ProductsTable } from '@/components/tables/products-table'
import { CreateProductDialog } from '@/components/forms/create-product-dialog'

export function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
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

  return (
    <div className="space-y-6">
      {/* Search & Filters */}
      <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by part code, customer, model, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </Card>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : (
        <ProductsTable products={filteredProducts} onUpdate={loadProducts} />
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
