"use client"

import { useState, useEffect } from 'react'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { mockProcesses } from '@/lib/mock-data'
import { simulateApiCall } from '@/lib/utils/mock-api'
import { Process } from '@/types'
import { ProcessesTable } from '@/components/tables/processes-table'
import { AddProcessDialog } from '@/components/forms/add-process-dialog'

export function ProcessesTab() {
  const [processes, setProcesses] = useState<Process[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddProcessOpen, setIsAddProcessOpen] = useState(false)

  useEffect(() => {
    loadProcesses()
  }, [])

  const loadProcesses = async () => {
    setLoading(true)
    const data = await simulateApiCall(mockProcesses, 800)
    setProcesses(data)
    setLoading(false)
  }

  const filteredProcesses = processes.filter(
    (process) =>
      process.processName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      process.processCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      process.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-4">
          <p className="text-sm text-muted-foreground">Total Processes</p>
          <p className="text-2xl font-bold">{processes.length}</p>
        </Card>
        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-4">
          <p className="text-sm text-muted-foreground">Machining</p>
          <p className="text-2xl font-bold text-blue-600">
            {processes.filter(p => p.category === 'Machining').length}
          </p>
        </Card>
        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-4">
          <p className="text-sm text-muted-foreground">Finishing</p>
          <p className="text-2xl font-bold text-green-600">
            {processes.filter(p => p.category === 'Finishing').length}
          </p>
        </Card>
        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-4">
          <p className="text-sm text-muted-foreground">Outsourced</p>
          <p className="text-2xl font-bold text-amber-600">
            {processes.filter(p => p.isOutsourced).length}
          </p>
        </Card>
      </div>

      {/* Search */}
      <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, code, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </Card>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <ProcessesTable processes={filteredProcesses} onUpdate={loadProcesses} />
      )}

      {/* Add Process Dialog */}
      <AddProcessDialog
        open={isAddProcessOpen}
        onOpenChange={setIsAddProcessOpen}
      />

      {/* Floating Action Button */}
      <Button
        onClick={() => setIsAddProcessOpen(true)}
        className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  )
}
