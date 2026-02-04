"use client"

import { useState } from "react"
import { Upload, FileText, X, CheckCircle, AlertCircle, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { mockProducts, mockCustomers, Drawing } from "@/lib/mock-data"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface FileWithMetadata {
    file: File
    id: string
    drawingName: string
    drawingType: Drawing['drawingType']
    revision: string
    revisionDate: string
    status: 'pending' | 'uploading' | 'success' | 'error'
    progress: number
    error?: string
}

interface BulkUploadDrawingsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

// Helper to extract drawing name from filename
const extractDrawingName = (filename: string): string => {
    // Remove extension
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, "")
    // Replace dashes/underscores with spaces and capitalize
    return nameWithoutExt
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase())
}

export function BulkUploadDrawingsDialog({ open, onOpenChange, onSuccess }: BulkUploadDrawingsDialogProps) {
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [files, setFiles] = useState<FileWithMetadata[]>([])

    // Common metadata for all drawings
    const [linkedProductId, setLinkedProductId] = useState("")
    const [linkedCustomerId, setLinkedCustomerId] = useState("")
    const [defaultStatus, setDefaultStatus] = useState<'draft' | 'approved'>("draft")

    const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || [])

        if (selectedFiles.length === 0) return

        // Validate files
        const validFiles: FileWithMetadata[] = []
        const errors: string[] = []
        const today = new Date().toISOString().split('T')[0]

        selectedFiles.forEach((file) => {
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
                drawingName: extractDrawingName(file.name),
                drawingType: 'shaft', // default
                revision: 'A',
                revisionDate: today,
                status: 'pending',
                progress: 0
            })
        })

        if (errors.length > 0) {
            toast.error(`${errors.length} file(s) rejected: ${errors[0]}`)
        }

        if (validFiles.length > 0) {
            setFiles((prev) => [...prev, ...validFiles])
            toast.success(`${validFiles.length} file(s) added`)
        }

        // Reset input
        e.target.value = ''
    }

    const handleRemoveFile = (id: string) => {
        setFiles((prev) => prev.filter((f) => f.id !== id))
    }

    const updateFileMetadata = (id: string, field: keyof FileWithMetadata, value: string) => {
        setFiles((prev) =>
            prev.map((f) =>
                f.id === id ? { ...f, [field]: value } : f
            )
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (files.length === 0) {
            toast.error("Please select at least one file to upload")
            return
        }

        if (!linkedProductId) {
            toast.error("Please select a product/roller model")
            return
        }

        // Validate each file has a drawing name
        const missingNames = files.filter(f => !f.drawingName.trim())
        if (missingNames.length > 0) {
            toast.error("Please enter drawing name for all files")
            return
        }

        setUploading(true)
        setUploadProgress(0)

        // Simulate uploading files one by one
        for (let i = 0; i < files.length; i++) {
            const file = files[i]

            // Update status to uploading
            setFiles((prev) =>
                prev.map((f) =>
                    f.id === file.id ? { ...f, status: 'uploading' as const } : f
                )
            )

            // Simulate upload with progress
            for (let progress = 0; progress <= 100; progress += 20) {
                await new Promise((resolve) => setTimeout(resolve, 100))
                setFiles((prev) =>
                    prev.map((f) =>
                        f.id === file.id ? { ...f, progress } : f
                    )
                )
            }

            // Simulate success (100% success for demo)
            setFiles((prev) =>
                prev.map((f) =>
                    f.id === file.id
                        ? {
                            ...f,
                            status: 'success' as const,
                            progress: 100
                        }
                        : f
                )
            )

            // Update overall progress
            setUploadProgress(((i + 1) / files.length) * 100)
        }

        // Log the data that would be sent to backend
        console.log('Bulk Upload Data:', {
            linkedProductId,
            linkedCustomerId,
            defaultStatus,
            files: files.map(f => ({
                fileName: f.file.name,
                drawingName: f.drawingName,
                drawingType: f.drawingType,
                revision: f.revision,
                revisionDate: f.revisionDate,
                fileSize: f.file.size
            }))
        })

        toast.success(`All ${files.length} drawings uploaded successfully`)
        setUploading(false)

        // Auto-close after success
        setTimeout(() => {
            resetForm()
            onSuccess()
            onOpenChange(false)
        }, 1000)
    }

    const resetForm = () => {
        setFiles([])
        setLinkedProductId("")
        setLinkedCustomerId("")
        setDefaultStatus("draft")
        setUploadProgress(0)
    }

    const getStatusIcon = (status: FileWithMetadata['status']) => {
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
            <DialogContent className="sm:max-w-[95vw] max-h-[90vh] flex flex-col p-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b">
                    <DialogTitle className="text-2xl">Bulk Upload Drawings</DialogTitle>
                    <DialogDescription className="mt-2">
                        Upload multiple drawing files for a roller model. You can set metadata for each file individually.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto px-6 pb-6">
                        <div className="space-y-6 mt-4">
                            {/* Common Metadata */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-blue-600" />
                                    <Label className="font-semibold">Common Settings (applies to all)</Label>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Product/Roller Model *</Label>
                                        <Select value={linkedProductId} onValueChange={setLinkedProductId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select roller model" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {mockProducts.map((product) => (
                                                    <SelectItem key={product.id} value={product.id.toString()}>
                                                        {product.modelName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Customer (Optional)</Label>
                                        <Select value={linkedCustomerId || "none"} onValueChange={(v) => setLinkedCustomerId(v === "none" ? "" : v)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="None" />
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

                            {/* Per-File Metadata Table */}
                            {files.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-lg">
                                            Drawing Details ({files.length} files)
                                        </Label>
                                        {!uploading && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setFiles([])}
                                            >
                                                Clear All
                                            </Button>
                                        )}
                                    </div>

                                    <div className="border rounded-lg overflow-hidden">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-muted/50">
                                                    <TableHead className="w-[40px]">#</TableHead>
                                                    <TableHead className="w-[180px]">File</TableHead>
                                                    <TableHead className="min-w-[200px]">Drawing Name</TableHead>
                                                    <TableHead className="w-[140px]">Part Type</TableHead>
                                                    <TableHead className="w-[80px]">Rev</TableHead>
                                                    <TableHead className="w-[140px]">Rev. Date</TableHead>
                                                    <TableHead className="w-[80px]">Status</TableHead>
                                                    <TableHead className="w-[60px]"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {files.map((file, index) => (
                                                    <TableRow key={file.id} className={file.status === 'success' ? 'bg-green-50' : ''}>
                                                        <TableCell className="font-medium text-muted-foreground">
                                                            {index + 1}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                {getStatusIcon(file.status)}
                                                                <div className="truncate max-w-[140px]" title={file.file.name}>
                                                                    {file.file.name}
                                                                </div>
                                                            </div>
                                                            {file.status === 'uploading' && (
                                                                <Progress value={file.progress} className="h-1 mt-1" />
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                value={file.drawingName}
                                                                onChange={(e) => updateFileMetadata(file.id, 'drawingName', e.target.value)}
                                                                placeholder="Enter drawing name"
                                                                disabled={uploading}
                                                                className="h-8"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Select
                                                                value={file.drawingType}
                                                                onValueChange={(v) => updateFileMetadata(file.id, 'drawingType', v)}
                                                                disabled={uploading}
                                                            >
                                                                <SelectTrigger className="h-8">
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
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                value={file.revision}
                                                                onChange={(e) => updateFileMetadata(file.id, 'revision', e.target.value)}
                                                                placeholder="A"
                                                                maxLength={3}
                                                                disabled={uploading}
                                                                className="h-8 font-mono text-center"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="date"
                                                                value={file.revisionDate}
                                                                onChange={(e) => updateFileMetadata(file.id, 'revisionDate', e.target.value)}
                                                                disabled={uploading}
                                                                className="h-8"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            {file.status === 'pending' && (
                                                                <Badge variant="outline">Pending</Badge>
                                                            )}
                                                            {file.status === 'uploading' && (
                                                                <Badge className="bg-blue-100 text-blue-700">Uploading</Badge>
                                                            )}
                                                            {file.status === 'success' && (
                                                                <Badge className="bg-green-100 text-green-700">Done</Badge>
                                                            )}
                                                            {file.status === 'error' && (
                                                                <Badge className="bg-red-100 text-red-700">Failed</Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {!uploading && file.status === 'pending' && (
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                    onClick={() => handleRemoveFile(file.id)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
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
                            {files.length === 0 && (
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                    <p className="text-sm text-gray-700">
                                        <strong>💡 Tip:</strong> After selecting files, you can edit the drawing name,
                                        part type, revision and date for each file individually before uploading.
                                    </p>
                                </div>
                            )}
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
                        <Button type="submit" disabled={uploading || files.length === 0}>
                            <Upload className="mr-2 h-4 w-4" />
                            {uploading ? "Uploading..." : `Upload ${files.length} Drawing${files.length !== 1 ? 's' : ''}`}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
