"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, AlertTriangle, Package, CheckCircle2, TrendingUp, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { orderService, OrderResponse } from '@/lib/api/orders'
import { jobCardService, JobCardResponse } from '@/lib/api/job-cards'
import { formatDate } from '@/lib/utils/formatters'
import { toast } from 'sonner'

interface OrderItemWithContext {
  orderId: number
  orderNo: string
  orderStatus: string
  orderPriority: string
  customerName?: string
  itemId: number
  itemSequence: string
  productId: number
  productName?: string
  partCode?: string
  numberOfTeeth?: number
  quantity: number
  dueDate: string
  itemPriority: string
  itemStatus: string
  drawingReviewStatus?: string
  planningStatus?: string
}

export function PlanningDashboardTab() {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<OrderResponse[]>([])
  const [orderItems, setOrderItems] = useState<OrderItemWithContext[]>([])
  const [jobCards, setJobCards] = useState<JobCardResponse[]>([])
  const [activeTab, setActiveTab] = useState('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [jobCardsLoaded, setJobCardsLoaded] = useState(false)

  const loadJobCards = async () => {
    try {
      const jobCardsData = await jobCardService.getAll()
      setJobCards(jobCardsData)
      setJobCardsLoaded(true)
    } catch {
      // non-critical
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const ordersData = await orderService.getAll()
      setOrders(ordersData)

      const flattenedItems: OrderItemWithContext[] = []
      ordersData.forEach(order => {
        if (order.items && order.items.length > 0) {
          order.items.forEach(item => {
            flattenedItems.push({
              orderId: order.id,
              orderNo: order.orderNo,
              orderStatus: order.status,
              orderPriority: order.priority,
              customerName: order.customerName,
              itemId: item.id,
              itemSequence: item.itemSequence,
              productId: item.productId,
              productName: item.productName,
              partCode: item.partCode,
              numberOfTeeth: item.numberOfTeeth,
              quantity: item.quantity,
              dueDate: item.dueDate,
              itemPriority: item.priority,
              itemStatus: item.status,
              drawingReviewStatus: item.drawingReviewStatus ?? order.drawingReviewStatus,
              planningStatus: item.planningStatus ?? order.planningStatus
            })
          })
        } else {
          flattenedItems.push({
            orderId: order.id,
            orderNo: order.orderNo,
            orderStatus: order.status,
            orderPriority: order.priority,
            customerName: order.customerName,
            itemId: 0,
            itemSequence: 'A',
            productId: order.productId,
            productName: order.productName,
            partCode: order.productCode,
            numberOfTeeth: order.numberOfTeeth,
            quantity: order.quantity,
            dueDate: order.dueDate,
            itemPriority: order.priority,
            itemStatus: order.status,
            drawingReviewStatus: order.drawingReviewStatus,
            planningStatus: order.planningStatus
          })
        }
      })
      setOrderItems(flattenedItems)
    } catch (error) {
      toast.error('Failed to load planning data', {
        description: error instanceof Error ? error.message : 'An error occurred'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    if (activeTab === 'planned' && !jobCardsLoaded) {
      loadJobCards()
    }
  }, [activeTab])

  const pendingPlanningItems = orderItems.filter(item =>
    item.drawingReviewStatus === 'Approved' &&
    item.planningStatus === 'Not Planned'
  )

  const plannedItems = orderItems.filter(item =>
    item.planningStatus === 'Planned' || item.planningStatus === 'Released'
  )

  const materialPendingJobCards = jobCards.filter(jc => jc.status === 'Pending Material')

  const stats = {
    totalOrders: orders.length,
    pendingPlanning: pendingPlanningItems.length,
    planned: plannedItems.length,
    materialShortage: materialPendingJobCards.length
  }

  const q = searchQuery.toLowerCase()
  const filteredPending = pendingPlanningItems.filter(item =>
    !q ||
    `${item.orderNo}-${item.itemSequence}`.toLowerCase().includes(q) ||
    (item.customerName ?? '').toLowerCase().includes(q) ||
    (item.productName ?? '').toLowerCase().includes(q) ||
    (item.partCode ?? '').toLowerCase().includes(q)
  )
  const filteredPlanned = plannedItems.filter(item =>
    !q ||
    `${item.orderNo}-${item.itemSequence}`.toLowerCase().includes(q) ||
    (item.customerName ?? '').toLowerCase().includes(q) ||
    (item.productName ?? '').toLowerCase().includes(q) ||
    (item.partCode ?? '').toLowerCase().includes(q)
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 hover:border-primary/50 hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">Active orders in system</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/50 hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Planning</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPlanning}</div>
            <p className="text-xs text-muted-foreground">Awaiting job cards</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/50 hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planned</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.planned}</div>
            <p className="text-xs text-muted-foreground">Job cards generated</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/50 hover:shadow-md transition-all">
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

      {/* Tabs — same format as /masters/products */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList className="grid max-w-md grid-cols-2">
            <TabsTrigger value="pending">Pending Planning</TabsTrigger>
            <TabsTrigger value="planned">Planned Items</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 bg-background border-2 border-border rounded-lg px-4 py-1 shadow-sm flex-1 max-w-md">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              placeholder="Search order, customer, product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 shadow-none focus-visible:ring-0 h-8 px-0 text-sm flex-1 placeholder:text-muted-foreground/40 focus:placeholder:text-transparent caret-foreground"
            />
          </div>
        </div>

        {/* Pending Planning Tab */}
        <TabsContent value="pending" className="mt-4">
          {filteredPending.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border rounded-lg">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-600" />
              <p className="font-medium">All items have been planned!</p>
              <p className="text-sm mt-1">No items awaiting job card generation</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPending.map((item) => (
                <div
                  key={`${item.orderId}-${item.itemSequence}`}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold">{item.orderNo}-{item.itemSequence}</p>
                      <Badge variant={item.itemPriority === 'Urgent' ? 'destructive' : 'outline'}>
                        {item.itemPriority}
                      </Badge>
                      <Badge variant="outline">{item.itemStatus}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Customer:</span>
                        <span className="ml-2">{item.customerName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Product:</span>
                        <span className="ml-2">
                          {item.productName || item.partCode}
                          {(item.numberOfTeeth ?? 0) > 0 && (
                            <span className="ml-1 text-xs text-muted-foreground">({item.numberOfTeeth}T)</span>
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Qty:</span>
                        <span className="ml-2">{item.quantity} pcs</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Due:</span>
                        <span className="ml-2">{formatDate(item.dueDate)}</span>
                      </div>
                    </div>
                  </div>
                  <Link href={`/planning/generate-job-cards/${item.orderId}?itemId=${item.itemId}&itemSequence=${item.itemSequence}`}>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Generate Job Cards
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Planned Items Tab */}
        <TabsContent value="planned" className="mt-4">
          {filteredPlanned.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border rounded-lg">
              <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
              <p className="font-medium">No planned items yet</p>
              <p className="text-sm mt-1">Generate job cards for pending items</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPlanned.map((item) => {
                const itemJobCards = jobCards.filter(jc =>
                  jc.orderId === item.orderId &&
                  (jc.itemSequence === item.itemSequence || item.itemId === 0)
                )
                const completedJobCards = itemJobCards.filter(jc => jc.status === 'Completed')
                const progress = itemJobCards.length > 0
                  ? Math.round((completedJobCards.length / itemJobCards.length) * 100)
                  : 0

                return (
                  <div
                    key={`${item.orderId}-${item.itemSequence}`}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="font-semibold">{item.orderNo}-{item.itemSequence}</p>
                        <Badge variant="outline">{item.customerName}</Badge>
                        <Badge variant="secondary">{itemJobCards.length} job cards</Badge>
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
                          <span className="ml-2">
                            {item.productName || item.partCode}
                            {(item.numberOfTeeth ?? 0) > 0 && (
                              <span className="ml-1 text-xs text-muted-foreground">({item.numberOfTeeth}T)</span>
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Progress:</span>
                          <span className="ml-2">{completedJobCards.length} / {itemJobCards.length} complete ({progress}%)</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/planning/job-cards?orderId=${item.orderId}&itemSequence=${item.itemSequence}`}>
                        <Button variant="outline" size="sm">View Job Cards</Button>
                      </Link>
                      <Link href={`/orders/${item.orderId}`}>
                        <Button variant="outline" size="sm">View Order</Button>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
