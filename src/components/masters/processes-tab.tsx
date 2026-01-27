"use client"

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { mockProcesses } from '@/lib/mock-data'
import { simulateApiCall } from '@/lib/utils/mock-api'
import { Process } from '@/types'
import { ProcessesDataGrid } from '@/components/tables/processes-data-grid'
import { AddProcessDialog } from '@/components/forms/add-process-dialog'

interface ProcessesTabProps {
  searchQuery?: string
}

export function ProcessesTab({ searchQuery = '' }: ProcessesTabProps) {
  const [processes, setProcesses] = useState<Process[]>([])
  const [loading, setLoading] = useState(true)
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
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardDescription>Total Processes</CardDescription>
            <CardTitle className="text-2xl">{processes.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardDescription>Machining</CardDescription>
            <CardTitle className="text-2xl text-blue-600">
              {processes.filter(p => p.category === 'Machining').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardDescription>Finishing</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {processes.filter(p => p.category === 'Finishing').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardDescription>Outsourced</CardDescription>
            <CardTitle className="text-2xl text-amber-600">
              {processes.filter(p => p.isOutsourced).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Data Grid Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <ProcessesDataGrid processes={filteredProcesses} onUpdate={loadProcesses} />
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
