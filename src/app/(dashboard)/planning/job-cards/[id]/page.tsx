"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText, Package, AlertTriangle, CheckCircle2, Clock, Layers, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { mockJobCards } from '@/lib/mock-data'
import { simulateApiCall } from '@/lib/utils/mock-api'
import { JobCard, JobCardStatus, MaterialStatus } from '@/types/job-card'
import { formatDate } from '@/lib/utils/formatters'

export default function JobCardDetailPage() {
  const params = useParams()
  const router = useRouter()
  const jobCardId = params.id as string

  const [loading, setLoading] = useState(true)
  const [jobCard, setJobCard] = useState<JobCard | null>(null)

  useEffect(() => {
    loadData()
  }, [jobCardId])

  const loadData = async () => {
    setLoading(true)
    const data = await simulateApiCall(
      mockJobCards.find(jc => jc.id === jobCardId) || null,
      500
    )
    setJobCard(data)
    setLoading(false)
  }

  const getStatusBadgeVariant = (status: JobCardStatus) => {
    switch (status) {
      case JobCardStatus.COMPLETED:
        return 'default'
      case JobCardStatus.IN_PROGRESS:
        return 'secondary'
      case JobCardStatus.PENDING_MATERIAL:
        return 'destructive'
      case JobCardStatus.BLOCKED:
        return 'destructive'
      default:
        return 'outline'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!jobCard) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertDescription>
            Job card not found
          </AlertDescription>
        </Alert>
        <Link href="/planning/job-cards">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Job Cards
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/planning/job-cards">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{jobCard.jobCardNo}</h1>
            <p className="text-muted-foreground mt-1">
              Job card details and status
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusBadgeVariant(jobCard.status)} className="text-base px-3 py-1">
            {jobCard.status}
          </Badge>
          {jobCard.priority && (
            <Badge variant={jobCard.priority === 'Urgent' ? 'destructive' : 'outline'} className="text-base px-3 py-1">
              {jobCard.priority}
            </Badge>
          )}
        </div>
      </div>

      {/* Material Shortage Alert */}
      {jobCard.materialShortfall && (
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertDescription>
            <p className="font-semibold">Material Shortage</p>
            <p className="text-sm mt-1">
              <strong>{jobCard.materialShortfall.materialName}:</strong> Need {jobCard.materialShortfall.required} {jobCard.materialShortfall.unit},
              Available {jobCard.materialShortfall.available} {jobCard.materialShortfall.unit},
              Short by {jobCard.materialShortfall.shortfall} {jobCard.materialShortfall.unit}
            </p>
            {jobCard.daysWaitingForMaterial && (
              <p className="text-sm mt-1">
                Waiting for {jobCard.daysWaitingForMaterial} days
              </p>
            )}
            <p className="text-sm mt-2 text-muted-foreground">
              Contact Stores/Procurement team to arrange material
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Job Card No:</span>
              <p className="font-semibold mt-1">{jobCard.jobCardNo}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Order No:</span>
              <p className="font-semibold mt-1">
                <Link href={`/orders/${jobCard.orderId}`} className="text-blue-600 hover:underline">
                  {jobCard.orderNo}
                </Link>
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Creation Type:</span>
              <p className="font-semibold mt-1">{jobCard.creationType}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Customer:</span>
              <p className="font-semibold mt-1">{jobCard.customerName}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Product:</span>
              <p className="font-semibold mt-1">{jobCard.productName}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Product Code:</span>
              <p className="font-semibold mt-1">{jobCard.productCode}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Child Part & Process Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Child Part & Process Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Child Part:</span>
              <p className="font-semibold mt-1">{jobCard.childPartName || 'N/A'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Process Name:</span>
              <p className="font-semibold mt-1">{jobCard.processName}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Process Code:</span>
              <p className="font-semibold mt-1">{jobCard.processCode}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Step Number:</span>
              <p className="font-semibold mt-1">Step {jobCard.stepNo}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Quantity:</span>
              <p className="font-semibold mt-1">{jobCard.quantity} pcs</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Drawing Information */}
      {jobCard.drawingNumber && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Drawing Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Drawing Number:</span>
                <p className="font-semibold mt-1">{jobCard.drawingNumber}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Revision:</span>
                <p className="font-semibold mt-1">Rev {jobCard.drawingRevision}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Selection Type:</span>
                <p className="font-semibold mt-1">
                  {jobCard.drawingSelectionType === 'auto' ? (
                    <Badge variant="secondary">Auto-selected</Badge>
                  ) : (
                    <Badge variant="outline">Manual</Badge>
                  )}
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Drawing Name:</span>
                <p className="font-semibold mt-1">{jobCard.drawingName}</p>
              </div>
            </div>

            {/* Manufacturing Dimensions */}
            {jobCard.manufacturingDimensions && (
              <>
                <Separator className="my-4" />
                <div>
                  <p className="text-sm font-medium mb-3">Manufacturing Dimensions</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    {jobCard.manufacturingDimensions.materialGrade && (
                      <div className="bg-muted/50 rounded p-2">
                        <span className="text-muted-foreground text-xs">Material Grade</span>
                        <p className="font-semibold">{jobCard.manufacturingDimensions.materialGrade}</p>
                      </div>
                    )}
                    {jobCard.manufacturingDimensions.rodDiameter && (
                      <div className="bg-muted/50 rounded p-2">
                        <span className="text-muted-foreground text-xs">Rod Diameter</span>
                        <p className="font-semibold">Ø{jobCard.manufacturingDimensions.rodDiameter}mm</p>
                      </div>
                    )}
                    {jobCard.manufacturingDimensions.finishedDiameter && (
                      <div className="bg-muted/50 rounded p-2">
                        <span className="text-muted-foreground text-xs">Finished Diameter</span>
                        <p className="font-semibold">Ø{jobCard.manufacturingDimensions.finishedDiameter}mm</p>
                      </div>
                    )}
                    {jobCard.manufacturingDimensions.finishedLength && (
                      <div className="bg-muted/50 rounded p-2">
                        <span className="text-muted-foreground text-xs">Finished Length</span>
                        <p className="font-semibold">{jobCard.manufacturingDimensions.finishedLength}mm</p>
                      </div>
                    )}
                    {jobCard.manufacturingDimensions.pipeOD && (
                      <div className="bg-muted/50 rounded p-2">
                        <span className="text-muted-foreground text-xs">Pipe OD</span>
                        <p className="font-semibold">{jobCard.manufacturingDimensions.pipeOD}mm</p>
                      </div>
                    )}
                    {jobCard.manufacturingDimensions.pipeID && (
                      <div className="bg-muted/50 rounded p-2">
                        <span className="text-muted-foreground text-xs">Pipe ID</span>
                        <p className="font-semibold">{jobCard.manufacturingDimensions.pipeID}mm</p>
                      </div>
                    )}
                    {jobCard.manufacturingDimensions.pipeThickness && (
                      <div className="bg-muted/50 rounded p-2">
                        <span className="text-muted-foreground text-xs">Wall Thickness</span>
                        <p className="font-semibold">{jobCard.manufacturingDimensions.pipeThickness}mm</p>
                      </div>
                    )}
                    {jobCard.manufacturingDimensions.tolerance && (
                      <div className="bg-muted/50 rounded p-2">
                        <span className="text-muted-foreground text-xs">Tolerance</span>
                        <p className="font-semibold">{jobCard.manufacturingDimensions.tolerance}</p>
                      </div>
                    )}
                    {jobCard.manufacturingDimensions.surfaceFinish && (
                      <div className="bg-muted/50 rounded p-2">
                        <span className="text-muted-foreground text-xs">Surface Finish</span>
                        <p className="font-semibold">{jobCard.manufacturingDimensions.surfaceFinish}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Material Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Material Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Material Status:</span>
              {jobCard.materialStatus === MaterialStatus.AVAILABLE ? (
                <Badge className="bg-green-600">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Available
                </Badge>
              ) : jobCard.materialStatus === MaterialStatus.PENDING ? (
                <Badge variant="destructive">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  Pending
                </Badge>
              ) : jobCard.materialStatus === MaterialStatus.PARTIAL ? (
                <Badge variant="outline">
                  <Package className="mr-1 h-3 w-3" />
                  Partial
                </Badge>
              ) : (
                <Badge variant="outline">Not Checked</Badge>
              )}
            </div>

            {jobCard.allocatedMaterials && jobCard.allocatedMaterials.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-2">Allocated Materials</p>
                  <div className="space-y-2">
                    {jobCard.allocatedMaterials.map((mat, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-muted/50 rounded p-2 text-sm">
                        <div>
                          <p className="font-medium">{mat.materialName}</p>
                          <p className="text-xs text-muted-foreground">{mat.materialCode}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{mat.allocatedQuantity} {mat.unit}</p>
                          {mat.isAllocated ? (
                            <Badge variant="default" className="text-xs">Allocated</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Pending</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Assignment & Scheduling */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Assignment & Scheduling
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Assigned Machine:</span>
              <p className="font-semibold mt-1">{jobCard.assignedMachineName || 'Not Assigned'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Assigned Operator:</span>
              <p className="font-semibold mt-1">{jobCard.assignedOperatorName || 'Not Assigned'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Estimated Time:</span>
              <p className="font-semibold mt-1">{jobCard.estimatedTotalTimeMin || 0} min</p>
            </div>
            {jobCard.scheduledStartTime && (
              <div>
                <span className="text-muted-foreground">Scheduled Start:</span>
                <p className="font-semibold mt-1">{formatDate(jobCard.scheduledStartTime)}</p>
              </div>
            )}
            {jobCard.actualStartTime && (
              <div>
                <span className="text-muted-foreground">Actual Start:</span>
                <p className="font-semibold mt-1">{formatDate(jobCard.actualStartTime)}</p>
              </div>
            )}
            {jobCard.actualEndTime && (
              <div>
                <span className="text-muted-foreground">Actual End:</span>
                <p className="font-semibold mt-1">{formatDate(jobCard.actualEndTime)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Production Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Production Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-green-50 border border-green-200 rounded p-3">
                <span className="text-muted-foreground text-xs">Completed</span>
                <p className="font-bold text-2xl text-green-700">{jobCard.completedQty}</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <span className="text-muted-foreground text-xs">In Progress</span>
                <p className="font-bold text-2xl text-blue-700">{jobCard.inProgressQty}</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <span className="text-muted-foreground text-xs">Rejected</span>
                <p className="font-bold text-2xl text-red-700">{jobCard.rejectedQty}</p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded p-3">
                <span className="text-muted-foreground text-xs">Rework</span>
                <p className="font-bold text-2xl text-orange-700">{jobCard.reworkQty}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-semibold">
                  {jobCard.completedQty} / {jobCard.quantity} ({Math.round((jobCard.completedQty / jobCard.quantity) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full"
                  style={{ width: `${(jobCard.completedQty / jobCard.quantity) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Work Instructions & Notes */}
      {(jobCard.workInstructions || jobCard.qualityCheckpoints || jobCard.specialNotes) && (
        <Card>
          <CardHeader>
            <CardTitle>Work Instructions & Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {jobCard.workInstructions && (
              <div>
                <p className="text-sm font-medium mb-2">Work Instructions</p>
                <p className="text-sm text-muted-foreground bg-muted/50 rounded p-3">
                  {jobCard.workInstructions}
                </p>
              </div>
            )}
            {jobCard.qualityCheckpoints && (
              <div>
                <p className="text-sm font-medium mb-2">Quality Checkpoints</p>
                <p className="text-sm text-muted-foreground bg-muted/50 rounded p-3">
                  {jobCard.qualityCheckpoints}
                </p>
              </div>
            )}
            {jobCard.specialNotes && (
              <div>
                <p className="text-sm font-medium mb-2">Special Notes</p>
                <p className="text-sm text-muted-foreground bg-amber-50 border border-amber-200 rounded p-3">
                  {jobCard.specialNotes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
