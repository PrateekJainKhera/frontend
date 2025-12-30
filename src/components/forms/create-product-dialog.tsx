"use client"

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
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
  FormDescription,
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
import { toast } from 'sonner'
import { simulateApiCall } from '@/lib/utils/mock-api'
import { generatePartCode } from '@/lib/utils/part-code-generator'
import { RollerType } from '@/types'
import { mockCustomers } from '@/lib/mock-data'

const formSchema = z.object({
  customerName: z.string().min(1, 'Customer is required'),
  modelName: z.string().min(2, 'Model name is required'),
  rollerType: z.nativeEnum(RollerType, { message: 'Roller type is required' }),
  diameter: z.number().min(1, 'Diameter must be greater than 0'),
  length: z.number().min(1, 'Length must be greater than 0'),
  materialGrade: z.string().min(1, 'Material grade is required'),
  drawingNo: z.string().min(1, 'Drawing number is required'),
  revisionNo: z.string().min(1, 'Revision number is required'),
  numberOfTeeth: z.number().optional().nullable(),
  surfaceFinish: z.string().optional(),
  hardness: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface CreateProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const materialGrades = ['EN8', 'EN19', 'SS304', 'SS316', 'Alloy Steel', 'NBR (Nitrile Rubber)']
const modelNames = ['Flexo 8-Color Press', 'Offset Press 4-Color', 'Flexo CI Press', 'Rotogravure Press', 'Web Handling System']

export function CreateProductDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateProductDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generatedPartCode, setGeneratedPartCode] = useState<string>('')

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: '',
      modelName: '',
      rollerType: undefined,
      diameter: 0,
      length: 0,
      materialGrade: '',
      drawingNo: '',
      revisionNo: 'R1',
      numberOfTeeth: null,
      surfaceFinish: '',
      hardness: '',
    },
  })

  // Auto-generate part code when relevant fields change
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (value.rollerType && value.diameter && value.materialGrade) {
        const code = generatePartCode(
          value.rollerType as RollerType,
          value.diameter as number,
          value.materialGrade as string
        )
        setGeneratedPartCode(code)
      }
    })
    return () => subscription.unsubscribe()
  }, [form])

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    toast.loading('Creating product...')

    try {
      // Simulate API call
      await simulateApiCall({ ...data, partCode: generatedPartCode }, 1000)

      toast.dismiss()
      toast.success(`Product created: ${generatedPartCode}`)
      form.reset()
      setGeneratedPartCode('')
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      toast.dismiss()
      toast.error('Failed to create product')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Product / Part</DialogTitle>
          <DialogDescription>
            Add a new roller product. Part code will be auto-generated.
          </DialogDescription>
        </DialogHeader>

        {generatedPartCode && (
          <div className="p-3 bg-primary/10 rounded-md">
            <p className="text-sm text-muted-foreground">Auto-Generated Part Code</p>
            <p className="text-lg font-mono font-bold text-primary">{generatedPartCode}</p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Name - DROPDOWN ONLY */}
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mockCustomers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.name}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Model Name - DROPDOWN ONLY */}
              <FormField
                control={form.control}
                name="modelName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model Name *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {modelNames.map((model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Roller Type - ENUM DROPDOWN */}
              <FormField
                control={form.control}
                name="rollerType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Roller Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
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

              {/* Material Grade - DROPDOWN */}
              <FormField
                control={form.control}
                name="materialGrade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material Grade *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {materialGrades.map((grade) => (
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

              {/* Diameter */}
              <FormField
                control={form.control}
                name="diameter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diameter (mm) *</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" placeholder="250" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Length */}
              <FormField
                control={form.control}
                name="length"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Length (mm) *</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" placeholder="1200" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Drawing No */}
              <FormField
                control={form.control}
                name="drawingNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Drawing Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="DRG-MAG-250-v2" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Revision No */}
              <FormField
                control={form.control}
                name="revisionNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Revision Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="R1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Number of Teeth - OPTIONAL */}
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
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Leave empty if not applicable
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Surface Finish */}
              <FormField
                control={form.control}
                name="surfaceFinish"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Surface Finish</FormLabel>
                    <FormControl>
                      <Input placeholder="Mirror Polish" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Hardness */}
              <FormField
                control={form.control}
                name="hardness"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hardness</FormLabel>
                    <FormControl>
                      <Input placeholder="HRC 58-62" {...field} />
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
              <Button type="submit" disabled={isSubmitting || !generatedPartCode}>
                {isSubmitting ? 'Creating...' : 'Create Product'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
