"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { mockRawMaterials } from "@/lib/mock-data"
import { toast } from "sonner"
import { grnService, CreateGRNRequest } from "@/lib/api/grn"

interface GRNEntryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

interface PieceBreakdown {
    id: string
    length: number // in meters
    quantity: number // number of pieces at this length
}

interface MaterialLine {
    id: string
    materialId: string
    materialName: string
    grade: string
    materialType: 'rod' | 'pipe' // Rod (solid) or Pipe (hollow)
    diameter: number // For rod (solid bar)
    outerDiameter: number // OD for pipe
    innerDiameter: number // ID for pipe
    materialDensity: number // Material density g/cm³ (7.85 for MS/EN8, 7.9 for SS)
    weight: number // Total weight in kg
    calculatedLength: number // Auto-calculated total length in meters
    weightPerMeter: number // Auto-calculated kg/m
    pieces: PieceBreakdown[] // Physical pieces
}

export function GRNEntryDialog({ open, onOpenChange, onSuccess }: GRNEntryDialogProps) {
    const [grnNumber, setGrnNumber] = useState("")
    const [grnDate, setGrnDate] = useState("")
    const [vendorName, setVendorName] = useState("")
    const [materialLines, setMaterialLines] = useState<MaterialLine[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showWarningDialog, setShowWarningDialog] = useState(false)
    const [warningMessage, setWarningMessage] = useState<string[]>([])
    const [pendingSubmit, setPendingSubmit] = useState(false)

    // Reset form when dialog opens
    useEffect(() => {
        if (open) {
            const today = new Date().toISOString().split('T')[0]
            setGrnNumber(`GRN-${Date.now()}`)
            setGrnDate(today)
            setVendorName("")
            setMaterialLines([])
        }
    }, [open])

    const addMaterialLine = () => {
        const newLine: MaterialLine = {
            id: `line-${Date.now()}`,
            materialId: "",
            materialName: "",
            grade: "",
            materialType: "rod",
            diameter: 0,
            outerDiameter: 0,
            innerDiameter: 0,
            materialDensity: 7.85, // Default MS/EN8
            weight: 0,
            calculatedLength: 0,
            weightPerMeter: 0,
            pieces: []
        }
        setMaterialLines([...materialLines, newLine])
    }

    const removeMaterialLine = (id: string) => {
        setMaterialLines(materialLines.filter(line => line.id !== id))
    }

    const calculateLength = (line: MaterialLine) => {
        const { materialType, diameter, outerDiameter, innerDiameter, weight, materialDensity } = line

        if (weight <= 0 || materialDensity <= 0) return { length: 0, weightPerMeter: 0 }

        let area = 0 // in cm²

        if (materialType === 'rod') {
            // Rod (solid): Area = (π/4) × D²
            if (diameter <= 0) return { length: 0, weightPerMeter: 0 }
            const diameterCm = diameter / 10 // mm to cm
            area = (Math.PI / 4) * diameterCm * diameterCm
        } else {
            // Pipe (hollow): Area = (π/4) × (OD² - ID²)
            if (outerDiameter <= 0) return { length: 0, weightPerMeter: 0 }
            const odCm = outerDiameter / 10 // mm to cm
            const idCm = innerDiameter / 10 // mm to cm
            area = (Math.PI / 4) * (odCm * odCm - idCm * idCm)
        }

        // Weight per meter = Area (cm²) × Density (g/cm³) × 100 cm / 1000 (to convert g to kg)
        const weightPerMeter = (area * materialDensity * 100) / 1000 // kg/m

        // Length = Weight / Weight per meter
        const length = weight / weightPerMeter

        return { length, weightPerMeter }
    }

    const updateMaterialLine = (id: string, field: string, value: any) => {
        setMaterialLines(materialLines.map(line => {
            if (line.id === id) {
                const updatedLine = { ...line, [field]: value }

                // If material selection changes, update material details
                if (field === 'materialId') {
                    const material = mockRawMaterials.find(m => m.id === value)
                    if (material) {
                        updatedLine.materialName = material.materialName
                        updatedLine.grade = material.grade
                        updatedLine.diameter = material.diameter || 0
                        updatedLine.outerDiameter = material.diameter || 0

                        // Set default density based on material grade
                        if (material.grade.includes('SS') || material.grade.includes('Stainless')) {
                            updatedLine.materialDensity = 7.9
                        } else {
                            updatedLine.materialDensity = 7.85 // MS/EN8 default
                        }
                    }
                }

                // Recalculate when any dimension or weight changes
                if (field === 'weight' || field === 'diameter' || field === 'outerDiameter' ||
                    field === 'innerDiameter' || field === 'materialDensity' || field === 'materialType') {
                    const { length, weightPerMeter } = calculateLength(updatedLine)
                    updatedLine.calculatedLength = length
                    updatedLine.weightPerMeter = weightPerMeter
                }

                return updatedLine
            }
            return line
        }))
    }

    const addPiece = (lineId: string) => {
        setMaterialLines(materialLines.map(line => {
            if (line.id === lineId) {
                const newPiece: PieceBreakdown = {
                    id: `piece-${Date.now()}`,
                    length: 0,
                    quantity: 1
                }
                return {
                    ...line,
                    pieces: [...line.pieces, newPiece]
                }
            }
            return line
        }))
    }

    const removePiece = (lineId: string, pieceId: string) => {
        setMaterialLines(materialLines.map(line => {
            if (line.id === lineId) {
                return {
                    ...line,
                    pieces: line.pieces.filter(p => p.id !== pieceId)
                }
            }
            return line
        }))
    }

    const updatePiece = (lineId: string, pieceId: string, field: 'length' | 'quantity', value: number) => {
        setMaterialLines(materialLines.map(line => {
            if (line.id === lineId) {
                return {
                    ...line,
                    pieces: line.pieces.map(p =>
                        p.id === pieceId ? { ...p, [field]: value } : p
                    )
                }
            }
            return line
        }))
    }

    const getTotalPieceLength = (pieces: PieceBreakdown[]) => {
        return pieces.reduce((sum, p) => sum + (p.length * p.quantity), 0)
    }

    const getTotalPieceCount = (pieces: PieceBreakdown[]) => {
        return pieces.reduce((sum, p) => sum + p.quantity, 0)
    }

    const handleWarningProceed = async () => {
        setShowWarningDialog(false)
        setPendingSubmit(false)
        await performSubmit()
    }

    const handleWarningCancel = () => {
        setShowWarningDialog(false)
        setPendingSubmit(false)
        setWarningMessage([])
    }

    const handleSubmit = async () => {
        if (!vendorName) {
            toast.error("Please enter vendor name")
            return
        }

        if (materialLines.length === 0) {
            toast.error("Please add at least one material")
            return
        }

        // Validate each material line
        let hasLengthMismatch = false
        let mismatchDetails: string[] = []

        for (const line of materialLines) {
            if (!line.materialId) {
                toast.error("Please select material for all lines")
                return
            }
            if (line.weight <= 0) {
                toast.error("Please enter valid weight for all materials")
                return
            }

            const totalPieceLength = getTotalPieceLength(line.pieces)
            if (totalPieceLength > 0 && Math.abs(totalPieceLength - line.calculatedLength) > 0.1) {
                hasLengthMismatch = true
                mismatchDetails.push(
                    `${line.materialName}: ${totalPieceLength.toFixed(2)}m entered vs ${line.calculatedLength.toFixed(2)}m expected`
                )
            }
        }

        // Show warning if lengths don't match, but allow proceeding
        if (hasLengthMismatch) {
            setWarningMessage(mismatchDetails)
            setShowWarningDialog(true)
            setPendingSubmit(true)
            return
        }

        await performSubmit()
    }

    const performSubmit = async () => {
        setIsSubmitting(true)

        try {
            // Create GRN request payload
            // Each batch of pieces becomes a separate GRN line (since all pieces in a batch have the same length)
            const grnLines: any[] = []
            let sequenceNo = 0

            for (const line of materialLines) {
                // If no pieces specified, create one line with average length
                if (line.pieces.length === 0) {
                    sequenceNo++
                    grnLines.push({
                        sequenceNo,
                        materialId: parseInt(line.materialId.replace(/\D/g, '')) || 0, // Extract number from 'rm-1' -> 1
                        materialName: line.materialName,
                        grade: line.grade,
                        materialType: line.materialType === 'rod' ? 'Rod' : 'Pipe',
                        diameter: line.materialType === 'rod' ? Number(line.diameter) : undefined,
                        outerDiameter: line.materialType === 'pipe' ? Number(line.outerDiameter) : undefined,
                        innerDiameter: line.materialType === 'pipe' ? Number(line.innerDiameter) : undefined,
                        materialDensity: Number(line.materialDensity),
                        totalWeightKG: Number(line.weight),
                        numberOfPieces: 1,
                        lengthPerPieceMM: Number(line.calculatedLength * 1000),
                        unitPrice: 0,
                    })
                } else {
                    // Each batch becomes a separate GRN line
                    for (const batch of line.pieces) {
                        sequenceNo++
                        // Calculate weight for this batch
                        const batchLength = batch.length * batch.quantity
                        const batchWeight = (batchLength / line.calculatedLength) * line.weight

                        grnLines.push({
                            sequenceNo,
                            materialId: parseInt(line.materialId.replace(/\D/g, '')) || 0, // Extract number from 'rm-1' -> 1
                            materialName: line.materialName,
                            grade: line.grade,
                            materialType: line.materialType === 'rod' ? 'Rod' : 'Pipe',
                            diameter: line.materialType === 'rod' ? Number(line.diameter) : undefined,
                            outerDiameter: line.materialType === 'pipe' ? Number(line.outerDiameter) : undefined,
                            innerDiameter: line.materialType === 'pipe' ? Number(line.innerDiameter) : undefined,
                            materialDensity: Number(line.materialDensity),
                            totalWeightKG: Number(batchWeight),
                            numberOfPieces: Number(batch.quantity),
                            lengthPerPieceMM: Number(batch.length * 1000), // All pieces in this batch have same length
                            unitPrice: 0,
                        })
                    }
                }
            }

            const grnRequest: CreateGRNRequest = {
                grnNo: grnNumber,
                grnDate: grnDate,
                supplierName: vendorName,
                lines: grnLines,
                createdBy: 'Admin', // TODO: Get from auth context
            }

            // Debug: Log the request
            console.log('GRN Request Payload:', JSON.stringify(grnRequest, null, 2))

            // Validate no NaN values
            for (const line of grnLines) {
                if (isNaN(line.totalWeightKG) || isNaN(line.numberOfPieces) || isNaN(line.lengthPerPieceMM) || isNaN(line.materialDensity)) {
                    toast.error('Invalid numeric values detected. Please check all fields.')
                    setIsSubmitting(false)
                    return
                }
            }

            // Call API to create GRN
            const result = await grnService.create(grnRequest)

            toast.success(`GRN ${result.grnNo} created successfully!`, {
                description: `${result.totalPieces} material pieces added to inventory`,
                duration: 5000,
            })

            setIsSubmitting(false)
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error('Failed to create GRN:', error)
            toast.error('Failed to create GRN', {
                description: error instanceof Error ? error.message : 'An error occurred',
                duration: 5000,
            })
            setIsSubmitting(false)
        }
    }

    return (
        <>
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[90vw] h-[90vh] flex flex-col p-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b">
                    <DialogTitle className="text-2xl">Inward Material (GRN Entry)</DialogTitle>
                    <DialogDescription className="mt-2">
                        Record goods receipt with material details and piece breakdown
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 pb-6">
                    <div className="space-y-6 mt-4">
                    {/* GRN Header */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>GRN Number</Label>
                            <Input value={grnNumber} readOnly className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>GRN Date</Label>
                            <Input
                                type="date"
                                value={grnDate}
                                onChange={(e) => setGrnDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Vendor Name *</Label>
                            <Input
                                placeholder="Enter vendor name"
                                value={vendorName}
                                onChange={(e) => setVendorName(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Add Material Button */}
                    <div className="flex justify-between items-center border-t pt-4">
                        <h3 className="font-semibold">Materials</h3>
                        <Button type="button" onClick={addMaterialLine} size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Material
                        </Button>
                    </div>

                    {/* Material Lines */}
                    {materialLines.length === 0 ? (
                        <Card className="p-8">
                            <p className="text-center text-muted-foreground">
                                No materials added. Click "Add Material" to start.
                            </p>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {materialLines.map((line, index) => (
                                <Card key={line.id} className="p-4">
                                    <div className="space-y-4">
                                        {/* Material Header */}
                                        <div className="flex items-center justify-between">
                                            <Badge variant="outline">Material #{index + 1}</Badge>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeMaterialLine(line.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        {/* Material Selection */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Select Material *</Label>
                                                <Select
                                                    value={line.materialId}
                                                    onValueChange={(value) => updateMaterialLine(line.id, 'materialId', value)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Choose material" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {mockRawMaterials.map((material) => (
                                                            <SelectItem key={material.id} value={material.id}>
                                                                {material.materialName} - {material.grade}
                                                                {material.diameter && ` (Ø${material.diameter}mm)`}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Total Weight (kg) *</Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="Enter total weight"
                                                    value={line.weight || ''}
                                                    onChange={(e) => updateMaterialLine(line.id, 'weight', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        {/* Weight to Length Converter */}
                                        <div className="space-y-3 bg-gray-50 p-4 rounded border">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-600">
                                                    <span className="text-white text-sm">⚖️</span>
                                                </div>
                                                <Label className="text-base font-semibold">Weight to Length Converter</Label>
                                            </div>

                                            {/* Material Type Selection */}
                                            <div className="space-y-2">
                                                <Label>Material Type *</Label>
                                                <RadioGroup
                                                    value={line.materialType}
                                                    onValueChange={(value) => updateMaterialLine(line.id, 'materialType', value)}
                                                    className="flex gap-4"
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="rod" id={`rod-${line.id}`} />
                                                        <Label htmlFor={`rod-${line.id}`} className="font-normal cursor-pointer">
                                                            Rod (Solid)
                                                        </Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="pipe" id={`pipe-${line.id}`} />
                                                        <Label htmlFor={`pipe-${line.id}`} className="font-normal cursor-pointer">
                                                            Pipe (Hollow)
                                                        </Label>
                                                    </div>
                                                </RadioGroup>
                                            </div>

                                            {/* ROD Inputs */}
                                            {line.materialType === 'rod' && (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Diameter (mm) *</Label>
                                                        <Input
                                                            type="number"
                                                            step="0.1"
                                                            placeholder="Rod diameter"
                                                            value={line.diameter || ''}
                                                            onChange={(e) => updateMaterialLine(line.id, 'diameter', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Density (g/cm³)</Label>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            value={line.materialDensity || ''}
                                                            onChange={(e) => updateMaterialLine(line.id, 'materialDensity', e.target.value)}
                                                            placeholder="7.85"
                                                        />
                                                        <p className="text-xs text-muted-foreground">
                                                            MS/EN8: 7.85 | SS: 7.9
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* PIPE Inputs */}
                                            {line.materialType === 'pipe' && (
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>OD (mm) *</Label>
                                                        <Input
                                                            type="number"
                                                            step="0.1"
                                                            placeholder="Outer diameter"
                                                            value={line.outerDiameter || ''}
                                                            onChange={(e) => updateMaterialLine(line.id, 'outerDiameter', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>ID (mm) *</Label>
                                                        <Input
                                                            type="number"
                                                            step="0.1"
                                                            placeholder="Inner diameter"
                                                            value={line.innerDiameter || ''}
                                                            onChange={(e) => updateMaterialLine(line.id, 'innerDiameter', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Density (g/cm³)</Label>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            value={line.materialDensity || ''}
                                                            onChange={(e) => updateMaterialLine(line.id, 'materialDensity', e.target.value)}
                                                            placeholder="7.85"
                                                        />
                                                        <p className="text-xs text-muted-foreground">
                                                            MS: 7.85 | SS: 7.9
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Calculated Results */}
                                            <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-muted-foreground">Weight per Meter</Label>
                                                    <div className="font-semibold text-lg">
                                                        {line.weightPerMeter > 0 ? `${line.weightPerMeter.toFixed(3)} kg/m` : '—'}
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-muted-foreground">Total Length</Label>
                                                    <div className="font-semibold text-lg text-blue-600">
                                                        {line.calculatedLength > 0 ? `${line.calculatedLength.toFixed(2)} m` : '0.00 m'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Piece Breakdown */}
                                        {line.calculatedLength > 0 && (
                                            <div className="space-y-3 border-t pt-3">
                                                <div className="flex items-center justify-between">
                                                    <Label>Piece Breakdown (Physical {line.materialType === 'rod' ? 'Rods' : 'Pipes'})</Label>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => addPiece(line.id)}
                                                    >
                                                        <Plus className="mr-2 h-3 w-3" />
                                                        Add Batch
                                                    </Button>
                                                </div>

                                                {line.pieces.length > 0 && (
                                                    <div className="space-y-2">
                                                        {line.pieces.map((piece, pieceIndex) => (
                                                            <div key={piece.id} className="flex items-center gap-2">
                                                                <span className="text-sm text-muted-foreground w-20">
                                                                    Batch {pieceIndex + 1}:
                                                                </span>
                                                                <div className="flex items-center gap-2">
                                                                    <Input
                                                                        type="number"
                                                                        step="0.1"
                                                                        placeholder="Length (m)"
                                                                        value={piece.length || ''}
                                                                        onChange={(e) => updatePiece(line.id, piece.id, 'length', parseFloat(e.target.value) || 0)}
                                                                        className="w-28"
                                                                    />
                                                                    <span className="text-sm text-muted-foreground">m ×</span>
                                                                    <Input
                                                                        type="number"
                                                                        min="1"
                                                                        step="1"
                                                                        placeholder="Qty"
                                                                        value={piece.quantity || ''}
                                                                        onChange={(e) => updatePiece(line.id, piece.id, 'quantity', parseInt(e.target.value) || 1)}
                                                                        className="w-20"
                                                                    />
                                                                    <span className="text-sm text-muted-foreground">pcs</span>
                                                                    <span className="text-sm font-medium text-blue-600 w-20">
                                                                        = {(piece.length * piece.quantity).toFixed(2)}m
                                                                    </span>
                                                                </div>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => removePiece(line.id, piece.id)}
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        ))}

                                                        {/* Total Validation */}
                                                        <div className="space-y-1 pt-2 border-t">
                                                            <div className="flex items-center justify-between text-sm">
                                                                <span className="font-medium">Total Pieces:</span>
                                                                <span className="font-semibold">{getTotalPieceCount(line.pieces)} pieces</span>
                                                            </div>
                                                            <div className="flex items-center justify-between text-sm">
                                                                <span className="font-medium">Total Length:</span>
                                                                <span className={
                                                                    Math.abs(getTotalPieceLength(line.pieces) - line.calculatedLength) < 0.1
                                                                        ? 'text-green-600 font-semibold'
                                                                        : 'text-red-600 font-semibold'
                                                                }>
                                                                    {getTotalPieceLength(line.pieces).toFixed(2)} m
                                                                    {Math.abs(getTotalPieceLength(line.pieces) - line.calculatedLength) < 0.1
                                                                        ? ' ✓'
                                                                        : ` (Expected: ${line.calculatedLength.toFixed(2)}m)`
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {line.pieces.length === 0 && (
                                                    <p className="text-sm text-muted-foreground text-center py-2">
                                                        Click "Add Batch" to record {line.materialType === 'rod' ? 'rod' : 'pipe'} lengths and quantities
                                                        <br />
                                                        <span className="text-xs">Example: 6m × 5 pieces = 30m total</span>
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                    </div>
                </div>

                <DialogFooter className="px-6 py-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save GRN'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Warning Dialog */}
        <Dialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-orange-600">
                        <span className="text-2xl">⚠️</span>
                        Piece Length Mismatch Warning
                    </DialogTitle>
                    <DialogDescription className="pt-4">
                        The entered piece lengths don't match the calculated total length:
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-2 py-4">
                    {warningMessage.map((msg, index) => (
                        <div key={index} className="bg-orange-50 border border-orange-200 rounded-md p-3 text-sm">
                            {msg}
                        </div>
                    ))}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
                    <strong>Note:</strong> You can proceed with the GRN entry even if the lengths don't match exactly.
                    This is useful for partial receipts or measurement variations.
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleWarningCancel}
                        className="flex-1 sm:flex-none"
                    >
                        Go Back
                    </Button>
                    <Button
                        type="button"
                        onClick={handleWarningProceed}
                        className="flex-1 sm:flex-none"
                    >
                        Proceed Anyway
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    )
}
