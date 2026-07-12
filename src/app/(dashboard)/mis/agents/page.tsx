"use client"

import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { misService, MISOverview } from '@/lib/api/mis'
import {
  StatTile, CategoryBars, statusRows, customerRows,
  MIS_BLUE, MIS_GREEN, NotCapturedNote,
} from '@/components/mis/mis-shared'

// Agents MIS — live counts from /api/mis/overview.
export default function MISAgentsPage() {
  const [data, setData] = useState<MISOverview | null>(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    misService.getOverview().then(setData).catch(() => setData(null)).finally(() => setLoading(false))
  }
  useEffect(load, [])

  if (loading) return <div className="space-y-4"><Skeleton className="h-28 w-full" /><Skeleton className="h-72 w-full" /></div>
  if (!data) return <p className="text-sm text-muted-foreground py-8">Failed to load MIS data.</p>

  const agentCount = data.orderSourceCounts.find(s => s.label.toLowerCase().includes('agent'))?.count ?? 0
  const directCount = data.orderSourceCounts.find(s => s.label.toLowerCase() === 'direct')?.count ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatTile label="Direct Orders" value={directCount} />
        <StatTile label="Agent Orders" value={agentCount} />
        <StatTile label="Total Orders" value={data.totalOrders} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryBars title="Orders by Source" rows={statusRows(data.orderSourceCounts)} color={MIS_BLUE} unit="orders" />
        <CategoryBars title="Top Customers" description="By number of orders" rows={customerRows(data.topCustomers)} color={MIS_GREEN} unit="orders" />
      </div>

      <NotCapturedNote what="Agent commission reports (commission amounts are entered on very few orders so far)" />
    </div>
  )
}
