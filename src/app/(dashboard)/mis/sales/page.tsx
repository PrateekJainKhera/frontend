"use client"

import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { misService, MISOverview } from '@/lib/api/mis'
import {
  StatTile, MonthBarChart, CategoryBars, customerRows,
  MIS_BLUE, NotCapturedNote,
} from '@/components/mis/mis-shared'

// Sales MIS — live counts from /api/mis/overview.
export default function MISSalesPage() {
  const [data, setData] = useState<MISOverview | null>(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    misService.getOverview().then(setData).catch(() => setData(null)).finally(() => setLoading(false))
  }
  useEffect(load, [])

  if (loading) return <div className="space-y-4"><Skeleton className="h-28 w-full" /><Skeleton className="h-72 w-full" /></div>
  if (!data) return <p className="text-sm text-muted-foreground py-8">Failed to load MIS data.</p>

  const top = data.topCustomers[0]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatTile label="Total Orders" value={data.totalOrders} />
        <StatTile label="Top Customer" value={<span className="text-lg leading-snug">{top?.customerName ?? '—'}</span>} hint={top ? `${top.orders} orders · ${top.qty} pcs` : undefined} />
        <StatTile label="Ordered Qty (12 mo)" value={data.ordersPerMonth.reduce((s, m) => s + m.qty, 0)} hint="pieces across last 12 months" />
      </div>

      <MonthBarChart title="Orders per Month" description="Orders booked, last 12 months" data={data.ordersPerMonth} color={MIS_BLUE} valueName="Orders" />

      <CategoryBars title="Top Customers" description="By number of orders (all time)" rows={customerRows(data.topCustomers)} color={MIS_BLUE} unit="orders" />

      <NotCapturedNote what="Revenue by customer and sales value trends (order values are not yet entered)" />
    </div>
  )
}
