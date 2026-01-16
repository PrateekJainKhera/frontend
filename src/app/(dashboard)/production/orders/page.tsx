'use client'

import { useState } from 'react'
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
} from 'lucide-react'
import { mockJobCards } from '@/lib/mock-data/job-cards-complete'
import { groupJobCardsByOrder, calculateOrderProgress } from '@/lib/utils/production-grouping'
import Link from 'next/link'

export default function ProductionDashboardPage() {
  const [searchQuery, setSearchQuery] = useState('')

  // Group job cards by order
  const orderViews = groupJobCardsByOrder(mockJobCards)

  // Calculate statistics
  const stats = {
    totalOrders: orderViews.length,
    inProgress: orderViews.filter(ov => ov.inProgressSteps > 0).length,
    completed: orderViews.filter(ov => ov.completedSteps === ov.totalSteps).length,
    totalSteps: orderViews.reduce((sum, ov) => sum + ov.totalSteps, 0),
    completedSteps: orderViews.reduce((sum, ov) => sum + ov.completedSteps, 0),
  }

  // Filter orders
  const filteredOrders = orderViews.filter(order => {
    const matchesSearch =
      order.orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.productName.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesSearch
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
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => {
                    const progress = calculateOrderProgress(order)
                    const isComplete = progress === 100
                    const hasInProgress = order.inProgressSteps > 0

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
                            <div>
                              <p className="font-medium">{order.customerName}</p>
                              <p className="text-xs text-muted-foreground">{order.customerCode}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{order.productName}</p>
                              <p className="text-xs text-muted-foreground">{order.productCode}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.childParts.length} Parts</p>
                            <p className="text-xs text-muted-foreground">
                              {order.totalSteps} total steps
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
