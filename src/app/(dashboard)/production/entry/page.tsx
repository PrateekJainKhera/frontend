"use client"

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Play,
  Square,
  CheckCircle,
  Clock,
  Package,
  User,
  Wrench,
  AlertCircle,
  ArrowLeft
} from 'lucide-react'
import { simulateApiCall } from '@/lib/utils/mock-api'
import { toast } from 'sonner'
import Link from 'next/link'

// Mock job card data
interface JobCard {
  id: string
  orderNo: string
  customerName: string
  productName: string
  processName: string
  quantity: number
  completedQty: number
  status: 'Pending' | 'In Progress' | 'Completed'
  priority: 'Low' | 'Medium' | 'High' | 'Urgent'
  machine: string
  startTime?: string
  estimatedTime: number
}

const mockJobCards: Record<string, JobCard> = {
  'JC-001': {
    id: 'JC-001',
    orderNo: 'ORD-128',
    customerName: 'ABC Industries',
    productName: 'Magnetic Roller 250mm',
    processName: 'CNC Turning',
    quantity: 10,
    completedQty: 0,
    status: 'Pending',
    priority: 'Urgent',
    machine: 'CNC-01',
    estimatedTime: 4.5
  },
  'JC-002': {
    id: 'JC-002',
    orderNo: 'ORD-125',
    customerName: 'XYZ Manufacturing',
    productName: 'Rubber Roller 300mm',
    processName: 'Grinding',
    quantity: 8,
    completedQty: 3,
    status: 'In Progress',
    priority: 'High',
    machine: 'GRN-01',
    startTime: '09:30 AM',
    estimatedTime: 3.0
  },
}

