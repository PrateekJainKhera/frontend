"use client"

import { useState } from 'react'
import { Process } from '@/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Eye, Clock, ExternalLink } from 'lucide-react'
import { ViewProcessDialog } from '@/components/dialogs/view-process-dialog'
import { EditProcessDialog } from '@/components/dialogs/edit-process-dialog'

interface ProcessesTableProps {
  processes: Process[]
  onUpdate?: () => void
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'Machining':
      return 'bg-blue-100 text-blue-800'
    case 'Heat Treatment':
      return 'bg-orange-100 text-orange-800'
    case 'Finishing':
      return 'bg-green-100 text-green-800'
    case 'Assembly':
      return 'bg-purple-100 text-purple-800'
    case 'Inspection':
      return 'bg-yellow-100 text-yellow-800'
    case 'Dispatch':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function ProcessesTable({ processes, onUpdate }: ProcessesTableProps) {
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const handleView = (process: Process) => {
    setSelectedProcess(process)
    setViewDialogOpen(true)
  }

  const handleEdit = (process: Process) => {
    setSelectedProcess(process)
    setEditDialogOpen(true)
  }
  if (processes.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No processes found</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Process Code</TableHead>
            <TableHead>Process Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Default Machine</TableHead>
            <TableHead>Standard Time</TableHead>
            <TableHead>Skill Required</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {processes.map((process) => (
            <TableRow key={process.id}>
              <TableCell className="font-mono font-semibold">
                {process.processCode}
              </TableCell>
              <TableCell className="font-medium">
                {process.processName}
              </TableCell>
              <TableCell>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(process.category)}`}>
                  {process.category}
                </span>
              </TableCell>
              <TableCell className="text-sm">
                {process.defaultMachine || '-'}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-sm">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  {process.standardTimeMin} min
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{process.skillRequired}</Badge>
              </TableCell>
              <TableCell>
                {process.isOutsourced ? (
                  <Badge variant="secondary" className="gap-1">
                    <ExternalLink className="h-3 w-3" />
                    Outsourced
                  </Badge>
                ) : (
                  <Badge variant="default">In-House</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleView(process)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(process)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Dialogs */}
      {selectedProcess && (
        <>
          <ViewProcessDialog
            process={selectedProcess}
            open={viewDialogOpen}
            onOpenChange={setViewDialogOpen}
          />
          <EditProcessDialog
            process={selectedProcess}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onSuccess={() => {
              setEditDialogOpen(false)
              onUpdate?.()
            }}
          />
        </>
      )}
    </div>
  )
}
