"use client"

import { useState } from "react"
import { Upload, FileText, X, CheckCircle, AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { mockProducts, mockCustomers, ManufacturingDimensions } from "@/lib/mock-data"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"
import { ManufacturingDimensionsForm } from "./manufacturing-dimensions-form"

interface UploadedFile {
    file: File
    id: string
    status: 'pending' | 'uploading' | 'success' | 'error'
    progress: number
    error?: string
}

interface BulkUploadDrawingsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function BulkUploadDrawingsDialog({ open, onOpenChange, onSuccess }: BulkUploadDrawingsDialogProps) {
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [selectedFiles, setSelectedFiles] = useState<UploadedFile[]>([])

    // Common metadata for all drawings
    const [linkedProductId, setLinkedProductId] = useState("")
    const [linkedCustomerId, setLinkedCustomerId] = useState("")
    const [defaultStatus, setDefaultStatus] = useState<'draft' | 'approved'>("draft")
    const [partType, setPartType] = useState<'shaft' | 'pipe' | 'final' | 'gear' | 'bushing' | 'roller' | 'other'>("shaft")
    const [manufacturingDimensions, setManufacturingDimensions] = useState<Partial<ManufacturingDimensions>>({
        materialGrade: ""
    })

    const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])

        if (files.length === 0) return

        // Validate files
        const validFiles: UploadedFile[] = []
        const errors: string[] = []

        files.forEach((file) => {
            // Validate file type
            const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
            if (!allowedTypes.includes(file.type)) {
                errors.push(`${file.name}: Invalid file type (only PDF, PNG, JPG allowed)`)
                return
            }

            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                errors.push(`${file.name}: File too large (max 10MB)`)
                return
            }

            validFiles.push({
                file,
                id: `${Date.now()}-${Math.random()}`,
                status: 'pending',
                progress: 0
            })
        })

        if (errors.length > 0) {
            toast.error(`${errors.length} file(s) rejected: ${errors[0]}`)
        }

        if (validFiles.length > 0) {
            setSelectedFiles((prev) => [...prev, ...validFiles])
            toast.success(`${validFiles.length} file(s) added`)
        }
    }

    const handleRemoveFile = (id: string) => {
        setSelectedFiles((prev) => prev.filter((f) => f.id !== id))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (selectedFiles.length === 0) {
            toast.error("Please select at least one file to upload")
            return
        }

        if (!linkedProductId) {
            toast.error("Please select a product/roller model")
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
        setUploadProgress(0)

        // Simulate uploading files one by one
        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i]

            // Update status to uploading
            setSelectedFiles((prev) =>
                prev.map((f) =>
                    f.id === file.id ? { ...f, status: 'uploading' as const } : f
                )
            )

            // Simulate upload with progress
            for (let progress = 0; progress <= 100; progress += 20) {
                await new Promise((resolve) => setTimeout(resolve, 100))
                setSelectedFiles((prev) =>
                    prev.map((f) =>
                        f.id === file.id ? { ...f, progress } : f
                    )
                )
            }

            // Simulate success/error (90% success rate)
            const success = Math.random() > 0.1

            setSelectedFiles((prev) =>
                prev.map((f) =>
                    f.id === file.id
                        ? {
                              ...f,
                              status: success ? ('success' as const) : ('error' as const),
                              progress: 100,
                              error: success ? undefined : 'Upload failed'
                          }
                        : f
                )
            )

            // Update overall progress
            setUploadProgress(((i + 1) / selectedFiles.length) * 100)
        }

        const successCount = selectedFiles.filter((f) => f.status === 'success').length
        const errorCount = selectedFiles.filter((f) => f.status === 'error').length

        if (errorCount === 0) {
            toast.success(`All ${successCount} drawings uploaded successfully`)
        } else {
            toast.warning(`${successCount} drawings uploaded, ${errorCount} failed`)
        }

        setUploading(false)

        // Auto-close if all successful
        if (errorCount === 0) {
            setTimeout(() => {
                resetForm()
                onSuccess()
                onOpenChange(false)
            }, 1000)
        }
    }

    const resetForm = () => {
        setSelectedFiles([])
        setLinkedProductId("")
        setLinkedCustomerId("")
        setDefaultStatus("draft")
        setPartType("shaft")
        setManufacturingDimensions({ materialGrade: "" })
        setUploadProgress(0)
    }

    const getStatusIcon = (status: UploadedFile['status']) => {
        switch (status) {
            case 'success':
                return <CheckCircle className="h-4 w-4 text-green-600" />
            case 'error':
                return <AlertCircle className="h-4 w-4 text-red-600" />
            case 'uploading':
                return <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            default:
                return <FileText className="h-4 w-4 text-gray-400" />
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[90vw] max-h-[90vh] flex flex-col p-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b">
                    <DialogTitle className="text-2xl">Bulk Upload Drawings</DialogTitle>
                    <DialogDescription className="mt-2">
                        Upload multiple drawing files for one roller model at once
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
                    <div className="flex-1 overflow-y-auto px-6 pb-6">
                        <div className="space-y-6 mt-4">
                            {/* Common Metadata */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-blue-600" />
                                    <Label className="font-semibold">Common Information for All Drawings</Label>
                                </div>

                                <div className="grid grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <Label>Product/Roller Model *</Label>
                                        <Select value={linkedProductId} onValueChange={setLinkedProductId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select roller model" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {mockProducts.map((product) => (
                                                    <SelectItem key={product.id} value={product.id}>
                                                        {product.modelName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-blue-700">
                                            All drawings will be linked to this roller model
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Part Type *</Label>
                                        <Select value={partType} onValueChange={(value) => setPartType(value as typeof partType)}>
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
                                        <p className="text-xs text-blue-700">
                                            Common part type for all drawings
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Customer (Optional)</Label>
                                        <Select value={linkedCustomerId || undefined} onValueChange={setLinkedCustomerId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="None" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {mockCustomers.map((customer) => (
                                                    <SelectItem key={customer.id} value={customer.id}>
                                                        {customer.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Default Status</Label>
                                        <Select value={defaultStatus} onValueChange={(value) => setDefaultStatus(value as 'draft' | 'approved')}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="draft">Draft</SelectItem>
                                                <SelectItem value="approved">Approved</SelectItem>
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

                            {/* File Upload Section */}
                            <div className="space-y-3">
                                <Label>Select Drawing Files</Label>
                                <div className="border-2 border-dashed rounded-lg p-6">
                                    <div className="text-center space-y-3">
                                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                        <div>
                                            <label htmlFor="bulk-file-upload" className="cursor-pointer">
                                                <span className="text-blue-600 hover:text-blue-700 font-medium">
                                                    Click to select multiple files
                                                </span>
                                                <span className="text-gray-600"> or drag and drop</span>
                                            </label>
                                            <Input
                                                id="bulk-file-upload"
                                                type="file"
                                                className="hidden"
                                                accept=".pdf,.png,.jpg,.jpeg"
                                                multiple
                                                onChange={handleFilesSelect}
                                                disabled={uploading}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            PDF, PNG, JPG up to 10MB each • Select multiple files
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Selected Files List */}
                            {selectedFiles.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label>
                                            Selected Files ({selectedFiles.length})
                                        </Label>
                                        {!uploading && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSelectedFiles([])}
                                            >
                                                Clear All
                                            </Button>
                                        )}
                                    </div>

                                    <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                                        {selectedFiles.map((uploadFile) => (
                                            <div key={uploadFile.id} className="p-3 hover:bg-gray-50">
                                                <div className="flex items-center gap-3">
                                                    {getStatusIcon(uploadFile.status)}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between">
                                                            <div className="font-medium truncate">
                                                                {uploadFile.file.name}
                                                            </div>
                                                            <Badge variant="outline" className="ml-2">
                                                                {(uploadFile.file.size / 1024).toFixed(1)} KB
                                                            </Badge>
                                                        </div>

                                                        {uploadFile.status === 'uploading' && (
                                                            <div className="mt-2">
                                                                <Progress value={uploadFile.progress} className="h-1" />
                                                            </div>
                                                        )}

                                                        {uploadFile.status === 'error' && uploadFile.error && (
                                                            <div className="text-xs text-red-600 mt-1">
                                                                {uploadFile.error}
                                                            </div>
                                                        )}

                                                        {uploadFile.status === 'success' && (
                                                            <div className="text-xs text-green-600 mt-1">
                                                                Uploaded successfully
                                                            </div>
                                                        )}
                                                    </div>
                                                    {!uploading && uploadFile.status === 'pending' && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleRemoveFile(uploadFile.id)}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Overall Progress */}
                            {uploading && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium">Upload Progress</span>
                                        <span className="text-blue-600">{Math.round(uploadProgress)}%</span>
                                    </div>
                                    <Progress value={uploadProgress} className="h-2" />
                                </div>
                            )}

                            {/* Info Box */}
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <p className="text-sm text-gray-700">
                                    <strong>💡 Tip:</strong> Upload all drawings related to one roller model together.
                                    The system will extract drawing numbers from filenames if possible.
                                </p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="px-6 py-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={uploading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={uploading || selectedFiles.length === 0}>
                            <Upload className="mr-2 h-4 w-4" />
                            {uploading ? "Uploading..." : `Upload ${selectedFiles.length} Drawing${selectedFiles.length !== 1 ? 's' : ''}`}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
