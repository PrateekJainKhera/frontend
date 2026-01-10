"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
import { Switch } from '@/components/ui/switch'

export default function CreateMaterialCategoryPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  // Form state
  const [categoryCode, setCategoryCode] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [quality, setQuality] = useState('')
  const [description, setDescription] = useState('')
  const [defaultUOM, setDefaultUOM] = useState('kg')
  const [materialType, setMaterialType] = useState<'raw_material' | 'component'>('raw_material')
  const [isActive, setIsActive] = useState(true)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    // In real app: POST to API
    console.log({
      categoryCode,
      categoryName,
      quality,
      description,
      defaultUOM,
      materialType,
      isActive
    })

    setSaving(false)
    router.push('/masters/material-categories')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/masters/material-categories">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Material Category</h1>
            <p className="text-muted-foreground">
              Add a new material category to the system
            </p>
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
              <CardDescription>
                Enter the basic details for this material category
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoryCode">Category Code *</Label>
                  <Input
                    id="categoryCode"
                    placeholder="e.g., MAT-STEEL"
                    value={categoryCode}
                    onChange={(e) => setCategoryCode(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoryName">Category Name *</Label>
                  <Input
                    id="categoryName"
                    placeholder="e.g., Steel Rods"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quality">Quality *</Label>
                <Input
                  id="quality"
                  placeholder="e.g., EN8, SKF, 8.8 Grade"
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of this category..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Classification */}
          <Card>
            <CardHeader>
              <CardTitle>Classification</CardTitle>
              <CardDescription>
                Define the type and unit of measurement for this category
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>Default Unit of Measurement (UOM) *</Label>
                  <Select value={defaultUOM} onValueChange={setDefaultUOM}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">Kilogram (kg)</SelectItem>
                      <SelectItem value="nos">Numbers (nos)</SelectItem>
                      <SelectItem value="meter">Meter (m)</SelectItem>
                      <SelectItem value="liter">Liter (L)</SelectItem>
                      <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Material Type *</Label>
                  <RadioGroup
                    value={materialType}
                    onValueChange={(value) => setMaterialType(value as 'raw_material' | 'component')}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="raw_material" id="raw_material" />
                      <Label htmlFor="raw_material" className="font-normal cursor-pointer">
                        Raw Material
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="component" id="component" />
                      <Label htmlFor="component" className="font-normal cursor-pointer">
                        Component
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
              <CardDescription>
                Set the active status for this category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <Label htmlFor="isActive" className="font-normal cursor-pointer">
                  {isActive ? 'Active' : 'Inactive'}
                </Label>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {isActive
                  ? 'This category is currently active and can be used'
                  : 'This category is inactive and will not appear in selection lists'}
              </p>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Link href="/masters/material-categories">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Category'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
