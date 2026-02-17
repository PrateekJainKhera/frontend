"use client"

import { useState, useEffect } from 'react'
import { Plus, Filter, FileText } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { estimationService } from '@/lib/api/estimations'
import { EstimationResponse } from '@/types/estimation'
import { toast } from 'sonner'

const STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-700',
  Submitted: 'bg-blue-100 text-blue-700',
  Approved: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
  Cancelled: 'bg-gray-100 text-gray-500',
  Converted: 'bg-purple-100 text-purple-700',
}

export default function EstimationsPage() {
  const [estimations, setEstimations] = useState<EstimationResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => { loadEstimations() }, [])

  const loadEstimations = async () => {
    setLoading(true)
    try {
      const data = await estimationService.getAll()
      setEstimations(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load estimations')
    } finally {
      setLoading(false)
    }
  }

  const filtered = estimations.filter(e => {
    if (statusFilter !== 'all' && e.status !== statusFilter) return false
    return true
  })

  const counts = {
    total: estimations.length,
    draft: estimations.filter(e => e.status === 'Draft').length,
    submitted: estimations.filter(e => e.status === 'Submitted').length,
    approved: estimations.filter(e => e.status === 'Approved').length,
    converted: estimations.filter(e => e.status === 'Converted').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Estimations / Quotations</h1>
          <p className="text-muted-foreground text-sm">Create price estimations and convert approved ones to orders</p>
        </div>
        <Button asChild>
          <Link href="/sales/estimations/create">
            <Plus className="mr-2 h-4 w-4" /> New Estimation
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card className="border-2 border-border p-4">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{counts.total}</p>
        </Card>
        <Card className="border-2 border-border p-4">
          <p className="text-sm text-muted-foreground">Draft</p>
          <p className="text-2xl font-bold text-gray-600">{counts.draft}</p>
        </Card>
        <Card className="border-2 border-border p-4">
          <p className="text-sm text-muted-foreground">Submitted</p>
          <p className="text-2xl font-bold text-blue-600">{counts.submitted}</p>
        </Card>
        <Card className="border-2 border-border p-4">
          <p className="text-sm text-muted-foreground">Approved</p>
          <p className="text-2xl font-bold text-green-600">{counts.approved}</p>
        </Card>
        <Card className="border-2 border-border p-4">
          <p className="text-sm text-muted-foreground">Converted</p>
          <p className="text-2xl font-bold text-purple-600">{counts.converted}</p>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Submitted">Submitted</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
            <SelectItem value="Converted">Converted</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{filtered.length} estimation(s)</span>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No estimations found</p>
          <Button asChild className="mt-4">
            <Link href="/sales/estimations/create"><Plus className="mr-2 h-4 w-4" /> Create First Estimation</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(estimation => (
            <Link key={estimation.id} href={`/sales/estimations/${estimation.id}`}>
              <Card className="border-2 border-border p-4 hover:border-primary/50 hover:bg-muted/20 transition-all cursor-pointer">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Left: Estimate No + Customer */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-semibold">{estimation.estimateNo}</span>
                      {estimation.revisionNumber > 1 && (
                        <Badge variant="outline" className="text-xs">R{estimation.revisionNumber}</Badge>
                      )}
                      <Badge className={`text-xs ${STATUS_COLORS[estimation.status] || 'bg-gray-100 text-gray-700'}`}>
                        {estimation.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{estimation.customerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {estimation.items.length} item{estimation.items.length !== 1 ? 's' : ''} &nbsp;·&nbsp; Valid until {estimation.validUntil}
                    </p>
                  </div>

                  {/* Right: Amount + Date */}
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold">
                      ₹{estimation.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                    {estimation.discountAmount > 0 && (
                      <p className="text-xs text-green-600">
                        -{estimation.discountType === 'Percent' ? `${estimation.discountValue}%` : `₹${estimation.discountValue}`} discount
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">{estimation.createdAt}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