function ProductionEntryContent() {
  const searchParams = useSearchParams()
  const jobId = searchParams.get('jobId')

  const [jobCard, setJobCard] = useState<JobCard | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantityToAdd, setQuantityToAdd] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentTime, setCurrentTime] = useState<string>('')

  useEffect(() => {
    loadJobCard()
    updateCurrentTime()
    const timer = setInterval(updateCurrentTime, 1000)
    return () => clearInterval(timer)
  }, [jobId])

  const updateCurrentTime = () => {
    const now = new Date()
    setCurrentTime(now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }))
  }

  const loadJobCard = async () => {
    setLoading(true)
    const data = await simulateApiCall(
      jobId && mockJobCards[jobId] ? mockJobCards[jobId] : null,
      500
    )
    setJobCard(data)
    setLoading(false)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'destructive'
      case 'High': return 'default'
      case 'Medium': return 'secondary'
      default: return 'outline'
    }
  }

  const handleStartJob = async () => {
    if (!jobCard) return

    setIsSubmitting(true)
    await simulateApiCall(null, 800)

    setJobCard({
      ...jobCard,
      status: 'In Progress',
      startTime: currentTime
    })

    toast.success('Job started successfully!')
    setIsSubmitting(false)
  }

  const handleAddQuantity = async () => {
    if (!jobCard || !quantityToAdd) return

    const qtyToAdd = parseInt(quantityToAdd)

    if (isNaN(qtyToAdd) || qtyToAdd <= 0) {
      toast.error('Please enter a valid quantity')
      return
    }

    const newCompletedQty = jobCard.completedQty + qtyToAdd

    if (newCompletedQty > jobCard.quantity) {
      toast.error(`Cannot exceed total quantity (${jobCard.quantity})`)
      return
    }

    setIsSubmitting(true)
    await simulateApiCall(null, 800)

    const isComplete = newCompletedQty === jobCard.quantity

    setJobCard({
      ...jobCard,
      completedQty: newCompletedQty,
      status: isComplete ? 'Completed' : 'In Progress'
    })

    if (isComplete) {
      toast.success('Job completed successfully!')
    } else {
      toast.success(`Added ${qtyToAdd} units. Progress: ${newCompletedQty}/${jobCard.quantity}`)
    }

    setQuantityToAdd('')
    setIsSubmitting(false)
  }

  const handlePauseJob = async () => {
    if (!jobCard) return

    setIsSubmitting(true)
    await simulateApiCall(null, 800)

    setJobCard({
      ...jobCard,
      status: 'Pending',
      startTime: undefined
    })

    toast.success('Job paused')
    setIsSubmitting(false)
  }

  const getRemainingQty = () => {
    if (!jobCard) return 0
    return jobCard.quantity - jobCard.completedQty
  }

  const getProgressPercentage = () => {
    if (!jobCard) return 0
    return (jobCard.completedQty / jobCard.quantity) * 100
  }

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!jobCard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <AlertCircle className="h-16 w-16 text-red-600 mb-4" />
        <h2 className="text-2xl font-bold text-primary mb-2">Job Card Not Found</h2>
        <p className="text-muted-foreground mb-6">The requested job card could not be loaded</p>
        <Button asChild>
          <Link href="/production/job-cards">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Job Cards
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Header - Mobile Optimized */}
      <div className="sticky top-0 z-10 bg-background p-4 border-b">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/production/job-cards">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold text-primary">Production Entry</h1>
            <p className="text-sm text-muted-foreground">Job Card: {jobCard.id}</p>
          </div>
        </div>

        {/* Current Time */}
        <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-900">Current Time</span>
          </div>
          <span className="text-lg font-bold text-blue-600">{currentTime}</span>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Job Details Card */}
        <Card className={`${
          jobCard.status === 'In Progress'
            ? 'border-l-4 border-l-blue-500 bg-blue-50/50'
            : jobCard.status === 'Completed'
            ? 'border-l-4 border-l-green-500 bg-green-50/50'
            : ''
        }`}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={getPriorityColor(jobCard.priority)} className="text-xs">
                    {jobCard.priority}
                  </Badge>
                  <Badge
                    variant={jobCard.status === 'In Progress' ? 'default' : 'outline'}
                    className="text-xs"
                  >
                    {jobCard.status}
                  </Badge>
                </div>
                <CardTitle className="text-xl">{jobCard.processName}</CardTitle>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {/* Order Info */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{jobCard.productName}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{jobCard.customerName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{jobCard.machine}</span>
              </div>
            </div>

            {/* Progress */}
            <div className="space-y-2 pt-2 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">
                  {jobCard.completedQty}/{jobCard.quantity} units
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    jobCard.status === 'Completed' ? 'bg-green-600' : 'bg-primary'
                  }`}
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Remaining: {getRemainingQty()} units</span>
                <span>{getProgressPercentage().toFixed(1)}% Complete</span>
              </div>
            </div>

            {/* Time Info */}
            {jobCard.startTime && (
              <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded">
                <Clock className="h-4 w-4" />
                <span>Started at {jobCard.startTime}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Cards */}
        {jobCard.status === 'Pending' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Start Production</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full h-14 text-lg"
                onClick={handleStartJob}
                disabled={isSubmitting}
              >
                <Play className="mr-2 h-5 w-5" />
                {isSubmitting ? 'Starting...' : 'Start Job'}
              </Button>
            </CardContent>
          </Card>
        )}

        {jobCard.status === 'In Progress' && jobCard.completedQty < jobCard.quantity && (
          <>
            {/* Quantity Entry Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Enter Completed Quantity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-base">
                    Quantity Completed
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max={getRemainingQty()}
                    value={quantityToAdd}
                    onChange={(e) => setQuantityToAdd(e.target.value)}
                    placeholder="Enter quantity"
                    className="h-14 text-lg text-center"
                    disabled={isSubmitting}
                  />
                  <p className="text-sm text-muted-foreground text-center">
                    Maximum: {getRemainingQty()} units
                  </p>
                </div>

                {/* Quick Add Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  {[1, 5, 10].filter(val => val <= getRemainingQty()).map((val) => (
                    <Button
                      key={val}
                      variant="outline"
                      onClick={() => setQuantityToAdd(val.toString())}
                      disabled={isSubmitting}
                    >
                      +{val}
                    </Button>
                  ))}
                </div>

                <Button
                  className="w-full h-14 text-lg"
                  onClick={handleAddQuantity}
                  disabled={isSubmitting || !quantityToAdd}
                >
                  <CheckCircle className="mr-2 h-5 w-5" />
                  {isSubmitting ? 'Submitting...' : 'Submit Quantity'}
                </Button>
              </CardContent>
            </Card>

            {/* Pause Button */}
            <Card>
              <CardContent className="pt-6">
                <Button
                  variant="outline"
                  className="w-full h-12"
                  onClick={handlePauseJob}
                  disabled={isSubmitting}
                >
                  <Square className="mr-2 h-4 w-4" />
                  Pause Job
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {jobCard.status === 'Completed' && (
          <Card className="border-green-500">
            <CardContent className="pt-6 text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-green-900 mb-2">Job Completed!</h3>
              <p className="text-muted-foreground mb-6">
                All {jobCard.quantity} units completed successfully
              </p>
              <Button asChild className="w-full">
                <Link href="/production/job-cards">
                  Back to Job Cards
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order No:</span>
              <span className="font-medium">{jobCard.orderNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Est. Time:</span>
              <span className="font-medium">{jobCard.estimatedTime}h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Machine:</span>
              <span className="font-medium">{jobCard.machine}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ProductionEntryPage() {
  return (
    <Suspense fallback={<div className="p-4"><div className="space-y-4"><div className="h-10 w-full bg-muted animate-pulse rounded" /><div className="h-64 w-full bg-muted animate-pulse rounded" /></div></div>}>
      <ProductionEntryContent />
    </Suspense>
  )
}
