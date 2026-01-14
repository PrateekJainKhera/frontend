"use client"

import { useState, useEffect } from 'react'
import { Search, Upload, FileText, AlertTriangle, CheckCircle, XCircle, FileStack } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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

  const getStatusBadge = (status: Drawing['status']) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-700">Approved</Badge>
      case 'draft':
        return <Badge className="bg-yellow-100 text-yellow-700">Draft</Badge>
      case 'obsolete':
        return <Badge className="bg-red-100 text-red-700">Obsolete</Badge>
    }
  }

  const getPartTypeBadge = (partType: Drawing['partType']) => {
    const colors: Record<Drawing['partType'], string> = {
      shaft: 'bg-blue-100 text-blue-700',
      pipe: 'bg-purple-100 text-purple-700',
      final: 'bg-green-100 text-green-700',
      gear: 'bg-amber-100 text-amber-700',
      bushing: 'bg-cyan-100 text-cyan-700',
      roller: 'bg-pink-100 text-pink-700',
      other: 'bg-gray-100 text-gray-700',
    }

    return (
      <Badge className={colors[partType]}>
        {partType.charAt(0).toUpperCase() + partType.slice(1)}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="sr-only">Drawing Master</h1>
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" onClick={() => setIsUploadDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Drawing
          </Button>
          <Button onClick={() => setIsBulkUploadDialogOpen(true)}>
            <FileStack className="mr-2 h-4 w-4" />
            Bulk Upload Drawings
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          <CardHeader className="pb-3">
            <CardDescription>Total Drawings</CardDescription>
            <CardTitle className="text-3xl">{drawings.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <CardDescription>Approved</CardDescription>
            </div>
            <CardTitle className="text-3xl text-green-600">{approvedCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <CardDescription>Draft</CardDescription>
            </div>
            <CardTitle className="text-3xl text-yellow-600">{draftCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <CardDescription>Obsolete</CardDescription>
            </div>
            <CardTitle className="text-3xl text-red-600">{obsoleteCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2 flex-1">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by drawing number, name, part, or product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="obsolete">Obsolete</SelectItem>
            </SelectContent>
          </Select>
          <Select value={partTypeFilter} onValueChange={setPartTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Part Types</SelectItem>
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
      </Card>

      {/* Warning for obsolete drawings */}
      {obsoleteCount > 0 && (
        <Card className="border-2 border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <CardTitle className="text-red-900">
                  ⚠️ {obsoleteCount} Obsolete Drawing{obsoleteCount > 1 ? 's' : ''} Found
                </CardTitle>
                <CardDescription className="text-red-700 mt-1">
                  These drawings are marked as obsolete and should NOT be used for production.
                  Always verify you're using the latest approved revision.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Drawing Number</TableHead>
                <TableHead>Drawing Name</TableHead>
                <TableHead>Revision</TableHead>
                <TableHead>Part Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Linked To</TableHead>
                <TableHead>File</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDrawings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    No drawings found
                  </TableCell>
                </TableRow>
              ) : (
                filteredDrawings.map((drawing) => (
                  <TableRow key={drawing.id} className={drawing.status === 'obsolete' ? 'bg-red-50' : ''}>
                    <TableCell>
                      <div className="font-mono font-semibold">{drawing.drawingNumber}</div>
                      {drawing.status === 'obsolete' && (
                        <div className="text-xs text-red-600 font-semibold mt-1">
                          ⚠️ DO NOT USE
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">{drawing.drawingName}</div>
                      {drawing.description && (
                        <div className="text-xs text-muted-foreground truncate max-w-xs">
                          {drawing.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        Rev {drawing.revision}
                      </Badge>
                    </TableCell>
                    <TableCell>{getPartTypeBadge(drawing.partType)}</TableCell>
                    <TableCell>{getStatusBadge(drawing.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        {drawing.linkedPartName && (
                          <div className="text-blue-600">→ {drawing.linkedPartName}</div>
                        )}
                        {drawing.linkedProductName && (
                          <div className="text-purple-600">→ {drawing.linkedProductName}</div>
                        )}
                        {drawing.linkedCustomerName && (
                          <div className="text-gray-600 text-xs">({drawing.linkedCustomerName})</div>
                        )}
                        {!drawing.linkedPartName && !drawing.linkedProductName && (
                          <div className="text-muted-foreground">—</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{drawing.fileName}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {drawing.fileSize} KB
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/masters/drawings/${drawing.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
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
