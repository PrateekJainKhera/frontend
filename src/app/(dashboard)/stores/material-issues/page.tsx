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
  PackageCheck,
  TrendingUp,
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  User,
  Ruler,
  Weight,
} from 'lucide-react'
import { mockMaterialIssues } from '@/data/mock-material-requisitions'
import { MaterialIssue } from '@/types/material-issue'
import { ViewIssueDialog } from '@/components/dialogs/view-issue-dialog'
import { format } from 'date-fns'

type IssueStatus = 'Pending' | 'Issued' | 'Returned' | 'Cancelled'

export default function MaterialIssuesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedIssue, setSelectedIssue] = useState<MaterialIssue | null>(null)

  // Calculate stats
  const stats = {
    totalIssues: mockMaterialIssues.length,
    issued: mockMaterialIssues.filter(i => i.status === 'Issued').length,
    pending: mockMaterialIssues.filter(i => i.status === 'Pending').length,
    totalPieces: mockMaterialIssues.reduce((sum, i) => sum + i.totalPieces, 0),
    totalWeight: mockMaterialIssues.reduce((sum, i) => sum + i.totalIssuedWeight, 0),
  }

  // Filter issues
  const filteredIssues = mockMaterialIssues.filter(issue => {
    const matchesSearch =
      issue.issueNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.jobCardNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.materialName.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || issue.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: IssueStatus) => {
    const variants: Record<IssueStatus, { className: string }> = {
      'Pending': { className: 'bg-orange-100 text-orange-800 border-orange-300' },
      'Issued': { className: 'bg-green-100 text-green-800 border-green-300' },
      'Returned': { className: 'bg-blue-100 text-blue-800 border-blue-300' },
      'Cancelled': { className: 'bg-gray-100 text-gray-800 border-gray-300' },
    }
    const config = variants[status]
    return <Badge variant="outline" className={config.className}>{status}</Badge>
  }

  const handleViewClick = (issue: MaterialIssue) => {
    setSelectedIssue(issue)
    setViewDialogOpen(true)
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Material Issues</h1>
        <p className="text-muted-foreground mt-1">
          Track all material issues from stores to production
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
            <PackageCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalIssues}</div>
            <p className="text-xs text-muted-foreground mt-1">All material issues</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issued</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.issued}</div>
            <p className="text-xs text-muted-foreground mt-1">Successfully issued</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting confirmation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pieces</CardTitle>
            <Ruler className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalPieces}</div>
            <p className="text-xs text-muted-foreground mt-1">Pieces issued</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Weight</CardTitle>
            <Weight className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.totalWeight.toFixed(2)}kg
            </div>
            <p className="text-xs text-muted-foreground mt-1">Material issued</p>
          </CardContent>
        </Card>
      </div>

      {/* Issues List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Issues List</CardTitle>
              <CardDescription>View all material issues and their details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 mb-6">
            {/* Search */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by issue no, job card, order, or material..."
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
                  <SelectItem value="Issued">Issued</SelectItem>
                  <SelectItem value="Returned">Returned</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Issues Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Issue No</TableHead>
                  <TableHead>Job Card / Order</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Quantity Issued</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Issued By</TableHead>
                  <TableHead>Received By</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIssues.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground h-32">
                      No material issues found matching your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIssues.map((issue) => (
                    <TableRow key={issue.issueId}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{issue.issueNo}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(issue.issueDate), 'dd MMM yyyy')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{issue.jobCardNo}</span>
                          <span className="text-xs text-muted-foreground">{issue.orderNo}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{issue.materialName}</span>
                          <span className="text-xs text-muted-foreground">{issue.materialGrade}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{issue.totalPieces} pieces</span>
                          <span className="text-xs text-muted-foreground">
                            {(issue.totalIssuedLength / 1000).toFixed(2)}m
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Weight className="h-3 w-3 text-muted-foreground" />
                          <span>{issue.totalIssuedWeight.toFixed(2)}kg</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{issue.issuedByName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {issue.receivedByName ? (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{issue.receivedByName}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            {format(new Date(issue.issueDate), 'dd MMM yyyy')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(issue.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => handleViewClick(issue)}>
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Issue Dialog */}
      <ViewIssueDialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        issue={selectedIssue}
      />
    </div>
  )
}
