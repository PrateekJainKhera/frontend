"use client"

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, AlertTriangle, Package, CheckCircle2, TrendingUp, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { orderService, PlanningItem, PlanningSummary } from '@/lib/api/orders'
import { formatDate } from '@/lib/utils/formatters'
import { toast } from 'sonner'

const PAGE_SIZES = [10, 25, 50]

export function PlanningDashboardTab() {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<PlanningItem[]>([])
  const [summary, setSummary] = useState<PlanningSummary>({ totalOrders: 0, pendingPlanning: 0, planned: 0, materialShortage: 0 })
  const [activeTab, setActiveTab] = useState<'pending' | 'planned'>('pending')

  const [searchQuery, setSearchQuery] = useState('')
  const [search, setSearch] = useState('')          // debounced

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // Debounce search → server, reset to page 1
  useEffect(() => {
    const id = setTimeout(() => { setSearch(searchQuery); setPage(1) }, 400)
    return () => clearTimeout(id)
  }, [searchQuery])

  const loadItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await orderService.getPlanningItems(activeTab, page, pageSize, search)
      setItems(res.items)
      setTotalCount(res.totalCount)
      setTotalPages(res.totalPages)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load planning data')
      setItems([])
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, page, pageSize, search])

  const loadSummary = useCallback(async () => {
    setSummary(await orderService.getPlanningSummary())
  }, [])

  useEffect(() => { loadItems() }, [loadItems])
  useEffect(() => { loadSummary() }, [loadSummary])

  const changeTab = (tab: string) => {
    setActiveTab(tab as 'pending' | 'planned')
    setPage(1)
  }

  const stats = summary
  const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeEnd = Math.min(page * pageSize, totalCount)

  const PaginationFooter = () => (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-1">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Rows per page</span>
        <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1) }}>
          <SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            {PAGE_SIZES.map(s => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="ml-2">{totalCount === 0 ? 'No items' : `${rangeStart}–${rangeEnd} of ${totalCount}`}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
          <ChevronLeft className="h-4 w-4" /> Prev
        </Button>
        <span className="text-sm text-muted-foreground min-w-24 text-center">Page {totalPages === 0 ? 0 : page} of {totalPages}</span>
        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      {/* KPI Cards — global counts from summary */}
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
      {stats.materialShortage > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Material Shortage Alert</p>
                <p className="text-sm mt-1">
                  {stats.materialShortage} job card{stats.materialShortage > 1 ? 's' : ''} blocked by material unavailability
                </p>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={changeTab} className="w-full">
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

        {loading ? (
          <div className="mt-4 space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : (
          <>
            {/* Pending Planning Tab */}
            <TabsContent value="pending" className="mt-4">
              {items.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border rounded-lg">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-600" />
                  <p className="font-medium">All items have been planned!</p>
                  <p className="text-sm mt-1">No items awaiting job card generation</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
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
                              {item.rollerType ? ` · ${item.rollerType}` : ''}
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
              <PaginationFooter />
            </TabsContent>

            {/* Planned Items Tab */}
            <TabsContent value="planned" className="mt-4">
              {items.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border rounded-lg">
                  <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="font-medium">No planned items yet</p>
                  <p className="text-sm mt-1">Generate job cards for pending items</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => {
                    const progress = item.jobCardCount > 0
                      ? Math.round((item.completedJobCardCount / item.jobCardCount) * 100)
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
                            <Badge variant="secondary">{item.jobCardCount} job cards</Badge>
                            {progress === 100 && item.jobCardCount > 0 && (
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
                                {item.rollerType ? ` · ${item.rollerType}` : ''}
                                {(item.numberOfTeeth ?? 0) > 0 && (
                                  <span className="ml-1 text-xs text-muted-foreground">({item.numberOfTeeth}T)</span>
                                )}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Progress:</span>
                              <span className="ml-2">{item.completedJobCardCount} / {item.jobCardCount} complete ({progress}%)</span>
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
              <PaginationFooter />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  )
}
