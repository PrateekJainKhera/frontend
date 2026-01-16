'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  ArrowLeft,
  Package,
  User,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { mockJobCards } from '@/lib/mock-data/job-cards-complete'
import { getOrderProductionView, calculateOrderProgress } from '@/lib/utils/production-grouping'
import { ProcessStepCard } from '@/components/production/process-step-card'
import { JobCard } from '@/types/job-card'
import Link from 'next/link'
import { toast } from 'sonner'

export default function OrderProductionPage() {
  const params = useParams()
  const orderId = params.orderId as string

  // Get order production view
  const orderView = getOrderProductionView(orderId, mockJobCards)

  const [refreshKey, setRefreshKey] = useState(0)

  if (!orderView) {
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
            <p className="text-lg font-medium">Order Not Found</p>
            <p className="text-sm text-muted-foreground">No job cards found for this order</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const progressPercentage = calculateOrderProgress(orderView)

  // Handlers
  const handleStart = (jobCard: JobCard) => {
    toast.success('Job card started', {
      description: `${jobCard.processName} has been started`,
    })
    setRefreshKey(prev => prev + 1)
  }

  const handleStop = (jobCard: JobCard) => {
    toast.info('Job card paused', {
      description: `${jobCard.processName} has been paused`,
    })
    setRefreshKey(prev => prev + 1)
  }

  const handleRestart = (jobCard: JobCard) => {
    toast.success('Job card restarted', {
      description: `${jobCard.processName} has been restarted`,
    })
    setRefreshKey(prev => prev + 1)
  }

  const handleComplete = (jobCard: JobCard) => {
    toast.success('Job card completed', {
      description: `${jobCard.processName} has been completed`,
    })
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="flex flex-col gap-6 p-6" key={refreshKey}>
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href="/production">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Order Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">Order: {orderView.orderNo}</CardTitle>
              <CardDescription className="text-base mt-2">
                Production workflow tracking
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className={
                progressPercentage === 100
                  ? 'border-green-500 text-green-700 bg-green-50 text-lg px-4 py-2'
                  : 'border-blue-500 text-blue-700 bg-blue-50 text-lg px-4 py-2'
              }
            >
              {progressPercentage}% Complete
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Customer & Product Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <User className="h-4 w-4" />
                <span>Customer</span>
              </div>
              <p className="font-semibold text-lg">{orderView.customerName}</p>
              <p className="text-sm text-muted-foreground">{orderView.customerCode}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Package className="h-4 w-4" />
                <span>Product</span>
              </div>
              <p className="font-semibold text-lg">{orderView.productName}</p>
              <p className="text-sm text-muted-foreground">{orderView.productCode}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                <span>Progress</span>
              </div>
              <p className="font-semibold text-lg">
                {orderView.completedSteps} / {orderView.totalSteps} Steps
              </p>
              <p className="text-sm text-muted-foreground">
                {orderView.inProgressSteps} in progress, {orderView.pendingSteps} pending
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-medium">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Child Parts */}
      {orderView.childParts.map((childPart, idx) => (
        <Card key={childPart.childPartId}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">
                  Child Part {idx + 1}: {childPart.childPartName}
                </CardTitle>
                <CardDescription className="mt-1">ID: {childPart.childPartId}</CardDescription>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="font-semibold">
                  {childPart.completedProcesses} / {childPart.totalProcesses} Steps
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Process Steps */}
            {childPart.processes.map((process) => (
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
          </CardContent>
        </Card>
      ))}

      {/* Assembly Step */}
      {orderView.assemblyJobCard && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Assembly</CardTitle>
            <CardDescription>Final assembly of all child parts</CardDescription>
          </CardHeader>
          <CardContent>
            <ProcessStepCard
              jobCard={orderView.assemblyJobCard}
              stepNumber={orderView.assemblyJobCard.stepNo}
              onStart={handleStart}
              onStop={handleStop}
              onRestart={handleRestart}
              onComplete={handleComplete}
            />
          </CardContent>
        </Card>
      )}

      {/* QC Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Quality Control</CardTitle>
          <CardDescription>Final inspection before dispatch</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 rounded-md bg-gray-50">
            {orderView.qcStatus === 'Completed' ? (
              <>
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-semibold text-green-800">QC Completed</p>
                  <p className="text-sm text-green-700">Order ready for dispatch</p>
                </div>
              </>
            ) : progressPercentage === 100 ? (
              <>
                <AlertCircle className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="font-semibold text-yellow-800">QC Pending</p>
                  <p className="text-sm text-yellow-700">All processes complete, awaiting inspection</p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="h-8 w-8 text-gray-500" />
                <div>
                  <p className="font-semibold text-gray-700">QC Pending</p>
                  <p className="text-sm text-gray-600">Complete all processes before QC</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
