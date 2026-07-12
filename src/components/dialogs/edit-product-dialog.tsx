"use client"

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Product } from '@/types'
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
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { productService } from '@/lib/api/products'
import { rollerTypeService, RollerTypeResponse } from '@/lib/api/roller-types'
import { productTemplateService, ProductTemplateResponse } from '@/lib/api/product-templates'

const formSchema = z.object({
  partCode: z.string().min(2, 'Part code is required'),
  customerName: z.string().optional(),
  modelId: z.number().min(1, 'Model is required'),
  rollerType: z.string().min(2, 'Roller type is required'),
  diameter: z.number().positive('Diameter must be positive').optional(),
  length: z.number().positive('Length must be positive').optional(),
  materialGrade: z.string().optional(),
  drawingNo: z.string().optional(),
  revisionNo: z.string().optional(),
  revisionDate: z.string().optional(),
  hasTeeth: z.boolean(),
  numberOfTeeth: z.number().optional(),
  surfaceFinish: z.string().optional(),
  hardness: z.string().optional(),
  processTemplateId: z.number(),
  productTemplateId: z.number().optional(),
}).superRefine((data, ctx) => {
  if (data.hasTeeth && (!data.numberOfTeeth || data.numberOfTeeth < 1)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['numberOfTeeth'], message: 'Number of teeth is required for a geared part' })
  }
})

type FormData = z.infer<typeof formSchema>

interface EditProductDialogProps {
  product: Product
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditProductDialog({
  product,
  open,
  onOpenChange,
  onSuccess,
}: EditProductDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [rollerTypes, setRollerTypes] = useState<RollerTypeResponse[]>([])
  const [productTemplates, setProductTemplates] = useState<ProductTemplateResponse[]>([])
  const [showAddRollerTypeDialog, setShowAddRollerTypeDialog] = useState(false)
  const [newRollerTypeName, setNewRollerTypeName] = useState('')
  const [isAddingRollerType, setIsAddingRollerType] = useState(false)

  useEffect(() => {
    if (open) {
      rollerTypeService.getAll().then(setRollerTypes).catch(console.error)
      productTemplateService.getAll().then(setProductTemplates).catch(console.error)
    }
  }, [open])

  const handleAddRollerType = async () => {
    if (!newRollerTypeName.trim()) { toast.error('Type name is required'); return }
    setIsAddingRollerType(true)
    try {
      await rollerTypeService.create({ typeName: newRollerTypeName.trim(), createdBy: 'Admin' })
      toast.success(`Roller type '${newRollerTypeName.trim()}' added`)
      const data = await rollerTypeService.getAll()
      setRollerTypes(data)
      form.setValue('rollerType', newRollerTypeName.trim())
      setNewRollerTypeName('')
      setShowAddRollerTypeDialog(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add roller type')
    } finally {
      setIsAddingRollerType(false)
    }
  }

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      partCode: product.partCode ?? '',
      customerName: product.customerName ?? '',
      modelId: product.modelId,
      rollerType: product.rollerType ?? '',
      diameter: product.diameter ?? undefined,
      length: product.length ?? undefined,
      materialGrade: product.materialGrade ?? '',
      drawingNo: product.drawingNo ?? '',
      revisionNo: product.revisionNo ?? '',
      revisionDate: product.revisionDate ?? '',
      hasTeeth: (product.numberOfTeeth ?? 0) > 0,
      numberOfTeeth: product.numberOfTeeth ?? 0,
      surfaceFinish: product.surfaceFinish ?? '',
      hardness: product.hardness ?? '',
      processTemplateId: product.processTemplateId || 1,
      productTemplateId: product.productTemplateId ?? undefined,
    },
  })

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    const loadingToast = toast.loading('Updating product...')

    try {
      await productService.update(product.id, {
        id: product.id,
        partCode: product.partCode,
        customerName: data.customerName,
        modelId: data.modelId,
        rollerType: data.rollerType,
        diameter: data.diameter,
        length: data.length,
        materialGrade: data.materialGrade,
        drawingNo: data.drawingNo,
        revisionNo: data.revisionNo,
        revisionDate: data.revisionDate,
        numberOfTeeth: data.hasTeeth ? data.numberOfTeeth : 0,
        surfaceFinish: data.surfaceFinish,
        hardness: data.hardness,
        processTemplateId: data.processTemplateId,
        productTemplateId: data.productTemplateId,
      })

      toast.dismiss(loadingToast)
      toast.success('Product updated successfully')
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast.dismiss(loadingToast)
      const message = error instanceof Error ? error.message : 'Failed to update product'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Update product information. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="partCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Part Code *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., PART-001"
                        {...field}
                        disabled
                        className="bg-muted cursor-not-allowed"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Auto-generated, cannot be edited</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter customer name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="modelId"
                render={() => (
                  <FormItem>
                    <FormLabel>Model *</FormLabel>
                    <FormControl>
                      <Input
                        value={product.modelName}
                        disabled
                        className="bg-muted cursor-not-allowed"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Model cannot be changed after creation</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rollerType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Roller Type *</FormLabel>
                    <div className="flex gap-2 items-center">
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {rollerTypes.map((t) => (
                            <SelectItem key={t.id} value={t.typeName}>
                              {t.typeName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setShowAddRollerTypeDialog(true)}
                        title="Add new roller type"
                        className="shrink-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="diameter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diameter (mm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="250"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="length"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Length (mm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="1200"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="materialGrade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material Grade</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., EN31" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="drawingNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Drawing Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., DRG-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="revisionNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Revision Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., R01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="revisionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Revision Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hasTeeth"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel className="text-sm">Geared part (has teeth)</FormLabel>
                      <p className="text-xs text-muted-foreground">Turn off for plain rollers / shafts / bearers with no teeth</p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(v) => { field.onChange(v); if (!v) form.setValue('numberOfTeeth', 0) }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch('hasTeeth') && (
                <FormField
                  control={form.control}
                  name="numberOfTeeth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Teeth *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter number of teeth"
                          value={field.value ?? 0}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="surfaceFinish"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Surface Finish</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hardness"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hardness</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Product Template */}
            <FormField
              control={form.control}
              name="productTemplateId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Template</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(v === 'none' ? undefined : Number(v))}
                    value={field.value ? String(field.value) : 'none'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select product template (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">— No template —</SelectItem>
                      {productTemplates.map(t => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.templateName} ({t.templateCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Links the BOM and process steps for job card generation</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

    {/* Quick Add Roller Type Dialog */}
    <Dialog open={showAddRollerTypeDialog} onOpenChange={setShowAddRollerTypeDialog}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle>Add Roller Type</DialogTitle>
          <DialogDescription>Enter a name for the new roller type</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label htmlFor="editNewRollerTypeName" className="text-sm font-medium">Type Name *</label>
            <Input
              id="editNewRollerTypeName"
              placeholder="e.g., Anilox Roller"
              value={newRollerTypeName}
              onChange={(e) => setNewRollerTypeName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddRollerType() }
              }}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => { setShowAddRollerTypeDialog(false); setNewRollerTypeName('') }}
            disabled={isAddingRollerType}
          >
            Cancel
          </Button>
          <Button onClick={handleAddRollerType} disabled={isAddingRollerType}>
            {isAddingRollerType ? 'Adding...' : 'Add Type'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
