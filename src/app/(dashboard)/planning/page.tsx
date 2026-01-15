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

  // Orders pending planning (explicit planning status check)
  const pendingPlanningOrders = orders.filter(order =>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Planning Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage order planning and job card generation
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Orders</CardDescription>
            <CardTitle className="text-3xl">{stats.totalOrders}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Active orders in system
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardDescription className="text-orange-700">Pending Planning</CardDescription>
            <CardTitle className="text-3xl text-orange-900">{stats.pendingPlanning}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-orange-600 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Orders awaiting job cards
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardDescription className="text-green-700">Planned</CardDescription>
            <CardTitle className="text-3xl text-green-900">{stats.planned}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Job cards generated
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardDescription className="text-red-700">Material Shortage</CardDescription>
            <CardTitle className="text-3xl text-red-900">{stats.materialShortage}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-red-600 flex items-center gap-1">
              <Package className="h-3 w-3" />
              Jobs blocked by material
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Material Shortage Alerts - Priority Section */}
      {materialPendingJobCards.length > 0 && (
        <Alert variant="destructive" className="border-2">
          <AlertTriangle className="h-5 w-5" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">🔴 Material Shortage Alert</p>
                <p className="text-sm mt-1">
                  {materialPendingJobCards.length} job card{materialPendingJobCards.length > 1 ? 's' : ''} blocked by material unavailability
                </p>
              </div>
              <Button variant="outline" size="sm" className="bg-white">
                View Details
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {materialPendingJobCards.length > 0 && (
        <Card className="border-2 border-red-200">
          <CardHeader>
            <CardTitle className="text-red-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Material Shortage Alerts
            </CardTitle>
            <CardDescription>
              Job cards waiting for material availability
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {materialPendingJobCards.map((jc) => {
                const daysWaiting = calculateDaysWaiting(jc)
                return (
                  <div
                    key={jc.id}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{jc.jobCardNo}</p>
                        <Badge variant="outline" className="text-xs">
                          {jc.orderNo}
                        </Badge>
                        {daysWaiting > 3 && (
                          <Badge variant="destructive" className="text-xs">
                            🔥 {daysWaiting} days
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
                      <p className="text-xs text-muted-foreground mt-2">
                        Contact Stores/Procurement team to arrange material
                      </p>
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
              <CardDescription className="mt-1">
                Orders without job cards - ready for planning
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1">
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
              <CardDescription className="mt-1">
                Orders with job cards generated
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1">
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
