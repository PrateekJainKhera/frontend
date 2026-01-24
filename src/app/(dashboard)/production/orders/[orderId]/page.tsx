'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
} from 'lucide-react'
import { mockJobCards } from '@/lib/mock-data/job-cards-complete'
import { getOrderProductionView, calculateOrderProgress } from '@/lib/utils/production-grouping'
import { ProcessStepCard } from '@/components/production/process-step-card'
import { JobCard, JobCardStatus } from '@/types/job-card'
import Link from 'next/link'
import { toast } from 'sonner'

export default function OrderProductionPage() {
  const params = useParams()
  const orderId = params.orderId as string
  const orderView = getOrderProductionView(orderId, mockJobCards)

  const [refreshKey, setRefreshKey] = useState(0)
  const [expandedParts, setExpandedParts] = useState<Set<string>>(new Set())
  const [assemblyExpanded, setAssemblyExpanded] = useState(false)

  if (!orderView) {
    return (
      <div className="p-6">
        <Link href="/production">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </Link>
        <Card className="mt-4">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="font-medium">Order Not Found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const progressPercentage = calculateOrderProgress(orderView)

  const togglePart = (partId: string) => {
    setExpandedParts(prev => {
      const next = new Set(prev)
      next.has(partId) ? next.delete(partId) : next.add(partId)
      return next
    })
  }

  const getStatus = (completed: number, total: number, processes: JobCard[]) => {
    if (completed === total && total > 0) return { label: 'Done', variant: 'default' as const }
    if (processes.some(p => p.status === JobCardStatus.IN_PROGRESS)) return { label: 'Active', variant: 'secondary' as const }
    return { label: 'Pending', variant: 'outline' as const }
  }

  const handleStart = (jc: JobCard) => { toast.success(`${jc.processName} started`); setRefreshKey(k => k + 1) }
  const handleStop = (jc: JobCard) => { toast.info(`${jc.processName} paused`); setRefreshKey(k => k + 1) }
  const handleRestart = (jc: JobCard) => { toast.success(`${jc.processName} restarted`); setRefreshKey(k => k + 1) }
  const handleComplete = (jc: JobCard) => { toast.success(`${jc.processName} completed`); setRefreshKey(k => k + 1) }

  return (
    <div className="px-6 pb-6 space-y-4 max-w-5xl" key={refreshKey}>
      {/* Back Button */}
      <Link href="/production">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
      </Link>

      {/* Order Summary */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{orderView.orderNo}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {orderView.customerName} • {orderView.productName}
              </p>
            </div>
            <Badge variant={progressPercentage === 100 ? 'default' : 'secondary'} className="text-lg px-3">
              {progressPercentage}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>{orderView.completedSteps} / {orderView.totalSteps} steps</span>
            <span>{orderView.childParts.length} child parts</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </CardContent>
      </Card>

      {/* Child Parts - Simple Accordion */}
      <div className="space-y-2">
        <h2 className="font-medium text-sm text-muted-foreground px-1">Child Parts</h2>

        {orderView.childParts.map((cp) => {
          const isExpanded = expandedParts.has(cp.childPartId)
          const progress = cp.totalProcesses > 0 ? Math.round((cp.completedProcesses / cp.totalProcesses) * 100) : 0
          const status = getStatus(cp.completedProcesses, cp.totalProcesses, cp.processes)

          return (
            <Collapsible key={cp.childPartId} open={isExpanded} onOpenChange={() => togglePart(cp.childPartId)}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <span className="font-medium">{cp.childPartName}</span>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{cp.completedProcesses}/{cp.totalProcesses}</span>
                    <span className="text-sm font-medium w-10 text-right">{progress}%</span>
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="ml-7 mt-2 space-y-2 pb-2">
                  {cp.processes.map((process) => (
                    <ProcessStepCard
                      key={process.id}
                      jobCard={process}
                      stepNumber={process.stepNo}
                      onStart={handleStart}
                      onStop={handleStop}
                      onRestart={handleRestart}
                      onComplete={handleComplete}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )
        })}
      </div>

      {/* Assembly - Simple Accordion */}
      {orderView.assemblyJobCard && (
        <div className="space-y-2">
          <h2 className="font-medium text-sm text-muted-foreground px-1">Assembly</h2>
          <Collapsible open={assemblyExpanded} onOpenChange={setAssemblyExpanded}>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer">
                <div className="flex items-center gap-3">
                  {assemblyExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <span className="font-medium">Final Assembly</span>
                  <Badge variant={orderView.assemblyJobCard.status === JobCardStatus.COMPLETED ? 'default' : 'outline'}>
                    {orderView.assemblyJobCard.status === JobCardStatus.COMPLETED ? 'Done' :
                      orderView.assemblyJobCard.status === JobCardStatus.IN_PROGRESS ? 'Active' : 'Pending'}
                  </Badge>
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="ml-7 mt-2 pb-2">
                <ProcessStepCard
                  jobCard={orderView.assemblyJobCard}
                  stepNumber={orderView.assemblyJobCard.stepNo}
                  onStart={handleStart}
                  onStop={handleStop}
                  onRestart={handleRestart}
                  onComplete={handleComplete}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

      {/* QC Status - Simple */}
      <div className="space-y-2">
        <h2 className="font-medium text-sm text-muted-foreground px-1">Quality Control</h2>
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
          {orderView.qcStatus === 'Completed' ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-700">QC Passed - Ready for dispatch</span>
            </>
          ) : progressPercentage === 100 ? (
            <>
              <Clock className="h-5 w-5 text-amber-600" />
              <span className="font-medium text-amber-700">Awaiting QC inspection</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              <span className="text-muted-foreground">Complete all processes first</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
