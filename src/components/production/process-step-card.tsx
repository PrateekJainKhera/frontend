import { JobCard, JobCardStatus } from '@/types/job-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CheckCircle2,
  Circle,
  Play,
  Square,
  Clock,
  AlertCircle,
  RotateCcw,
} from 'lucide-react'

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

  const getStatusIcon = () => {
    if (isCompleted) return <CheckCircle2 className="h-4 w-4 text-green-600" />
    if (isInProgress) return <Play className="h-4 w-4 text-blue-600" />
    if (isPaused) return <Square className="h-4 w-4 text-yellow-600" />
    if (isBlocked) return <AlertCircle className="h-4 w-4 text-orange-500" />
    return <Circle className="h-4 w-4 text-gray-400" />
  }

  const getStatusBadge = () => {
    if (isCompleted) return <Badge variant="outline" className="text-xs border-green-500 text-green-700 bg-green-50">Done</Badge>
    if (isInProgress) return <Badge variant="outline" className="text-xs border-blue-500 text-blue-700 bg-blue-50">Active</Badge>
    if (isPaused) return <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-700 bg-yellow-50">Paused</Badge>
    if (isReady) return <Badge variant="outline" className="text-xs border-purple-500 text-purple-700 bg-purple-50">Ready</Badge>
    if (isBlocked) return <Badge variant="outline" className="text-xs border-orange-500 text-orange-700 bg-orange-50">Blocked</Badge>
    return <Badge variant="outline" className="text-xs">Pending</Badge>
  }

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border bg-card ${isInProgress ? 'border-blue-400 bg-blue-50/50' : ''}`}>
      {/* Left: Icon + Process Info */}
      <div className="flex items-center gap-3">
        {getStatusIcon()}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">Step {stepNumber}: {jobCard.processName}</span>
            {getStatusBadge()}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {jobCard.estimatedTotalTimeMin}min
            </span>
            <span>{jobCard.completedQty}/{jobCard.quantity} pcs</span>
            {jobCard.assignedMachineName && <span>{jobCard.assignedMachineName}</span>}
          </div>
        </div>
      </div>

      {/* Right: Action Buttons */}
      <div className="flex items-center gap-2">
        {isReady && (
          <Button size="sm" variant="default" onClick={() => onStart?.(jobCard)} className="h-7 text-xs">
            <Play className="h-3 w-3 mr-1" /> Start
          </Button>
        )}
        {isInProgress && (
          <>
            <Button size="sm" variant="outline" onClick={() => onStop?.(jobCard)} className="h-7 text-xs">
              Pause
            </Button>
            <Button size="sm" variant="default" onClick={() => onComplete?.(jobCard)} className="h-7 text-xs">
              Complete
            </Button>
          </>
        )}
        {isPaused && (
          <Button size="sm" variant="default" onClick={() => onRestart?.(jobCard)} className="h-7 text-xs">
            <RotateCcw className="h-3 w-3 mr-1" /> Resume
          </Button>
        )}
        {isCompleted && (
          <span className="text-xs text-green-600 font-medium">✓ Completed</span>
        )}
        {isBlocked && (
          <span className="text-xs text-orange-600">Waiting...</span>
        )}
      </div>
    </div>
  )
}
