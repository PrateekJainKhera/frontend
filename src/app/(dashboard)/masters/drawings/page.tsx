"use client"

import { useState, useEffect } from 'react'
import { Search, Upload, AlertTriangle, CheckCircle, XCircle, FileStack, Mic, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { mockDrawings, Drawing } from '@/lib/mock-data'
import { simulateApiCall } from '@/lib/utils/mock-api'
import { UploadDrawingDialog } from '@/components/forms/upload-drawing-dialog'
import { BulkUploadDrawingsDialog } from '@/components/forms/bulk-upload-drawings-dialog'
import { DrawingsDataGrid } from '@/components/tables/drawings-data-grid'

export default function DrawingsPage() {
  const [drawings, setDrawings] = useState<Drawing[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [partTypeFilter, setPartTypeFilter] = useState<string>('all')
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isBulkUploadDialogOpen, setIsBulkUploadDialogOpen] = useState(false)

  useEffect(() => {
    loadDrawings()
  }, [])

  const loadDrawings = async () => {
    setLoading(true)
    const data = await simulateApiCall(mockDrawings, 800)
    setDrawings(data)
    setLoading(false)
  }

  const filteredDrawings = drawings.filter((drawing) => {
    const matchesSearch =
      drawing.drawingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drawing.drawingName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drawing.linkedPartName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drawing.linkedProductName?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || drawing.status === statusFilter
    const matchesPartType = partTypeFilter === 'all' || drawing.partType === partTypeFilter

    return matchesSearch && matchesStatus && matchesPartType
  })

  // Calculate stats
  const approvedCount = drawings.filter((d) => d.status === 'approved').length
  const draftCount = drawings.filter((d) => d.status === 'draft').length
  const obsoleteCount = drawings.filter((d) => d.status === 'obsolete').length

  const handleMicClick = () => {
    alert('Voice search feature coming soon!')
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters Row */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Compact Search with Mic */}
        <div className="flex items-center gap-2 bg-background border-2 border-border rounded-lg px-4 py-1 shadow-sm flex-1 max-w-md">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            placeholder="Search drawings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 h-8 px-0 text-sm flex-1 placeholder:text-muted-foreground/40 focus:placeholder:text-transparent caret-foreground"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={handleMicClick}
            title="Voice search"
          >
            <Mic className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>

        {/* Filters */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="obsolete">Obsolete</SelectItem>
          </SelectContent>
        </Select>

        <Select value={partTypeFilter} onValueChange={setPartTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="shaft">Shaft</SelectItem>
            <SelectItem value="pipe">Pipe</SelectItem>
            <SelectItem value="final">Final Assembly</SelectItem>
            <SelectItem value="gear">Gear</SelectItem>
            <SelectItem value="bushing">Bushing</SelectItem>
            <SelectItem value="roller">Roller</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>

        {/* Action Buttons */}
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" onClick={() => setIsUploadDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
          <Button onClick={() => setIsBulkUploadDialogOpen(true)}>
            <FileStack className="mr-2 h-4 w-4" />
            Bulk Upload
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardDescription>Total Drawings</CardDescription>
            <CardTitle className="text-2xl">{drawings.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <CardDescription>Approved</CardDescription>
            </div>
            <CardTitle className="text-2xl text-green-600">{approvedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <CardDescription>Draft</CardDescription>
            </div>
            <CardTitle className="text-2xl text-yellow-600">{draftCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <CardDescription>Obsolete</CardDescription>
            </div>
            <CardTitle className="text-2xl text-red-600">{obsoleteCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Warning for obsolete drawings */}
      {obsoleteCount > 0 && (
        <Card className="border-2 border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-semibold text-red-900">
                  ⚠️ {obsoleteCount} Obsolete Drawing{obsoleteCount > 1 ? 's' : ''} Found
                </p>
                <p className="text-sm text-red-700">
                  These drawings are marked as obsolete and should NOT be used for production.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Grid */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <DrawingsDataGrid drawings={filteredDrawings} />
      )}

      {/* Upload Dialogs */}
      <UploadDrawingDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        onSuccess={loadDrawings}
      />
      <BulkUploadDrawingsDialog
        open={isBulkUploadDialogOpen}
        onOpenChange={setIsBulkUploadDialogOpen}
        onSuccess={loadDrawings}
      />
    </div>
  )
}
