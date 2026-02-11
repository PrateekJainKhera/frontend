'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  CheckCircle2,
  Clock,
  PackageCheck,
  Search,
  FileText,
  ArrowRight,
  User,
  Package,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'

interface ProductionOrderSummary {
  orderId: number
  orderNo: string
  customerName: string | null
  productName: string | null
  priority: string
  dueDate: string | null
  totalSteps: number
  completedSteps: number
  inProgressSteps: number
  readySteps: number
  totalChildParts: number
  completedChildParts: number
  productionStatus: string  // Pending | InProgress | Completed
}

export default function ProductionDashboardPage() {
  const [orders, setOrders] = useState<ProductionOrderSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetch('http://localhost:5217/api/production/orders')
      .then(r => r.json())
      .then(data => {
        if (data.success) setOrders(data.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const stats = {
    totalOrders: orders.length,
    inProgress: orders.filter(o => o.productionStatus === 'InProgress').length,
    completed: orders.filter(o => o.productionStatus === 'Completed').length,
    totalSteps: orders.reduce((sum, o) => sum + o.totalSteps, 0),
    completedSteps: orders.reduce((sum, o) => sum + o.completedSteps, 0),
  }

  const filteredOrders = orders.filter(o => {
    const q = searchQuery.toLowerCase()
    return (
      o.orderNo.toLowerCase().includes(q) ||
      (o.customerName ?? '').toLowerCase().includes(q) ||
      (o.productName ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Production Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor and execute orders through complete production workflow
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <FileText className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">Active production orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">Orders with active work</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Finished orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Progress</CardTitle>
            <PackageCheck className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalSteps > 0 ? Math.round((stats.completedSteps / stats.totalSteps) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.completedSteps} / {stats.totalSteps} steps
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Production Orders</CardTitle>
          <CardDescription>
            Click on an order to view complete workflow and control processes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders, customers, products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order No</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Child Parts</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => {
                    const progress = order.totalSteps > 0
                      ? Math.round((order.completedSteps / order.totalSteps) * 100)
                      : 0
                    const isComplete = order.productionStatus === 'Completed'
                    const hasInProgress = order.productionStatus === 'InProgress'

                    return (
                      <TableRow key={order.orderId}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/production/orders/${order.orderId}`}
                            className="hover:underline text-blue-600"
                          >
                            {order.orderNo}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <p className="font-medium">{order.customerName ?? '—'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <p className="font-medium">{order.productName ?? '—'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.totalChildParts} Parts</p>
                            <p className="text-xs text-muted-foreground">
                              {order.completedChildParts}/{order.totalChildParts} ready for assembly
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 min-w-[200px]">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                {order.completedSteps} / {order.totalSteps} steps
                              </span>
                              <span className="font-medium">{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                        </TableCell>
                        <TableCell>
                          {isComplete ? (
                            <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Completed
                            </Badge>
                          ) : hasInProgress ? (
                            <Badge variant="outline" className="border-blue-500 text-blue-700 bg-blue-50">
                              <Clock className="mr-1 h-3 w-3" />
                              In Progress
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-gray-500 text-gray-700 bg-gray-50">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/production/orders/${order.orderId}`}>
                            <Button size="sm" variant="ghost">
                              View Workflow
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
