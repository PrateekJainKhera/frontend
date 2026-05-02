'use client'

import { useState, useEffect } from 'react'
import { Package, CheckCircle2, AlertTriangle, Layers, Link } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Product } from '@/types/product'
import { productTemplateService, ProductTemplateResponse } from '@/lib/api/product-templates'
import { productService } from '@/lib/api/products'
import { toast } from 'sonner'

interface ProductBOMDialogProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onLinked?: () => void
}

export function ProductBOMDialog({ product, open, onOpenChange, onLinked }: ProductBOMDialogProps) {
  const [loading, setLoading] = useState(false)
  const [template, setTemplate] = useState<ProductTemplateResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [allTemplates, setAllTemplates] = useState<ProductTemplateResponse[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [linking, setLinking] = useState(false)

  useEffect(() => {
    if (!open || !product) return
    setTemplate(null)
    setError(null)
    setSelectedTemplateId('')

    if (product.productTemplateId) {
      setLoading(true)
      productTemplateService.getById(product.productTemplateId)
        .then(setTemplate)
        .catch(err => setError(err instanceof Error ? err.message : 'Failed to load template'))
        .finally(() => setLoading(false))
    } else {
      productTemplateService.getAll().then(setAllTemplates).catch(console.error)
    }
  }, [open, product])

  const handleLinkTemplate = async () => {
    if (!product || !selectedTemplateId) return
    setLinking(true)
    try {
      await productService.update(product.id, {
        id: product.id,
        partCode: product.partCode,
        customerName: product.customerName,
        modelId: product.modelId,
        rollerType: product.rollerType,
        diameter: product.diameter,
        length: product.length,
        materialGrade: product.materialGrade,
        numberOfTeeth: product.numberOfTeeth,
        surfaceFinish: product.surfaceFinish,
        hardness: product.hardness,
        drawingNo: product.drawingNo,
        revisionNo: product.revisionNo,
        revisionDate: product.revisionDate,
        processTemplateId: product.processTemplateId,
        productTemplateId: Number(selectedTemplateId),
        assemblyDrawingId: product.assemblyDrawingId,
      })
      toast.success('Product template linked successfully')
      onLinked?.()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to link template')
    } finally {
      setLinking(false)
    }
  }

  if (!product) return null

  const hasTemplate = !!product.productTemplateId

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[70vw] h-[85vh] flex flex-col p-0">

        {/* Sticky Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Package className="h-6 w-6" />
            Bill of Materials
          </DialogTitle>
          <DialogDescription className="mt-1">
            <span className="font-semibold text-foreground">{product.partCode}</span>
            {' · '}{product.modelName}{' · '}{product.rollerType}
            {(product.numberOfTeeth ?? 0) > 0 && ` · ${product.numberOfTeeth}T`}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="space-y-5 mt-5">

            {/* Template Status Card */}
            <div className={`flex items-start gap-4 p-4 rounded-lg border-2 ${
              hasTemplate ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'
            }`}>
              <div className="mt-0.5">
                {hasTemplate
                  ? <CheckCircle2 className="h-6 w-6 text-green-600" />
                  : <AlertTriangle className="h-6 w-6 text-orange-500" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-sm">Product Template</p>
                  {hasTemplate
                    ? <Badge variant="outline" className="border-green-600 text-green-700">Linked</Badge>
                    : <Badge variant="outline" className="border-orange-500 text-orange-600">Not Linked</Badge>
                  }
                </div>

                {hasTemplate ? (
                  loading
                    ? <Skeleton className="h-4 w-64" />
                    : template
                      ? <p className="text-sm text-muted-foreground">
                          {template.templateName}
                          <span className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded">{template.templateCode}</span>
                        </p>
                      : <p className="text-sm text-muted-foreground">ID: {product.productTemplateId}</p>
                ) : (
                  <div className="space-y-3 mt-2">
                    <p className="text-sm text-orange-700">
                      No template linked. Select one to enable job card generation for this product.
                    </p>
                    <div className="flex gap-2 items-center">
                      <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                        <SelectTrigger className="flex-1 bg-white">
                          <SelectValue placeholder="Select a product template..." />
                        </SelectTrigger>
                        <SelectContent>
                          {allTemplates.map(t => (
                            <SelectItem key={t.id} value={String(t.id)}>
                              {t.templateName} ({t.templateCode})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        disabled={!selectedTemplateId || linking}
                        onClick={handleLinkTemplate}
                        className="shrink-0"
                      >
                        <Link className="h-4 w-4 mr-1.5" />
                        {linking ? 'Linking...' : 'Link Template'}
                      </Button>
                    </div>
                    {allTemplates.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        No product templates available. Create one in Masters → Product Templates first.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Process Template */}
            {template && (
              <div className="flex items-center gap-4 p-4 rounded-lg border bg-blue-50 border-blue-200">
                <Layers className="h-6 w-6 text-blue-600 shrink-0" />
                <div>
                  <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Process Template</p>
                  <p className="font-semibold text-sm mt-0.5">{template.processTemplateName}</p>
                </div>
              </div>
            )}

            {/* BOM Table */}
            {hasTemplate && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-base">
                    Bill of Materials
                    {template && (
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        ({template.bomItems.length} {template.bomItems.length === 1 ? 'part' : 'parts'})
                      </span>
                    )}
                  </h3>
                </div>

                {loading && (
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 w-full" />)}
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 p-4 border border-red-200 bg-red-50 rounded-lg text-red-700 text-sm">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                {template && template.bomItems.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No BOM items configured</p>
                    <p className="text-sm mt-1">Add child parts to this product template in Masters</p>
                  </div>
                )}

                {template && template.bomItems.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted border-b">
                          <th className="text-left px-4 py-3 font-semibold text-muted-foreground w-12">#</th>
                          <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Child Part</th>
                          <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Type</th>
                          <th className="text-center px-4 py-3 font-semibold text-muted-foreground w-20">Qty</th>
                          <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {template.bomItems.map((item, idx) => (
                          <tr key={item.childPartTemplateId} className="hover:bg-muted/40 transition-colors">
                            <td className="px-4 py-3 text-muted-foreground font-medium">{idx + 1}</td>
                            <td className="px-4 py-3 font-semibold">{item.childPartTemplateName}</td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className="text-xs font-mono">{item.childPartType}</Badge>
                            </td>
                            <td className="px-4 py-3 text-center font-semibold">{item.quantity}</td>
                            <td className="px-4 py-3">
                              {item.isPurchased ? (
                                <Badge variant="secondary" className="text-xs">Purchased</Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs border-blue-400 text-blue-700 bg-blue-50">
                                  Manufactured
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
