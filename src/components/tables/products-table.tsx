"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Product } from '@/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Eye, Package } from 'lucide-react'
import { formatDate } from '@/lib/utils/formatters'
import { ViewProductDialog } from '@/components/dialogs/view-product-dialog'
import { EditProductDialog } from '@/components/dialogs/edit-product-dialog'

interface ProductsTableProps {
  products: Product[]
  onUpdate?: () => void
}

export function ProductsTable({ products, onUpdate }: ProductsTableProps) {
  const router = useRouter()
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const handleView = (product: Product) => {
    setSelectedProduct(product)
    setViewDialogOpen(true)
  }

  const handleEdit = (product: Product) => {
    setSelectedProduct(product)
    setEditDialogOpen(true)
  }

  const handleViewBOM = (productId: string) => {
    router.push(`/masters/products/${productId}`)
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No products found</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Part Code</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Model</TableHead>
            <TableHead>Roller Type</TableHead>
            <TableHead>Dimensions</TableHead>
            <TableHead>Material</TableHead>
            <TableHead>Drawing No</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-mono font-semibold">
                {product.partCode}
              </TableCell>
              <TableCell className="max-w-50 truncate">
                {product.customerName}
              </TableCell>
              <TableCell>{product.modelName}</TableCell>
              <TableCell>
                <Badge variant="outline">{product.rollerType}</Badge>
              </TableCell>
              <TableCell className="text-sm">
                ⌀{product.diameter} × {product.length}mm
              </TableCell>
              <TableCell className="text-sm">
                {product.materialGrade}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {product.drawingNo}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(product.createdAt)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleViewBOM(product.id)} title="View BOM">
                    <Package className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleView(product)} title="View Details">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(product)} title="Edit Product">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Dialogs */}
      {selectedProduct && (
        <>
          <ViewProductDialog
            product={selectedProduct}
            open={viewDialogOpen}
            onOpenChange={setViewDialogOpen}
          />
          <EditProductDialog
            product={selectedProduct}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onSuccess={() => {
              setEditDialogOpen(false)
              onUpdate?.()
            }}
          />
        </>
      )}
    </div>
  )
}
