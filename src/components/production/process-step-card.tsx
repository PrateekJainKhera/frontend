import { JobCard, JobCardStatus } from '@/types/job-card'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  CheckCircle2,
  Circle,
  Play,
  Square,
  Clock,
  AlertCircle,
  Factory,
  RotateCcw,
} from 'lucide-react'
import { format } from 'date-fns'

interface ProcessStepCardProps {
  jobCard: JobCard
  stepNumber: number
  onStart?: (jobCard: JobCard) => void
  onStop?: (jobCard: JobCard) => void
  onRestart?: (jobCard: JobCard) => void
  onComplete?: (jobCard: JobCard) => void
}

export function ProcessStepCard({
  jobCard,
  stepNumber,
  onStart,
  onStop,
  onRestart,
  onComplete,
}: ProcessStepCardProps) {
  const isCompleted = jobCard.status === JobCardStatus.COMPLETED
  const isInProgress = jobCard.status === JobCardStatus.IN_PROGRESS
  const isPaused = jobCard.status === JobCardStatus.PAUSED
  const isReady = jobCard.status === JobCardStatus.READY
  const isBlocked = jobCard.status === JobCardStatus.BLOCKED || jobCard.status === JobCardStatus.PENDING_MATERIAL

  // Get status icon
  const getStatusIcon = () => {
    if (isCompleted) return <CheckCircle2 className="h-5 w-5 text-green-600" />
    if (isInProgress) return <Play className="h-5 w-5 text-blue-600" />
    if (isPaused) return <Square className="h-5 w-5 text-yellow-600" />
    return <Circle className="h-5 w-5 text-gray-400" />
  }

  // Get status badge
  const getStatusBadge = () => {
    if (isCompleted) {
      return <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">Completed</Badge>
    }
    if (isInProgress) {
      return <Badge variant="outline" className="border-blue-500 text-blue-700 bg-blue-50">In Progress</Badge>
    }
    if (isPaused) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-700 bg-yellow-50">Paused</Badge>
    }
    if (isReady) {
      return <Badge variant="outline" className="border-purple-500 text-purple-700 bg-purple-50">Ready</Badge>
    }
    if (isBlocked) {
      return <Badge variant="outline" className="border-orange-500 text-orange-700 bg-orange-50">Blocked</Badge>
    }
    return <Badge variant="outline" className="border-gray-500 text-gray-700 bg-gray-50">Pending</Badge>
  }

  return (
    <Card className={`${isInProgress ? 'border-blue-500 border-2' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Status Icon */}
          <div className="pt-1">
            {getStatusIcon()}
          </div>

          {/* Content */}
          <div className="flex-1 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-lg">
                  Step {stepNumber}: {jobCard.processName}
                </h4>
                <p className="text-sm text-muted-foreground">{jobCard.processCode}</p>
              </div>
              {getStatusBadge()}
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Machine</Label>
                <div className="flex items-center gap-1 font-medium">
                  <Factory className="h-3 w-3" />
                  <span>{jobCard.assignedMachineName || 'Not Assigned'}</span>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Estimated Time</Label>
                <div className="flex items-center gap-1 font-medium">
                  <Clock className="h-3 w-3" />
                  <span>{jobCard.estimatedTotalTimeMin} min</span>
                </div>
              </div>

              {jobCard.actualTotalTimeMin && (
                <div>
                  <Label className="text-muted-foreground">Actual Time</Label>
                  <div className="flex items-center gap-1 font-medium">
                    <Clock className="h-3 w-3" />
                    <span>{jobCard.actualTotalTimeMin} min</span>
                  </div>
                </div>
              )}

              <div>
                <Label className="text-muted-foreground">Quantity</Label>
                <p className="font-medium">
                  {jobCard.completedQty} / {jobCard.quantity} pcs
                </p>
              </div>
            </div>

            {/* Operator Info - Show if in progress or completed */}
            {(isInProgress || isCompleted || isPaused) && jobCard.assignedOperatorName && (
              <>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <Label className="text-muted-foreground">Operator</Label>
                    <p className="font-medium">{jobCard.assignedOperatorName}</p>
                  </div>
                  {jobCard.actualStartTime && (
                    <div className="text-right">
                      <Label className="text-muted-foreground">Started</Label>
                      <p className="font-medium">{format(jobCard.actualStartTime, 'hh:mm a')}</p>
                    </div>
                  )}
                  {isCompleted && jobCard.actualEndTime && (
                    <div className="text-right">
                      <Label className="text-muted-foreground">Completed</Label>
                      <p className="font-medium">{format(jobCard.actualEndTime, 'hh:mm a')}</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Blocked Message */}
            {isBlocked && jobCard.blockedBy.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-orange-600 p-3 bg-orange-50 rounded-md">
                <AlertCircle className="h-4 w-4" />
                <span>Waiting for previous steps to complete</span>
              </div>
            )}

            {/* Action Buttons */}
            {!isCompleted && (
              <>
                <Separator />
                <div className="flex gap-2">
                  {isReady && (
                    <Button
                      size="sm"
                      onClick={() => onStart?.(jobCard)}
                      disabled={!onStart}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Start
                    </Button>
                  )}

                  {isInProgress && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onStop?.(jobCard)}
                        disabled={!onStop}
                      >
                        <Square className="mr-2 h-4 w-4" />
                        Pause
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => onComplete?.(jobCard)}
                        disabled={!onComplete}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Complete
                      </Button>
                    </>
                  )}

                  {isPaused && (
                    <Button
                      size="sm"
                      onClick={() => onRestart?.(jobCard)}
                      disabled={!onRestart}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Restart
                    </Button>
                  )}
                </div>
              </>
            )}

            {/* Completion Summary */}
            {isCompleted && (
              <div className="p-3 bg-green-50 rounded-md text-sm">
                <div className="flex items-center gap-2 text-green-800 font-medium mb-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Completed Successfully</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-green-700">
                  <div>Completed: {jobCard.completedQty} pcs</div>
                  {jobCard.rejectedQty > 0 && (
                    <div className="text-red-600">Rejected: {jobCard.rejectedQty} pcs</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
