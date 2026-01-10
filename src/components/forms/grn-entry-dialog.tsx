"use client"

import { useState, useEffect } from "react"
import { Calendar, AlertTriangle, Calculator, Scale, Ruler, CheckCircle2, FileText, Truck } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { mockRawMaterials } from "@/lib/mock-data"
import { RawMaterial } from "@/types"
import { toast } from "sonner"

interface GRNEntryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function GRNEntryDialog({ open, onOpenChange, onSuccess }: GRNEntryDialogProps) {
    // Form State
    const [selectedMaterialId, setSelectedMaterialId] = useState<string>("")
    const [supplierName, setSupplierName] = useState("")
    const [challanNo, setChallanNo] = useState("")
    const [heatNumber, setHeatNumber] = useState("")
    const [entryMode, setEntryMode] = useState<"standard" | "cut-piece">("standard")

    // Measurement State
    const [weightInput, setWeightInput] = useState<string>("")
    const [quantityInput, setQuantityInput] = useState<string>("1")

    // Cut Piece Specifics
    const [cutDiameter, setCutDiameter] = useState<string>("")
    const [cutLength, setCutLength] = useState<string>("") // mm

    // Validation State
    const [calculatedValue, setCalculatedValue] = useState<number | null>(null)
    const [variance, setVariance] = useState<number>(0)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Derived
    const selectedMaterial = mockRawMaterials.find(m => m.id === selectedMaterialId)

    // Reset form on open
    useEffect(() => {
        if (open) {
            setSupplierName("")
            setChallanNo("")
            setHeatNumber("")
            setWeightInput("")
            setQuantityInput("1")
            setCutDiameter("")
            setCutLength("")
            setCalculatedValue(null)
            setVariance(0)
        }
    }, [open])

    // Auto-Calculation Logic
    useEffect(() => {
        if (!selectedMaterial) return

        const weight = parseFloat(weightInput) || 0
        const qty = parseInt(quantityInput) || 1
        const diameter = parseFloat(cutDiameter) || selectedMaterial.diameter || 0
        const length = parseFloat(cutLength) || 0

        const DENSITY_STEEL_G_CM3 = 7.85

        if (entryMode === "standard") {
            // Standard Mode: Have Weight -> Calculate Length
            if (weight > 0 && diameter > 0) {
                // Length (m) = Weight / (Dia^2 * 0.00617)
                const specificWeightPerMeter = (diameter * diameter * 0.00617) // kg/m
                const expectedLengthMeters = weight / specificWeightPerMeter
                setCalculatedValue(expectedLengthMeters * 1000) // Convert to mm
            }
        } else {
            // Cut Piece Mode: Have Length -> Calculate Weight
            if (length > 0 && diameter > 0) {
                // Weight = Length(m) * (Dia^2 * 0.00617)
                const specificWeightPerMeter = (diameter * diameter * 0.00617) // kg/m
                const expectedWeight = (length / 1000) * specificWeightPerMeter * qty
                setCalculatedValue(expectedWeight)

                if (weight > 0) {
                    const diff = Math.abs(weight - expectedWeight)
                    setVariance((diff / expectedWeight) * 100)
                }
            }
        }
    }, [entryMode, weightInput, cutLength, cutDiameter, quantityInput, selectedMaterialId])

    const handleSubmit = async () => {
        if (!selectedMaterial || !supplierName || !heatNumber) {
            toast.error("Please fill all mandatory fields")
            return
        }

        setIsSubmitting(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))

        toast.success("Material Inwarded Successfully", {
            description: `Generated ${quantityInput} IDs for ${selectedMaterial.materialName}`
        })

