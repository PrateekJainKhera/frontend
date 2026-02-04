"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { MaterialType, MaterialGrade, MaterialShape } from '@/types/enums'
import { materialService } from '@/lib/api/materials'
import { toast } from 'sonner'

const formSchema = z.object({
  materialName: z.string().min(2, 'Material name is required'),
  materialType: z.nativeEnum(MaterialType, { message: 'Material type is required' }),
  grade: z.nativeEnum(MaterialGrade, { message: 'Grade is required' }),
  shape: z.nativeEnum(MaterialShape, { message: 'Shape is required' }),
  diameter: z.number().optional(),
  innerDiameter: z.number().optional(),
  width: z.number().optional(),
  lengthInMM: z.number().min(0.01, 'Length must be greater than 0'),
  density: z.number().min(0.01, 'Density must be greater than 0'),
  weightKG: z.number().min(0, 'Weight must be positive'),
}).superRefine((data, ctx) => {
  if (data.shape === 'Rod' || data.shape === 'Forged' || data.shape === 'Pipe') {
    if (!data.diameter || data.diameter < 0.01) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['diameter'], message: 'Diameter is required' })
    }
  }
  if (data.shape === 'Pipe') {
    if (!data.innerDiameter || data.innerDiameter < 0.01) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['innerDiameter'], message: 'Inner diameter is required' })
    } else if (data.diameter && data.innerDiameter >= data.diameter) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['innerDiameter'], message: 'Must be less than outer diameter' })
    }
  }
  if (data.shape === 'Sheet') {
    if (!data.width || data.width < 0.01) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['width'], message: 'Width is required' })
    }
  }
})

type FormData = z.infer<typeof formSchema>

interface AddRawMaterialDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AddRawMaterialDialog({ open, onOpenChange, onSuccess }: AddRawMaterialDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      materialName: '',
      diameter: 0,
      innerDiameter: 0,
      width: 0,
      lengthInMM: 3000,
      density: 7.85,
      weightKG: 0,
    },
  })

  const shape = form.watch('shape')

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      await materialService.create({
        materialName: data.materialName,
        materialType: data.materialType,
        grade: data.grade,
        shape: data.shape,
        diameter: (data.shape === 'Sheet') ? 0 : (data.diameter ?? 0),
        innerDiameter: data.shape === 'Pipe' ? data.innerDiameter : undefined,
        width: data.shape === 'Sheet' ? data.width : undefined,
        lengthInMM: data.lengthInMM,
        density: data.density,
        weightKG: data.weightKG,
      })
      toast.success('Material added successfully!')
      form.reset()
      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add material'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Raw Material</DialogTitle>
          <DialogDescription>
            Add a new raw material specification to the master catalog
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="materialName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Material Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., EN8 Rod 50mm" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="materialType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Material Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select material type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(MaterialType).map((type) => (
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(MaterialGrade).map((grade) => (
                          <SelectItem key={grade} value={grade}>
                            {grade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shape"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shape *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select shape" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(MaterialShape).map((shape) => (
                          <SelectItem key={shape} value={shape}>
                            {shape}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Shape-dependent dimension fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(shape === 'Rod' || shape === 'Forged') && (
                <FormField
                  control={form.control}
                  name="diameter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diameter (mm) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="50"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {shape === 'Pipe' && (
                <>
                  <FormField
                    control={form.control}
                    name="diameter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Outer Diameter (mm) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="60"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="innerDiameter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Inner Diameter (mm) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="50"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {shape === 'Sheet' && (
                <FormField
                  control={form.control}
                  name="width"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Width (mm) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="500"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="lengthInMM"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Length (mm) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="3000"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                name="density"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Density (g/cm³) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.001"
                        placeholder="7.85"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weightKG"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight (kg) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="46.2"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add Material'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
