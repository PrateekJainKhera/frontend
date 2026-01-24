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
import { simulateApiCall } from '@/lib/utils/mock-api'

const formSchema = z.object({
  partCode: z.string().min(2, 'Part code is required'),
  customerName: z.string().min(2, 'Customer name is required'),
  modelName: z.string().min(2, 'Model name is required'),
  rollerType: z.string().min(2, 'Roller type is required'),
  diameter: z.number().positive('Diameter must be positive'),
  length: z.number().positive('Length must be positive'),
  materialGrade: z.string().min(1, 'Material grade is required'),
  drawingNo: z.string().optional(),
  revisionNo: z.string().optional(),
  revisionDate: z.string().optional(),
  numberOfTeeth: z.number().optional().nullable(),
  surfaceFinish: z.string().optional(),
  hardness: z.string().optional(),
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
      modelName: product.modelName,
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
    },
  })

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      await simulateApiCall({
        ...product,
        ...data,
      }, 1000)
      toast.success('Product updated successfully')
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to update product')
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
                      <Input placeholder="e.g., PART-001" {...field} />
                    </FormControl>
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
                name="modelName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter model name" {...field} />
                    </FormControl>
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
                    <FormLabel>Number of Teeth</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Optional"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
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
