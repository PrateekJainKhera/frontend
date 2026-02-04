"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Skeleton } from '@/components/ui/skeleton'
import { Drawing, mockRawMaterials, mockProducts, mockCustomers, ManufacturingDimensions } from '@/lib/mock-data'
import { drawingService } from '@/lib/api/drawings'
import { ManufacturingDimensionsForm } from '@/components/forms/manufacturing-dimensions-form'
import { toast } from 'sonner'

export default function EditDrawingPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [drawingNumber, setDrawingNumber] = useState('')
  const [drawingName, setDrawingName] = useState('')
  const [drawingType, setDrawingType] = useState<Drawing['drawingType']>('shaft')
  const [revision, setRevision] = useState('')
  const [revisionDate, setRevisionDate] = useState('')
  const [status, setStatus] = useState<Drawing['status']>('draft')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [linkedPartId, setLinkedPartId] = useState('')
  const [linkedProductId, setLinkedProductId] = useState('')
  const [linkedCustomerId, setLinkedCustomerId] = useState('')
  const [manufacturingDimensions, setManufacturingDimensions] = useState<Partial<ManufacturingDimensions>>({
    materialGrade: ''
  })

  useEffect(() => {
    loadDrawing()
  }, [params.id])

  const loadDrawing = async () => {
    setLoading(true)
    try {
      const found = await drawingService.getById(Number(params.id))
      setDrawingNumber(found.drawingNumber)
      setDrawingName(found.drawingName)
      setDrawingType(found.drawingType as Drawing['drawingType'])
      setRevision(found.revision || '')
      setRevisionDate(found.revisionDate || '')
      setStatus(found.status as Drawing['status'])
      setDescription(found.description || '')
      setNotes(found.notes || '')
      setLinkedPartId(found.linkedPartId?.toString() || '')
      setLinkedProductId(found.linkedProductId?.toString() || '')
      setLinkedCustomerId(found.linkedCustomerId?.toString() || '')
      setManufacturingDimensions(
        found.manufacturingDimensionsJSON
          ? JSON.parse(found.manufacturingDimensionsJSON)
          : { materialGrade: '' }
      )
    } catch (err) {
      console.error('Failed to load drawing:', err)
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const hasDimensions = Object.values(manufacturingDimensions).some(
        (v) => v !== '' && v !== undefined && v !== null
      )

      await drawingService.update(Number(params.id), {
        drawingNumber,
        drawingName,
        drawingType,
        revision,
        revisionDate,
        status,
        description,
        notes,
        manufacturingDimensionsJSON: hasDimensions ? JSON.stringify(manufacturingDimensions) : undefined,
        linkedPartId: linkedPartId ? Number(linkedPartId) : undefined,
        linkedProductId: linkedProductId ? Number(linkedProductId) : undefined,
        linkedCustomerId: linkedCustomerId ? Number(linkedCustomerId) : undefined,
      })

      toast.success(`Drawing "${drawingNumber}" updated successfully`)
      router.push(`/masters/drawings/${params.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update drawing')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/masters/drawings/${params.id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Drawing</h1>
            <p className="text-muted-foreground">Update drawing details and revisions</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Core drawing identification details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="drawingNumber">Drawing Number *</Label>
                  <Input
                    id="drawingNumber"
                    placeholder="e.g., SHAFT-001"
                    value={drawingNumber}
                    onChange={(e) => setDrawingNumber(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="drawingName">Drawing Name *</Label>
                  <Input
                    id="drawingName"
                    placeholder="e.g., Main Shaft Assembly"
                    value={drawingName}
                    onChange={(e) => setDrawingName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the drawing..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes, tolerances, special instructions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Classification */}
          <Card>
            <CardHeader>
              <CardTitle>Classification</CardTitle>
              <CardDescription>Drawing type, revision, and status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-3">
                  <Label>Drawing Type *</Label>
                  <Select value={drawingType} onValueChange={(value) => setDrawingType(value as Drawing['drawingType'])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shaft">Shaft</SelectItem>
                      <SelectItem value="pipe">Pipe</SelectItem>
                      <SelectItem value="final">Final Assembly</SelectItem>
                      <SelectItem value="gear">Gear</SelectItem>
                      <SelectItem value="bushing">Bushing</SelectItem>
                      <SelectItem value="roller">Roller</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="revision">Revision *</Label>
                  <Input
                    id="revision"
                    placeholder="e.g., A, B, C"
                    value={revision}
                    onChange={(e) => setRevision(e.target.value)}
                    required
                    maxLength={3}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use A, B, C, etc. for revisions
                  </p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="revisionDate">Revision Date *</Label>
                  <Input
                    id="revisionDate"
                    type="date"
                    value={revisionDate}
                    onChange={(e) => setRevisionDate(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Date when this revision was created
                  </p>
                </div>

                <div className="space-y-3">
                  <Label>Status *</Label>
                  <RadioGroup value={status} onValueChange={(value) => setStatus(value as Drawing['status'])}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="draft" id="draft" />
                      <Label htmlFor="draft" className="font-normal cursor-pointer">
                        Draft
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="approved" id="approved" />
                      <Label htmlFor="approved" className="font-normal cursor-pointer">
                        Approved
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="obsolete" id="obsolete" />
                      <Label htmlFor="obsolete" className="font-normal cursor-pointer text-red-600">
                        Obsolete
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Linking */}
          <Card>
            <CardHeader>
              <CardTitle>Drawing Linking</CardTitle>
              <CardDescription>
                Link this drawing to parts, products, and customers for better traceability
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Linked Part (Optional)</Label>
                  <Select value={linkedPartId || "none"} onValueChange={(v) => setLinkedPartId(v === "none" ? "" : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select part" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {mockRawMaterials.map((material) => (
                        <SelectItem key={material.id} value={material.id.toString()}>
                          {material.materialName} - {material.grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Linked Product/Roller (Optional)</Label>
                  <Select value={linkedProductId || "none"} onValueChange={(v) => setLinkedProductId(v === "none" ? "" : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {mockProducts.map((product) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.modelName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Linked Customer (Optional)</Label>
                  <Select value={linkedCustomerId || "none"} onValueChange={(v) => setLinkedCustomerId(v === "none" ? "" : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {mockCustomers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.customerName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    For customer-specific drawings
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Why link drawings?</strong>
                </p>
                <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                  <li>Quick access to part specifications during production</li>
                  <li>Reuse standard drawings across multiple products</li>
                  <li>Track customer-specific modifications</li>
                  <li>Prevent wrong drawing usage in manufacturing</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Manufacturing Dimensions - CRITICAL */}
          <ManufacturingDimensionsForm
            drawingType={drawingType}
            dimensions={manufacturingDimensions}
            onChange={setManufacturingDimensions}
          />

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Link href={`/masters/drawings/${params.id}`}>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
