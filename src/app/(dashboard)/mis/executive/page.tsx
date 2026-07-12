"use client"

import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { misService, MISOverview } from '@/lib/api/mis'
import {
  StatTile, MonthBarChart, CategoryBars, statusRows,
  MIS_BLUE, MIS_GREEN, NotCapturedNote,
} from '@/components/mis/mis-shared'

// Executive overview — every number comes from /api/mis/overview (live DB aggregates).
export default function MISExecutivePage() {
  const [data, setData] = useState<MISOverview | null>(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    misService.getOverview().then(setData).catch(() => setData(null)).finally(() => setLoading(false))
  }
  useEffect(load, [])

  if (loading) return <div className="space-y-4"><Skeleton className="h-28 w-full" /><Skeleton className="h-72 w-full" /></div>
  if (!data) return <p className="text-sm text-muted-foreground py-8">Failed to load MIS data.</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="Total Orders" value={data.totalOrders} />
        <StatTile label="Dispatched Qty" value={data.totalDispatchedQty} hint={`${data.totalChallans} delivery challans`} />
        <StatTile label="Job Card Steps Done" value={data.jobCardsCompletedSteps} hint={`of ${data.jobCardsTotal} total steps`} />
        <StatTile label="Rejections" value={data.totalRejectedQty} hint={`${data.reworkJobCards} rework job cards`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthBarChart title="Orders per Month" description="Orders booked, last 12 months" data={data.ordersPerMonth} color={MIS_BLUE} valueName="Orders" />
        <MonthBarChart title="Dispatches per Month" description="Delivery challans created, last 12 months" data={data.challansPerMonth} color={MIS_GREEN} valueName="Challans" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryBars title="Order Status" rows={statusRows(data.orderStatusCounts)} color={MIS_BLUE} />
        <CategoryBars title="Order Source" rows={statusRows(data.orderSourceCounts)} color={MIS_GREEN} />
      </div>

      <NotCapturedNote what="Revenue and payment analytics (order values are not yet entered on orders)" />
    </div>
  )
}
