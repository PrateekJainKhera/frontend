"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText, Package, AlertTriangle, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { jobCardService, JobCardResponse } from '@/lib/api/job-cards'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils/formatters'

export default function JobCardDetailPage() {
  const params = useParams()
  const jobCardId = params.id as string

  const [loading, setLoading] = useState(true)
  const [jobCard, setJobCard] = useState<JobCardResponse | null>(null)

  useEffect(() => {
    loadData()
  }, [jobCardId])

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await jobCardService.getById(Number(jobCardId))
      setJobCard(data)
    } catch (error) {
      console.error('Failed to load job card:', error)
      toast.error('Failed to load job card', {
        description: error instanceof Error ? error.message : 'An error occurred'
      })
      setJobCard(null)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Completed':
      case 'QC Passed':
        return 'default'
      case 'In Progress':
      case 'Scheduled':
        return 'secondary'
      case 'Pending Material':
      case 'Blocked':
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
        <Link href="/planning">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Planning
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
          <Link href="/planning">
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
                  {jobCard.orderNo || `Order #${jobCard.orderId}`}
                </Link>
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Creation Type:</span>
              <p className="font-semibold mt-1 capitalize">{jobCard.creationType}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <p className="font-semibold mt-1">{jobCard.status}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Priority:</span>
              <p className="font-semibold mt-1">{jobCard.priority}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Quantity:</span>
              <p className="font-semibold mt-1">{jobCard.quantity} pcs</p>
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
            {jobCard.childPartName && (
              <div>
                <span className="text-muted-foreground">Child Part:</span>
                <p className="font-semibold mt-1">{jobCard.childPartName}</p>
              </div>
            )}
            {jobCard.processName && (
              <div>
                <span className="text-muted-foreground">Process Name:</span>
                <p className="font-semibold mt-1">{jobCard.processName}</p>
              </div>
            )}
            {jobCard.processCode && (
              <div>
                <span className="text-muted-foreground">Process Code:</span>
                <p className="font-semibold mt-1">{jobCard.processCode}</p>
              </div>
            )}
            {jobCard.stepNo && (
              <div>
                <span className="text-muted-foreground">Step Number:</span>
                <p className="font-semibold mt-1">Step {jobCard.stepNo}</p>
              </div>
            )}
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
              {jobCard.drawingRevision && (
                <div>
                  <span className="text-muted-foreground">Revision:</span>
                  <p className="font-semibold mt-1">Rev {jobCard.drawingRevision}</p>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Selection Type:</span>
                <p className="font-semibold mt-1 capitalize">
                  {jobCard.drawingSelectionType || 'N/A'}
                </p>
              </div>
              {jobCard.drawingName && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Drawing Name:</span>
                  <p className="font-semibold mt-1">{jobCard.drawingName}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Material Requirements */}
      {jobCard.materialRequirements && jobCard.materialRequirements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Material Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {jobCard.materialRequirements.map((mat, idx) => (
                <div key={idx} className="flex items-center justify-between bg-muted/50 rounded p-3 text-sm">
                  <div>
                    <p className="font-medium">{mat.rawMaterialName}</p>
                    {mat.materialGrade && (
                      <p className="text-xs text-muted-foreground">Grade: {mat.materialGrade}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{mat.requiredQuantity} {mat.unit}</p>
                    {mat.wastagePercent > 0 && (
                      <p className="text-xs text-muted-foreground">(+{mat.wastagePercent}% wastage)</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                <p className="text-sm text-muted-foreground bg-muted/50 rounded p-3 whitespace-pre-wrap">
                  {jobCard.workInstructions}
                </p>
              </div>
            )}
            {jobCard.qualityCheckpoints && (
              <div>
                <p className="text-sm font-medium mb-2">Quality Checkpoints</p>
                <p className="text-sm text-muted-foreground bg-muted/50 rounded p-3 whitespace-pre-wrap">
                  {jobCard.qualityCheckpoints}
                </p>
              </div>
            )}
            {jobCard.specialNotes && (
              <div>
                <p className="text-sm font-medium mb-2">Special Notes</p>
                <p className="text-sm text-muted-foreground bg-amber-50 border border-amber-200 rounded p-3 whitespace-pre-wrap">
                  {jobCard.specialNotes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Audit Information */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Created:</span>
              <p className="font-semibold mt-1">{formatDate(jobCard.createdAt)}</p>
            </div>
            {jobCard.createdBy && (
              <div>
                <span className="text-muted-foreground">Created By:</span>
                <p className="font-semibold mt-1">{jobCard.createdBy}</p>
              </div>
            )}
            {jobCard.updatedAt && (
              <div>
                <span className="text-muted-foreground">Last Updated:</span>
                <p className="font-semibold mt-1">{formatDate(jobCard.updatedAt)}</p>
              </div>
            )}
            {jobCard.updatedBy && (
              <div>
                <span className="text-muted-foreground">Updated By:</span>
                <p className="font-semibold mt-1">{jobCard.updatedBy}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
