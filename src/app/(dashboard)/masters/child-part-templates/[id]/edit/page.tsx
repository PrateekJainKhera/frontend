"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { childPartTemplateService, ChildPartTemplateResponse } from '@/lib/api/child-part-templates'
import { rollerTypeService, RollerTypeResponse } from '@/lib/api/roller-types'
import { processTemplateService, ProcessTemplateResponse } from '@/lib/api/process-templates'
import { childPartTypeService, ChildPartTypeResponse } from '@/lib/api/child-part-types'
import { toast } from 'sonner'

export default function EditChildPartTemplatePage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [template, setTemplate] = useState<ChildPartTemplateResponse | null>(null)

  // Masters
  const [rollerTypes, setRollerTypes] = useState<RollerTypeResponse[]>([])
  const [childPartTypes, setChildPartTypes] = useState<ChildPartTypeResponse[]>([])
  const [processTemplates, setProcessTemplates] = useState<ProcessTemplateResponse[]>([])

  // Form state
  const [templateName, setTemplateName] = useState('')
  const [childPartType, setChildPartType] = useState('')
  const [applicableTypes, setApplicableTypes] = useState<string[]>([])
  const [processTemplateId, setProcessTemplateId] = useState<number | null>(null)
  const [description, setDescription] = useState('')
  const [technicalNotes, setTechnicalNotes] = useState('')
  const [isPurchased, setIsPurchased] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [tmpl, rts, cpts, pts] = await Promise.all([
          childPartTemplateService.getById(id),
          rollerTypeService.getAll(),
          childPartTypeService.getAll(),
          processTemplateService.getAll(),
        ])

        setTemplate(tmpl)
        setRollerTypes(rts.filter(r => r.isActive))
        setChildPartTypes(cpts)
        setProcessTemplates(pts.filter(p => p.isActive))

        // Pre-fill form from loaded template
        setTemplateName(tmpl.templateName)
        setChildPartType(tmpl.childPartType)
        setApplicableTypes(tmpl.rollerType ? tmpl.rollerType.split(',').map(s => s.trim()).filter(Boolean) : [])
        setProcessTemplateId(tmpl.processTemplateId ?? null)
        setDescription(tmpl.description ?? '')
        setTechnicalNotes(tmpl.technicalNotes ?? '')
        setIsPurchased(tmpl.isPurchased)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load template')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const toggleRollerType = (typeName: string) => {
    setApplicableTypes(prev =>
      prev.includes(typeName) ? prev.filter(t => t !== typeName) : [...prev, typeName]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!templateName.trim()) { toast.error('Template name is required'); return }
    if (!childPartType) { toast.error('Child part type is required'); return }
    if (applicableTypes.length === 0) { toast.error('Select at least one applicable roller type'); return }
    if (!isPurchased && !processTemplateId) { toast.error('Process template is required for manufactured parts'); return }

    setSaving(true)
    try {
      await childPartTemplateService.update(id, {
        id,
        templateName: templateName.trim(),
        childPartType,
        rollerType: applicableTypes.join(','),
        processTemplateId: processTemplateId ?? undefined,
        description: description.trim() || undefined,
        technicalNotes: technicalNotes.trim() || undefined,
        isPurchased,
        isActive: template?.isActive ?? true,
        updatedBy: 'Admin',
      })
      toast.success('Template updated successfully')
      router.push(`/masters/products`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update template')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!template) {
    return (
      <div className="space-y-6">
        <Card className="p-12">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Template not found</h3>
            <Button asChild>
              <Link href="/masters/products">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Templates
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/masters/products/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Child Part Template</h1>
          <p className="text-muted-foreground text-sm">{template.templateCode}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>General details about this child part template</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Template Code</Label>
                <Input value={template.templateCode} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="templateName">Template Name *</Label>
                <Input
                  id="templateName"
                  value={templateName}
                  onChange={e => setTemplateName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Child Part Type *</Label>
                <Select value={childPartType} onValueChange={setChildPartType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {childPartTypes.map(t => (
                      <SelectItem key={t.id} value={t.typeName}>{t.typeName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Process Template {!isPurchased && '*'}</Label>
                <Select
                  value={processTemplateId?.toString() ?? ''}
                  onValueChange={v => setProcessTemplateId(v ? Number(v) : null)}
                  disabled={isPurchased}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isPurchased ? 'N/A (Purchased)' : 'Select process template'} />
                  </SelectTrigger>
                  <SelectContent>
                    {processTemplates.map(t => (
                      <SelectItem key={t.id} value={t.id.toString()}>{t.templateName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Applicable Roller Types * <span className="text-muted-foreground text-xs">(select all that apply)</span></Label>
              <div className="flex flex-wrap gap-3 pt-1">
                {rollerTypes.map(rt => (
                  <label key={rt.id} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={applicableTypes.includes(rt.typeName)}
                      onCheckedChange={() => toggleRollerType(rt.typeName)}
                    />
                    <span className="text-sm">{rt.typeName}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="isPurchased"
                checked={isPurchased}
                onCheckedChange={v => {
                  setIsPurchased(!!v)
                  if (v) setProcessTemplateId(null)
                }}
              />
              <Label htmlFor="isPurchased">Purchased Part (no in-house manufacturing)</Label>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe the child part and its purpose"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Technical Notes</Label>
              <Textarea
                value={technicalNotes}
                onChange={e => setTechnicalNotes(e.target.value)}
                placeholder="e.g., Material hardness: 45-50 HRC after heat treatment"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href={`/masters/products/${id}`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}
