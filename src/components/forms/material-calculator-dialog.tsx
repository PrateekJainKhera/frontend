"use client"

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  calculateWeightFromLength,
  calculateLengthFromWeight,
  getDensityForGrade,
} from '@/lib/utils/material-calculations'

interface MaterialCalculatorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const materialGrades = ['EN8', 'EN19', 'SS304', 'SS316', 'Alloy Steel']

export function MaterialCalculatorDialog({
  open,
  onOpenChange,
}: MaterialCalculatorDialogProps) {
  const [grade, setGrade] = useState<string>('EN8')
  const [diameter, setDiameter] = useState<number>(50)

  // Weight from Length
  const [length, setLength] = useState<number>(3000)
  const [calculatedWeight, setCalculatedWeight] = useState<number>(0)

  // Length from Weight
  const [weight, setWeight] = useState<number>(100)
  const [calculatedLength, setCalculatedLength] = useState<number>(0)

  const handleCalculateWeight = () => {
    const density = getDensityForGrade(grade)
    const result = calculateWeightFromLength(length, diameter, density)
    setCalculatedWeight(result)
  }

  const handleCalculateLength = () => {
    const density = getDensityForGrade(grade)
    const result = calculateLengthFromWeight(weight, diameter, density)
    setCalculatedLength(result)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Material Weight Calculator</DialogTitle>
          <DialogDescription>
            Calculate weight from length or length from weight for cylindrical materials
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Common Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Material Grade</Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {materialGrades.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Diameter (mm)</Label>
              <Input
                type="number"
                value={diameter}
                onChange={(e) => setDiameter(Number(e.target.value))}
                min="1"
              />
            </div>
          </div>

          <div className="p-3 bg-muted rounded-md text-sm">
            <p className="text-muted-foreground">
              Density: {getDensityForGrade(grade).toFixed(8)} kg/mm³
            </p>
          </div>

          {/* Calculator Tabs */}
          <Tabs defaultValue="weight" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="weight">Calculate Weight</TabsTrigger>
              <TabsTrigger value="length">Calculate Length</TabsTrigger>
            </TabsList>

            {/* Weight from Length */}
            <TabsContent value="weight" className="space-y-4">
              <div className="space-y-2">
                <Label>Length (mm)</Label>
                <Input
                  type="number"
                  value={length}
                  onChange={(e) => {
                    setLength(Number(e.target.value))
                    handleCalculateWeight()
                  }}
                  min="1"
                  placeholder="3000"
                />
              </div>

              <Card className="bg-primary/5 border-primary">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-1">
                    Calculated Weight
                  </p>
                  <p className="text-3xl font-bold text-primary">
                    {calculatedWeight > 0
                      ? `${calculatedWeight.toFixed(3)} kg`
                      : 'Enter values above'}
                  </p>
                  {calculatedWeight > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Formula: π × r² × length × density
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Length from Weight */}
            <TabsContent value="length" className="space-y-4">
              <div className="space-y-2">
                <Label>Weight (kg)</Label>
                <Input
                  type="number"
                  value={weight}
                  onChange={(e) => {
                    setWeight(Number(e.target.value))
                    handleCalculateLength()
                  }}
                  min="0.1"
                  step="0.1"
                  placeholder="100"
                />
              </div>

              <Card className="bg-primary/5 border-primary">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-1">
                    Calculated Length
                  </p>
                  <p className="text-3xl font-bold text-primary">
                    {calculatedLength > 0
                      ? `${calculatedLength.toFixed(2)} mm`
                      : 'Enter values above'}
                  </p>
                  {calculatedLength > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Formula: weight / (π × r² × density)
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Example Calculation */}
          <div className="p-3 bg-muted/50 rounded-md text-xs text-muted-foreground">
            <p className="font-semibold mb-1">Example:</p>
            <p>EN8 Rod ⌀50mm × 3000mm = ~46.336 kg</p>
            <p>EN19 Rod ⌀100mm × 3000mm = ~185.354 kg</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
