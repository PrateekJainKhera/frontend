"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ShoppingCart, Factory, AlertTriangle, CheckCircle,
  TruckIcon, Activity, RefreshCw, PackageMinus, Plus,
  ClipboardList, ShieldCheck, Boxes,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { componentService, ComponentLowStockItem } from '@/lib/api/components'
import { orderService, OrderResponse, OrderSummary } from '@/lib/api/orders'
import { productionService, ProductionOrderSummary } from '@/lib/api/production'
import { dispatchService } from '@/lib/api/dispatch'
import { ReadyToDispatchItem, DeliveryChallanApi } from '@/types/dispatch'
import { inventoryService } from '@/lib/api/inventory'
import { materialRequisitionService } from '@/lib/api/material-requisitions'
import { qcService } from '@/lib/api/qc'
import { formatDate } from '@/lib/utils/formatters'

// Every number on this dashboard comes from the live API — no demo data.
export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const [orderSummary, setOrderSummary] = useState<OrderSummary>({ total: 0, pending: 0, inProgress: 0, readyToDispatch: 0, completed: 0 })
  const [recentOrders, setRecentOrders] = useState<OrderResponse[]>([])
  const [prodItems, setProdItems] = useState<ProductionOrderSummary[]>([])
  const [readyItems, setReadyItems] = useState<ReadyToDispatchItem[]>([])
  const [challans, setChallans] = useState<DeliveryChallanApi[]>([])
  const [lowStockComponents, setLowStockComponents] = useState<ComponentLowStockItem[]>([])
  const [rmLowStockCount, setRmLowStockCount] = useState(0)
  const [pendingReqCount, setPendingReqCount] = useState(0)
  const [qcPendingCount, setQcPendingCount] = useState(0)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [ordSum, ordRecent, prod, ready, chal, comp, rmLow, req, qc] = await Promise.allSettled([
      orderService.getSummary(),
      orderService.getPaged(1, 8),
      productionService.getOrderItems(),
      dispatchService.getReadyToDispatch(),
      dispatchService.getAllChallans(),
      componentService.getLowStock(),
      inventoryService.getLowStock(),
      materialRequisitionService.getPending(),
      qcService.getPending(),
    ])
    if (ordSum.status === 'fulfilled') setOrderSummary(ordSum.value)
    if (ordRecent.status === 'fulfilled') setRecentOrders(ordRecent.value.items)
    if (prod.status === 'fulfilled') setProdItems(prod.value)
    if (ready.status === 'fulfilled') setReadyItems(ready.value)
    if (chal.status === 'fulfilled') setChallans(chal.value)
    if (comp.status === 'fulfilled') setLowStockComponents(comp.value)
    if (rmLow.status === 'fulfilled') setRmLowStockCount(rmLow.value.length)
    if (req.status === 'fulfilled') setPendingReqCount(req.value.length)
    if (qc.status === 'fulfilled') setQcPendingCount(qc.value.filter(i => i.qcStatus !== 'Passed').length)
    setLoading(false)
    setLastRefresh(new Date())
  }

  // ── Derived (all real) ──────────────────────────────────────────────────────
  const totalOrders = orderSummary.total
  const pendingOrders = orderSummary.pending
  const completedOrders = orderSummary.completed
  const inProduction = prodItems.filter(p => p.productionStatus === 'InProgress').length
  const readyCount = readyItems.length
  const readyQty = readyItems.reduce((s, i) => s + i.qtyPendingDispatch, 0)
  const dispatchedChallans = challans.filter(c => c.status === 'Dispatched').length

  // Recent activity: latest real orders + challans merged by date
  const recentActivity = [
    ...recentOrders.map(o => ({
      key: `o-${o.id}`,
      icon: 'order' as const,
      title: 'Order Created',
      detail: `${o.orderNo} · ${o.customerName ?? ''}`,
      date: o.orderDate,
      href: `/orders/${o.id}`,
    })),
    ...challans.map(c => ({
      key: `c-${c.id}`,
      icon: 'dispatch' as const,
      title: 'Challan Dispatched',
      detail: `${c.challanNo} · ${c.customerName ?? ''}`,
      date: c.createdAt,
      href: '/dispatch',
    })),
  ]
    .filter(a => a.date)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8)

  const pendingActions = [
    { title: 'Approve Requisitions', count: pendingReqCount, href: '/inventory/material-requisitions', urgent: pendingReqCount > 0 },
    { title: 'Submit QC', count: qcPendingCount, href: '/production/execution', urgent: qcPendingCount > 0 },
    { title: 'Dispatch Ready Items', count: readyCount, href: '/dispatch', urgent: false },
    { title: 'Raw Material Low Stock', count: rmLowStockCount, href: '/inventory', urgent: rmLowStockCount > 0 },
  ]

  const kpi = 'border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:border-primary/50 hover:shadow-md transition-all duration-200'

  return (
    <div className="space-y-6">
      <h1 className="sr-only">Dashboard</h1>

      {/* Refresh */}
      <div className="flex items-center justify-end gap-2">
        {lastRefresh && (
          <span className="text-xs text-muted-foreground">Updated {lastRefresh.toLocaleTimeString()}</span>
        )}
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={loadData} title="Refresh">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Top KPI cards — live counts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/orders">
          <Card className={kpi}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardDescription>Total Orders</CardDescription>
              <ShoppingCart className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{loading ? '—' : totalOrders}</div>
              <p className="text-xs text-muted-foreground mt-1">{pendingOrders} pending · {completedOrders} completed</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/production/execution">
          <Card className={kpi}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardDescription>In Production</CardDescription>
              <Factory className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{loading ? '—' : inProduction}</div>
              <p className="text-xs text-muted-foreground mt-1">order items with active job cards</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dispatch">
          <Card className={kpi}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardDescription>Ready to Dispatch</CardDescription>
              <TruckIcon className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{loading ? '—' : readyCount}</div>
              <p className="text-xs text-muted-foreground mt-1">{readyQty} pcs awaiting dispatch</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dispatch">
          <Card className={kpi}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardDescription>Challans Dispatched</CardDescription>
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{loading ? '—' : dispatchedChallans}</div>
              <p className="text-xs text-muted-foreground mt-1">total delivery challans</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Component low-stock alert (live) */}
      {lowStockComponents.length > 0 && (
        <Card className="border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <CardTitle className="text-amber-800 dark:text-amber-400">
                  Component Low Stock Alert ({lowStockComponents.length})
                </CardTitle>
              </div>
              <Link href="/inventory/receive-components" className="text-sm text-amber-700 dark:text-amber-400 hover:underline font-medium">
                Receive Components →
              </Link>
            </div>
            <CardDescription className="text-amber-700 dark:text-amber-500">
              The following components have fallen below their minimum stock level. Please reorder.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {lowStockComponents.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-white dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-md shrink-0">
                      <PackageMinus className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{item.componentName}</p>
                      <p className="text-xs text-muted-foreground">{item.partNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-red-600">{item.availableStock} {item.unit}</p>
                      <p className="text-xs text-muted-foreground">Min: {item.minimumStock}</p>
                    </div>
                    <Button size="sm" variant="outline" className="border-amber-400 text-amber-700 hover:bg-amber-100 h-8 px-2" asChild>
                      <Link href={`/procurement/purchase-requests/create?itemType=Component&itemId=${item.id}&itemName=${encodeURIComponent(item.componentName)}&qty=${Math.max(0, item.minimumStock - item.availableStock)}&unit=${encodeURIComponent(item.unit)}`}>
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        PR
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent activity (real orders + challans) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest orders and dispatches</CardDescription>
              </div>
              <Activity className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground py-4">Loading…</p>
            ) : recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No activity yet.</p>
            ) : (
              <div className="divide-y">
                {recentActivity.map(a => (
                  <Link key={a.key} href={a.href} className="flex items-center gap-3 py-2.5 hover:bg-muted/40 rounded px-2 -mx-2">
                    {a.icon === 'order'
                      ? <ShoppingCart className="h-4 w-4 text-blue-600 shrink-0" />
                      : <TruckIcon className="h-4 w-4 text-green-600 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{a.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{a.detail}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{formatDate(a.date)}</span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending actions (real counts + links) */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Actions</CardTitle>
            <CardDescription>Items requiring attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingActions.map(pa => (
              <Link key={pa.title} href={pa.href}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/40 transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  {pa.title.includes('Requisition') ? <ClipboardList className="h-4 w-4 text-muted-foreground shrink-0" />
                    : pa.title.includes('QC') ? <ShieldCheck className="h-4 w-4 text-muted-foreground shrink-0" />
                    : pa.title.includes('Dispatch') ? <TruckIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                    : <Boxes className="h-4 w-4 text-muted-foreground shrink-0" />}
                  <span className="text-sm font-medium truncate">{pa.title}</span>
                </div>
                <Badge variant={pa.urgent ? 'destructive' : 'secondary'} className="shrink-0">
                  {loading ? '—' : pa.count}
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
