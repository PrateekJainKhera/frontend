"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { mockRawMaterials } from "@/lib/mock-data"
import { toast } from "sonner"

interface GRNEntryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

interface PieceBreakdown {
    id: string
    length: number // in meters
}

interface MaterialLine {
    id: string
    materialId: string
    materialName: string
    grade: string
    diameter: number
    weight: number
    calculatedLength: number
    pieces: PieceBreakdown[]
    densityFormula: string // Editable formula
}

export function GRNEntryDialog({ open, onOpenChange, onSuccess }: GRNEntryDialogProps) {
    const [grnNumber, setGrnNumber] = useState("")
    const [grnDate, setGrnDate] = useState("")
    const [vendorName, setVendorName] = useState("")
    const [materialLines, setMaterialLines] = useState<MaterialLine[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)

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
            diameter: 0,
            weight: 0,
            calculatedLength: 0,
            pieces: [],
            densityFormula: "weight / (diameter * diameter * 0.00617)" // Default formula
        }
        setMaterialLines([...materialLines, newLine])
    }

    const removeMaterialLine = (id: string) => {
        setMaterialLines(materialLines.filter(line => line.id !== id))
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
                    }
                }

                // Recalculate length when weight or diameter changes
                if (field === 'weight' || field === 'diameter') {
                    const weight = field === 'weight' ? parseFloat(value) || 0 : updatedLine.weight
                    const diameter = field === 'diameter' ? parseFloat(value) || 0 : updatedLine.diameter

                    if (weight > 0 && diameter > 0) {
                        // Formula: Length (m) = Weight / (Diameter^2 * 0.00617)
                        updatedLine.calculatedLength = weight / (diameter * diameter * 0.00617)
                    }
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
                    length: 0
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

    const updatePiece = (lineId: string, pieceId: string, length: number) => {
        setMaterialLines(materialLines.map(line => {
            if (line.id === lineId) {
                return {
                    ...line,
                    pieces: line.pieces.map(p =>
                        p.id === pieceId ? { ...p, length } : p
                    )
                }
            }
            return line
        }))
    }

    const getTotalPieceLength = (pieces: PieceBreakdown[]) => {
        return pieces.reduce((sum, p) => sum + p.length, 0)
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
                toast.error(`Piece lengths don't match calculated length for ${line.materialName}`)
                return
            }
        }

        setIsSubmitting(true)

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))

        toast.success("GRN saved successfully")
        setIsSubmitting(false)
        onSuccess()
        onOpenChange(false)
    }

    return (
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
                                        <div className="grid grid-cols-3 gap-4">
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
                                                <Label>Weight (kg) *</Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="Enter weight"
                                                    value={line.weight || ''}
                                                    onChange={(e) => updateMaterialLine(line.id, 'weight', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Calculated Length (m)</Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={line.calculatedLength > 0 ? line.calculatedLength.toFixed(2) : ''}
                                                    readOnly
                                                    className="bg-blue-50 font-semibold text-blue-700"
                                                    placeholder="Auto-calculated"
                                                />
                                            </div>
                                        </div>

                                        {/* Editable Formula */}
                                        <div className="space-y-2 bg-gray-50 p-3 rounded border">
                                            <Label>Length Calculation Formula (editable)</Label>
                                            <Input
                                                placeholder="e.g., weight / (diameter * diameter * 0.00617)"
                                                value={line.densityFormula}
                                                onChange={(e) => updateMaterialLine(line.id, 'densityFormula', e.target.value)}
                                                className="font-mono text-sm"
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Variables: weight (kg), diameter (mm). Result in meters.
                                            </p>
                                        </div>

                                        {/* Piece Breakdown */}
                                        {line.calculatedLength > 0 && (
                                            <div className="space-y-3 border-t pt-3">
                                                <div className="flex items-center justify-between">
                                                    <Label>Piece Breakdown (optional)</Label>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => addPiece(line.id)}
                                                    >
                                                        <Plus className="mr-2 h-3 w-3" />
                                                        Add Piece
                                                    </Button>
                                                </div>

                                                {line.pieces.length > 0 && (
                                                    <div className="space-y-2">
                                                        {line.pieces.map((piece, pieceIndex) => (
                                                            <div key={piece.id} className="flex items-center gap-2">
                                                                <span className="text-sm text-muted-foreground w-16">
                                                                    Piece {pieceIndex + 1}:
                                                                </span>
                                                                <Input
                                                                    type="number"
                                                                    step="0.1"
                                                                    placeholder="Length (m)"
                                                                    value={piece.length || ''}
                                                                    onChange={(e) => updatePiece(line.id, piece.id, parseFloat(e.target.value) || 0)}
                                                                    className="w-32"
                                                                />
                                                                <span className="text-sm">m</span>
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
                                                        <div className="flex items-center justify-between text-sm pt-2 border-t">
                                                            <span className="font-medium">Total Pieces:</span>
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
    )
}
