"use client"

import { BOMItem, BOMRequirement } from '@/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Package, Layers, AlertCircle, CheckCircle } from 'lucide-react'

interface BOMTableProps {
  bomItems: BOMItem[] | BOMRequirement[]
  showStockInfo?: boolean
}

const getItemTypeBadge = (type: 'COMPONENT' | 'RAW_MATERIAL') => {
  if (type === 'COMPONENT') {
    return (
      <Badge className="bg-blue-100 text-blue-700">
        <Package className="mr-1 h-3 w-3" />
        Component
      </Badge>
    )
  }
  return (
    <Badge className="bg-purple-100 text-purple-700">
      <Layers className="mr-1 h-3 w-3" />
      Raw Material
    </Badge>
  )
}

const isRequirement = (item: BOMItem | BOMRequirement): item is BOMRequirement => {
  return 'requiredQty' in item && 'currentStock' in item && 'shortfall' in item
}

export function BOMTable({ bomItems, showStockInfo = false }: BOMTableProps) {
  if (bomItems.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No BOM items found</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Item Code</TableHead>
            <TableHead>Item Name</TableHead>
            <TableHead className="text-right">Qty/Unit</TableHead>
            <TableHead>Unit</TableHead>
            {showStockInfo && (
              <>
                <TableHead className="text-right">Required</TableHead>
                <TableHead className="text-right">In Stock</TableHead>
                <TableHead className="text-right">Shortfall</TableHead>
              </>
            )}
            <TableHead>Approval</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bomItems.map((item) => {
            const hasShortfall = isRequirement(item) && item.shortfall > 0

            return (
              <TableRow key={item.id} className={hasShortfall ? 'bg-amber-50' : ''}>
                <TableCell>
                  {getItemTypeBadge(item.itemType)}
                </TableCell>
                <TableCell className="font-mono font-semibold">
                  {item.itemCode}
                </TableCell>
                <TableCell className="max-w-xs">
                  <div className="truncate">{item.itemName}</div>
                  {item.isOptional && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      Optional
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {item.quantity}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {item.unit}
                </TableCell>
                {showStockInfo && isRequirement(item) && (
                  <>
                    <TableCell className="text-right font-semibold">
                      {item.requiredQty.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={item.currentStock < item.requiredQty ? 'text-amber-600' : 'text-green-600'}>
                        {item.currentStock.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.shortfall > 0 ? (
                        <span className="text-amber-600 font-semibold flex items-center justify-end gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {item.shortfall.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-green-600 flex items-center justify-end gap-1">
                          <CheckCircle className="h-4 w-4" />
                          0
                        </span>
                      )}
                    </TableCell>
                  </>
                )}
                <TableCell>
                  {item.approvalRequired ? (
                    <div>
                      <Badge className="bg-orange-100 text-orange-700">
                        Approval Required
                      </Badge>
                      {item.approvedSuppliers && item.approvedSuppliers.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Approved: {item.approvedSuppliers.join(', ')}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Not Required
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="max-w-xs">
                  {item.notes ? (
                    <span className="text-sm text-muted-foreground truncate block">
                      {item.notes}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
