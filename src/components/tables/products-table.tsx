"use client"

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
import { Edit, Eye } from 'lucide-react'
import { formatDate } from '@/lib/utils/formatters'

interface ProductsTableProps {
  products: Product[]
}

export function ProductsTable({ products }: ProductsTableProps) {
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
              <TableCell className="max-w-[200px] truncate">
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
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
