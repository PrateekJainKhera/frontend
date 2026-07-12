"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, RefreshCw, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ProductSpec } from '@/components/ui/product-spec'
import { jobCardService, JobCardResponse } from '@/lib/api/job-cards'

const STATUS_OPTIONS = ['All', 'Pending', 'Scheduled', 'InProgress', 'Completed']

function statusBadge(s: string) {
  const map: Record<string, string> = {
    Pending: 'bg-gray-100 text-gray-700 border-gray-300',
    Scheduled: 'bg-blue-100 text-blue-700 border-blue-300',
    InProgress: 'bg-amber-100 text-amber-700 border-amber-300',
    Completed: 'bg-green-100 text-green-700 border-green-300',
  }
  return <Badge variant="outline" className={`text-xs ${map[s] ?? ''}`}>{s}</Badge>
}

export default function JobCardsPage() {
  const [items, setItems] = useState<JobCardResponse[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(25)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const [loading, setLoading] = useState(true)

  // Drop out-of-order responses — searching fires a request per keystroke, so a
  // slower earlier one must not overwrite the newest results.
  const reqSeq = useRef(0)
  const load = useCallback(async () => {
    const mySeq = ++reqSeq.current
    setLoading(true)
    try {
      const res = await jobCardService.getPaged(page, pageSize, search || undefined, status === 'All' ? undefined : status)
      if (mySeq !== reqSeq.current) return
      setItems(res.items)
      setTotalCount(res.totalCount)
    } catch {
      if (mySeq === reqSeq.current) { setItems([]); setTotalCount(0) }
    }
    if (mySeq === reqSeq.current) setLoading(false)
  }, [page, pageSize, search, status])

  useEffect(() => { load() }, [load])

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/planning">
          <Button variant="ghost" size="sm"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Planning</Button>
        </Link>
        <div className="flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Job Cards</h1>
            <p className="text-sm text-muted-foreground">{totalCount} job cards</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 border rounded-md px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search job card / order / part / process…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="border-0 shadow-none focus-visible:ring-0 h-9 px-0 w-64"
            />
          </div>
          <Select value={status} onValueChange={v => { setStatus(v); setPage(1) }}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={load} title="Refresh">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : items.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No job cards found.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {items.map(jc => (
            <div key={jc.id} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/40 flex-wrap">
              <div className="w-64 shrink-0">
                <span className="font-mono text-sm font-semibold block truncate">{jc.jobCardNo}</span>
                <span className="text-xs text-muted-foreground">
                  {jc.orderNo}{jc.itemSequence ? `-${jc.itemSequence}` : ''}
                </span>
              </div>
              <div className="w-56 shrink-0 min-w-0">
                <ProductSpec machineModel={jc.machineModelName} rollerType={jc.rollerType} numberOfTeeth={jc.numberOfTeeth} />
                <div className="text-xs text-muted-foreground truncate">{jc.childPartName ?? '—'}</div>
              </div>
              <div className="text-sm text-muted-foreground w-40 shrink-0 truncate">
                {jc.stepNo != null && <span className="mr-1 font-medium text-foreground">#{jc.stepNo}</span>}
                {jc.processName ?? '—'}
              </div>
              <span className="text-sm text-muted-foreground">Qty: <span className="font-medium text-foreground">{jc.quantity}</span></span>
              {statusBadge(jc.status)}
              {jc.productionStatus && jc.productionStatus !== 'Pending' && (
                <Badge variant="outline" className="text-xs">{jc.productionStatus}</Badge>
              )}
              {jc.completedQty > 0 && (
                <span className="text-xs text-green-700 ml-auto">Done: {jc.completedQty}{jc.rejectedQty > 0 ? ` · Rej: ${jc.rejectedQty}` : ''}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  )
}
