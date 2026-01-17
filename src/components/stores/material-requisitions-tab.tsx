'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ClipboardList,
  PackageCheck,
  AlertCircle,
  TrendingUp,
  Search,
  Filter,
  FileText,
  Calendar,
  CheckCircle2,
} from 'lucide-react'
import { mockMaterialRequisitions } from '@/data/mock-material-requisitions'
import { MaterialRequisition, RequisitionStatus } from '@/types/material-issue'
import { Priority } from '@/types/enums'
import { MaterialAllocationDialog } from '@/components/dialogs/material-allocation-dialog'
import { MaterialIssueDialog } from '@/components/dialogs/material-issue-dialog'
import { NewRequisitionDialog } from '@/components/dialogs/new-requisition-dialog'
import { ViewRequisitionDialog } from '@/components/dialogs/view-requisition-dialog'
import { format } from 'date-fns'

export function MaterialRequisitionsTab() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')

  // Dialog states
  const [allocationDialogOpen, setAllocationDialogOpen] = useState(false)
  const [issueDialogOpen, setIssueDialogOpen] = useState(false)
  const [newRequisitionDialogOpen, setNewRequisitionDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedRequisition, setSelectedRequisition] = useState<MaterialRequisition | null>(null)

  // Calculate KPI stats
  const stats = {
    totalRequisitions: mockMaterialRequisitions.length,
    pending: mockMaterialRequisitions.filter(r => r.status === 'Pending').length,
    allocated: mockMaterialRequisitions.filter(r => r.status === 'Allocated').length,
    partial: mockMaterialRequisitions.filter(r => r.status === 'Partial').length,
    highPriority: mockMaterialRequisitions.filter(r => r.priority === Priority.HIGH && r.status !== 'Issued').length,
  }

  // Filter requisitions
  const filteredRequisitions = mockMaterialRequisitions.filter(req => {
    const matchesSearch =
      req.requisitionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.jobCardNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.customerName.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || req.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || req.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  const getStatusBadge = (status: RequisitionStatus) => {
    const variants: Record<RequisitionStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline', className: string }> = {
      'Pending': { variant: 'outline', className: 'border-orange-500 text-orange-700 bg-orange-50' },
      'Partial': { variant: 'outline', className: 'border-blue-500 text-blue-700 bg-blue-50' },
      'Allocated': { variant: 'outline', className: 'border-purple-500 text-purple-700 bg-purple-50' },
      'Issued': { variant: 'outline', className: 'border-green-500 text-green-700 bg-green-50' },
      'Cancelled': { variant: 'outline', className: 'border-gray-500 text-gray-700 bg-gray-50' },
    }
    const config = variants[status]
    return <Badge variant={config.variant} className={config.className}>{status}</Badge>
  }

  const getPriorityBadge = (priority: Priority) => {
    const variants: Record<Priority, { variant: 'default' | 'secondary' | 'destructive' | 'outline', className: string }> = {
      [Priority.HIGH]: { variant: 'destructive', className: '' },
      [Priority.MEDIUM]: { variant: 'outline', className: 'border-yellow-500 text-yellow-700 bg-yellow-50' },
      [Priority.LOW]: { variant: 'secondary', className: '' },
      [Priority.URGENT]: { variant: 'destructive', className: 'bg-red-600 text-white' },
    }
    const config = variants[priority]
    return <Badge variant={config.variant} className={config.className}>{priority}</Badge>
  }

  const handleAllocateClick = (req: MaterialRequisition) => {
    setSelectedRequisition(req)
    setAllocationDialogOpen(true)
  }

  const handleIssueClick = (req: MaterialRequisition) => {
    setSelectedRequisition(req)
    setIssueDialogOpen(true)
  }

  const handleCloseAllocationDialog = () => {
    setAllocationDialogOpen(false)
    setSelectedRequisition(null)
  }

  const handleCloseIssueDialog = () => {
    setIssueDialogOpen(false)
    setSelectedRequisition(null)
  }

  const handleViewClick = (req: MaterialRequisition) => {
    setSelectedRequisition(req)
    setViewDialogOpen(true)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requisitions</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRequisitions}</div>
            <p className="text-xs text-muted-foreground mt-1">All material requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting allocation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Allocated</CardTitle>
            <PackageCheck className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.allocated}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready to issue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partial</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.partial}</div>
            <p className="text-xs text-muted-foreground mt-1">Partially allocated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.highPriority}</div>
            <p className="text-xs text-muted-foreground mt-1">Urgent requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Requisition List</CardTitle>
              <CardDescription>View and manage all material requisitions</CardDescription>
            </div>
            <Button className="w-full sm:w-auto" onClick={() => setNewRequisitionDialogOpen(true)}>
              <FileText className="mr-2 h-4 w-4" />
              New Requisition
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 mb-6">
            {/* Search */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by requisition, job card, order, or customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Partial">Partial</SelectItem>
                  <SelectItem value="Allocated">Allocated</SelectItem>
                  <SelectItem value="Issued">Issued</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value={Priority.HIGH}>High</SelectItem>
                  <SelectItem value={Priority.MEDIUM}>Medium</SelectItem>
                  <SelectItem value={Priority.LOW}>Low</SelectItem>
                  <SelectItem value={Priority.URGENT}>Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Requisitions Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Requisition No</TableHead>
                  <TableHead>Job Card</TableHead>
                  <TableHead>Order / Customer</TableHead>
                  <TableHead>Material Details</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequisitions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground h-32">
                      No requisitions found matching your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequisitions.map((req) => (
                    <TableRow key={req.requisitionId}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{req.requisitionNo}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(req.requisitionDate), 'dd MMM yyyy')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{req.jobCardNo}</span>
                          <span className="text-xs text-muted-foreground">{req.orderNo}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{req.orderNo}</span>
                          <span className="text-xs text-muted-foreground">{req.customerName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {req.materials.map((mat, idx) => (
                          <div key={idx} className="flex flex-col">
                            <span className="font-medium">{mat.materialName}</span>
                            <span className="text-xs text-muted-foreground">
                              {mat.materialGrade} - Ø{mat.dimensions.diameter}mm
                            </span>
                          </div>
                        ))}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {req.materials[0].quantityRequired} {req.materials[0].unit}
                          </span>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            {req.materials[0].quantityAllocated} allocated
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(req.status)}</TableCell>
                      <TableCell>{getPriorityBadge(req.priority)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {format(new Date(req.dueDate), 'dd MMM')}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {req.status === 'Pending' && (
                            <Button size="sm" variant="outline" onClick={() => handleAllocateClick(req)}>
                              Allocate
                            </Button>
                          )}
                          {req.status === 'Allocated' && (
                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleIssueClick(req)}>
                              Issue
                            </Button>
                          )}
                          {req.status === 'Partial' && (
                            <Button size="sm" variant="outline" onClick={() => handleAllocateClick(req)}>
                              Complete
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => handleViewClick(req)}>
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <MaterialAllocationDialog
        open={allocationDialogOpen}
        onClose={handleCloseAllocationDialog}
        requisition={selectedRequisition}
      />

      <MaterialIssueDialog
        open={issueDialogOpen}
        onClose={handleCloseIssueDialog}
        requisition={selectedRequisition}
      />

      <NewRequisitionDialog
        open={newRequisitionDialogOpen}
        onClose={() => setNewRequisitionDialogOpen(false)}
      />

      <ViewRequisitionDialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        requisition={selectedRequisition}
      />
    </div>
  )
}