        setIsSubmitting(false)
        onSuccess()
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[90vw] h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 pb-2 border-b shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Truck className="h-6 w-6 text-primary" />
                        Inward Material (GRN)
                    </DialogTitle>
                    <DialogDescription>
                        Record receipt of raw material with heat number and dimension validation.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Section 1: Supplier & Traceability */}
                        <div className="space-y-4">
                            <h3 className="font-semibold flex items-center gap-2 text-sm text-muted-foreground border-b pb-1">
                                <FileText className="h-4 w-4" /> Supplier & Traceability
                            </h3>

                            <div className="space-y-2">
                                <Label>Material Selection <span className="text-destructive">*</span></Label>
                                <Select value={selectedMaterialId} onValueChange={setSelectedMaterialId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Material" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {mockRawMaterials.map(m => (
                                            <SelectItem key={m.id} value={m.id}>
                                                {m.materialName} ({m.grade}) - {m.shape}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Supplier Name <span className="text-destructive">*</span></Label>
                                    <Input placeholder="e.g. Tata Steel" value={supplierName} onChange={e => setSupplierName(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Challan / Invoice No</Label>
                                    <Input placeholder="e.g. CH-2025-001" value={challanNo} onChange={e => setChallanNo(e.target.value)} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-blue-600 font-semibold">Heat / Batch Number <span className="text-destructive">*</span></Label>
                                <Input
                                    placeholder="CRITICAL: Stamped Heat No"
                                    value={heatNumber}
                                    onChange={e => setHeatNumber(e.target.value)}
                                    className="border-blue-200 focus:border-blue-500 bg-blue-50/50"
                                />
                                <p className="text-xs text-muted-foreground">This ID will follow the material through production.</p>
                            </div>
                        </div>

                        {/* Section 2: Validation & Entry */}
                        <div className="space-y-4">
                            <h3 className="font-semibold flex items-center gap-2 text-sm text-muted-foreground border-b pb-1">
                                <Scale className="h-4 w-4" /> Measurement & Validation
                            </h3>

                            {/* Mode Toggle */}
                            <div className="flex gap-2 p-1 bg-muted rounded-lg">
                                <Button
                                    variant={entryMode === "standard" ? "default" : "ghost"}
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => setEntryMode("standard")}
                                >
                                    Standard (Weight)
                                </Button>
                                <Button
                                    variant={entryMode === "cut-piece" ? "default" : "ghost"}
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => setEntryMode("cut-piece")}
                                >
                                    Cut Piece (Dim)
                                </Button>
                            </div>

                            {/* Dynamic Inputs */}
                            {entryMode === "standard" ? (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                    <div className="space-y-2">
                                        <Label>Total Received Weight (kg) <span className="text-destructive">*</span></Label>
                                        <Input type="number" value={weightInput} onChange={e => setWeightInput(e.target.value)} />
                                    </div>
                                    {calculatedValue !== null && (
                                        <Card className="bg-muted/50 border-dashed">
                                            <CardContent className="pt-4 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Calculator className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-sm font-medium">Est. Total Length:</span>
                                                </div>
                                                <span className="text-xl font-bold text-primary">{(calculatedValue / 1000).toFixed(2)} m</span>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Diameter (mm)</Label>
                                            <Input
                                                type="number"
                                                value={cutDiameter}
                                                onChange={e => setCutDiameter(e.target.value)}
                                                placeholder={selectedMaterial?.diameter?.toString() || ""}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Cut Length (mm)</Label>
                                            <Input type="number" value={cutLength} onChange={e => setCutLength(e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Quantity (Nos)</Label>
                                            <Input type="number" value={quantityInput} onChange={e => setQuantityInput(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Inv/Bill Weight (kg)</Label>
                                            <Input type="number" value={weightInput} onChange={e => setWeightInput(e.target.value)} />
                                        </div>
                                    </div>

                                    {calculatedValue !== null && (
                                        <Card className={`border-l-4 ${variance > 5 ? 'border-l-destructive bg-destructive/10' : 'border-l-green-500 bg-green-50/50'}`}>
                                            <CardContent className="pt-4 space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-muted-foreground">Formula Weight:</span>
                                                    <span className="font-mono font-bold">{calculatedValue.toFixed(3)} kg</span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-muted-foreground">Variance:</span>
                                                    <span className={`${variance > 5 ? 'text-destructive' : 'text-green-600'} font-bold`}>
                                                        {variance.toFixed(1)}% {variance > 5 ? '(Abnormal)' : '(OK)'}
                                                    </span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            )}

                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 border-t shrink-0 sm:justify-between items-center bg-muted/10">
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                        {variance > 5 && entryMode === "cut-piece" && (
                            <span className="text-destructive flex items-center gap-1 font-medium">
                                <AlertTriangle className="h-4 w-4" /> Verify Weight!
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? "Processing..." : (
                                <span className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4" /> Confirm & Inward
                                </span>
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
