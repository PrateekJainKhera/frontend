"use client"

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Plus, Check, ChevronsUpDown } from 'lucide-react'
import { ProcessResponse, processService } from '@/lib/api/processes'
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
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { processCategoryService } from '@/lib/api/process-categories'
import { ProcessCategory } from '@/types/process-category'

const formSchema = z.object({
  processCode: z.string().min(2, 'Process code must be at least 2 characters'),
  processName: z.string().min(2, 'Process name must be at least 2 characters'),
  processCategoryId: z.number().min(1, 'Process category is required'),
  standardSetupTimeMin: z.number().min(0, 'Setup time cannot be negative'),
  cycleTimePerPieceHours: z.number().min(0.001, 'Cycle time must be greater than 0'),
  restTimeHours: z.number().min(0, 'Rest time cannot be negative').optional(),
  description: z.string().optional(),
  isOutsourced: z.boolean(),
})

type FormData = z.infer<typeof formSchema>

interface EditProcessDialogProps {
  process: ProcessResponse
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditProcessDialog({
  process,
  open,
  onOpenChange,
  onSuccess,
}: EditProcessDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [processCategories, setProcessCategories] = useState<ProcessCategory[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryDescription, setNewCategoryDescription] = useState('')
  const [isAddingCategory, setIsAddingCategory] = useState(false)

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
    } finally {
      setCategoriesLoading(false)
    }
  }

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      processCode: process.processCode,
      processName: process.processName,
      processCategoryId: process.processCategoryId || 0,
      standardSetupTimeMin: process.standardSetupTimeMin || 0,
      cycleTimePerPieceHours: process.cycleTimePerPieceHours || 0.5,
      restTimeHours: process.restTimeHours || 0,
      description: process.description || '',
      isOutsourced: process.isOutsourced,
    },
  })

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
      await processService.update(process.id, {
        id: process.id,
        processCode: data.processCode,
        processName: data.processName,
        processCategoryId: data.processCategoryId,
        standardSetupTimeMin: data.standardSetupTimeMin,
        cycleTimePerPieceHours: data.cycleTimePerPieceHours,
        restTimeHours: data.restTimeHours || null,
        description: data.description || null,
        isOutsourced: data.isOutsourced,
        isActive: process.isActive,
      })
      toast.success('Process updated successfully')
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update process'
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
            <DialogTitle>Edit Process</DialogTitle>
            <DialogDescription>
              Update process information. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="processCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Process Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., PROC-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="processName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Process Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter process name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="processCategoryId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
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
                  <FormDescription className="text-xs">
                    Used for capacity-based scheduling
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="standardSetupTimeMin"
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
                    <FormDescription className="text-xs">One-time per job</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cycleTimePerPieceHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cycle Time/Piece (hrs) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 2.5"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">Time per piece</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="restTimeHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rest Time (hrs)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">Optional cooling time</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
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

            <FormField
              control={form.control}
              name="isOutsourced"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Outsourced Process</FormLabel>
                    <FormDescription>
                      Enable if this process is handled by external vendor/contractor
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
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
