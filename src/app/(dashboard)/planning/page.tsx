"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, AlertTriangle, Package, CheckCircle2, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { mockOrders, mockJobCards } from '@/lib/mock-data'
import { simulateApiCall } from '@/lib/utils/mock-api'
import { Order, OrderStatus } from '@/types'
import { JobCard, JobCardStatus, MaterialStatus } from '@/types/job-card'
import { formatDate } from '@/lib/utils/formatters'

export default function PlanningDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [jobCards, setJobCards] = useState<JobCard[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [ordersData, jobCardsData] = await Promise.all([
      simulateApiCall(mockOrders, 500),
      simulateApiCall(mockJobCards, 500)
    ])
    setOrders(ordersData)
    setJobCards(jobCardsData)
    setLoading(false)
  }

  // 🔒 BUSINESS RULE: Planning blocked until drawingReviewStatus === 'APPROVED'
  const pendingPlanningOrders = orders.filter(order =>
    order.drawingReviewStatus === 'Approved' &&
    order.planningStatus === 'Not Planned' &&
    (order.status === OrderStatus.PENDING || order.status === OrderStatus.IN_PROGRESS)
  )

  // Orders that are planned or released (explicit planning status check)
  const plannedOrders = orders.filter(order =>
    order.planningStatus === 'Planned' || order.planningStatus === 'Released'
  )

  // Job cards pending material
  const materialPendingJobCards = jobCards.filter(jc =>
    jc.materialStatus === MaterialStatus.PENDING ||
    jc.status === JobCardStatus.PENDING_MATERIAL
  )

  // Calculate days waiting for material
  const calculateDaysWaiting = (jobCard: JobCard): number => {
    if (!jobCard.materialStatusUpdatedAt) return 0
    const now = new Date()
    const updatedAt = new Date(jobCard.materialStatusUpdatedAt)
    const diffTime = Math.abs(now.getTime() - updatedAt.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  // Stats
  const stats = {
    totalOrders: orders.length,
    pendingPlanning: pendingPlanningOrders.length,
    planned: plannedOrders.length,
    materialShortage: materialPendingJobCards.length
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
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Planning Dashboard</h1>
        <p className="text-muted-foreground">
          Manage order planning and job card generation
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">Active orders in system</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Planning</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPlanning}</div>
            <p className="text-xs text-muted-foreground">Awaiting job cards</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planned</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.planned}</div>
            <p className="text-xs text-muted-foreground">Job cards generated</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Material Shortage</CardTitle>
            <Package className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.materialShortage}</div>
            <p className="text-xs text-muted-foreground">Jobs blocked by material</p>
          </CardContent>
        </Card>
      </div>

      {/* Material Shortage Alert */}
      {materialPendingJobCards.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Material Shortage Alert</p>
                <p className="text-sm mt-1">
                  {materialPendingJobCards.length} job card{materialPendingJobCards.length > 1 ? 's' : ''} blocked by material unavailability
                </p>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {materialPendingJobCards.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Material Shortage Details</CardTitle>
                <CardDescription>
                  Job cards waiting for material availability
                </CardDescription>
              </div>
              <Badge variant="destructive">
                {materialPendingJobCards.length} Blocked
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {materialPendingJobCards.map((jc) => {
                const daysWaiting = calculateDaysWaiting(jc)
                return (
                  <div
                    key={jc.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{jc.jobCardNo}</p>
                        <Badge variant="outline" className="text-xs">
                          {jc.orderNo}
                        </Badge>
                        {daysWaiting > 3 && (
                          <Badge variant="destructive" className="text-xs">
                            {daysWaiting} days
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {jc.childPartName} • {jc.processName}
                      </p>
                      {jc.materialShortfall && (
                        <p className="text-xs text-red-700 mt-1">
                          <strong>Shortfall:</strong> {jc.materialShortfall.materialName} -
                          Need {jc.materialShortfall.shortfall} {jc.materialShortfall.unit}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Planning Orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Orders Pending Planning</CardTitle>
              <CardDescription>
                Orders without job cards - ready for planning
              </CardDescription>
            </div>
            <Badge variant="outline">
              {pendingPlanningOrders.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {pendingPlanningOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-600" />
              <p>All orders have been planned!</p>
              <p className="text-sm mt-1">No orders awaiting job card generation</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingPlanningOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold">{order.orderNo}</p>
                      <Badge variant={order.priority === 'Urgent' ? 'destructive' : 'outline'}>
                        {order.priority}
                      </Badge>
                      <Badge variant="outline">{order.status}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Customer:</span>
                        <span className="ml-2">{order.customer?.name}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Product:</span>
                        <span className="ml-2">{order.product?.modelName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Quantity:</span>
                        <span className="ml-2">{order.quantity} pcs</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Due Date:</span>
                        <span className="ml-2">{formatDate(order.dueDate)}</span>
                      </div>
                    </div>
                  </div>
                  <Link href={`/planning/generate-job-cards/${order.id}`}>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Generate Job Cards
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Planned Orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Planned Orders</CardTitle>
              <CardDescription>
                Orders with job cards generated
              </CardDescription>
            </div>
            <Badge variant="outline">
              {plannedOrders.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {plannedOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3" />
              <p>No planned orders yet</p>
              <p className="text-sm mt-1">Generate job cards for orders above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {plannedOrders.map((order) => {
                const orderJobCards = jobCards.filter(jc => jc.orderId === order.id)
                const completedJobCards = orderJobCards.filter(jc => jc.status === JobCardStatus.COMPLETED)
                const progress = orderJobCards.length > 0
                  ? Math.round((completedJobCards.length / orderJobCards.length) * 100)
                  : 0

                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="font-semibold">{order.orderNo}</p>
                        <Badge variant="outline">{order.customer?.name}</Badge>
                        <Badge variant="secondary">
                          {orderJobCards.length} job cards
                        </Badge>
                        {progress === 100 && (
                          <Badge className="bg-green-600">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Complete
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Product:</span>
                          <span className="ml-2">{order.product?.modelName}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Progress:</span>
                          <span className="ml-2">{completedJobCards.length} / {orderJobCards.length} complete ({progress}%)</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/planning/job-cards?orderId=${order.id}`}>
                        <Button variant="outline" size="sm">
                          View Job Cards
                        </Button>
                      </Link>
                      <Link href={`/orders/${order.id}`}>
                        <Button variant="outline" size="sm">
                          View Order
                        </Button>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
