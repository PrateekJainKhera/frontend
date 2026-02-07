"use client"

import { useState } from 'react'
import { Plus, Trash2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { JobCardMaterialRequirementRequest } from '@/lib/api/job-cards'

interface MaterialRequirementsSelectorProps {
  value: JobCardMaterialRequirementRequest[]
  onChange: (materials: JobCardMaterialRequirementRequest[]) => void
  disabled?: boolean
}

export function MaterialRequirementsSelector({
  value,
  onChange,
  disabled = false
}: MaterialRequirementsSelectorProps) {
  const [expandedMaterials, setExpandedMaterials] = useState<Set<number>>(new Set())

  const handleAddMaterial = () => {
    const newMaterial: JobCardMaterialRequirementRequest = {
      rawMaterialName: '',
      materialGrade: '',
      requiredQuantity: 0,
      unit: 'pcs',
      wastagePercent: 0,
      source: 'Manual',
      confirmedBy: ''
    }
    onChange([...value, newMaterial])
  }

  const handleRemoveMaterial = (index: number) => {
    const updated = value.filter((_, i) => i !== index)
    onChange(updated)
  }

  const handleUpdateMaterial = (index: number, field: keyof JobCardMaterialRequirementRequest, fieldValue: any) => {
    const updated = [...value]
    updated[index] = { ...updated[index], [field]: fieldValue }
    onChange(updated)
  }

  const calculateTotalQuantity = (required: number, wastage: number) => {
    return required * (1 + wastage / 100)
  }

  if (value.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📦 Material Requirements
          </CardTitle>
          <CardDescription>
            No materials specified yet. Add materials required for this job card.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleAddMaterial} disabled={disabled} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Material
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              📦 Material Requirements
              <Badge variant="secondary">{value.length} material{value.length !== 1 ? 's' : ''}</Badge>
            </CardTitle>
            <CardDescription>
              Review and confirm materials required for this job card
            </CardDescription>
          </div>
          <Button onClick={handleAddMaterial} disabled={disabled} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Material
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {value.some(m => m.source === 'Template') && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Materials marked as "Template" were auto-loaded from the Child Part template. You can edit or remove them if needed.
            </AlertDescription>
          </Alert>
        )}

        {value.map((material, index) => (
          <Card key={index} className="border-2">
            <CardContent className="pt-4">
              <div className="space-y-4">
                {/* Header Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">Material #{index + 1}</span>
                    <Badge variant={material.source === 'Template' ? 'secondary' : 'outline'} className="text-xs">
                      {material.source || 'Manual'}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMaterial(index)}
                    disabled={disabled}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Material Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`material-name-${index}`}>Material Name *</Label>
                    <Input
                      id={`material-name-${index}`}
                      value={material.rawMaterialName}
                      onChange={(e) => handleUpdateMaterial(index, 'rawMaterialName', e.target.value)}
                      placeholder="e.g., Steel Rod Ø50mm"
                      disabled={disabled}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`material-grade-${index}`}>Material Grade</Label>
                    <Input
                      id={`material-grade-${index}`}
                      value={material.materialGrade || ''}
                      onChange={(e) => handleUpdateMaterial(index, 'materialGrade', e.target.value)}
                      placeholder="e.g., SS304, EN8"
                      disabled={disabled}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`required-qty-${index}`}>Required Quantity *</Label>
                    <Input
                      id={`required-qty-${index}`}
                      type="number"
                      step="0.01"
                      value={material.requiredQuantity}
                      onChange={(e) => handleUpdateMaterial(index, 'requiredQuantity', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      disabled={disabled}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`unit-${index}`}>Unit *</Label>
                    <Input
                      id={`unit-${index}`}
                      value={material.unit}
                      onChange={(e) => handleUpdateMaterial(index, 'unit', e.target.value)}
                      placeholder="e.g., pcs, kg, m"
                      disabled={disabled}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`wastage-${index}`}>Wastage (%)</Label>
                    <Input
                      id={`wastage-${index}`}
                      type="number"
                      step="0.01"
                      max="100"
                      value={material.wastagePercent || 0}
                      onChange={(e) => handleUpdateMaterial(index, 'wastagePercent', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      disabled={disabled}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Total with Wastage</Label>
                    <div className="h-10 px-3 rounded-md border bg-muted flex items-center text-sm font-medium">
                      {calculateTotalQuantity(material.requiredQuantity, material.wastagePercent || 0).toFixed(2)} {material.unit}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  )
}
