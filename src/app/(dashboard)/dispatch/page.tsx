'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Package, Truck, CheckCircle2, Clock, AlertTriangle, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { mockDeliveryChallans } from '@/lib/mock-data/delivery-challans'
import { simulateApiCall } from '@/lib/utils/mock-api'
import { DeliveryChallan, DispatchStatus } from '@/types/dispatch'
import { formatDate } from '@/lib/utils/formatters'

export default function DispatchDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [challans, setChallans] = useState<DeliveryChallan[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const data = await simulateApiCall(mockDeliveryChallans, 500)
    setChallans(data)
    setLoading(false)
  }

  // Filter challans by status
  const pendingChallans = challans.filter(c => c.status === DispatchStatus.PENDING)
  const readyChallans = challans.filter(c => c.status === DispatchStatus.READY)
  const dispatchedChallans = challans.filter(c => c.status === DispatchStatus.DISPATCHED || c.status === DispatchStatus.IN_TRANSIT)
  const deliveredChallans = challans.filter(c => c.status === DispatchStatus.DELIVERED)

  // Stats
  const stats = {
    pending: pendingChallans.length,
    ready: readyChallans.length,
    inTransit: dispatchedChallans.length,
    delivered: deliveredChallans.length
  }

  const getStatusBadge = (status: DispatchStatus) => {
    switch (status) {
      case DispatchStatus.PENDING:
        return <Badge variant="outline" className="border-orange-500 text-orange-700">Pending</Badge>
      case DispatchStatus.READY:
        return <Badge variant="outline" className="border-blue-500 text-blue-700">Ready</Badge>
      case DispatchStatus.DISPATCHED:
      case DispatchStatus.IN_TRANSIT:
        return <Badge variant="outline" className="border-purple-500 text-purple-700">In Transit</Badge>
      case DispatchStatus.DELIVERED:
        return <Badge variant="outline" className="border-green-500 text-green-700">Delivered</Badge>
      case DispatchStatus.CANCELLED:
        return <Badge variant="outline" className="border-gray-500 text-gray-700">Cancelled</Badge>
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dispatch</h1>
          <p className="text-muted-foreground">
            Manage delivery challans and track shipments
          </p>
        </div>
        <Link href="/dispatch/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Delivery Challan
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting dispatch</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ready}</div>
            <p className="text-xs text-muted-foreground">Ready to ship</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Truck className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inTransit}</div>
            <p className="text-xs text-muted-foreground">On the way</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.delivered}</div>
            <p className="text-xs text-muted-foreground">Successfully delivered</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Dispatch */}
      {pendingChallans.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Pending Dispatch</CardTitle>
                <CardDescription>Orders ready for delivery challan creation</CardDescription>
              </div>
              <Badge variant="outline">{pendingChallans.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingChallans.map((challan) => (
                <div
                  key={challan.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold">{challan.challanNo}</p>
                      {getStatusBadge(challan.status)}
                      <Badge variant={challan.priority === 'Urgent' ? 'destructive' : 'outline'}>
                        {challan.priority}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Order:</span>
                        <span className="ml-2">{challan.orderNo}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Customer:</span>
                        <span className="ml-2">{challan.customerName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Product:</span>
                        <span className="ml-2">{challan.productName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Quantity:</span>
                        <span className="ml-2">{challan.quantity} {challan.unit}</span>
                      </div>
                    </div>
                  </div>
                  <Link href={`/dispatch/${challan.id}`}>
                    <Button variant="outline">
                      Complete Dispatch
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ready to Dispatch */}
      {readyChallans.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Ready to Dispatch</CardTitle>
                <CardDescription>Challans ready for pickup</CardDescription>
              </div>
              <Badge variant="outline">{readyChallans.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {readyChallans.map((challan) => (
                <div
                  key={challan.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold">{challan.challanNo}</p>
                      {getStatusBadge(challan.status)}
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Order:</span>
                        <span className="ml-2">{challan.orderNo}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Customer:</span>
                        <span className="ml-2">{challan.customerName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Transporter:</span>
                        <span className="ml-2">{challan.transporterName || 'Not assigned'}</span>
                      </div>
                    </div>
                  </div>
                  <Link href={`/dispatch/${challan.id}`}>
                    <Button>
                      Mark Dispatched
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* In Transit */}
      {dispatchedChallans.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>In Transit</CardTitle>
                <CardDescription>Shipments on the way to customer</CardDescription>
              </div>
              <Badge variant="outline">{dispatchedChallans.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dispatchedChallans.map((challan) => (
                <div
                  key={challan.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold">{challan.challanNo}</p>
                      {getStatusBadge(challan.status)}
                    </div>
                    <div className="grid grid-cols-4 gap-4 mt-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Order:</span>
                        <span className="ml-2">{challan.orderNo}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Customer:</span>
                        <span className="ml-2">{challan.customerName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Vehicle:</span>
                        <span className="ml-2">{challan.vehicleNumber || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Expected:</span>
                        <span className="ml-2">{challan.expectedDeliveryDate ? formatDate(challan.expectedDeliveryDate) : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  <Link href={`/dispatch/${challan.id}`}>
                    <Button variant="outline">
                      Track
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recently Delivered */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recently Delivered</CardTitle>
              <CardDescription>Successfully completed deliveries</CardDescription>
            </div>
            <Badge variant="outline">{deliveredChallans.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {deliveredChallans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3" />
              <p>No deliveries yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {deliveredChallans.slice(0, 5).map((challan) => (
                <div
                  key={challan.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold">{challan.challanNo}</p>
                      {getStatusBadge(challan.status)}
                    </div>
                    <div className="grid grid-cols-4 gap-4 mt-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Order:</span>
                        <span className="ml-2">{challan.orderNo}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Customer:</span>
                        <span className="ml-2">{challan.customerName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Delivered:</span>
                        <span className="ml-2">{challan.actualDeliveryDate ? formatDate(challan.actualDeliveryDate) : 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Received by:</span>
                        <span className="ml-2">{challan.receivedBy || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  <Link href={`/dispatch/${challan.id}`}>
                    <Button variant="ghost" size="sm">
                      View Details
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
