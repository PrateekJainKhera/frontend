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
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { simulateApiCall } from '@/lib/utils/mock-api'
import { generatePartCode } from '@/lib/utils/part-code-generator'
import { RollerType, ChildPartType } from '@/types'
import { mockCustomers } from '@/lib/mock-data'
import { Plus, Trash2, Upload, FileImage } from 'lucide-react'

const formSchema = z.object({
  customerName: z.string().min(1, 'Customer is required'),
  modelName: z.string().min(2, 'Model name is required'),
  rollerType: z.nativeEnum(RollerType, { message: 'Roller type is required' }),
  diameter: z.number().min(1, 'Diameter must be greater than 0'),
  length: z.number().min(1, 'Length must be greater than 0'),
  materialGrade: z.string().min(1, 'Material grade is required'),
  drawingNo: z.string().optional(),
  revisionNo: z.string().optional(),
  revisionDate: z.string().optional(),
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

// Child part entry for the form
interface ChildPartEntry {
  id: string
  type: ChildPartType | ''
  drawingFile: File | null
  drawingFileName: string
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
  const [childParts, setChildParts] = useState<ChildPartEntry[]>([])

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
      revisionNo: '',
      revisionDate: '',
      numberOfTeeth: null,
      surfaceFinish: '',
      hardness: '',
    },
  })

  const watchedRollerType = form.watch('rollerType')

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

  // Reset child parts when dialog closes
  useEffect(() => {
    if (!open) {
      setChildParts([])
    }
  }, [open])

  const addChildPart = () => {
    const newPart: ChildPartEntry = {
      id: `cp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: '',
      drawingFile: null,
      drawingFileName: '',
    }
    setChildParts([...childParts, newPart])
  }

  const removeChildPart = (id: string) => {
    setChildParts(childParts.filter((part) => part.id !== id))
  }

  const updateChildPartType = (id: string, type: ChildPartType) => {
    setChildParts(
      childParts.map((part) =>
        part.id === id ? { ...part, type } : part
      )
    )
  }

  const handleFileChange = (id: string, file: File | null) => {
    setChildParts(
      childParts.map((part) =>
        part.id === id
          ? { ...part, drawingFile: file, drawingFileName: file?.name || '' }
          : part
      )
    )
  }

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    toast.loading('Creating product...')

    try {
      // Prepare child parts data (for API - files would be uploaded separately in real implementation)
      const childPartsData = childParts
        .filter((part) => part.type) // Only include parts with a type selected
        .map((part) => ({
          type: part.type,
          drawingFileName: part.drawingFileName,
          // In real implementation, you'd upload files and store URLs here
        }))

      // Simulate API call
      await simulateApiCall(
        { ...data, partCode: generatedPartCode, childParts: childPartsData },
        1000
      )

      toast.dismiss()
      toast.success(`Product created: ${generatedPartCode}`)
      form.reset()
      setGeneratedPartCode('')
      setChildParts([])
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
                          <SelectItem key={customer.id} value={customer.customerName}>
                            {customer.customerName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Model Name - TEXT INPUT */}
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

              {/* Roller Type - ENUM DROPDOWN (Only MAGNETIC and PRINTING) */}
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
                      <Input
                        type="number"
                        min="1"
                        placeholder="250"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                      />
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
                      <Input
                        type="number"
                        min="1"
                        placeholder="1200"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                      />
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
                    <FormLabel>Drawing Number</FormLabel>
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
                    <FormLabel>Revision Number</FormLabel>
                    <FormControl>
                      <Input placeholder="R1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Revision Date */}
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
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
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

            {/* Child Parts Section - Appears after roller type is selected */}
            {watchedRollerType && (
              <Card className="p-4 mt-4 border-dashed">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-sm">Child Parts</h3>
                    <p className="text-xs text-muted-foreground">
                      Optional: Add child parts for this {watchedRollerType} roller
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addChildPart}
                    className="gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add Part
                  </Button>
                </div>

                {childParts.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm border rounded-md border-dashed">
                    <FileImage className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No child parts added yet</p>
                    <p className="text-xs">Click "Add Part" to add child parts with drawings</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {childParts.map((part, index) => (
                      <div
                        key={part.id}
                        className="flex items-center gap-3 p-3 bg-muted/50 rounded-md"
                      >
                        <span className="text-xs font-medium text-muted-foreground w-6">
                          {index + 1}.
                        </span>

                        {/* Child Part Type Dropdown */}
                        <Select
                          value={part.type}
                          onValueChange={(value) =>
                            updateChildPartType(part.id, value as ChildPartType)
                          }
                        >
                          <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(ChildPartType).map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* File Upload */}
                        <div className="flex-1 flex items-center gap-2">
                          <Input
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            id={`file-${part.id}`}
                            onChange={(e) =>
                              handleFileChange(part.id, e.target.files?.[0] || null)
                            }
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              document.getElementById(`file-${part.id}`)?.click()
                            }
                            className="gap-1"
                          >
                            <Upload className="h-3 w-3" />
                            {part.drawingFileName ? 'Change' : 'Upload Drawing'}
                          </Button>
                          {part.drawingFileName && (
                            <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                              {part.drawingFileName}
                            </span>
                          )}
                        </div>

                        {/* Remove Button */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeChildPart(part.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

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
