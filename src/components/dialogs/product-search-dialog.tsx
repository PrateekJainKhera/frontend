"use client"

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Search, Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Product, RollerType } from '@/types'
import { MachineModel } from '@/types/machine-model'
import { machineModelService } from '@/lib/api/machine-models'
import { productService } from '@/lib/api/products'
import { toast } from 'sonner'
import { CreateProductDialog } from '@/components/forms/create-product-dialog'

const searchSchema = z.object({
  modelId: z.string().min(1, 'Machine model is required'),
  rollerType: z.nativeEnum(RollerType),
  numberOfTeeth: z.number().min(1, 'Number of teeth is required'),
})

type SearchFormData = z.infer<typeof searchSchema>

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
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [createProductDialogOpen, setCreateProductDialogOpen] = useState(false)
  const [isAddModelDialogOpen, setIsAddModelDialogOpen] = useState(false)
  const [newModelName, setNewModelName] = useState('')
  const [isCreatingModel, setIsCreatingModel] = useState(false)

  const form = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      modelId: '',
      rollerType: RollerType.MAGNETIC,
      numberOfTeeth: 1,
    },
  })

  // Load machine models on mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        const models = await machineModelService.getAll()
        setMachineModels(models)
      } catch (err) {
        console.error('Failed to load machine models:', err)
      }
    }
    if (open) {
      loadModels()
    }
  }, [open])

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset()
      setSearchResults([])
      setHasSearched(false)
    }
  }, [open, form])

  const onSearch = async (data: SearchFormData) => {
    setIsSearching(true)
    setHasSearched(true)

    try {
      const results = await productService.searchByCriteria(
        Number(data.modelId),
        data.rollerType,
        data.numberOfTeeth
      )
      setSearchResults(results)

      if (results.length === 0) {
        toast.info('No products found matching the criteria')
      }
    } catch (error) {
      toast.error('Failed to search products')
      console.error(error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectProduct = (product: Product) => {
    onSelectProduct(product)
    toast.success(`Added ${product.partCode} to order`)
  }

  const handleCreateProduct = () => {
    setCreateProductDialogOpen(true)
  }

  const handleProductCreated = (createdProduct?: Product) => {
    if (createdProduct) {
      // Close the create dialog
      setCreateProductDialogOpen(false)

      // Add the newly created product to the order
      onSelectProduct(createdProduct)

      // Optionally re-run search to show the new product in results
      const formData = form.getValues()
      if (formData.modelId && formData.rollerType && formData.numberOfTeeth) {
        onSearch(formData)
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

      // Refresh the machine models list
      const updatedModels = await machineModelService.getAll()
      setMachineModels(updatedModels)

      // Auto-select the newly created model
      form.setValue('modelId', newModelId.toString())

      // Close dialog and reset
      setIsAddModelDialogOpen(false)
      setNewModelName('')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create machine model'
      toast.error(message)
    } finally {
      setIsCreatingModel(false)
    }
  }

  // Filter out already selected products
  const availableResults = searchResults.filter(
    p => !excludedProductIds.includes(p.id)
  )

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Search Products</DialogTitle>
          <DialogDescription>
            Search for products by Machine Model, Roller Type, and Number of Teeth
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSearch)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Machine Model */}
                <FormField
                  control={form.control}
                  name="modelId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <div className="flex items-center justify-between">
                        <FormLabel>Machine Model *</FormLabel>
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
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select model" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {machineModels.map((model) => (
                            <SelectItem key={model.id} value={model.id.toString()}>
                              {model.modelName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Roller Type */}
                <FormField
                  control={form.control}
                  name="rollerType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Roller Type *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(RollerType).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Number of Teeth */}
                <FormField
                  control={form.control}
                  name="numberOfTeeth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Teeth *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="e.g., 40"
                          value={field.value ?? 0}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" disabled={isSearching} className="w-full">
                <Search className="h-4 w-4 mr-2" />
                {isSearching ? 'Searching...' : 'Search Products'}
              </Button>
            </form>
          </Form>

          {/* Search Results */}
          {hasSearched && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">
                  Search Results ({availableResults.length})
                </h3>
              </div>

              {availableResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground space-y-4">
                  <p className="text-sm">
                    {searchResults.length === 0
                      ? 'No products found matching the criteria'
                      : 'All matching products are already in your order'}
                  </p>
                  {searchResults.length === 0 && (
                    <div className="flex justify-center">
                      <Button
                        variant="outline"
                        onClick={handleCreateProduct}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Create New Product with These Criteria
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {availableResults.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {product.partCode}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {product.modelName} • {product.rollerType} • {product.numberOfTeeth} teeth
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ⌀{product.diameter}mm × {product.length}mm • {product.materialGrade}
                        </p>
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

    {/* Create Product Dialog - Pre-filled with search criteria */}
    <CreateProductDialog
      open={createProductDialogOpen}
      onOpenChange={setCreateProductDialogOpen}
      onSuccess={handleProductCreated}
      initialModelId={form.getValues('modelId') ? Number(form.getValues('modelId')) : undefined}
      initialRollerType={form.getValues('rollerType')}
      initialNumberOfTeeth={form.getValues('numberOfTeeth')}
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
