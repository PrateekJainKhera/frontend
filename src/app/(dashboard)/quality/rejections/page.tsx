"use client"

import { useEffect, useMemo, useState } from 'react'
import { XCircle, Search, RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ProductSpec } from '@/components/ui/product-spec'
import { jobCardService, JobCardResponse } from '@/lib/api/job-cards'
import { formatDate } from '@/lib/utils/formatters'

// QC Rejections register — real job cards with RejectedQty > 0.
export default function QualityRejectionsPage() {
  const [rows, setRows] = useState<JobCardResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = () => {
    setLoading(true)
    jobCardService.getRejections().then(setRows).catch(() => setRows([])).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return rows
    return rows.filter(r =>
      r.jobCardNo.toLowerCase().includes(q) ||
      (r.orderNo ?? '').toLowerCase().includes(q) ||
      (r.childPartName ?? '').toLowerCase().includes(q) ||
      (r.processName ?? '').toLowerCase().includes(q) ||
      (r.machineModelName ?? '').toLowerCase().includes(q))
  }, [rows, search])

  const totalRejected = rows.reduce((s, r) => s + r.rejectedQty, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <XCircle className="h-7 w-7 text-red-600" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Rejections</h1>
          <p className="text-sm text-muted-foreground">
            {rows.length} job card(s) with rejections · {totalRejected} piece(s) rejected in total
          </p>
        </div>
        <div className="flex items-center gap-2 border rounded-md px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search job card / order / part / process…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 h-9 px-0 w-64" />
        </div>
        <Button variant="outline" size="icon" onClick={load} title="Refresh">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <XCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No rejections recorded</p>
            <p className="text-sm">Rejections reported in Production → Execution will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(jc => (
            <div key={jc.id} className="flex items-center gap-4 p-3 border rounded-lg bg-red-50/40 border-red-200 flex-wrap">
              <div className="w-64 shrink-0">
                <span className="font-mono text-sm font-semibold block truncate">{jc.jobCardNo}</span>
                <span className="text-xs text-muted-foreground">{jc.orderNo}{jc.itemSequence ? `-${jc.itemSequence}` : ''}</span>
              </div>
              <div className="w-56 shrink-0 min-w-0">
                <ProductSpec machineModel={jc.machineModelName} rollerType={jc.rollerType} numberOfTeeth={jc.numberOfTeeth} />
                <div className="text-xs text-muted-foreground truncate">{jc.childPartName ?? '—'}</div>
              </div>
              <div className="text-sm text-muted-foreground w-40 shrink-0 truncate">
                {jc.stepNo != null && <span className="mr-1 font-medium text-foreground">#{jc.stepNo}</span>}
                {jc.processName ?? '—'}
              </div>
              <Badge variant="outline" className="border-red-400 text-red-700 bg-red-50">
                Rejected: {jc.rejectedQty}
              </Badge>
              <span className="text-sm text-muted-foreground">of {jc.quantity} pcs</span>
              {jc.updatedAt && <span className="text-xs text-muted-foreground ml-auto">{formatDate(jc.updatedAt)}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
