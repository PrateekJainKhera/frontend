"use client"

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ArrowLeft, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Product, ProductBOM } from '@/types'
import { mockProducts, mockBOMs } from '@/lib/mock-data'
import { simulateApiCall } from '@/lib/utils/mock-api'
import { ViewBOMDialog } from '@/components/dialogs/view-bom-dialog'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [bom, setBom] = useState<ProductBOM | null>(null)
  const [loading, setLoading] = useState(true)
  const [bomDialogOpen, setBomDialogOpen] = useState(false)

  useEffect(() => {
    loadProductAndBOM()
  }, [params.id])

  const loadProductAndBOM = async () => {
    setLoading(true)
    const foundProduct = mockProducts.find(p => p.id === params.id)
    const foundBom = mockBOMs.find(b => b.productId === params.id && b.isActive)

    const productData = await simulateApiCall(foundProduct || null, 500)
    const bomData = await simulateApiCall(foundBom || null, 500)

    setProduct(productData)
    setBom(bomData)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Product not found</p>
        <Button onClick={() => router.push('/masters/products')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/masters/products')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary">{product.partCode}</h1>
            <p className="text-muted-foreground">{product.customerName}</p>
          </div>
        </div>
      </div>

      {/* Product Details */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Product Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Model Name</p>
            <p className="font-semibold">{product.modelName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Roller Type</p>
            <Badge>{product.rollerType}</Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Material Grade</p>
            <p className="font-semibold">{product.materialGrade}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Diameter</p>
            <p className="font-semibold">{product.diameter} mm</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Length</p>
            <p className="font-semibold">{product.length} mm</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Drawing No</p>
            <p className="font-semibold font-mono">{product.drawingNo}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Revision No</p>
            <p className="font-semibold">{product.revisionNo}</p>
          </div>
          {product.numberOfTeeth && (
            <div>
              <p className="text-sm text-muted-foreground">Number of Teeth</p>
              <p className="font-semibold">{product.numberOfTeeth}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Surface Finish</p>
            <p className="font-semibold">{product.surfaceFinish}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Hardness</p>
            <p className="font-semibold">{product.hardness}</p>
          </div>
        </div>
      </Card>

      {/* Bill of Materials Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Package className="h-5 w-5" />
            Bill of Materials
          </h2>
          {bom && (
            <Button onClick={() => setBomDialogOpen(true)}>
              View Full BOM
            </Button>
          )}
        </div>

        {bom ? (
          <div>
            <div className="flex items-center gap-4 mb-4">
              <Badge className="bg-blue-100 text-blue-700">
                Version {bom.bomVersion}
              </Badge>
              {bom.isActive && (
                <Badge className="bg-green-100 text-green-700">Active</Badge>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 bg-blue-50 border-blue-200">
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold text-blue-700">{bom.bomItems.length}</p>
              </Card>
              <Card className="p-4 bg-purple-50 border-purple-200">
                <p className="text-sm text-muted-foreground">Components</p>
                <p className="text-2xl font-bold text-purple-700">
                  {bom.bomItems.filter(i => i.itemType === 'COMPONENT').length}
                </p>
              </Card>
              <Card className="p-4 bg-orange-50 border-orange-200">
                <p className="text-sm text-muted-foreground">Raw Materials</p>
                <p className="text-2xl font-bold text-orange-700">
                  {bom.bomItems.filter(i => i.itemType === 'RAW_MATERIAL').length}
                </p>
              </Card>
            </div>

            {bom.notes && (
              <div className="mt-4 p-4 bg-muted rounded">
                <p className="text-sm font-semibold">BOM Notes</p>
                <p className="text-sm text-muted-foreground mt-1">{bom.notes}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No BOM configured for this product</p>
          </div>
        )}
      </Card>

      {/* View BOM Dialog */}
      {bom && (
        <ViewBOMDialog
          bom={bom}
          open={bomDialogOpen}
          onOpenChange={setBomDialogOpen}
          productName={`${product.partCode} - ${product.customerName}`}
        />
      )}
    </div>
  )
}
