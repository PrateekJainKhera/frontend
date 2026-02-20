"use client"

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Check, ChevronsUpDown } from 'lucide-react'
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
  FormDescription,
} from '@/components/ui/form'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { processService } from '@/lib/api/processes'
import { processCategoryService } from '@/lib/api/process-categories'
import { ProcessCategory as ProcessCategoryType } from '@/types/process-category'

const formSchema = z.object({
  processName: z.string().min(2, 'Process name is required'),
  processCategoryId: z.number().min(1, 'Process category is required'),
  standardTimeMin: z.number().min(0, 'Setup time cannot be negative'),
  cycleTimeMin: z.number().min(0.1, 'Cycle time must be greater than 0'),
  restTimeMin: z.number().min(0, 'Rest time cannot be negative').optional(),
  description: z.string().optional(),
  isOutsourced: z.boolean(),
})

type FormData = z.infer<typeof formSchema>

interface AddProcessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AddProcessDialog({ open, onOpenChange, onSuccess }: AddProcessDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [processCategories, setProcessCategories] = useState<ProcessCategoryType[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryDescription, setNewCategoryDescription] = useState('')
  const [isAddingCategory, setIsAddingCategory] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      processName: '',
      description: '',
      standardTimeMin: 0,
      cycleTimeMin: 30,
      restTimeMin: 0,
      isOutsourced: false,
    },
  })

  // Load process categories when dialog opens
  useEffect(() => {
    if (open) {
      loadProcessCategories()
    }
  }, [open])

  const loadProcessCategories = async () => {
    setCategoriesLoading(true)
    try {
      const data = await processCategoryService.getAll()
      setProcessCategories(data.filter(c => c.isActive))
    } catch (error) {
      console.error('Failed to load process categories:', error)
      toast.error('Failed to load process categories')
    } finally {
      setCategoriesLoading(false)
    }
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Category name is required')
      return
    }

    setIsAddingCategory(true)
    try {
      const newCategoryId = await processCategoryService.create({
        categoryName: newCategoryName,
        description: newCategoryDescription || undefined,
        createdBy: 'Admin'
      })

      toast.success('Process category added successfully')

      // Reload categories
      await loadProcessCategories()

      // Set the newly created category as selected
      form.setValue('processCategoryId', newCategoryId)

      // Reset and close dialog
      setNewCategoryName('')
      setNewCategoryDescription('')
      setShowAddCategoryDialog(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add category')
    } finally {
      setIsAddingCategory(false)
    }
  }

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)

    try {
      await processService.create({
        processName: data.processName,
        processCategoryId: data.processCategoryId,
        standardSetupTimeMin: data.standardTimeMin,
        cycleTimePerPieceHours: data.cycleTimeMin / 60,
        restTimeHours: (data.restTimeMin || 0) / 60 || null,
        description: data.description || null,
        isOutsourced: data.isOutsourced,
        createdBy: 'Admin'
      })

      toast.success('Process added successfully!')
      onOpenChange(false)
      form.reset()

      // Refresh parent data
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('Failed to create process:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create process')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Process</DialogTitle>
            <DialogDescription>
              Add a new manufacturing process. Process code will be auto-generated.
            </DialogDescription>
          </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="processName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Process Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., CNC Turning" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="processCategoryId"
                render={({ field }) => (
                  <FormItem className="flex flex-col col-span-full">
                    <FormLabel>Process Category *</FormLabel>
                    <div className="flex gap-2 items-center">
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              disabled={categoriesLoading}
                              className={cn(
                                "flex-1 min-w-0 justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? processCategories.find(
                                    (category) => category.id === field.value
                                  )?.categoryName
                                : categoriesLoading ? 'Loading...' : 'Select process category'}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 min-w-[200px]" style={{ width: 'var(--radix-popover-trigger-width)' }} align="start">
                          <Command>
                            <CommandInput placeholder="Search process category..." className="h-9" />
                            <CommandList className="max-h-[300px] overflow-y-auto">
                              <CommandEmpty>No process category found.</CommandEmpty>
                              <CommandGroup>
                                {processCategories.map((category) => (
                                  <CommandItem
                                    key={category.id}
                                    value={category.categoryName}
                                    onSelect={() => {
                                      form.setValue('processCategoryId', category.id)
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        category.id === field.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {category.categoryName}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setShowAddCategoryDialog(true)}
                        title="Add new process category"
                        className="shrink-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormDescription>
                      Used for capacity-based scheduling
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cycleTimeMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cycle Time per Piece (min) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="1"
                        placeholder="e.g. 30"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>Time to process one piece</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="standardTimeMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Setup Time (min) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="1"
                        placeholder="e.g. 30"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>One-time per job</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="restTimeMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rest Time (min)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="1"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>Optional cooling time</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isOutsourced"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Outsourced Process
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        This process is handled by external vendors
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter process description..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                {isSubmitting ? 'Adding...' : 'Add Process'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>

    {/* Quick Add Category Dialog */}
    <Dialog open={showAddCategoryDialog} onOpenChange={setShowAddCategoryDialog}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Process Category</DialogTitle>
          <DialogDescription>
            Create a new process category for capacity-based scheduling
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="category-name" className="text-sm font-medium">
              Category Name *
            </label>
            <Input
              id="category-name"
              placeholder="e.g., Turning 1, Grinding 1"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleAddCategory()
                }
              }}
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="category-description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="category-description"
              placeholder="Optional description"
              value={newCategoryDescription}
              onChange={(e) => setNewCategoryDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setShowAddCategoryDialog(false)
              setNewCategoryName('')
              setNewCategoryDescription('')
            }}
            disabled={isAddingCategory}
          >
            Cancel
          </Button>
          <Button onClick={handleAddCategory} disabled={isAddingCategory}>
            {isAddingCategory ? 'Adding...' : 'Add Category'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
