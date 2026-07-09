"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Filter, FileText, AlertTriangle, CheckCircle2, Clock, Package, Search, Pencil, Check, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { jobCardService, JobCardResponse, JobCardSummary } from '@/lib/api/job-cards'
import { toast } from 'sonner'

const PAGE_SIZES = [10, 25, 50, 100]

export function JobCardsTab() {
  const [loading, setLoading] = useState(true)
  const [jobCards, setJobCards] = useState<JobCardResponse[]>([])
  const [summary, setSummary] = useState<JobCardSummary>({ total: 0, pending: 0, scheduled: 0, inProgress: 0, completed: 0 })

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [search, setSearch] = useState('')          // debounced
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // Inline qty edit
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editQty, setEditQty] = useState('')
  const [savingId, setSavingId] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounce search → server, reset to page 1
  useEffect(() => {
    const id = setTimeout(() => { setSearch(searchTerm); setPage(1) }, 400)
    return () => clearTimeout(id)
  }, [searchTerm])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await jobCardService.getPaged(page, pageSize, search, statusFilter)
      setJobCards(res.items)
      setTotalCount(res.totalCount)
      setTotalPages(res.totalPages)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load job cards')
      setJobCards([])
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, search, statusFilter])

  const loadSummary = useCallback(async () => {
    setSummary(await jobCardService.getSummary())
  }, [])

  useEffect(() => { loadData() }, [loadData])
  useEffect(() => { loadSummary() }, [loadSummary])

  const startEdit = (jc: JobCardResponse) => {
    setEditingId(jc.id)
    setEditQty(jc.quantity.toString())
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditQty('')
  }

  const saveQty = async (jc: JobCardResponse) => {
    const newQty = parseInt(editQty)
    if (isNaN(newQty) || newQty < 1) {
      toast.error('Quantity must be at least 1')
      return
    }
    if (newQty === jc.quantity) { cancelEdit(); return }
    setSavingId(jc.id)
    try {
      await jobCardService.updateQuantity(jc.id, newQty)
      toast.success(`${jc.jobCardNo}: quantity updated to ${newQty} — order also updated`)
      setEditingId(null)
      setEditQty('')
      await loadData()
      loadSummary()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update quantity')
    } finally {
      setSavingId(null)
    }
  }

  // Server already applies search + status filtering to the current page
  const filteredJobCards = jobCards

  // Stats come from the global summary endpoint
  const stats = summary

  const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeEnd = Math.min(page * pageSize, totalCount)

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'default'
      case 'In Progress':
        return 'secondary'
      case 'Pending Material':
        return 'destructive'
      case 'Blocked':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle2 className="h-3 w-3" />
      case 'In Progress':
        return <Clock className="h-3 w-3" />
      case 'Pending Material':
        return <AlertTriangle className="h-3 w-3" />
      case 'Blocked':
        return <AlertTriangle className="h-3 w-3" />
      default:
        return <Package className="h-3 w-3" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Job Cards</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-3xl text-orange-600">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-3">
            <CardDescription className="text-yellow-700">Scheduled</CardDescription>
            <CardTitle className="text-3xl text-yellow-900">{stats.scheduled}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardDescription className="text-blue-700">In Progress</CardDescription>
            <CardTitle className="text-3xl text-blue-900">{stats.inProgress}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardDescription className="text-green-700">Completed</CardDescription>
            <CardTitle className="text-3xl text-green-900">{stats.completed}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Job card, order, child part, process..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Pending Material">Pending Material</SelectItem>
                  <SelectItem value="Ready">Ready</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(searchTerm || statusFilter !== 'all') && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                  setPage(1)
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Job Cards List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Job Cards List</CardTitle>
              <CardDescription className="mt-1">
                {totalCount === 0 ? 'No job cards' : `${rangeStart}–${rangeEnd} of ${totalCount} job cards`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredJobCards.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No job cards found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredJobCards.map((jc) => (
                <div
                  key={jc.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    {/* Left Side - Job Card Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <p className="font-semibold">{jc.jobCardNo}</p>
                        {jc.orderNo && <Badge variant="outline">{jc.orderNo}</Badge>}
                        <Badge variant={getStatusBadgeVariant(jc.status) as any}>
                          {getStatusIcon(jc.status)}
                          <span className="ml-1">{jc.status}</span>
                        </Badge>
                        {jc.priority && (
                          <Badge variant={jc.priority === 'Urgent' ? 'destructive' : 'outline'}>
                            {jc.priority}
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Child Part:</span>
                          <p className="font-medium">{jc.childPartName || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Process:</span>
                          <p className="font-medium">{jc.processName || 'N/A'}</p>
                        </div>
                        {jc.stepNo && (
                          <div>
                            <span className="text-muted-foreground">Step:</span>
                            <p className="font-medium">Step {jc.stepNo}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground">Machine Model:</span>
                          <p className="font-medium">{jc.machineModelName || '—'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Roller Type:</span>
                          <p className="font-medium">{jc.rollerType || '—'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">No. of Teeth:</span>
                          <p className="font-medium">{(jc.numberOfTeeth ?? 0) > 0 ? jc.numberOfTeeth : '—'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Quantity:</span>
                          {editingId === jc.id ? (
                            <div className="flex items-center gap-1 mt-0.5">
                              <input
                                ref={inputRef}
                                type="number"
                                min={1}
                                value={editQty}
                                onChange={e => setEditQty(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') saveQty(jc); if (e.key === 'Escape') cancelEdit() }}
                                className="w-20 h-7 rounded border border-input bg-background px-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                disabled={savingId === jc.id}
                              />
                              <button
                                onClick={() => saveQty(jc)}
                                disabled={savingId === jc.id}
                                className="h-7 w-7 flex items-center justify-center rounded text-green-600 hover:bg-green-50 disabled:opacity-50"
                                title="Save"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                disabled={savingId === jc.id}
                                className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:bg-muted"
                                title="Cancel"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 mt-0.5">
                              <p className="font-medium">{jc.quantity} pcs</p>
                              <button
                                onClick={() => startEdit(jc)}
                                className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                                title="Edit quantity"
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Drawing Info */}
                      {jc.drawingNumber && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                          <FileText className="h-3 w-3" />
                          <span>Drawing: {jc.drawingNumber} {jc.drawingRevision && `Rev ${jc.drawingRevision}`}</span>
                          {jc.drawingSelectionType === 'auto' && (
                            <Badge variant="secondary" className="text-xs">Auto-selected</Badge>
                          )}
                        </div>
                      )}

                      {/* Work Instructions */}
                      {jc.workInstructions && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          <span className="font-medium">Instructions:</span> {jc.workInstructions}
                        </div>
                      )}
                    </div>

                    {/* Right Side - Actions */}
                    <div className="ml-4">
                      <Link href={`/planning/job-cards/${jc.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-2 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Rows per page</span>
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1) }}>
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZES.map(s => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <span className="ml-2">
                {totalCount === 0 ? 'No job cards' : `${rangeStart}–${rangeEnd} of ${totalCount}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>
              <span className="text-sm text-muted-foreground min-w-24 text-center">
                Page {totalPages === 0 ? 0 : page} of {totalPages}
              </span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
