"use client"

import { useState } from "react"
import { Upload, FileText, X } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { mockRawMaterials, mockProducts, mockCustomers, Drawing, ManufacturingDimensions } from "@/lib/mock-data"
import { toast } from "sonner"
import { ManufacturingDimensionsForm } from "./manufacturing-dimensions-form"

interface UploadDrawingDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function UploadDrawingDialog({ open, onOpenChange, onSuccess }: UploadDrawingDialogProps) {
    const [uploading, setUploading] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    // Form state
    const [drawingNumber, setDrawingNumber] = useState("")
    const [drawingName, setDrawingName] = useState("")
    const [partType, setPartType] = useState<Drawing['partType']>("shaft")
    const [revision, setRevision] = useState("A")
    const [status, setStatus] = useState<Drawing['status']>("draft")
    const [description, setDescription] = useState("")
    const [notes, setNotes] = useState("")
    const [linkedPartId, setLinkedPartId] = useState("")
    const [linkedProductId, setLinkedProductId] = useState("")
    const [linkedCustomerId, setLinkedCustomerId] = useState("")
    const [manufacturingDimensions, setManufacturingDimensions] = useState<Partial<ManufacturingDimensions>>({
        materialGrade: ""
    })

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // Validate file type
            const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
            if (!allowedTypes.includes(file.type)) {
                toast.error("Only PDF and image files (PNG, JPG) are allowed")
                return
            }

            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                toast.error("File size must be less than 10MB")
                return
            }

            setSelectedFile(file)
        }
    }

    const handleRemoveFile = () => {
        setSelectedFile(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!selectedFile) {
            toast.error("Please select a file to upload")
            return
        }

        if (!drawingNumber || !drawingName || !description) {
            toast.error("Please fill all required fields")
            return
        }

        // Validate manufacturing dimensions
        if (!manufacturingDimensions.materialGrade) {
            toast.error("Material Grade is required in Manufacturing Dimensions")
            return
        }

        if (partType === 'shaft' && (!manufacturingDimensions.rodDiameter || !manufacturingDimensions.finishedLength)) {
            toast.error("Rod Diameter and Finished Length are required for shaft drawings")
            return
        }

        if (partType === 'pipe' && (!manufacturingDimensions.pipeOD || !manufacturingDimensions.cutLength)) {
            toast.error("Pipe OD and Cut Length are required for pipe drawings")
            return
        }

        setUploading(true)

        // Simulate file upload and API call
        await new Promise((resolve) => setTimeout(resolve, 2000))

        console.log({
            file: selectedFile,
            drawingNumber,
            drawingName,
            partType,
            revision,
            status,
            description,
            notes,
            linkedPartId,
            linkedProductId,
            linkedCustomerId,
            manufacturingDimensions
        })

        toast.success(`Drawing "${drawingNumber}" uploaded successfully`)
        setUploading(false)
        resetForm()
        onSuccess()
        onOpenChange(false)
    }

    const resetForm = () => {
        setSelectedFile(null)
        setDrawingNumber("")
        setDrawingName("")
        setPartType("shaft")
        setRevision("A")
        setStatus("draft")
        setDescription("")
        setNotes("")
        setLinkedPartId("")
        setLinkedProductId("")
        setLinkedCustomerId("")
        setManufacturingDimensions({ materialGrade: "" })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[90vw] h-[90vh] flex flex-col p-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b">
                    <DialogTitle className="text-2xl">Upload Drawing</DialogTitle>
                    <DialogDescription className="mt-2">
                        Upload a single drawing file (PDF or image) with details and manufacturing dimensions
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
                    <div className="flex-1 overflow-y-auto px-6 pb-6">
                        <div className="space-y-6 mt-4">
                        {/* File Upload Section */}
                        <div className="space-y-3">
                            <Label>Drawing File *</Label>
                            <div className="border-2 border-dashed rounded-lg p-6">
                                {!selectedFile ? (
                                    <div className="text-center space-y-3">
                                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                        <div>
                                            <label htmlFor="file-upload" className="cursor-pointer">
                                                <span className="text-blue-600 hover:text-blue-700 font-medium">
                                                    Click to upload
                                                </span>
                                                <span className="text-gray-600"> or drag and drop</span>
                                            </label>
                                            <Input
                                                id="file-upload"
                                                type="file"
                                                className="hidden"
                                                accept=".pdf,.png,.jpg,.jpeg"
                                                onChange={handleFileSelect}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            PDF, PNG, JPG up to 10MB
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded">
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-8 w-8 text-blue-600" />
                                            <div>
                                                <div className="font-medium">{selectedFile.name}</div>
                                                <div className="text-xs text-gray-500">
                                                    {(selectedFile.size / 1024).toFixed(2)} KB
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleRemoveFile}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Basic Information */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
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
                                    rows={2}
                                />
                            </div>
                        </div>

                        {/* Classification */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Part Type *</Label>
                                <Select value={partType} onValueChange={(value) => setPartType(value as Drawing['partType'])}>
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

                            <div className="space-y-2">
                                <Label htmlFor="revision">Revision *</Label>
                                <Input
                                    id="revision"
                                    placeholder="A, B, C"
                                    value={revision}
                                    onChange={(e) => setRevision(e.target.value)}
                                    required
                                    maxLength={3}
                                    className="font-mono"
                                />
                            </div>

                            <div className="space-y-2">
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
                                </RadioGroup>
                            </div>
                        </div>

                        {/* Linking (Optional) */}
                        <div className="space-y-3">
                            <Label className="text-sm font-semibold">Link to (Optional)</Label>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs">Part</Label>
                                    <Select value={linkedPartId || undefined} onValueChange={setLinkedPartId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="None" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {mockRawMaterials.slice(0, 5).map((material) => (
                                                <SelectItem key={material.id} value={material.id}>
                                                    {material.materialName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs">Product/Roller</Label>
                                    <Select value={linkedProductId || undefined} onValueChange={setLinkedProductId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="None" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {mockProducts.slice(0, 5).map((product) => (
                                                <SelectItem key={product.id} value={product.id}>
                                                    {product.modelName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs">Customer</Label>
                                    <Select value={linkedCustomerId || undefined} onValueChange={setLinkedCustomerId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="None" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {mockCustomers.slice(0, 5).map((customer) => (
                                                <SelectItem key={customer.id} value={customer.id}>
                                                    {customer.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Manufacturing Dimensions - CRITICAL */}
                        <ManufacturingDimensionsForm
                            partType={partType}
                            dimensions={manufacturingDimensions}
                            onChange={setManufacturingDimensions}
                        />
                        </div>
                    </div>

                    <DialogFooter className="px-6 py-4 border-t">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={uploading}>
                            <Upload className="mr-2 h-4 w-4" />
                            {uploading ? "Uploading..." : "Upload Drawing"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
