'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Play,
  CheckCircle2,
  Clock,
  Package,
  User,
  FileText,
  ArrowLeft,
  AlertCircle,
  Eye,
  Square,
} from 'lucide-react'
import { mockJobCards } from '@/lib/mock-data/job-cards'
import { JobCardStatus, MaterialStatus } from '@/types/job-card'
import { toast } from 'sonner'
import Link from 'next/link'
import { format } from 'date-fns'

export default function JobCardExecutionPage() {
  const params = useParams()
  const router = useRouter()
  const jobCardId = params.id as string

  // Find the job card from Planning
  const jobCard = mockJobCards.find(jc => jc.id === jobCardId)

  // Form states
  const [operatorName, setOperatorName] = useState(jobCard?.assignedOperatorName || 'Ramesh Kumar')
  const [actualQuantity, setActualQuantity] = useState('')
  const [rejectedQuantity, setRejectedQuantity] = useState('0')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!jobCard) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center gap-4">
          <Link href="/production">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Job Card Not Found</p>
            <p className="text-sm text-muted-foreground">The requested job card does not exist</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const canStart = jobCard.materialStatus === MaterialStatus.AVAILABLE && jobCard.status === JobCardStatus.READY
  const canComplete = jobCard.status === JobCardStatus.IN_PROGRESS
  const isCompleted = jobCard.status === JobCardStatus.COMPLETED

  const handleStart = () => {
    if (!operatorName.trim()) {
      toast.error('Please enter operator name')
      return
    }

    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      toast.success('Job card started successfully', {
        description: `Started by ${operatorName} at ${format(new Date(), 'hh:mm a')}`,
      })
      setIsSubmitting(false)
      // In real app, would update job card status
      router.push('/production')
    }, 500)
  }

  const handleComplete = () => {
    const qty = parseInt(actualQuantity)
    const rejQty = parseInt(rejectedQuantity || '0')

    if (!actualQuantity || qty <= 0) {
      toast.error('Please enter valid completed quantity')
      return
    }

    if (qty + rejQty > jobCard.quantity) {
      toast.error('Total quantity (completed + rejected) cannot exceed required quantity')
      return
    }

    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      toast.success('Job card completed successfully', {
        description: `${qty} pieces completed${rejQty > 0 ? `, ${rejQty} rejected` : ''} by ${operatorName}`,
      })
      setIsSubmitting(false)
      router.push('/production')
    }, 500)
  }

  const handlePause = () => {
    toast.info('Job card paused', {
      description: 'You can resume this job card later',
    })
    router.push('/production')
  }

  const getStatusBadge = (status: JobCardStatus) => {
    const variants: Record<JobCardStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline', className: string }> = {
      [JobCardStatus.PENDING]: { variant: 'outline', className: 'border-gray-500 text-gray-700 bg-gray-50' },
      [JobCardStatus.PENDING_MATERIAL]: { variant: 'outline', className: 'border-orange-500 text-orange-700 bg-orange-50' },
      [JobCardStatus.READY]: { variant: 'outline', className: 'border-blue-500 text-blue-700 bg-blue-50' },
      [JobCardStatus.IN_PROGRESS]: { variant: 'outline', className: 'border-purple-500 text-purple-700 bg-purple-50' },
      [JobCardStatus.PAUSED]: { variant: 'outline', className: 'border-yellow-500 text-yellow-700 bg-yellow-50' },
      [JobCardStatus.COMPLETED]: { variant: 'outline', className: 'border-green-500 text-green-700 bg-green-50' },
      [JobCardStatus.BLOCKED]: { variant: 'outline', className: 'border-red-500 text-red-700 bg-red-50' },
    }
    const config = variants[status]
    return <Badge variant={config.variant} className={config.className}>{status}</Badge>
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/production">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{jobCard.jobCardNo}</h1>
            <p className="text-muted-foreground">Job Card Execution</p>
          </div>
        </div>
        {getStatusBadge(jobCard.status)}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Card Information */}
          <Card>
            <CardHeader>
              <CardTitle>Job Card Information</CardTitle>
              <CardDescription>Created from Planning module</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Job Card No</Label>
                  <p className="font-medium">{jobCard.jobCardNo}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Order No</Label>
                  <p className="font-medium">{jobCard.orderNo}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Customer</Label>
                  <p className="font-medium">{jobCard.customerName}</p>
                  <p className="text-sm text-muted-foreground">{jobCard.customerCode}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Product</Label>
                  <p className="font-medium">{jobCard.productName}</p>
                  <p className="text-sm text-muted-foreground">{jobCard.productCode}</p>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-muted-foreground">Child Part</Label>
                <p className="font-medium text-lg">{jobCard.childPartName || 'N/A'}</p>
                <p className="text-sm text-muted-foreground">Step {jobCard.stepNo}</p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Operation</Label>
                  <p className="font-medium">{jobCard.processName}</p>
                  <p className="text-sm text-muted-foreground">{jobCard.processCode}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Required Quantity</Label>
                  <p className="font-medium">{jobCard.quantity} pieces</p>
                </div>
              </div>

              {jobCard.assignedMachineName && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-muted-foreground">Assigned Machine</Label>
                    <p className="font-medium">{jobCard.assignedMachineName}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Drawing Reference */}
          {jobCard.drawingNumber && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Drawing Reference
                </CardTitle>
                <CardDescription>ALWAYS refer to drawing during operation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Drawing Number</Label>
                    <p className="font-medium text-lg">{jobCard.drawingNumber}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Revision</Label>
                    <p className="font-medium text-lg">{jobCard.drawingRevision}</p>
                  </div>
                </div>

                {jobCard.drawingName && (
                  <div>
                    <Label className="text-muted-foreground">Drawing Name</Label>
                    <p className="font-medium">{jobCard.drawingName}</p>
                  </div>
                )}

                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/masters/drawings/${jobCard.drawingId}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Drawing Details
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Material Information */}
          {jobCard.allocatedMaterials && jobCard.allocatedMaterials.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Allocated Materials
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {jobCard.allocatedMaterials.map((mat) => (
                    <div key={mat.id} className="p-3 bg-gray-50 rounded-md">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{mat.materialName}</p>
                          <p className="text-sm text-muted-foreground">{mat.materialCode}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{mat.allocatedQuantity} {mat.unit}</p>
                          {mat.isAllocated && (
                            <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50 text-xs">
                              Allocated
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Work Instructions */}
          {jobCard.workInstructions && (
            <Card>
              <CardHeader>
                <CardTitle>Work Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{jobCard.workInstructions}</p>
              </CardContent>
            </Card>
          )}

          {/* Execution Section */}
          {!isCompleted && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {canStart ? 'Start Job' : canComplete ? 'Complete Job' : 'Job Status'}
                </CardTitle>
                <CardDescription>
                  {canStart && 'Enter operator details to start the job'}
                  {canComplete && 'Record completed quantity and details'}
                  {jobCard.materialStatus !== MaterialStatus.AVAILABLE && 'Material not available yet'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Operator Name */}
                <div>
                  <Label htmlFor="operator">
                    <User className="inline h-4 w-4 mr-1" />
                    Operator Name *
                  </Label>
                  <Input
                    id="operator"
                    value={operatorName}
                    onChange={(e) => setOperatorName(e.target.value)}
                    placeholder="Enter operator name"
                    disabled={isCompleted || jobCard.materialStatus !== MaterialStatus.AVAILABLE}
                  />
                </div>

                {/* Show start time if in progress */}
                {jobCard.actualStartTime && canComplete && (
                  <div className="p-4 bg-blue-50 rounded-md space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-blue-900">
                      <Clock className="h-4 w-4" />
                      Job In Progress
                    </div>
                    <div className="text-sm text-blue-700">
                      Started: {format(jobCard.actualStartTime, 'dd MMM yyyy, hh:mm a')}
                    </div>
                    {jobCard.assignedOperatorName && (
                      <div className="text-sm text-blue-700">
                        Operator: {jobCard.assignedOperatorName}
                      </div>
                    )}
                  </div>
                )}

                {/* Execution details - only show if in progress */}
                {canComplete && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="quantity">Completed Quantity *</Label>
                        <Input
                          id="quantity"
                          type="number"
                          value={actualQuantity}
                          onChange={(e) => setActualQuantity(e.target.value)}
                          placeholder="Enter completed pieces"
                          min="0"
                          max={jobCard.quantity}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Required: {jobCard.quantity} pcs
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="rejected">Rejected Quantity</Label>
                        <Input
                          id="rejected"
                          type="number"
                          value={rejectedQuantity}
                          onChange={(e) => setRejectedQuantity(e.target.value)}
                          placeholder="0"
                          min="0"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Any observations or issues..."
                        rows={3}
                      />
                    </div>
                  </>
                )}

                {/* Action Buttons */}
                <Separator />
                <div className="flex gap-2">
                  {canStart && (
                    <Button
                      onClick={handleStart}
                      disabled={isSubmitting || !operatorName.trim()}
                      className="flex-1"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Start Job
                    </Button>
                  )}

                  {canComplete && (
                    <>
                      <Button
                        onClick={handleComplete}
                        disabled={isSubmitting || !actualQuantity}
                        className="flex-1"
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Complete Job
                      </Button>
                      <Button
                        onClick={handlePause}
                        variant="outline"
                        disabled={isSubmitting}
                      >
                        <Square className="mr-2 h-4 w-4" />
                        Pause
                      </Button>
                    </>
                  )}

                  {jobCard.materialStatus !== MaterialStatus.AVAILABLE && (
                    <div className="flex items-center gap-2 text-sm text-orange-600 p-4 bg-orange-50 rounded-md w-full">
                      <AlertCircle className="h-4 w-4" />
                      Material not available. Cannot start job.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Completed Job Details */}
          {isCompleted && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  Job Completed
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {jobCard.actualStartTime && (
                    <div>
                      <Label className="text-muted-foreground">Started</Label>
                      <p className="font-medium">
                        {format(jobCard.actualStartTime, 'dd MMM yyyy, hh:mm a')}
                      </p>
                    </div>
                  )}
                  {jobCard.actualEndTime && (
                    <div>
                      <Label className="text-muted-foreground">Completed</Label>
                      <p className="font-medium">
                        {format(jobCard.actualEndTime, 'dd MMM yyyy, hh:mm a')}
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="grid grid-cols-3 gap-4">
                  {jobCard.assignedOperatorName && (
                    <div>
                      <Label className="text-muted-foreground">Operator</Label>
                      <p className="font-medium">{jobCard.assignedOperatorName}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-muted-foreground">Completed</Label>
                    <p className="font-medium text-lg text-green-600">{jobCard.completedQty} pcs</p>
                  </div>
                  {jobCard.rejectedQty > 0 && (
                    <div>
                      <Label className="text-muted-foreground">Rejected</Label>
                      <p className="font-medium text-lg text-red-600">{jobCard.rejectedQty} pcs</p>
                    </div>
                  )}
                </div>

                {jobCard.specialNotes && (
                  <>
                    <Separator />
                    <div>
                      <Label className="text-muted-foreground">Notes</Label>
                      <p className="text-sm">{jobCard.specialNotes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Sidebar - Quick Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Job Card Status</Label>
                {getStatusBadge(jobCard.status)}
              </div>

              <Separator />

              <div>
                <Label className="text-muted-foreground">Material Status</Label>
                <Badge
                  variant="outline"
                  className={
                    jobCard.materialStatus === MaterialStatus.AVAILABLE
                      ? 'border-green-500 text-green-700 bg-green-50'
                      : jobCard.materialStatus === MaterialStatus.PARTIAL
                      ? 'border-yellow-500 text-yellow-700 bg-yellow-50'
                      : 'border-orange-500 text-orange-700 bg-orange-50'
                  }
                >
                  {jobCard.materialStatus || 'Unknown'}
                </Badge>
              </div>

              <Separator />

              <div>
                <Label className="text-muted-foreground">Priority</Label>
                <Badge
                  variant={jobCard.priority === 'High' || jobCard.priority === 'Urgent' ? 'destructive' : 'secondary'}
                >
                  {jobCard.priority}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Completed</span>
                <span className="font-medium">
                  {jobCard.completedQty} / {jobCard.quantity}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min((jobCard.completedQty / jobCard.quantity) * 100, 100)}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {Math.round((jobCard.completedQty / jobCard.quantity) * 100)}% complete
              </p>

              {jobCard.rejectedQty > 0 && (
                <div className="pt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Rejected</span>
                    <span className="font-medium text-red-600">{jobCard.rejectedQty} pcs</span>
                  </div>
                </div>
              )}

              {jobCard.reworkQty > 0 && (
                <div className="pt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Rework</span>
                    <span className="font-medium text-yellow-600">{jobCard.reworkQty} pcs</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {jobCard.estimatedTotalTimeMin && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Time Estimate</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Estimated</span>
                  <span className="font-medium">{jobCard.estimatedTotalTimeMin} min</span>
                </div>
                {jobCard.actualTotalTimeMin && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Actual</span>
                    <span className="font-medium">{jobCard.actualTotalTimeMin} min</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
