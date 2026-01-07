"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  XCircle,
  AlertTriangle,
  Package,
  User,
  Calendar,
  FileText,
  Filter,
  Trash2
} from 'lucide-react'
import { simulateApiCall } from '@/lib/utils/mock-api'
import Link from 'next/link'

// Mock rejection records
interface RejectionRecord {
  id: string
  jobCardId: string
  orderNo: string
  customerName: string
  productName: string
  rejectedQty: number
  reason: string
  impactLevel: 'Low' | 'Medium' | 'High' | 'Critical'
  canBeReworked: boolean
  inspectorName: string
  date: string
  status: 'Recorded' | 'Rework Created' | 'Scrapped'
}

const mockRejections: RejectionRecord[] = [
  {
    id: 'REJ-001',
    jobCardId: 'JC-001',
    orderNo: 'ORD-128',
    customerName: 'ABC Industries',
    productName: 'Magnetic Roller 250mm',
    rejectedQty: 2,
    reason: 'Dimensional Out of Tolerance',
    impactLevel: 'High',
    canBeReworked: true,
    inspectorName: 'Ramesh Kumar',
    date: '2024-01-28',
    status: 'Rework Created'
  },
  {
    id: 'REJ-002',
    jobCardId: 'JC-002',
    orderNo: 'ORD-125',
    customerName: 'XYZ Manufacturing',
    productName: 'Rubber Roller 300mm',
    rejectedQty: 1,
    reason: 'Surface Defect',
    impactLevel: 'Medium',
    canBeReworked: false,
    inspectorName: 'Suresh Patel',
    date: '2024-01-27',
    status: 'Scrapped'
  },
  {
    id: 'REJ-003',
    jobCardId: 'JC-003',
    orderNo: 'ORD-130',
    customerName: 'Global Prints',
    productName: 'Anilox Roller 200mm',
    rejectedQty: 3,
    reason: 'Material Defect',
    impactLevel: 'Critical',
    canBeReworked: true,
    inspectorName: 'Rajesh Singh',
    date: '2024-01-26',
    status: 'Recorded'
  },
  {
    id: 'REJ-004',
    jobCardId: 'JC-004',
    orderNo: 'ORD-127',
    customerName: 'Mega Corp',
    productName: 'Printing Roller 350mm',
    rejectedQty: 1,
    reason: 'Quality Check Failure',
    impactLevel: 'Low',
    canBeReworked: true,
    inspectorName: 'Amit Sharma',
    date: '2024-01-25',
    status: 'Rework Created'
  }
]

export default function RejectionsListPage() {
  const [rejections, setRejections] = useState<RejectionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'rework-pending' | 'scrapped'>('all')

  useEffect(() => {
    loadRejections()
  }, [])

  const loadRejections = async () => {
    setLoading(true)
    const data = await simulateApiCall(mockRejections, 800)
    setRejections(data)
    setLoading(false)
  }

  const filteredRejections = rejections.filter(rejection => {
    if (filter === 'rework-pending') return rejection.status === 'Recorded' && rejection.canBeReworked
    if (filter === 'scrapped') return rejection.status === 'Scrapped'
    return true
  })

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'Critical': return 'destructive'
      case 'High': return 'default'
      case 'Medium': return 'secondary'
      default: return 'outline'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Rework Created': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'Scrapped': return 'bg-red-50 text-red-700 border-red-200'
      default: return 'bg-amber-50 text-amber-700 border-amber-200'
    }
  }

  const totalRejected = rejections.reduce((sum, r) => sum + r.rejectedQty, 0)
  const reworkPending = rejections.filter(r => r.status === 'Recorded' && r.canBeReworked).length
  const scrapped = rejections.filter(r => r.status === 'Scrapped').length

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="sr-only">Rejection Records</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Total Rejected
            </CardDescription>
            <CardTitle className="text-3xl text-red-600">{totalRejected}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Units rejected this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Rework Pending
            </CardDescription>
            <CardTitle className="text-3xl text-amber-600">{reworkPending}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Awaiting rework orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Scrapped
            </CardDescription>
            <CardTitle className="text-3xl text-gray-600">{scrapped}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Non-reworkable</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Rejections
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
            >
              All Rejections ({rejections.length})
            </Button>
            <Button
              variant={filter === 'rework-pending' ? 'default' : 'outline'}
              onClick={() => setFilter('rework-pending')}
            >
              Rework Pending ({reworkPending})
            </Button>
            <Button
              variant={filter === 'scrapped' ? 'default' : 'outline'}
              onClick={() => setFilter('scrapped')}
            >
              Scrapped ({scrapped})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Rejections List */}
      <div className="space-y-4">
        {filteredRejections.length === 0 ? (
          <Card className="p-8 text-center">
            <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No rejections found</p>
            <p className="text-sm text-muted-foreground">No rejection records match the selected filter</p>
          </Card>
        ) : (
          filteredRejections.map((rejection) => (
            <Card key={rejection.id} className="border-l-4 border-l-red-500">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-sm text-muted-foreground">{rejection.id}</span>
                      <Badge variant={getImpactColor(rejection.impactLevel)}>
                        {rejection.impactLevel} Impact
                      </Badge>
                      <Badge className={`${getStatusColor(rejection.status)} border`}>
                        {rejection.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{rejection.productName}</CardTitle>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-red-600">{rejection.rejectedQty}</div>
                    <div className="text-xs text-muted-foreground">units</div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Job Card:</span>
                    <Link
                      href={`/production/job-cards/${rejection.jobCardId}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {rejection.jobCardId}
                    </Link>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Order:</span>
                    <span className="font-medium">{rejection.orderNo}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Customer:</span>
                    <span className="font-medium">{rejection.customerName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium">{new Date(rejection.date).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>

                {/* Reason */}
                <div className="bg-red-50 p-3 rounded border border-red-200">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-900">Rejection Reason</p>
                      <p className="text-sm text-red-700">{rejection.reason}</p>
                    </div>
                  </div>
                </div>

                {/* Inspector */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>Inspector: {rejection.inspectorName}</span>
                  </div>
                  {rejection.canBeReworked && rejection.status === 'Recorded' && (
                    <Button asChild size="sm">
                      <Link href={`/production/rework/create?jobId=${rejection.jobCardId}&rejectedQty=${rejection.rejectedQty}`}>
                        Create Rework Order
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
