"use client"
import { getCurrentUserName } from '@/lib/auth'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Plus, Trash2, Package, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { productTemplateService, ProductTemplateBOMItemRequest } from '@/lib/api/product-templates'
import { processTemplateService, ProcessTemplateResponse } from '@/lib/api/process-templates'
import { childPartTemplateService, ChildPartTemplateResponse } from '@/lib/api/child-part-templates'
import { rollerTypeService, RollerTypeResponse } from '@/lib/api/roller-types'
import { toast } from 'sonner'

interface BOMItemForm {
  tempId: string
  childPartTemplateId: number | null
  quantity: number
  notes: string
  sequenceNumber: number
}

export default function EditProductTemplatePage() {
  const params = useParams()
  const router = useRouter()
  const templateId = Number(params.id)

  const [pageLoading, setPageLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // API Data
  const [rollerTypes, setRollerTypes] = useState<RollerTypeResponse[]>([])
  const [processTemplates, setProcessTemplates] = useState<ProcessTemplateResponse[]>([])
  const [allChildPartTemplates, setAllChildPartTemplates] = useState<ChildPartTemplateResponse[]>([])
  const [loadingProcessTemplates, setLoadingProcessTemplates] = useState(false)
  const [loadingChildPartTemplates, setLoadingChildPartTemplates] = useState(false)

  // Form fields
  const [templateName, setTemplateName] = useState('')
  const [templateCode, setTemplateCode] = useState('')
  const [rollerType, setRollerType] = useState('')
  const [processTemplateId, setProcessTemplateId] = useState<number | null>(null)
  const [description, setDescription] = useState('')
  const [drawingNumber, setDrawingNumber] = useState('')
  const [drawingRevision, setDrawingRevision] = useState('')
  const [length, setLength] = useState('')
  const [diameter, setDiameter] = useState('')
  const [bomItems, setBomItems] = useState<BOMItemForm[]>([])

  // Load template on mount
  useEffect(() => {
    const load = async () => {
      setPageLoading(true)
      try {
        const [template, allRollerTypes] = await Promise.all([
          productTemplateService.getById(templateId),
          rollerTypeService.getAll(),
        ])
        setRollerTypes(allRollerTypes.filter(t => t.isActive))
        setTemplateName(template.templateName)
        setTemplateCode(template.templateCode)
        setRollerType(template.rollerType)
        setProcessTemplateId(template.processTemplateId || null)
        setDescription(template.description || '')
        setDrawingNumber(template.drawingNumber || '')
        setDrawingRevision(template.drawingRevision || '')
        setLength(template.length?.toString() || '')
        setDiameter(template.diameter?.toString() || '')

        // Load BOM items
        if (template.bomItems && template.bomItems.length > 0) {
          setBomItems(template.bomItems.map((item, idx) => ({
            tempId: `existing-${item.id}`,
            childPartTemplateId: item.childPartTemplateId,
            quantity: item.quantity,
            notes: item.notes || '',
            sequenceNumber: item.sequenceNumber || idx + 1,
          })))
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to load template')
        router.push('/masters/products')
      } finally {
        setPageLoading(false)
      }
    }
    load()
  }, [templateId])

  // Load process templates when roller type is set/changed
  useEffect(() => {
    if (!rollerType) return
    setLoadingProcessTemplates(true)
    processTemplateService.getByApplicableType(rollerType)
      .then(data => setProcessTemplates(data.filter(t => t.isActive)))
      .catch(() => toast.error('Failed to load process templates'))
      .finally(() => setLoadingProcessTemplates(false))

    setLoadingChildPartTemplates(true)
    childPartTemplateService.getActiveTemplates()
      .then(all => setAllChildPartTemplates(all))
      .catch(() => toast.error('Failed to load child part templates'))
      .finally(() => setLoadingChildPartTemplates(false))
  }, [rollerType])

  // Options = templates matching the roller type, PLUS any template already linked in the BOM
  // (so an existing link always shows even if its roller-type tag doesn't match exactly).
  const linkedTemplateIds = new Set(bomItems.map(i => i.childPartTemplateId).filter(Boolean) as number[])
  const childPartTemplates = allChildPartTemplates.filter(t =>
    (t.rollerType ?? '').split(',').map(x => x.trim()).includes(rollerType) ||
    linkedTemplateIds.has(t.id)
  )

  const addBOMItem = () => {
    setBomItems(prev => [...prev, {
      tempId: `new-${Date.now()}`,
      childPartTemplateId: null,
      quantity: 1,
      notes: '',
      sequenceNumber: prev.length + 1,
    }])
  }

  const removeBOMItem = (tempId: string) => {
    setBomItems(prev =>
      prev.filter(i => i.tempId !== tempId).map((i, idx) => ({ ...i, sequenceNumber: idx + 1 }))
    )
  }

  const updateBOMItem = (tempId: string, field: keyof BOMItemForm, value: any) => {
    setBomItems(prev => prev.map(i => i.tempId === tempId ? { ...i, [field]: value } : i))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!templateName.trim()) { toast.error('Template name is required'); return }
    if (!rollerType) { toast.error('Roller type is required'); return }
    if (!processTemplateId) { toast.error('Assembly process template is required'); return }
    if (bomItems.length === 0) { toast.error('Add at least one child part'); return }
    if (bomItems.some(i => !i.childPartTemplateId)) {
      toast.error('Select a child part for all BOM items'); return
    }

    setSaving(true)
    try {
      const bomData: ProductTemplateBOMItemRequest[] = bomItems.map(i => ({
        childPartTemplateId: i.childPartTemplateId!,
        quantity: i.quantity,
        notes: i.notes.trim() || undefined,
        sequenceNumber: i.sequenceNumber,
      }))

      await productTemplateService.update(templateId, {
        templateName: templateName.trim(),
        rollerType: rollerType,
        processTemplateId: processTemplateId,
        description: description.trim() || undefined,
        drawingNumber: drawingNumber.trim() || undefined,
        drawingRevision: drawingRevision.trim() || undefined,
        length: length ? parseFloat(length) : undefined,
        diameter: diameter ? parseFloat(diameter) : undefined,
        isActive: true,
        updatedBy: getCurrentUserName(),
        bomItems: bomData,
      })

      toast.success('Product template updated successfully')
      router.push('/masters/products?tab=templates')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update template')
    } finally {
      setSaving(false)
    }
  }

  if (pageLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/masters/products?tab=templates"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Product Template</h1>
          <p className="text-muted-foreground text-sm">{templateCode}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Update the product template details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Product Template Name *</Label>
                <Input
                  value={templateName}
                  onChange={e => setTemplateName(e.target.value)}
                  placeholder="e.g., Magnetic Roller 500mm Standard"
                />
              </div>
              <div className="space-y-2">
                <Label>Template Code</Label>
                <Input value={templateCode} disabled className="bg-muted" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Roller Type *</Label>
                <Select value={rollerType} onValueChange={setRollerType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select roller type" />
                  </SelectTrigger>
                  <SelectContent>
                    {rollerTypes.map(t => (
                      <SelectItem key={t.id} value={t.typeName}>{t.typeName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Assembly Process Template *</Label>
                <Select
                  value={processTemplateId?.toString() || ''}
                  onValueChange={v => setProcessTemplateId(parseInt(v))}
                  disabled={!rollerType || loadingProcessTemplates}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !rollerType ? 'Select roller type first' :
                      loadingProcessTemplates ? 'Loading...' :
                      'Select assembly process'
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {processTemplates.map(t => (
                      <SelectItem key={t.id} value={t.id.toString()}>{t.templateName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Drawing Number</Label>
                <Input value={drawingNumber} onChange={e => setDrawingNumber(e.target.value)} placeholder="e.g., DRG-MAG-500-001" />
              </div>
              <div className="space-y-2">
                <Label>Drawing Revision</Label>
                <Input value={drawingRevision} onChange={e => setDrawingRevision(e.target.value)} placeholder="e.g., Rev A" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Length (mm)</Label>
                <Input type="number" step="0.01" value={length} onChange={e => setLength(e.target.value)} placeholder="e.g., 500" />
              </div>
              <div className="space-y-2">
                <Label>Diameter (mm)</Label>
                <Input type="number" step="0.01" value={diameter} onChange={e => setDiameter(e.target.value)} placeholder="e.g., 60" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe this product..." rows={3} />
            </div>
          </CardContent>
        </Card>

        {/* BOM */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Bill of Materials (BOM)</CardTitle>
                <CardDescription>Child parts required for this product</CardDescription>
              </div>
              <Button type="button" onClick={addBOMItem} disabled={!rollerType || loadingChildPartTemplates}>
                <Plus className="mr-2 h-4 w-4" />
                Add Child Part
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {bomItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No child parts. Click "Add Child Part" to add.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bomItems.map(item => (
                  <Card key={item.tempId} className="border-2">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-4">
                        <Badge variant="outline" className="mt-2">#{item.sequenceNumber}</Badge>
                        <div className="flex-1 space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2 space-y-2">
                              <Label>Child Part Template *</Label>
                              <Select
                                value={item.childPartTemplateId?.toString() || ''}
                                onValueChange={v => updateBOMItem(item.tempId, 'childPartTemplateId', parseInt(v))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select child part" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                  {loadingChildPartTemplates ? (
                                    <div className="px-2 py-4 text-sm text-muted-foreground text-center">Loading...</div>
                                  ) : childPartTemplates.length === 0 ? (
                                    <div className="px-2 py-4 text-sm text-muted-foreground text-center">No templates found for this roller type</div>
                                  ) : (
                                    childPartTemplates.map(t => (
                                      <SelectItem key={t.id} value={t.id.toString()}>
                                        <div className="flex items-center gap-2">
                                          <Badge variant="secondary" className="text-xs">{t.childPartType}</Badge>
                                          <span>{t.templateName}</span>
                                        </div>
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Quantity *</Label>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={e => updateBOMItem(item.tempId, 'quantity', parseInt(e.target.value) || 1)}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Notes</Label>
                            <Input
                              placeholder="e.g., Install with bearing grease"
                              value={item.notes}
                              onChange={e => updateBOMItem(item.tempId, 'notes', e.target.value)}
                            />
                          </div>
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeBOMItem(item.tempId)} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" asChild>
            <Link href="/masters/products?tab=templates">Cancel</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />Save Changes</>}
          </Button>
        </div>
      </form>
    </div>
  )
}
