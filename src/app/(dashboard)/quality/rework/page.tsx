"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  RefreshCw,
  Package,
  User,
  Wrench,
  Clock,
  Link as LinkIcon,
  Calendar,
  Filter,
  ListChecks
} from 'lucide-react'
import { simulateApiCall } from '@/lib/utils/mock-api'
import Link from 'next/link'

// Mock rework orders
interface ReworkOrder {
  id: string
  parentJobCardId: string
  orderNo: string
  customerName: string
  productName: string
  reworkProcess: string
  reworkQuantity: number
  completedQty: number
  status: 'Pending' | 'In Progress' | 'Completed'
  priority: 'Low' | 'Medium' | 'High' | 'Urgent'
  machine: string
  assignedOperator?: string
  createdDate: string
  targetDate: string
}

const mockReworkOrders: ReworkOrder[] = [
  {
    id: 'RW-JC-001-1234',
    parentJobCardId: 'JC-001',
    orderNo: 'ORD-128',
    customerName: 'ABC Industries',
    productName: 'Magnetic Roller 250mm',
    reworkProcess: 'Re-Grinding',
    reworkQuantity: 2,
    completedQty: 0,
    status: 'Pending',
    priority: 'Urgent',
    machine: 'GRN-01',
    createdDate: '2024-01-28',
    targetDate: '2024-01-30'
  },
  {
    id: 'RW-JC-003-5678',
    parentJobCardId: 'JC-003',
    orderNo: 'ORD-130',
    customerName: 'Global Prints',
    productName: 'Anilox Roller 200mm',
    reworkProcess: 'Re-Machining',
    reworkQuantity: 3,
    completedQty: 1,
    status: 'In Progress',
    priority: 'High',
    machine: 'CNC-02',
    assignedOperator: 'Rajesh Kumar',
    createdDate: '2024-01-26',
    targetDate: '2024-01-29'
  },
  {
    id: 'RW-JC-004-9012',
    parentJobCardId: 'JC-004',
    orderNo: 'ORD-127',
    customerName: 'Mega Corp',
    productName: 'Printing Roller 350mm',
    reworkProcess: 'Re-Polishing',
    reworkQuantity: 1,
    completedQty: 1,
    status: 'Completed',
    priority: 'Medium',
    machine: 'PLT-01',
    assignedOperator: 'Suresh Patel',
    createdDate: '2024-01-25',
    targetDate: '2024-01-27'
  }
]

export default function ReworkOrdersListPage() {
  const [reworkOrders, setReworkOrders] = useState<ReworkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all')

  useEffect(() => {
    loadReworkOrders()
  }, [])

  const loadReworkOrders = async () => {
    setLoading(true)
    const data = await simulateApiCall(mockReworkOrders, 800)
    setReworkOrders(data)
    setLoading(false)
  }

  const filteredOrders = reworkOrders.filter(order => {
    if (filter === 'pending') return order.status === 'Pending'
    if (filter === 'in-progress') return order.status === 'In Progress'
    if (filter === 'completed') return order.status === 'Completed'
    return true
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'destructive'
      case 'High': return 'default'
      case 'Medium': return 'secondary'
      default: return 'outline'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-green-600'
      case 'In Progress': return 'text-blue-600'
      default: return 'text-amber-600'
    }
  }

  const getProgressPercentage = (completed: number, total: number) => {
    return (completed / total) * 100
  }

  const getDaysUntilDue = (targetDate: string) => {
    const due = new Date(targetDate)
    const today = new Date()
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const totalRework = reworkOrders.reduce((sum, r) => sum + r.reworkQuantity, 0)
  const pending = reworkOrders.filter(r => r.status === 'Pending').length
  const inProgress = reworkOrders.filter(r => r.status === 'In Progress').length

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
      <h1 className="text-3xl font-bold text-primary">Rework Orders</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Total Rework Units
            </CardDescription>
            <CardTitle className="text-3xl text-blue-600">{totalRework}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Units in rework process</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending Orders
            </CardDescription>
            <CardTitle className="text-3xl text-amber-600">{pending}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Not yet started</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <ListChecks className="h-4 w-4" />
              In Progress
            </CardDescription>
            <CardTitle className="text-3xl text-green-600">{inProgress}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Currently being reworked</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Orders
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
            >
              All Orders ({reworkOrders.length})
            </Button>
            <Button
              variant={filter === 'pending' ? 'default' : 'outline'}
              onClick={() => setFilter('pending')}
            >
              Pending ({pending})
            </Button>
            <Button
              variant={filter === 'in-progress' ? 'default' : 'outline'}
              onClick={() => setFilter('in-progress')}
            >
              In Progress ({inProgress})
            </Button>
            <Button
              variant={filter === 'completed' ? 'default' : 'outline'}
              onClick={() => setFilter('completed')}
            >
              Completed ({reworkOrders.filter(r => r.status === 'Completed').length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Rework Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card className="p-8 text-center">
            <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No rework orders found</p>
            <p className="text-sm text-muted-foreground">No rework orders match the selected filter</p>
          </Card>
        ) : (
          filteredOrders.map((order) => {
            const daysUntilDue = getDaysUntilDue(order.targetDate)
            return (
              <Card
                key={order.id}
                className={`${
                  order.status === 'In Progress'
                    ? 'border-l-4 border-l-blue-500 bg-blue-50/50'
                    : order.status === 'Completed'
                    ? 'border-l-4 border-l-green-500 bg-green-50/50'
                    : ''
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="font-mono text-sm text-muted-foreground">{order.id}</span>
                        <Badge variant={getPriorityColor(order.priority)}>
                          {order.priority}
                        </Badge>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <LinkIcon className="h-3 w-3" />
                          <span>Parent: {order.parentJobCardId}</span>
                        </div>
                      </div>
                      <CardTitle className="text-lg">{order.reworkProcess}</CardTitle>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Product & Order Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{order.productName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{order.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{order.machine}</span>
                    </div>
                    {order.assignedOperator && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Operator: {order.assignedOperator}</span>
                      </div>
                    )}
                  </div>

                  {/* Progress */}
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">
                        {order.completedQty}/{order.reworkQuantity} units
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          order.status === 'Completed' ? 'bg-green-600' : 'bg-primary'
                        }`}
                        style={{ width: `${getProgressPercentage(order.completedQty, order.reworkQuantity)}%` }}
                      />
                    </div>
                  </div>

                  {/* Dates & Actions */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Created: {new Date(order.createdDate).toLocaleDateString('en-IN')}</span>
                      </div>
                      <div className={`flex items-center gap-1 ${
                        daysUntilDue < 0 ? 'text-red-600' : daysUntilDue <= 2 ? 'text-amber-600' : ''
                      }`}>
                        <Clock className="h-3 w-3" />
                        <span>
                          Due: {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)}d overdue` : `${daysUntilDue}d left`}
                        </span>
                      </div>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/production/job-cards/${order.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
