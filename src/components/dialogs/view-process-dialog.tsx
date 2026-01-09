"use client"

import { Process } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils/formatters'
import { Code, Tag, Settings, Clock, Award, Building2, Calendar } from 'lucide-react'

interface ViewProcessDialogProps {
  process: Process
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ViewProcessDialog({
  process,
  open,
  onOpenChange,
}: ViewProcessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Process Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold">{process.processName}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Code className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-sm text-muted-foreground">
                  {process.processCode}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">{process.category}</Badge>
              {process.isOutsourced && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  Outsourced
                </Badge>
              )}
            </div>
          </div>

          {/* Process Information */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase">
              Process Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Tag className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="font-medium">{process.category}</p>
                </div>
              </div>

              {process.defaultMachine && (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Settings className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Default Machine</p>
                    <p className="font-medium">{process.defaultMachine}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Standard Time</p>
                  <p className="font-medium">{process.standardTimeMin} minutes</p>
                </div>
              </div>

              {process.restTimeHours && (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Rest Time</p>
                    <p className="font-medium">{process.restTimeHours} hours</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Award className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Skill Required</p>
                  <Badge variant="outline">{process.skillRequired}</Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Outsourcing Info */}
          {process.isOutsourced && (
            <div className="space-y-3 pt-4 border-t">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase">
                Outsourcing
              </h4>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary/50 border">
                <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium text-sm">This process is outsourced</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Process will be completed by external vendor/contractor.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* System Information */}
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase">
              System Information
            </h4>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created On</p>
                <p className="font-medium">{formatDate(process.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
