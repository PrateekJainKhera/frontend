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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { toast } from 'sonner'
import { generatePartCode } from '@/lib/utils/part-code-generator'
import { RollerType, ChildPartType } from '@/types'
import { Customer } from '@/types/customer'
import { Upload, FileImage, Check, ChevronsUpDown } from 'lucide-react'
import { productService } from '@/lib/api/products'
import { customerService } from '@/lib/api/customer'
import { productTemplateService, ProductTemplateResponse } from '@/lib/api/product-templates'
import { cn } from '@/lib/utils'

const formSchema = z.object({
  customerName: z.string().min(1, 'Customer is required'),
  modelName: z.string().min(2, 'Model name is required'),
  rollerType: z.nativeEnum(RollerType, { message: 'Roller type is required' }),
  productTemplateId: z.number().min(1, 'Product template is required'),
  diameter: z.number().min(1, 'Diameter must be greater than 0'),
  length: z.number().min(1, 'Length must be greater than 0'),
  materialGrade: z.string().min(1, 'Material grade is required'),
  drawingNo: z.string().optional(),
  revisionNo: z.string().optional(),
  revisionDate: z.string().optional(),
  numberOfTeeth: z.number().optional().nullable(),
  surfaceFinish: z.string().optional(),
  hardness: z.string().optional(),
  processTemplateId: z.number(),
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
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false)
  const [templates, setTemplates] = useState<ProductTemplateResponse[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerName: '',
      modelName: '',
      rollerType: undefined,
      productTemplateId: 0,
      diameter: 0,
      length: 0,
      materialGrade: '',
      drawingNo: '',
      revisionNo: '',
      revisionDate: '',
      numberOfTeeth: null,
      surfaceFinish: '',
      hardness: '',
      processTemplateId: 1, // Default template ID
    },
  })

  const watchedRollerType = form.watch('rollerType')
  const watchedTemplateId = form.watch('productTemplateId')

  // Fetch customers when dialog opens
  useEffect(() => {
    if (open) {
      const loadCustomers = async () => {
        try {
          const data = await customerService.getAll()
          setCustomers(data)
        } catch (error) {
          console.error('Failed to load customers:', error)
          toast.error('Failed to load customers')
        }
      }
      loadCustomers()
    }
  }, [open])

  // Fetch templates when roller type changes
  useEffect(() => {
    if (watchedRollerType) {
      const loadTemplates = async () => {
        setLoadingTemplates(true)
        try {
          const allTemplates = await productTemplateService.getAll()
          // Filter templates by roller type
          const filtered = allTemplates.filter(t => t.rollerType === watchedRollerType)
          setTemplates(filtered)

          // Reset template selection when roller type changes
          form.setValue('productTemplateId', 0)
        } catch (error) {
          console.error('Failed to load templates:', error)
          toast.error('Failed to load product templates')
          setTemplates([])
        } finally {
          setLoadingTemplates(false)
        }
      }
      loadTemplates()
    } else {
      setTemplates([])
      form.setValue('productTemplateId', 0)
    }
  }, [watchedRollerType, form])

  // Load child parts from selected template
  useEffect(() => {
    if (watchedTemplateId && watchedTemplateId > 0) {
      const selectedTemplate = templates.find(t => t.id === watchedTemplateId)
      if (selectedTemplate && selectedTemplate.bomItems) {
        // Convert template BOM items to child part entries with optional drawing
        const templateChildParts: ChildPartEntry[] = selectedTemplate.bomItems.map(cp => ({
          id: `template-${cp.id}`,
          type: cp.childPartTemplateName as ChildPartType,
          drawingFile: null,
          drawingFileName: '',
        }))
        setChildParts(templateChildParts)
      }
    } else {
      setChildParts([])
    }
  }, [watchedTemplateId, templates])

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
    const loadingToast = toast.loading('Creating product...')

    try {
      // Create product using API service
      const product = await productService.create({
        customerName: data.customerName,
        modelName: data.modelName,
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
      toast.success(`Product created: ${product.partCode}`)
      form.reset()
      setGeneratedPartCode('')
      setChildParts([])
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      toast.dismiss(loadingToast)
      const message = error instanceof Error ? error.message : 'Failed to create product'
      toast.error(message)
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
              {/* Customer Name - SEARCHABLE DROPDOWN */}
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Customer Name *</FormLabel>
                    <Popover open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <span className="truncate">
                              {field.value
                                ? customers.find((customer) => customer.customerName === field.value)?.customerName
                                : "Select customer"}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full sm:w-[400px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search customer..." className="h-9" />
                          <CommandList className="max-h-[200px] sm:max-h-[300px]">
                            <CommandEmpty>No customer found.</CommandEmpty>
                            <CommandGroup>
                              {customers.map((customer) => (
                                <CommandItem
                                  value={customer.customerName}
                                  key={customer.id}
                                  onSelect={() => {
                                    form.setValue("customerName", customer.customerName)
                                    setCustomerSearchOpen(false)
                                  }}
                                  className="cursor-pointer"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      customer.customerName === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  <span className="truncate">{customer.customerName}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
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

              {/* Product Template - DROPDOWN (loads after roller type selected) */}
              <FormField
                control={form.control}
                name="productTemplateId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Template *</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value?.toString()}
                      disabled={!watchedRollerType || loadingTemplates}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            !watchedRollerType
                              ? "First select roller type"
                              : loadingTemplates
                                ? "Loading templates..."
                                : "Select template"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id.toString()}>
                            {template.templateName}
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

            {/* Child Parts Section - Loaded from template */}
            {watchedTemplateId && watchedTemplateId > 0 && (
              <Card className="p-4 mt-4 border-dashed">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-sm">Child Parts (from Template)</h3>
                    <p className="text-xs text-muted-foreground">
                      Optional: Attach drawings to child parts
                    </p>
                  </div>
                </div>

                {childParts.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm border rounded-md border-dashed">
                    <FileImage className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No child parts in this template</p>
                    <p className="text-xs">Select a template with child parts</p>
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

                        {/* Child Part Name (Read-only from template) */}
                        <div className="flex items-center gap-2 min-w-[160px]">
                          <span className="text-sm font-medium">{part.type}</span>
                          <span className="text-xs text-muted-foreground">(from template)</span>
                        </div>

                        {/* File Upload (Optional) */}
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
                            {part.drawingFileName ? 'Change Drawing' : 'Upload Drawing (Optional)'}
                          </Button>
                          {part.drawingFileName && (
                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {part.drawingFileName}
                            </span>
                          )}
                        </div>
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
