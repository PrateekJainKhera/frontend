"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ManufacturingDimensions } from "@/lib/mock-data"
import { AlertCircle } from "lucide-react"

interface ManufacturingDimensionsFormProps {
  partType: 'shaft' | 'pipe' | 'final' | 'gear' | 'bushing' | 'roller' | 'other'
  dimensions: Partial<ManufacturingDimensions>
  onChange: (dimensions: Partial<ManufacturingDimensions>) => void
}

export function ManufacturingDimensionsForm({ partType, dimensions, onChange }: ManufacturingDimensionsFormProps) {
  const updateField = (field: keyof ManufacturingDimensions, value: string | number) => {
    onChange({ ...dimensions, [field]: value })
  }

  return (
    <Card className="border-2 border-orange-200 bg-orange-50">
      <CardHeader>
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
          <div className="flex-1">
            <CardTitle className="text-orange-900">⚙️ Manufacturing Dimensions (CRITICAL)</CardTitle>
            <CardDescription className="text-orange-700 mt-1">
              These dimensions are <strong>AUTHORITATIVE</strong> and will be used by job cards.
              Engineer must manually enter values from the drawing PDF.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* SHAFT-specific dimensions */}
        {partType === 'shaft' && (
          <div className="space-y-4 bg-white p-4 rounded-lg border border-orange-200">
            <Label className="text-sm font-semibold text-orange-900">Shaft Dimensions</Label>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rodDiameter">Rod Diameter (mm) *</Label>
                <Input
                  id="rodDiameter"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 50"
                  value={dimensions.rodDiameter || ''}
                  onChange={(e) => updateField('rodDiameter', parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-gray-600">Raw material rod size</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="finishedDiameter">Finished Diameter (mm) *</Label>
                <Input
                  id="finishedDiameter"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 48"
                  value={dimensions.finishedDiameter || ''}
                  onChange={(e) => updateField('finishedDiameter', parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-gray-600">After machining</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="finishedLength">Finished Length (mm) *</Label>
                <Input
                  id="finishedLength"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 1200"
                  value={dimensions.finishedLength || ''}
                  onChange={(e) => updateField('finishedLength', parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-gray-600">Final shaft length</p>
              </div>
            </div>
          </div>
        )}

        {/* PIPE-specific dimensions */}
        {partType === 'pipe' && (
          <div className="space-y-4 bg-white p-4 rounded-lg border border-orange-200">
            <Label className="text-sm font-semibold text-orange-900">Pipe Dimensions</Label>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pipeOD">Outer Diameter (mm) *</Label>
                <Input
                  id="pipeOD"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 110"
                  value={dimensions.pipeOD || ''}
                  onChange={(e) => updateField('pipeOD', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pipeID">Inner Diameter (mm) *</Label>
                <Input
                  id="pipeID"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 90"
                  value={dimensions.pipeID || ''}
                  onChange={(e) => updateField('pipeID', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pipeThickness">Thickness (mm)</Label>
                <Input
                  id="pipeThickness"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 10"
                  value={dimensions.pipeThickness || ''}
                  onChange={(e) => updateField('pipeThickness', parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cutLength">Cut Length (mm) *</Label>
                <Input
                  id="cutLength"
                  type="number"
                  step="0.1"
                  placeholder="e.g., 1500"
                  value={dimensions.cutLength || ''}
                  onChange={(e) => updateField('cutLength', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Common dimensions for all part types */}
        <div className="space-y-4 bg-white p-4 rounded-lg border border-orange-200">
          <Label className="text-sm font-semibold text-orange-900">Material & Quality</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="materialGrade">Material Grade *</Label>
              <Input
                id="materialGrade"
                placeholder="e.g., EN8, MS, SS304"
                value={dimensions.materialGrade || ''}
                onChange={(e) => updateField('materialGrade', e.target.value)}
              />
              <p className="text-xs text-gray-600">Exact grade from drawing</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tolerance">Tolerance</Label>
              <Input
                id="tolerance"
                placeholder="e.g., ±0.01mm, H7"
                value={dimensions.tolerance || ''}
                onChange={(e) => updateField('tolerance', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="surfaceFinish">Surface Finish</Label>
              <Input
                id="surfaceFinish"
                placeholder="e.g., N6, Ra 1.6"
                value={dimensions.surfaceFinish || ''}
                onChange={(e) => updateField('surfaceFinish', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hardness">Hardness</Label>
              <Input
                id="hardness"
                placeholder="e.g., 45-50 HRC"
                value={dimensions.hardness || ''}
                onChange={(e) => updateField('hardness', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Additional features */}
        <div className="space-y-4 bg-white p-4 rounded-lg border border-orange-200">
          <Label className="text-sm font-semibold text-orange-900">Additional Features (if applicable)</Label>
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="keySlotLength">Key Slot Length (mm)</Label>
              <Input
                id="keySlotLength"
                type="number"
                step="0.1"
                placeholder="e.g., 40"
                value={dimensions.keySlotLength || ''}
                onChange={(e) => updateField('keySlotLength', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="keySlotWidth">Key Slot Width (mm)</Label>
              <Input
                id="keySlotWidth"
                type="number"
                step="0.1"
                placeholder="e.g., 12"
                value={dimensions.keySlotWidth || ''}
                onChange={(e) => updateField('keySlotWidth', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="threadSize">Thread Size</Label>
              <Input
                id="threadSize"
                placeholder="e.g., M20x1.5"
                value={dimensions.threadSize || ''}
                onChange={(e) => updateField('threadSize', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bearingSize">Bearing Size</Label>
              <Input
                id="bearingSize"
                placeholder="e.g., 6210"
                value={dimensions.bearingSize || ''}
                onChange={(e) => updateField('bearingSize', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Weight calculations */}
        <div className="space-y-4 bg-white p-4 rounded-lg border border-orange-200">
          <Label className="text-sm font-semibold text-orange-900">Weight & Material Required</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="theoreticalWeight">Theoretical Weight (kg/piece)</Label>
              <Input
                id="theoreticalWeight"
                type="number"
                step="0.01"
                placeholder="e.g., 15.5"
                value={dimensions.theoreticalWeight || ''}
                onChange={(e) => updateField('theoreticalWeight', parseFloat(e.target.value) || 0)}
              />
              <p className="text-xs text-gray-600">Finished part weight</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="materialRequiredPerPiece">Material Required (kg/piece)</Label>
              <Input
                id="materialRequiredPerPiece"
                type="number"
                step="0.01"
                placeholder="e.g., 17.0"
                value={dimensions.materialRequiredPerPiece || ''}
                onChange={(e) => updateField('materialRequiredPerPiece', parseFloat(e.target.value) || 0)}
              />
              <p className="text-xs text-gray-600">Raw material needed</p>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-900">
            <strong>⚠️ IMPORTANT:</strong> These dimensions must match the approved drawing exactly.
            Job cards will use these values for material calculation and production planning.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
