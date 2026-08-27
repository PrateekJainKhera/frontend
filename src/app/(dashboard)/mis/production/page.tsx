"use client"

import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { misService, MISOverview } from '@/lib/api/mis'
import { machineService, MachineUtilizationResponse } from '@/lib/api/machines'
import {
  StatTile, MonthBarChart, CategoryBars, statusRows,
  MIS_GREEN, MIS_VIOLET,
} from '@/components/mis/mis-shared'

// Production MIS — live counts from /api/mis/overview, plus real machine
// utilization from /api/machines/utilization (Scheduling → Machine Utilization
// has the full drill-down; this is just a shop-wide summary).
export default function MISProductionPage() {
  const [data, setData] = useState<MISOverview | null>(null)
  const [machines, setMachines] = useState<MachineUtilizationResponse[] | null>(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    Promise.all([
      misService.getOverview().catch(() => null),
      machineService.getUtilization().catch(() => null),
    ]).then(([overview, util]) => {
      setData(overview)
      setMachines(util)
    }).finally(() => setLoading(false))
  }
  useEffect(load, [])

  if (loading) return <div className="space-y-4"><Skeleton className="h-28 w-full" /><Skeleton className="h-72 w-full" /></div>
  if (!data) return <p className="text-sm text-muted-foreground py-8">Failed to load MIS data.</p>

  const pct = data.jobCardsTotal > 0 ? Math.round((data.jobCardsCompletedSteps / data.jobCardsTotal) * 100) : 0

  const avgUtilization = machines && machines.length > 0
    ? Math.round(machines.reduce((s, m) => s + m.utilizationPercentToday, 0) / machines.length)
    : null
  const busyCount = machines ? machines.filter((m) => m.isCurrentlyBusy).length : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="Job Card Steps" value={data.jobCardsTotal} />
        <StatTile label="Steps Completed" value={data.jobCardsCompletedSteps} hint={`${pct}% of all steps`} />
        <StatTile label="Rejected Pieces" value={data.totalRejectedQty} hint={`${data.rejectionJobCards} job cards with rejections`} />
        <StatTile label="Rework Job Cards" value={data.reworkJobCards} />
      </div>

      {machines && machines.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatTile label="Machines Tracked" value={machines.length} />
          <StatTile label="Currently Busy" value={busyCount ?? 0} hint={`${machines.length - (busyCount ?? 0)} free right now`} />
          <StatTile label="Avg. Utilization Today" value={`${avgUtilization ?? 0}%`} hint="Across all active machines" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryBars title="Roller Type Mix" description="Order items by product roller type" rows={statusRows(data.rollerTypeCounts)} color={MIS_VIOLET} unit="items" />
        <MonthBarChart title="Dispatched Qty per Month" description="Pieces dispatched, last 12 months" data={data.challansPerMonth} color={MIS_GREEN} valueKey="qty" valueName="Pieces" />
      </div>

      <p className="text-xs text-muted-foreground">
        Cycle-time analytics (actual vs. estimated duration per process) aren&apos;t built yet.
        For the full machine-by-machine breakdown, see{' '}
        <a href="/scheduling/machine-utilization" className="underline">Scheduling → Machine Utilization</a>.
      </p>
    </div>
  )
}
