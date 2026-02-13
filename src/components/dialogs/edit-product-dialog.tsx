"use client"

import { useState } from 'react'
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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { productService } from '@/lib/api/products'

const formSchema = z.object({
  partCode: z.string().min(2, 'Part code is required'),
  customerName: z.string().optional(),
  modelId: z.number().min(1, 'Model is required'),
  rollerType: z.string().min(2, 'Roller type is required'),
  diameter: z.number().positive('Diameter must be positive'),
  length: z.number().positive('Length must be positive'),
  materialGrade: z.string().min(1, 'Material grade is required'),
  drawingNo: z.string().optional(),
  revisionNo: z.string().optional(),
  revisionDate: z.string().optional(),
  numberOfTeeth: z.number().min(1, 'Number of teeth is required'),
  surfaceFinish: z.string().optional(),
  hardness: z.string().optional(),
  processTemplateId: z.number(),
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

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      partCode: product.partCode,
      customerName: product.customerName,
      modelId: product.modelId,
      rollerType: product.rollerType,
      diameter: product.diameter,
      length: product.length,
      materialGrade: product.materialGrade,
      drawingNo: product.drawingNo || '',
      revisionNo: product.revisionNo || '',
      revisionDate: product.revisionDate || '',
      numberOfTeeth: product.numberOfTeeth,
      surfaceFinish: product.surfaceFinish || '',
      hardness: product.hardness || '',
      processTemplateId: product.processTemplateId || 1,
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
        numberOfTeeth: data.numberOfTeeth,
        surfaceFinish: data.surfaceFinish,
        hardness: data.hardness,
        processTemplateId: data.processTemplateId,
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
                    <FormLabel>Customer Name *</FormLabel>
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
                render={({ field }) => (
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
                    <FormControl>
                      <Input placeholder="e.g., Magnetic Roller" {...field} />
                    </FormControl>
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
                    <FormLabel>Diameter (mm) *</FormLabel>
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
                    <FormLabel>Length (mm) *</FormLabel>
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
                    <FormLabel>Material Grade *</FormLabel>
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
  )
}
