"use client"

import { useState, useEffect, useMemo } from 'react'
import { Plus, PackageSearch } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Product } from '@/types'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { MachineModel } from '@/types/machine-model'
import { machineModelService } from '@/lib/api/machine-models'
import { productService } from '@/lib/api/products'
import { toast } from 'sonner'
import { CreateProductDialog } from '@/components/forms/create-product-dialog'

const ALL_TEETH = '__all__'

interface ProductSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectProduct: (product: Product) => void
  excludedProductIds?: number[]
}

export function ProductSearchDialog({
  open,
  onOpenChange,
  onSelectProduct,
  excludedProductIds = [],
}: ProductSearchDialogProps) {
  const [machineModels, setMachineModels] = useState<MachineModel[]>([])

  // Progressive filter state
  const [modelId, setModelId] = useState('')
  const [rollerType, setRollerType] = useState('')
  const [teeth, setTeeth] = useState(ALL_TEETH)

  // All products for the selected model (fetched once per model, filtered client-side)
  const [modelProducts, setModelProducts] = useState<Product[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)

  const [createProductDialogOpen, setCreateProductDialogOpen] = useState(false)
  const [isAddModelDialogOpen, setIsAddModelDialogOpen] = useState(false)
  const [newModelName, setNewModelName] = useState('')
  const [isCreatingModel, setIsCreatingModel] = useState(false)

  // Load machine models and roller types on open
  useEffect(() => {
    if (!open) return
    const loadData = async () => {
      try {
        const models = await machineModelService.getAll()
        setMachineModels(models)
      } catch (err) {
        console.error('Failed to load data:', err)
      }
    }
    loadData()
  }, [open])

  // Reset everything when dialog closes
  useEffect(() => {
    if (!open) {
      setModelId('')
      setRollerType('')
      setTeeth(ALL_TEETH)
      setModelProducts([])
    }
  }, [open])

  // When the model changes, fetch ALL products for that model (roller/teeth applied client-side)
  useEffect(() => {
    if (!modelId) {
      setModelProducts([])
      return
    }
    let cancelled = false
    const load = async () => {
      setIsLoadingProducts(true)
      try {
        const results = await productService.searchByCriteria(Number(modelId))
        if (!cancelled) setModelProducts(results)
      } catch (error) {
        if (!cancelled) {
          setModelProducts([])
          toast.error('Failed to load products for this model')
          console.error(error)
        }
      } finally {
        if (!cancelled) setIsLoadingProducts(false)
      }
    }
    load()
    // Reset the downstream filters whenever the model changes
    setRollerType('')
    setTeeth(ALL_TEETH)
    return () => {
      cancelled = true
    }
  }, [modelId])

  // Distinct roller types that actually exist for the selected model
  const rollerOptions = useMemo(() => {
    const distinct = Array.from(
      new Set(modelProducts.map(p => p.rollerType).filter(Boolean))
    ).sort()
    return distinct
  }, [modelProducts])

  // Distinct teeth options for the current model + roller selection
  const teethOptions = useMemo(() => {
    const relevant = rollerType
      ? modelProducts.filter(p => p.rollerType === rollerType)
      : modelProducts
    const distinct = Array.from(
      new Set(relevant.map(p => p.numberOfTeeth ?? 0))
    ).sort((a, b) => a - b)
    return distinct
  }, [modelProducts, rollerType])

  // If the selected teeth value is no longer available after a roller change, reset to "All"
  useEffect(() => {
    if (teeth !== ALL_TEETH && !teethOptions.includes(Number(teeth))) {
      setTeeth(ALL_TEETH)
    }
  }, [teethOptions, teeth])

  // Apply progressive filters
  const availableResults = useMemo(() => {
    return modelProducts.filter(p => {
      if (excludedProductIds.includes(p.id)) return false
      if (rollerType && p.rollerType !== rollerType) return false
      if (teeth !== ALL_TEETH && (p.numberOfTeeth ?? 0) !== Number(teeth)) return false
      return true
    })
  }, [modelProducts, rollerType, teeth, excludedProductIds])

  const handleSelectProduct = (product: Product) => {
    onSelectProduct(product)
    toast.success(`Added ${product.partCode} to order`)
  }

  const handleProductCreated = (createdProduct?: Product) => {
    if (createdProduct) {
      setCreateProductDialogOpen(false)
      onSelectProduct(createdProduct)
      // Refresh the model's product list so the new part appears in results
      if (modelId) {
        productService
          .searchByCriteria(Number(modelId))
          .then(setModelProducts)
          .catch(() => {})
      }
    }
  }

  const handleCreateMachineModel = async () => {
    if (!newModelName.trim()) {
      toast.error('Model name is required')
      return
    }
    setIsCreatingModel(true)
    try {
      const newModelId = await machineModelService.create({ modelName: newModelName })
      toast.success(`Machine model "${newModelName}" created successfully`)
      const updatedModels = await machineModelService.getAll()
      setMachineModels(updatedModels)
      setModelId(newModelId.toString())
      setIsAddModelDialogOpen(false)
      setNewModelName('')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create machine model'
      toast.error(message)
    } finally {
      setIsCreatingModel(false)
    }
  }

  const selectedModelName = machineModels.find(m => m.id.toString() === modelId)?.modelName

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Search Products</DialogTitle>
            <DialogDescription>
              Pick a machine model to see all its variants, then narrow by roller type and teeth.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Progressive filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Machine Model (required) */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label>Machine Model *</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddModelDialogOpen(true)}
                    title="Add new machine model"
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground -mt-0.5"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add
                  </Button>
                </div>
                <SearchableSelect
                  options={machineModels.map((model) => ({
                    value: model.id.toString(),
                    label: model.modelName,
                  }))}
                  value={modelId}
                  onChange={setModelId}
                  placeholder="Select model"
                  searchPlaceholder="Search model..."
                  emptyText="No model found."
                />
              </div>

              {/* Roller Type (optional) */}
              <div className="flex flex-col gap-2">
                <Label className={modelId ? '' : 'text-muted-foreground'}>Roller Type</Label>
                <SearchableSelect
                  options={[
                    { value: '', label: 'All roller types' },
                    ...rollerOptions.map((rt) => ({
                      value: rt,
                      label: rt,
                    })),
                  ]}
                  value={rollerType}
                  onChange={setRollerType}
                  placeholder="All roller types"
                  searchPlaceholder="Search roller type..."
                  emptyText="No roller type found."
                  disabled={!modelId}
                />
              </div>

              {/* Number of Teeth (optional) */}
              <div className="flex flex-col gap-2">
                <Label className={modelId ? '' : 'text-muted-foreground'}>Number of Teeth</Label>
                <SearchableSelect
                  options={[
                    { value: ALL_TEETH, label: 'All teeth' },
                    ...teethOptions.map((t) => ({
                      value: t.toString(),
                      label: t > 0 ? `${t} teeth` : 'No teeth',
                    })),
                  ]}
                  value={teeth}
                  onChange={setTeeth}
                  placeholder="All teeth"
                  searchPlaceholder="Search teeth..."
                  emptyText="No teeth found."
                  disabled={!modelId}
                />
              </div>
            </div>

            {/* Results */}
            {!modelId ? (
              <div className="text-center py-10 text-muted-foreground">
                <PackageSearch className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Select a machine model to view its products.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-sm">
                    {isLoadingProducts
                      ? 'Loading products...'
                      : `Products (${availableResults.length})`}
                  </h3>
                  {/* + New Product pinned at the top of results */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCreateProductDialogOpen(true)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    New Product
                  </Button>
                </div>

                {!isLoadingProducts && availableResults.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">
                      No products found for the selected filters. Use “New Product” to add one.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {availableResults.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{product.partCode}</p>
                          <p className="text-xs text-muted-foreground">
                            {[
                              product.modelName,
                              product.rollerType,
                              product.numberOfTeeth && product.numberOfTeeth > 0
                                ? `${product.numberOfTeeth} teeth`
                                : null,
                            ]
                              .filter(Boolean)
                              .join(' • ')}
                          </p>
                          {(product.diameter || product.length || product.materialGrade) && (
                            <p className="text-xs text-muted-foreground">
                              {[
                                product.diameter && product.length
                                  ? `⌀${product.diameter}mm × ${product.length}mm`
                                  : null,
                                product.materialGrade || null,
                              ]
                                .filter(Boolean)
                                .join(' • ')}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleSelectProduct(product)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Product Dialog - Pre-filled with current filter selection */}
      <CreateProductDialog
        open={createProductDialogOpen}
        onOpenChange={setCreateProductDialogOpen}
        onSuccess={handleProductCreated}
        initialModelId={modelId ? Number(modelId) : undefined}
        initialRollerType={rollerType || undefined}
        initialNumberOfTeeth={teeth !== ALL_TEETH ? Number(teeth) : undefined}
      />

      {/* Quick Add Machine Model Dialog */}
      <Dialog open={isAddModelDialogOpen} onOpenChange={setIsAddModelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Machine Model</DialogTitle>
            <DialogDescription>
              Create a new machine model. It will be automatically selected for your search.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="modelName" className="text-sm font-medium">
                Model Name *
              </label>
              <Input
                id="modelName"
                placeholder="e.g., Flexo 8-Color Press"
                value={newModelName}
                onChange={(e) => setNewModelName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleCreateMachineModel()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAddModelDialogOpen(false)
                setNewModelName('')
              }}
              disabled={isCreatingModel}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateMachineModel}
              disabled={isCreatingModel || !newModelName.trim()}
            >
              {isCreatingModel ? 'Creating...' : 'Create Model'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
