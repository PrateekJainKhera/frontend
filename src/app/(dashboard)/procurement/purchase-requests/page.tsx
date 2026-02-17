"use client"

import { useState, useEffect } from 'react'
import { Plus, Filter } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { purchaseRequestService, PurchaseRequestResponse } from '@/lib/api/purchase-requests'
import { toast } from 'sonner'
import { format } from 'date-fns'

const STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-700',
  Submitted: 'bg-blue-100 text-blue-700',
  UnderApproval: 'bg-yellow-100 text-yellow-700',
  Approved: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
  POGenerated: 'bg-purple-100 text-purple-700',
}

export default function PurchaseRequestsPage() {
  const [prs, setPRs] = useState<PurchaseRequestResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => { loadPRs() }, [])

  const loadPRs = async () => {
    setLoading(true)
    try {
      const data = await purchaseRequestService.getAll()
      setPRs(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load purchase requests')
    } finally {
      setLoading(false)
    }
  }

  const filtered = prs.filter(pr => {
    if (statusFilter !== 'all' && pr.status !== statusFilter) return false
    if (typeFilter !== 'all' && pr.itemType !== typeFilter) return false
    return true
  })

  const counts = {
    total: prs.length,
    draft: prs.filter(p => p.status === 'Draft').length,
    pending: prs.filter(p => p.status === 'Submitted' || p.status === 'UnderApproval').length,
    approved: prs.filter(p => p.status === 'Approved' || p.status === 'POGenerated').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Purchase Requests</h1>
          <p className="text-muted-foreground text-sm">Create and manage purchase requests for components and raw materials</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/procurement/purchase-requests/create?itemType=RawMaterial">Raw Material PR</Link>
          </Button>
          <Button asChild>
            <Link href="/procurement/purchase-requests/create?itemType=Component">
              <Plus className="mr-2 h-4 w-4" /> Component PR
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-2 border-border p-4">
          <p className="text-sm text-muted-foreground">Total PRs</p>
          <p className="text-2xl font-bold">{counts.total}</p>
        </Card>
        <Card className="border-2 border-border p-4">
          <p className="text-sm text-muted-foreground">Draft</p>
          <p className="text-2xl font-bold text-gray-600">{counts.draft}</p>
        </Card>
        <Card className="border-2 border-border p-4">
          <p className="text-sm text-muted-foreground">Pending Approval</p>
          <p className="text-2xl font-bold text-yellow-600">{counts.pending}</p>
        </Card>
        <Card className="border-2 border-border p-4">
          <p className="text-sm text-muted-foreground">Approved / PO Generated</p>
          <p className="text-2xl font-bold text-green-600">{counts.approved}</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm text-muted-foreground hidden sm:inline">Filter:</span>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Submitted">Submitted</SelectItem>
            <SelectItem value="UnderApproval">Under Approval</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
            <SelectItem value="POGenerated">PO Generated</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Component">Component</SelectItem>
            <SelectItem value="RawMaterial">Raw Material</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-2 border-border p-8 text-center">
          <p className="text-muted-foreground">No purchase requests found</p>
          <Button className="mt-4" asChild>
            <Link href="/procurement/purchase-requests/create?itemType=Component">
              <Plus className="mr-2 h-4 w-4" /> Create First PR
            </Link>
          </Button>
        </Card>
      ) : (
        <Card className="border-2 border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[400px]">
              <thead>
                <tr className="bg-muted border-b">
                  <th className="text-left p-3 font-semibold">PR Number</th>
                  <th className="text-left p-3 font-semibold hidden sm:table-cell">Type</th>
                  <th className="text-left p-3 font-semibold hidden sm:table-cell">Items</th>
                  <th className="text-left p-3 font-semibold hidden md:table-cell">Requested By</th>
                  <th className="text-left p-3 font-semibold hidden md:table-cell">Date</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-left p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((pr) => (
                  <tr key={pr.id} className="border-b hover:bg-muted/40 transition-colors">
                    <td className="p-3">
                      <p className="font-mono font-semibold text-sm">{pr.prNumber}</p>
                      {/* Show type inline on mobile */}
                      <p className="text-xs text-muted-foreground sm:hidden">
                        {pr.itemType === 'RawMaterial' ? 'Raw Material' : 'Component'} • {pr.items.length} item(s)
                      </p>
                    </td>
                    <td className="p-3 hidden sm:table-cell">
                      <Badge variant="outline">{pr.itemType === 'RawMaterial' ? 'Raw Material' : 'Component'}</Badge>
                    </td>
                    <td className="p-3 text-muted-foreground hidden sm:table-cell">{pr.items.length} item(s)</td>
                    <td className="p-3 hidden md:table-cell">{pr.requestedBy}</td>
                    <td className="p-3 text-muted-foreground hidden md:table-cell">
                      {format(new Date(pr.createdAt), 'dd MMM yyyy')}
                    </td>
                    <td className="p-3">
                      <Badge className={STATUS_COLORS[pr.status] || 'bg-gray-100 text-gray-700'}>
                        {pr.status}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/procurement/purchase-requests/${pr.id}`}>View</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
