'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Clock,
  Search,
  ArrowRight,
  RefreshCw,
  Loader2,
  Package,
} from 'lucide-react'
import { productionService, ProductionOrderSummary } from '@/lib/api/production'
import { format } from 'date-fns'
import Link from 'next/link'
import { toast } from 'sonner'

function priorityBadge(priority: string) {
  const p = priority?.toUpperCase()
  if (p === 'HIGH' || p === 'CRITICAL')
    return <Badge className="bg-red-100 text-red-700 border border-red-200 text-[10px] h-4 px-1.5">High</Badge>
  if (p === 'MEDIUM')
    return <Badge className="bg-amber-100 text-amber-700 border border-amber-200 text-[10px] h-4 px-1.5">Med</Badge>
  return <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] h-4 px-1.5">Low</Badge>
}

function statusBadge(status: string) {
  if (status === 'Completed')
    return <Badge className="bg-green-100 text-green-700 border border-green-200 text-[10px] h-4 px-1.5">Completed</Badge>
  if (status === 'InProgress')
    return <Badge className="bg-blue-100 text-blue-700 border border-blue-200 text-[10px] h-4 px-1.5">In Progress</Badge>
  return <Badge className="bg-gray-100 text-gray-600 border border-gray-200 text-[10px] h-4 px-1.5">Pending</Badge>
}

export default function ProductionOrdersPage() {
  const [items, setItems] = useState<ProductionOrderSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'InProgress' | 'Completed'>('all')

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const data = await productionService.getOrderItems()
      setItems(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load production orders')
    } finally {
      setLoading(false)
    }
  }

  const filtered = items.filter(item => {
    const matchSearch =
      item.orderNo.toLowerCase().includes(search.toLowerCase()) ||
      (item.customerName ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (item.productName ?? '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || item.productionStatus === statusFilter
    return matchSearch && matchStatus
  })

  const counts = {
    all: items.length,
    Pending: items.filter(i => i.productionStatus === 'Pending').length,
    InProgress: items.filter(i => i.productionStatus === 'InProgress').length,
    Completed: items.filter(i => i.productionStatus === 'Completed').length,
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-background shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">Production Dashboard</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Scheduled orders ready for production execution
            </p>
          </div>
          <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Refresh
          </Button>
        </div>

        {/* Stats row */}
        {!loading && (
          <div className="flex gap-4 text-xs text-muted-foreground mb-4">
            <span><span className="font-semibold text-foreground">{counts.all}</span> total</span>
            <span><span className="font-semibold text-blue-600">{counts.InProgress}</span> in progress</span>
            <span><span className="font-semibold text-amber-600">{counts.Pending}</span> pending</span>
            <span><span className="font-semibold text-green-600">{counts.Completed}</span> completed</span>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-muted/40 border rounded-lg px-2.5 py-1 flex-1 max-w-xs">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <Input
              placeholder="Search orders, customers, products…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border-0 shadow-none focus-visible:ring-0 h-6 px-0 text-xs bg-transparent"
            />
          </div>
          {(['all', 'Pending', 'InProgress', 'Completed'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                statusFilter === s
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border hover:bg-muted/50'
              }`}
            >
              {s === 'all' ? 'All' : s === 'InProgress' ? 'In Progress' : s}
              {' '}({counts[s]})
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
            {items.length === 0 ? (
              <>
                <Package className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm font-medium">No orders in production</p>
                <p className="text-xs text-center max-w-xs">
                  Orders appear here once their job cards are scheduled.
                  Go to <Link href="/scheduling" className="text-primary underline">Scheduling</Link> to schedule job cards.
                </p>
              </>
            ) : (
              <>
                <Search className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm font-medium">No results for "{search}"</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(item => {
              const progress = item.totalSteps > 0
                ? Math.round((item.completedSteps / item.totalSteps) * 100)
                : 0
              const detailHref = item.orderItemId
                ? `/production/order-items/${item.orderItemId}`
                : `/production/orders/${item.orderId}`

              return (
                <div
                  key={item.orderItemId ?? item.orderId}
                  className="flex items-center gap-4 rounded-lg border bg-card px-4 py-3 hover:bg-muted/20 transition-colors"
                >
                  {/* Order info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link href={detailHref} className="font-semibold text-sm hover:underline text-primary">
                        {item.orderNo}
                      </Link>
                      {priorityBadge(item.priority)}
                      {statusBadge(item.productionStatus)}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {item.customerName && <span>{item.customerName}</span>}
                      {(item.machineModel || item.productName) && (
                        <>
                          <span>·</span>
                          <span className="font-medium text-foreground truncate max-w-[260px]">
                            {item.machineModel || item.productName}
                            {item.rollerType ? ` · ${item.rollerType}` : ''}
                            {(item.numberOfTeeth ?? 0) > 0 ? ` · ${item.numberOfTeeth}T` : ''}
                          </span>
                        </>
                      )}
                      {item.dueDate && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Due {format(new Date(item.dueDate), 'dd MMM')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Child parts progress */}
                  <div className="text-xs text-center shrink-0 w-24">
                    <div className="text-muted-foreground">Parts</div>
                    <div className="font-semibold">
                      {item.completedChildParts}/{item.totalChildParts}
                    </div>
                  </div>

                  {/* Steps progress bar */}
                  <div className="w-36 shrink-0">
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                      <span>{item.completedSteps}/{item.totalSteps} steps</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                    {item.inProgressSteps > 0 && (
                      <div className="text-[10px] text-blue-600 mt-0.5">{item.inProgressSteps} running</div>
                    )}
                  </div>

                  {/* Action */}
                  <Link href={detailHref}>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
