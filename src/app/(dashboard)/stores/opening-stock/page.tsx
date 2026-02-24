"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Eye, Trash2, CheckCircle, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { openingStockService } from '@/lib/api/opening-stock'
import { OpeningStockSummary } from '@/types/opening-stock'
import { toast } from 'sonner'
import { format } from 'date-fns'

const STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  Confirmed: 'bg-green-100 text-green-700 border-green-200',
}

export default function OpeningStockPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<OpeningStockSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [deleting, setDeleting] = useState<number | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await openingStockService.getAll()
      setEntries(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load opening stock entries')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number, entryNo: string) => {
    if (!confirm(`Delete ${entryNo}? This cannot be undone.`)) return
    setDeleting(id)
    try {
      await openingStockService.delete(id)
      toast.success(`${entryNo} deleted`)
      setEntries(prev => prev.filter(e => e.id !== id))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete')
    } finally {
      setDeleting(null)
    }
  }

  const statuses = ['All', 'Draft', 'Confirmed']
  const counts = {
    All: entries.length,
    Draft: entries.filter(e => e.status === 'Draft').length,
    Confirmed: entries.filter(e => e.status === 'Confirmed').length,
  }

  const filtered = entries.filter(e =>
    statusFilter === 'All' || e.status === statusFilter
  )

  const totalPieces = entries.filter(e => e.status === 'Confirmed').reduce((s, e) => s + e.totalPieces, 0)
  const totalComponents = entries.filter(e => e.status === 'Confirmed').reduce((s, e) => s + e.totalComponents, 0)

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Opening Stock</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Add existing inventory (raw materials &amp; components) without a purchase order
          </p>
        </div>
        <Button onClick={() => router.push('/stores/opening-stock/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Entry
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statuses.map(s => (
          <Card
            key={s}
            className={`border-2 cursor-pointer transition-colors ${statusFilter === s ? 'border-primary' : 'border-border hover:border-primary/50'}`}
            onClick={() => setStatusFilter(s)}
          >
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{s}</p>
              <p className="text-2xl font-bold">{counts[s as keyof typeof counts] ?? 0}</p>
            </CardContent>
          </Card>
        ))}
        <Card className="border-2 border-border bg-green-50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Confirmed Pieces</p>
            <p className="text-2xl font-bold text-green-700">{totalPieces}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-2 border-border">
        <CardHeader>
          <CardTitle>
            Opening Stock Entries
            <span className="text-muted-foreground font-normal text-base ml-2">({filtered.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <Package className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">No opening stock entries found</p>
              <Button variant="outline" className="mt-4" onClick={() => router.push('/stores/opening-stock/new')}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Entry
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="bg-muted border-b">
                    <th className="text-left p-3 font-semibold">Entry No.</th>
                    <th className="text-left p-3 font-semibold">Date</th>
                    <th className="text-left p-3 font-semibold">Status</th>
                    <th className="text-left p-3 font-semibold text-center">RM Lines</th>
                    <th className="text-left p-3 font-semibold text-center">Comp. Lines</th>
                    <th className="text-left p-3 font-semibold text-center">Pieces</th>
                    <th className="text-left p-3 font-semibold hidden md:table-cell">Created</th>
                    <th className="text-left p-3 font-semibold">Remarks</th>
                    <th className="text-right p-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(entry => (
                    <tr key={entry.id} className="border-b hover:bg-muted/40 transition-colors">
                      <td className="p-3 font-mono font-semibold">
                        <Link href={`/stores/opening-stock/${entry.id}`} className="text-primary hover:underline">
                          {entry.entryNo}
                        </Link>
                      </td>
                      <td className="p-3">
                        {format(new Date(entry.entryDate), 'dd MMM yyyy')}
                      </td>
                      <td className="p-3">
                        <Badge className={STATUS_COLORS[entry.status]}>
                          {entry.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">{entry.rawMaterialLines}</td>
                      <td className="p-3 text-center">{entry.componentLines}</td>
                      <td className="p-3 text-center font-semibold">
                        {entry.status === 'Confirmed' ? (
                          <span className="text-green-700">{entry.totalPieces}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-3 hidden md:table-cell text-muted-foreground">
                        {format(new Date(entry.createdAt), 'dd MMM yyyy')}
                      </td>
                      <td className="p-3 text-muted-foreground max-w-[180px] truncate">
                        {entry.remarks || '—'}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/stores/opening-stock/${entry.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          {entry.status === 'Draft' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(entry.id, entry.entryNo)}
                              disabled={deleting === entry.id}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
