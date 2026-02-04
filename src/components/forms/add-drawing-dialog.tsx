"use client"

import { useState } from "react"
import { Upload, FileText, X, FileUp, Files, CheckCircle, AlertCircle, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { mockRawMaterials, mockProducts, mockCustomers, Drawing, ManufacturingDimensions } from "@/lib/mock-data"
import { toast } from "sonner"
import { ManufacturingDimensionsForm } from "./manufacturing-dimensions-form"
import { drawingService, BulkUploadResult } from "@/lib/api/drawings"

interface AddDrawingDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function AddDrawingDialog({ open, onOpenChange, onSuccess }: AddDrawingDialogProps) {
    const [uploading, setUploading] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    // Single upload form state
    const [drawingNumber, setDrawingNumber] = useState("")
    const [drawingName, setDrawingName] = useState("")
    const [drawingType, setDrawingType] = useState<Drawing['drawingType']>("shaft")
    const [revision, setRevision] = useState("A")
    const [revisionDate, setRevisionDate] = useState(new Date().toISOString().split('T')[0])
    const [status, setStatus] = useState<Drawing['status']>("draft")
    const [description, setDescription] = useState("")
    const [notes, setNotes] = useState("")
    const [linkedPartId, setLinkedPartId] = useState("")
    const [linkedProductId, setLinkedProductId] = useState("")
    const [linkedCustomerId, setLinkedCustomerId] = useState("")
    const [manufacturingDimensions, setManufacturingDimensions] = useState<Partial<ManufacturingDimensions>>({
        materialGrade: ""
    })

    // Bulk upload state
    const [bulkFiles, setBulkFiles] = useState<File[]>([])
    const [bulkLinkedProductId, setBulkLinkedProductId] = useState("")
    const [bulkLinkedCustomerId, setBulkLinkedCustomerId] = useState("")
    const [bulkResults, setBulkResults] = useState<BulkUploadResult[]>([])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
            if (!allowedTypes.includes(file.type)) {
                toast.error("Only PDF and image files (PNG, JPG) are allowed")
                return
            }
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

    // Single upload submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!selectedFile) {
            toast.error("Please select a file to upload")
            return
        }

        if (!drawingName || !description) {
            toast.error("Please fill all required fields")
            return
        }

        setUploading(true)

        try {
            const hasDimensions = Object.values(manufacturingDimensions).some(v => v !== "" && v !== 0 && v !== undefined)
            const dimensionsJson = hasDimensions ? JSON.stringify(manufacturingDimensions) : undefined

            const metadata = {
                drawingNumber,
                drawingName,
                drawingType,
                revision,
                revisionDate,
                status,
                manufacturingDimensionsJSON: dimensionsJson,
                linkedPartId: linkedPartId ? parseInt(linkedPartId) : undefined,
                linkedProductId: linkedProductId ? parseInt(linkedProductId) : undefined,
                linkedCustomerId: linkedCustomerId ? parseInt(linkedCustomerId) : undefined,
                description,
                notes: notes || undefined,
            }

            await drawingService.upload(selectedFile, metadata)
            toast.success(drawingNumber ? `Drawing "${drawingNumber}" uploaded successfully` : "Drawing uploaded successfully")
            resetForm()
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to upload drawing")
        } finally {
            setUploading(false)
        }
    }

    const resetForm = () => {
        setSelectedFile(null)
        setDrawingNumber("")
        setDrawingName("")
        setDrawingType("shaft")
        setRevision("A")
        setRevisionDate(new Date().toISOString().split('T')[0])
        setStatus("draft")
        setDescription("")
        setNotes("")
        setLinkedPartId("")
        setLinkedProductId("")
        setLinkedCustomerId("")
        setManufacturingDimensions({ materialGrade: "" })
    }

    // Bulk upload handlers
    const handleBulkFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return

        const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
        const validFiles: File[] = []
        let rejected = 0

        Array.from(files).forEach((file) => {
            if (!allowedTypes.includes(file.type)) { rejected++; return }
            if (file.size > 10 * 1024 * 1024) { rejected++; return }
            validFiles.push(file)
        })

        if (rejected > 0) toast.warning(`${rejected} file(s) skipped (invalid type or size > 10MB)`)
        setBulkFiles((prev) => [...prev, ...validFiles])
        e.target.value = ""
    }

    const removeBulkFile = (index: number) => {
        setBulkFiles((prev) => prev.filter((_, i) => i !== index))
    }

    const handleBulkUpload = async () => {
        if (bulkFiles.length === 0) {
            toast.error("Please select files to upload")
            return
        }

        setUploading(true)
        setBulkResults([])

        try {
            const results = await drawingService.bulkUpload(
                bulkFiles,
                bulkLinkedProductId ? parseInt(bulkLinkedProductId) : undefined,
                bulkLinkedCustomerId ? parseInt(bulkLinkedCustomerId) : undefined
            )

            setBulkResults(results)
            const successCount = results.filter(r => r.success).length
            const failCount = results.filter(r => !r.success).length

            if (failCount === 0) {
                toast.success(`All ${successCount} drawings uploaded successfully`)
            } else {
                toast.warning(`${successCount} uploaded, ${failCount} failed`)
            }

            if (successCount > 0) onSuccess()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to bulk upload")
        } finally {
            setUploading(false)
        }
    }

    const resetBulk = () => {
        setBulkFiles([])
        setBulkLinkedProductId("")
        setBulkLinkedCustomerId("")
        setBulkResults([])
    }

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[90vw] h-[90vh] flex flex-col p-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b">
                    <DialogTitle className="text-2xl">Add Drawing</DialogTitle>
                    <DialogDescription className="mt-2">
                        Upload single drawing with complete details or bulk upload multiple drawings
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="single" className="flex-1 flex flex-col overflow-hidden">
                    <TabsList className="mx-6 mt-4 grid w-auto grid-cols-2">
                        <TabsTrigger value="single">
                            <FileUp className="h-4 w-4 mr-2" />
                            Single Upload
                        </TabsTrigger>
                        <TabsTrigger value="bulk">
                            <Files className="h-4 w-4 mr-2" />
                            Bulk Upload
                        </TabsTrigger>
                    </TabsList>

                    {/* ===== SINGLE UPLOAD TAB ===== */}
                    <TabsContent value="single" className="flex-1 mt-0 overflow-hidden">
                        <form onSubmit={handleSubmit} className="flex flex-col h-full">
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
                                                            <span className="text-blue-600 hover:text-blue-700 font-medium">Click to upload</span>
                                                            <span className="text-gray-600"> or drag and drop</span>
                                                        </label>
                                                        <Input id="file-upload" type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileSelect} />
                                                    </div>
                                                    <p className="text-xs text-gray-500">PDF, PNG, JPG up to 10MB</p>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between bg-gray-50 p-3 rounded">
                                                    <div className="flex items-center gap-3">
                                                        <FileText className="h-8 w-8 text-blue-600" />
                                                        <div>
                                                            <div className="font-medium">{selectedFile.name}</div>
                                                            <div className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</div>
                                                        </div>
                                                    </div>
                                                    <Button type="button" variant="ghost" size="sm" onClick={handleRemoveFile}>
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
                                                <Label htmlFor="drawingNumber">Drawing Number <span className="text-muted-foreground font-normal">(auto-generated if empty)</span></Label>
                                                <Input id="drawingNumber" placeholder="e.g., DWG-001" value={drawingNumber} onChange={(e) => setDrawingNumber(e.target.value)} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="drawingName">Drawing Name *</Label>
                                                <Input id="drawingName" placeholder="e.g., Main Shaft Assembly" value={drawingName} onChange={(e) => setDrawingName(e.target.value)} required />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="description">Description *</Label>
                                            <Textarea id="description" placeholder="Brief description of the drawing..." value={description} onChange={(e) => setDescription(e.target.value)} rows={2} required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="notes">Notes (Optional)</Label>
                                            <Textarea id="notes" placeholder="Additional notes, tolerances, special instructions..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
                                        </div>
                                    </div>

                                    {/* Classification */}
                                    <div className="grid grid-cols-4 gap-4">
                                        <div className="space-y-2">
                                            <Label>Drawing Type *</Label>
                                            <Select value={drawingType} onValueChange={(value) => setDrawingType(value as Drawing['drawingType'])}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
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
                                            <Input id="revision" placeholder="A, B, C" value={revision} onChange={(e) => setRevision(e.target.value)} required maxLength={3} className="font-mono" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="revisionDate">Revision Date *</Label>
                                            <Input id="revisionDate" type="date" value={revisionDate} onChange={(e) => setRevisionDate(e.target.value)} required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Status *</Label>
                                            <RadioGroup value={status} onValueChange={(value) => setStatus(value as Drawing['status'])}>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="draft" id="draft" />
                                                    <Label htmlFor="draft" className="font-normal cursor-pointer">Draft</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="approved" id="approved" />
                                                    <Label htmlFor="approved" className="font-normal cursor-pointer">Approved</Label>
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
                                                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                                                    <SelectContent>
                                                        {mockRawMaterials.slice(0, 5).map((material) => (
                                                            <SelectItem key={material.id} value={material.id.toString()}>{material.materialName}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs">Product/Roller</Label>
                                                <Select value={linkedProductId || undefined} onValueChange={setLinkedProductId}>
                                                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                                                    <SelectContent>
                                                        {mockProducts.slice(0, 5).map((product) => (
                                                            <SelectItem key={product.id} value={product.id.toString()}>{product.modelName}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs">Customer</Label>
                                                <Select value={linkedCustomerId || undefined} onValueChange={setLinkedCustomerId}>
                                                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                                                    <SelectContent>
                                                        {mockCustomers.slice(0, 5).map((customer) => (
                                                            <SelectItem key={customer.id} value={customer.id.toString()}>{customer.customerName}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Manufacturing Dimensions - Optional */}
                                    <div className="space-y-3">
                                        <Label className="text-sm font-semibold">
                                            Manufacturing Dimensions (Optional)
                                            <span className="text-xs text-muted-foreground ml-2 font-normal">Can be added later</span>
                                        </Label>
                                        <ManufacturingDimensionsForm drawingType={drawingType} dimensions={manufacturingDimensions} onChange={setManufacturingDimensions} />
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="px-6 py-4 border-t">
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>Cancel</Button>
                                <Button type="submit" disabled={uploading}>
                                    <Upload className="mr-2 h-4 w-4" />
                                    {uploading ? "Uploading..." : "Upload Drawing"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </TabsContent>

                    {/* ===== BULK UPLOAD TAB ===== */}
                    <TabsContent value="bulk" className="flex-1 mt-0 overflow-hidden flex flex-col">
                        <div className="flex-1 overflow-y-auto px-6 pb-6">
                            <div className="space-y-5 mt-4">
                                {/* Link to Product / Customer */}
                                <div className="space-y-3">
                                    <Label className="text-sm font-semibold">Link all drawings to (Optional)</Label>
                                    <p className="text-xs text-muted-foreground">
                                        All uploaded drawings will be linked to the selected product/customer. You can edit individual drawings later.
                                    </p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs">Product / Roller</Label>
                                            <Select value={bulkLinkedProductId || undefined} onValueChange={setBulkLinkedProductId}>
                                                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                                                <SelectContent>
                                                    {mockProducts.slice(0, 5).map((product) => (
                                                        <SelectItem key={product.id} value={product.id.toString()}>{product.modelName}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs">Customer</Label>
                                            <Select value={bulkLinkedCustomerId || undefined} onValueChange={setBulkLinkedCustomerId}>
                                                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                                                <SelectContent>
                                                    {mockCustomers.slice(0, 5).map((customer) => (
                                                        <SelectItem key={customer.id} value={customer.id.toString()}>{customer.customerName}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                {/* Drop Zone */}
                                <div className="space-y-3">
                                    <Label>Drawing Files *</Label>
                                    <div className="border-2 border-dashed rounded-lg p-6 text-center space-y-3">
                                        <Files className="mx-auto h-10 w-10 text-gray-400" />
                                        <div>
                                            <label htmlFor="bulk-file-upload" className="cursor-pointer">
                                                <span className="text-blue-600 hover:text-blue-700 font-medium">Click to select files</span>
                                                <span className="text-gray-600"> (multiple allowed)</span>
                                            </label>
                                            <Input id="bulk-file-upload" type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" multiple onChange={handleBulkFileSelect} />
                                        </div>
                                        <p className="text-xs text-gray-500">PDF, PNG, JPG up to 10MB each</p>
                                    </div>
                                </div>

                                {/* Selected files list */}
                                {bulkFiles.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm font-semibold">{bulkFiles.length} file(s) selected</Label>
                                            <Button type="button" variant="ghost" size="sm" onClick={() => setBulkFiles([])} className="text-red-600 hover:text-red-700">
                                                Clear all
                                            </Button>
                                        </div>
                                        <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                                            {bulkFiles.map((file, index) => (
                                                <div key={index} className="flex items-center justify-between px-4 py-2">
                                                    <div className="flex items-center gap-3">
                                                        <FileText className="h-5 w-5 text-blue-600" />
                                                        <div>
                                                            <div className="text-sm font-medium truncate max-w-[280px]">{file.name}</div>
                                                            <div className="text-xs text-muted-foreground">{formatFileSize(file.size)}</div>
                                                        </div>
                                                    </div>
                                                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeBulkFile(index)}>
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Upload results */}
                                {bulkResults.length > 0 && (
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold">Upload Results</Label>
                                        <div className="border rounded-lg divide-y">
                                            {bulkResults.map((result, index) => (
                                                <div key={index} className="flex items-center justify-between px-4 py-2">
                                                    <div className="flex items-center gap-2">
                                                        {result.success ? (
                                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                                        ) : (
                                                            <AlertCircle className="h-4 w-4 text-red-600" />
                                                        )}
                                                        <span className="text-sm">{result.fileName}</span>
                                                    </div>
                                                    <span className={`text-xs ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                                                        {result.success ? result.drawingNumber : result.message}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Info note */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <p className="text-sm text-blue-800">
                                        <strong>Note:</strong> Bulk uploaded drawings are created as <strong>Draft</strong> with drawing type set to <strong>Other</strong>.
                                        Edit each drawing individually after upload to set the correct type, revision, and manufacturing dimensions.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="px-6 py-4 border-t">
                            <Button type="button" variant="outline" onClick={() => { resetBulk(); onOpenChange(false) }} disabled={uploading}>Cancel</Button>
                            <Button type="button" disabled={uploading || bulkFiles.length === 0} onClick={handleBulkUpload}>
                                <Files className="mr-2 h-4 w-4" />
                                {uploading ? "Uploading..." : `Upload ${bulkFiles.length} Drawing(s)`}
                            </Button>
                        </DialogFooter>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
