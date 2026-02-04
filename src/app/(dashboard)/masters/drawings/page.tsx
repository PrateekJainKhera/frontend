"use client"

import { useState, useEffect } from 'react'
import { Search, AlertTriangle, CheckCircle, XCircle, Mic, Filter, Plus } from 'lucide-react'
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
import { Drawing } from '@/lib/mock-data'
import { drawingService, DrawingResponse } from '@/lib/api/drawings'
import { AddDrawingDialog } from '@/components/forms/add-drawing-dialog'
import { DrawingsDataGrid } from '@/components/tables/drawings-data-grid'

export default function DrawingsPage() {
  const [drawings, setDrawings] = useState<Drawing[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [drawingTypeFilter, setDrawingTypeFilter] = useState<string>('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  useEffect(() => {
    loadDrawings()
  }, [])

  const mapToDrawing = (d: DrawingResponse): Drawing => ({
    id: String(d.id),
    drawingNumber: d.drawingNumber,
    drawingName: d.drawingName,
    drawingType: d.drawingType as Drawing['drawingType'],
    revision: d.revision || '',
    revisionDate: d.revisionDate || '',
    status: d.status as Drawing['status'],
    fileName: d.fileName || '',
    fileType: (d.fileType === 'pdf' ? 'pdf' : d.fileType === 'dwg' ? 'dwg' : 'image') as Drawing['fileType'],
    fileUrl: d.fileUrl || '',
    fileSize: d.fileSize || 0,
    manufacturingDimensions: d.manufacturingDimensionsJSON ? JSON.parse(d.manufacturingDimensionsJSON) : undefined,
    linkedPartId: d.linkedPartId?.toString(),
    linkedProductId: d.linkedProductId?.toString(),
    linkedCustomerId: d.linkedCustomerId?.toString(),
    description: d.description || '',
    notes: d.notes,
    createdBy: d.createdBy || '',
    createdAt: d.createdAt,
    updatedAt: d.updatedAt || '',
    approvedBy: d.approvedBy,
    approvedAt: d.approvedAt,
  })

  const loadDrawings = async () => {
    setLoading(true)
    try {
      const data = await drawingService.getAll()
      setDrawings(data.map(mapToDrawing))
    } catch (err) {
      console.error('Failed to load drawings:', err)
    }
    setLoading(false)
  }

  const filteredDrawings = drawings.filter((drawing) => {
    const matchesSearch =
      drawing.drawingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drawing.drawingName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drawing.linkedPartName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drawing.linkedProductName?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || drawing.status === statusFilter
    const matchesDrawingType = drawingTypeFilter === 'all' || drawing.drawingType === drawingTypeFilter

    return matchesSearch && matchesStatus && matchesDrawingType
  })

  // Calculate stats
  const approvedCount = drawings.filter((d) => d.status === 'approved').length
  const draftCount = drawings.filter((d) => d.status === 'draft').length
  const obsoleteCount = drawings.filter((d) => d.status === 'obsolete').length

  const handleMicClick = () => {
    alert('Voice search feature coming soon!')
  }

  return (
    <div className="space-y-4 relative">
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

        <Select value={drawingTypeFilter} onValueChange={setDrawingTypeFilter}>
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

      {/* Floating Action Button */}
      <Button
        onClick={() => setIsAddDialogOpen(true)}
        className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow z-50"
        size="icon"
        title="Add Drawing"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Add Drawing Dialog */}
      <AddDrawingDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={loadDrawings}
      />
    </div>
  )
}
