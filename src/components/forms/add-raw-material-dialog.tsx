"use client"

import { useState, useEffect } from 'react'
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
import { Plus } from 'lucide-react'
import { MaterialGrade, MaterialShape } from '@/types/enums'

// Frontend-only density suggestions (g/cm³) based on material type name keywords
const DENSITY_MAP: { keywords: string[]; density: number }[] = [
  { keywords: ['stainless', 'ss'],               density: 7.90 },
  { keywords: ['steel', 'en8', 'en19', 'en24', 'alloy'], density: 7.85 },
  { keywords: ['aluminum', 'aluminium', 'al'],   density: 2.70 },
  { keywords: ['brass'],                          density: 8.50 },
  { keywords: ['cast iron'],                      density: 7.20 },
  { keywords: ['copper'],                         density: 8.96 },
]

function getSuggestedDensity(typeName: string): number | null {
  const lower = typeName.toLowerCase()
  for (const entry of DENSITY_MAP) {
    if (entry.keywords.some(k => lower.includes(k))) return entry.density
  }
  return null
}
import { materialService } from '@/lib/api/materials'
import { materialTypeService, MaterialTypeResponse } from '@/lib/api/material-types'
import { toast } from 'sonner'

const formSchema = z.object({
  materialName: z.string().min(2, 'Material name is required'),
  materialType: z.string().min(1, 'Material type is required'),
  grade: z.nativeEnum(MaterialGrade, { message: 'Grade is required' }),
  shape: z.nativeEnum(MaterialShape, { message: 'Shape is required' }),
  diameter: z.number().optional(),
  innerDiameter: z.number().optional(),
  width: z.number().optional(),
  density: z.number().min(0.01, 'Density must be greater than 0'),
  minLengthMM: z.number().int().min(1, 'Min length must be at least 1 mm').max(9999),
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
  if (data.shape === 'Sheet' || data.shape === 'Flat') {
    if (!data.width || data.width < 0.01) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['width'], message: 'Width is required for Sheet/Flat shape' })
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
  const [materialTypes, setMaterialTypes] = useState<MaterialTypeResponse[]>([])

  // Inline "Add new type" state
  const [showAddType, setShowAddType] = useState(false)
  const [newTypeName, setNewTypeName] = useState('')
  const [addingType, setAddingType] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      materialName: '',
      diameter: 0,
      innerDiameter: 0,
      width: 0,
      density: 7.85,
      minLengthMM: 300,
    },
  })

  const shape = form.watch('shape')

  const loadMaterialTypes = async () => {
    try {
      const types = await materialTypeService.getAll()
      setMaterialTypes(types)
    } catch {
      toast.error('Failed to load material types')
    }
  }

  useEffect(() => {
    loadMaterialTypes()
  }, [])

  const handleMaterialTypeChange = (typeName: string, onChange: (v: string) => void) => {
    onChange(typeName)
    const suggested = getSuggestedDensity(typeName)
    if (suggested) form.setValue('density', suggested)
  }

  const handleAddType = async () => {
    if (!newTypeName.trim()) { toast.error('Type name is required'); return }
    setAddingType(true)
    try {
      const created = await materialTypeService.create({ name: newTypeName.trim() })
      await loadMaterialTypes()
      form.setValue('materialType', created.name)
      setShowAddType(false)
      setNewTypeName('')
      toast.success(`Material type "${created.name}" added`)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setAddingType(false)
    }
  }

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      await materialService.create({
        materialName: data.materialName,
        materialType: data.materialType,
        grade: data.grade,
        shape: data.shape,
        diameter: (data.shape === 'Sheet' || data.shape === 'Flat') ? 0 : (data.diameter ?? 0),
        innerDiameter: data.shape === 'Pipe' ? data.innerDiameter : undefined,
        width: (data.shape === 'Sheet' || data.shape === 'Flat') ? data.width : undefined,
        lengthInMM: 0,
        density: data.density,
        weightKG: 0,
        minLengthMM: data.minLengthMM,
      })
      toast.success('Material added successfully!')
      form.reset()
      setShowAddType(false)
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
            Define a material type specification for your catalog. Actual weight and length are recorded during inventory receipt.
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

            {/* Material Type — from master */}
            <FormField
              control={form.control}
              name="materialType"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormLabel>Material Type *</FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => setShowAddType(v => !v)}
                      title="Add new material type"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Inline add form */}
                  {showAddType && (
                    <div className="border rounded p-3 bg-muted/40 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">New Material Type</p>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Type name (e.g., Tool Steel)"
                          value={newTypeName}
                          onChange={e => setNewTypeName(e.target.value)}
                          className="flex-1 h-8 text-sm"
                        />
                        <Button
                          type="button"
                          size="sm"
                          className="h-8"
                          onClick={handleAddType}
                          disabled={addingType}
                        >
                          {addingType ? 'Adding...' : 'Add'}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-8"
                          onClick={() => { setShowAddType(false); setNewTypeName('') }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  <Select
                    onValueChange={(v) => handleMaterialTypeChange(v, field.onChange)}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select material type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {materialTypes.map((type) => (
                        <SelectItem key={type.id} value={type.name}>
                          {type.name}
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

              {(shape === 'Sheet' || shape === 'Flat') && (
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
            </div>

            {/* Density — auto-filled from material type, editable */}
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
                  <p className="text-xs text-muted-foreground">Suggested from material type. Adjust if needed.</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Min Length — scrap threshold */}
            <FormField
              control={form.control}
              name="minLengthMM"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Min Usable Length (mm) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="1"
                      placeholder="300"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 300)}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">Pieces shorter than this after cutting are marked as scrap. Default: 300 mm.</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
              <strong>Note:</strong> Material Master defines the material specification only.
              Actual weight and length are recorded when receiving stock into inventory.
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
