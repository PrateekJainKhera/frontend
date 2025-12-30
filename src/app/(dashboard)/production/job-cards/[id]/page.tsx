"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Play,
  Square,
  CheckCircle,
  Clock,
  Package,
  User,
  Wrench,
  AlertCircle,
  ArrowLeft,
  FileText,
  Calendar,
  Target,
  AlertTriangle,
  XCircle
} from 'lucide-react'
import { simulateApiCall } from '@/lib/utils/mock-api'
import { toast } from 'sonner'
import Link from 'next/link'

// Mock job card data with detailed information
interface JobCardDetail {
  id: string
  orderNo: string
  customerName: string
  customerCode: string
  productName: string
  productCode: string
  processName: string
  processCode: string
  quantity: number
  completedQty: number
  rejectedQty: number
  status: 'Pending' | 'In Progress' | 'Completed'
  priority: 'Low' | 'Medium' | 'High' | 'Urgent'
  machine: string
  machineCode: string
  startTime?: string
  endTime?: string
  estimatedTime: number
  actualTime?: number
  assignedOperator?: string
  notes?: string
  orderDate: string
  dueDate: string
  specifications: {
    diameter: string
    length: string
    material: string
    finish: string
  }
}

const mockJobCardDetails: Record<string, JobCardDetail> = {
  'JC-001': {
    id: 'JC-001',
    orderNo: 'ORD-128',
    customerName: 'ABC Industries',
    customerCode: 'CUST-001',
    productName: 'Magnetic Roller 250mm',
    productCode: 'PROD-M-250',
    processName: 'CNC Turning',
    processCode: 'PROC-CNC-01',
    quantity: 10,
    completedQty: 0,
    rejectedQty: 0,
    status: 'Pending',
    priority: 'Urgent',
    machine: 'CNC-01',
    machineCode: 'MCH-CNC-001',
    estimatedTime: 4.5,
    orderDate: '2024-01-15',
    dueDate: '2024-01-20',
    specifications: {
      diameter: '250mm',
      length: '1200mm',
      material: 'Stainless Steel 304',
      finish: 'Mirror Polish'
    },
    notes: 'Handle with care. Check dimensions after every 2 units.'
  },
  'JC-002': {
    id: 'JC-002',
    orderNo: 'ORD-125',
    customerName: 'XYZ Manufacturing',
    customerCode: 'CUST-002',
    productName: 'Rubber Roller 300mm',
    productCode: 'PROD-R-300',
    processName: 'Grinding',
    processCode: 'PROC-GRD-01',
    quantity: 8,
    completedQty: 3,
    rejectedQty: 0,
    status: 'In Progress',
    priority: 'High',
    machine: 'GRN-01',
    machineCode: 'MCH-GRN-001',
    startTime: '09:30 AM',
    estimatedTime: 3.0,
    actualTime: 1.5,
    assignedOperator: 'Rajesh Kumar',
    orderDate: '2024-01-12',
    dueDate: '2024-01-18',
    specifications: {
      diameter: '300mm',
      length: '1500mm',
      material: 'Natural Rubber',
      finish: 'Smooth'
    },
    notes: 'Customer requires special packaging.'
  },
}

export default function JobCardDetailPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.id as string

  const [jobCard, setJobCard] = useState<JobCardDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadJobCard()
  }, [jobId])

  const loadJobCard = async () => {
    setLoading(true)
    const data = await simulateApiCall(
      mockJobCardDetails[jobId] || null,
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-green-600'
      case 'In Progress': return 'text-blue-600'
      case 'Pending': return 'text-amber-600'
      default: return 'text-gray-600'
    }
  }

  const handleStartJob = async () => {
    if (!jobCard) return

    setIsSubmitting(true)
    await simulateApiCall(null, 800)

    const now = new Date()
    const startTime = now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })

    setJobCard({
      ...jobCard,
      status: 'In Progress',
      startTime: startTime,
      assignedOperator: 'Current User' // In real app, get from auth
    })

    toast.success('Job started successfully!')
    setIsSubmitting(false)
  }

  const handlePauseJob = async () => {
    if (!jobCard) return

    setIsSubmitting(true)
    await simulateApiCall(null, 800)

    setJobCard({
      ...jobCard,
      status: 'Pending',
      endTime: new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    })

    toast.success('Job paused')
    setIsSubmitting(false)
  }

  const handleEndJob = async () => {
    if (!jobCard) return

    if (jobCard.completedQty < jobCard.quantity) {
      toast.error('Cannot end job. Not all units are completed.')
      return
    }

    setIsSubmitting(true)
    await simulateApiCall(null, 800)

    const now = new Date()
    setJobCard({
      ...jobCard,
      status: 'Completed',
      endTime: now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    })

    toast.success('Job completed successfully!')
    setIsSubmitting(false)
  }

  const handleRecordRejection = () => {
    router.push(`/production/rejection?jobId=${jobId}`)
  }

  const getProgressPercentage = () => {
    if (!jobCard) return 0
    return (jobCard.completedQty / jobCard.quantity) * 100
  }

  const getDaysUntilDue = () => {
    if (!jobCard) return 0
    const due = new Date(jobCard.dueDate)
    const today = new Date()
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
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

  const daysUntilDue = getDaysUntilDue()

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background p-4 border-b">
        <div className="flex items-center gap-3 mb-3">
          <Button variant="outline" size="icon" asChild>
            <Link href="/production/job-cards">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-primary">Job Card Details</h1>
            <p className="text-sm text-muted-foreground">{jobCard.id}</p>
          </div>
          <Badge variant={getPriorityColor(jobCard.priority)}>
            {jobCard.priority}
          </Badge>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Status Card */}
        <Card className={`${
          jobCard.status === 'In Progress'
            ? 'border-l-4 border-l-blue-500 bg-blue-50/50'
            : jobCard.status === 'Completed'
            ? 'border-l-4 border-l-green-500 bg-green-50/50'
            : ''
        }`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Current Status</CardTitle>
              <Badge
                variant={jobCard.status === 'In Progress' ? 'default' : 'outline'}
                className={`text-sm ${getStatusColor(jobCard.status)}`}
              >
                {jobCard.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Production Progress</span>
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
                <span>Remaining: {jobCard.quantity - jobCard.completedQty} units</span>
                <span>{getProgressPercentage().toFixed(1)}%</span>
              </div>
            </div>

            {/* Time Info */}
            <Separator />
            <div className="grid grid-cols-2 gap-3 text-sm">
              {jobCard.startTime && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Started At</p>
                  <p className="font-medium">{jobCard.startTime}</p>
                </div>
              )}
              {jobCard.endTime && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Ended At</p>
                  <p className="font-medium">{jobCard.endTime}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground text-xs mb-1">Est. Time</p>
                <p className="font-medium">{jobCard.estimatedTime}h</p>
              </div>
              {jobCard.actualTime && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Actual Time</p>
                  <p className="font-medium">{jobCard.actualTime}h</p>
                </div>
              )}
            </div>

            {/* Rejection Info */}
            {jobCard.rejectedQty > 0 && (
              <>
                <Separator />
                <div className="flex items-center justify-between bg-red-50 p-2 rounded">
                  <div className="flex items-center gap-2 text-red-900">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium">Rejected Units</span>
                  </div>
                  <span className="text-lg font-bold text-red-600">{jobCard.rejectedQty}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {jobCard.status === 'Pending' && (
          <Card>
            <CardContent className="pt-6 space-y-3">
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

        {jobCard.status === 'In Progress' && (
          <Card>
            <CardContent className="pt-6 space-y-3">
              <Button
                className="w-full h-14 text-lg"
                asChild
              >
                <Link href={`/production/entry?jobId=${jobCard.id}`}>
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Enter Quantity
                </Link>
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-12"
                  onClick={handleRecordRejection}
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Rejection
                </Button>
                <Button
                  variant="outline"
                  className="h-12"
                  onClick={handlePauseJob}
                  disabled={isSubmitting}
                >
                  <Square className="mr-2 h-4 w-4" />
                  Pause
                </Button>
              </div>

              {jobCard.completedQty === jobCard.quantity && (
                <Button
                  variant="default"
                  className="w-full h-12 bg-green-600 hover:bg-green-700"
                  onClick={handleEndJob}
                  disabled={isSubmitting}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  End Job
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Process Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Process Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Process Name</span>
              <span className="font-medium">{jobCard.processName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Process Code</span>
              <span className="font-mono text-xs">{jobCard.processCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Machine</span>
              <span className="font-medium">{jobCard.machine}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Machine Code</span>
              <span className="font-mono text-xs">{jobCard.machineCode}</span>
            </div>
            {jobCard.assignedOperator && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Operator</span>
                <span className="font-medium">{jobCard.assignedOperator}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              Product Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Product Name</span>
              <span className="font-medium">{jobCard.productName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Product Code</span>
              <span className="font-mono text-xs">{jobCard.productCode}</span>
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="font-medium">Specifications</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Diameter:</span>
                  <span className="ml-2 font-medium">{jobCard.specifications.diameter}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Length:</span>
                  <span className="ml-2 font-medium">{jobCard.specifications.length}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Material:</span>
                  <span className="ml-2 font-medium">{jobCard.specifications.material}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Finish:</span>
                  <span className="ml-2 font-medium">{jobCard.specifications.finish}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order & Customer Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Order Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order No</span>
              <span className="font-medium">{jobCard.orderNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer</span>
              <span className="font-medium">{jobCard.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer Code</span>
              <span className="font-mono text-xs">{jobCard.customerCode}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order Date</span>
              <span className="font-medium">
                {new Date(jobCard.orderDate).toLocaleDateString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Due Date</span>
              <span className="font-medium">
                {new Date(jobCard.dueDate).toLocaleDateString('en-IN')}
              </span>
            </div>
            <div className={`flex items-center justify-between p-2 rounded ${
              daysUntilDue < 0
                ? 'bg-red-50'
                : daysUntilDue <= 2
                ? 'bg-amber-50'
                : 'bg-green-50'
            }`}>
              <div className="flex items-center gap-2">
                <Calendar className={`h-4 w-4 ${
                  daysUntilDue < 0
                    ? 'text-red-600'
                    : daysUntilDue <= 2
                    ? 'text-amber-600'
                    : 'text-green-600'
                }`} />
                <span className={`text-xs font-medium ${
                  daysUntilDue < 0
                    ? 'text-red-900'
                    : daysUntilDue <= 2
                    ? 'text-amber-900'
                    : 'text-green-900'
                }`}>
                  {daysUntilDue < 0 ? 'Overdue' : 'Days Until Due'}
                </span>
              </div>
              <span className={`font-bold ${
                daysUntilDue < 0
                  ? 'text-red-600'
                  : daysUntilDue <= 2
                  ? 'text-amber-600'
                  : 'text-green-600'
              }`}>
                {daysUntilDue < 0 ? Math.abs(daysUntilDue) : daysUntilDue} days
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {jobCard.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Special Instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground bg-amber-50 p-3 rounded border-l-4 border-l-amber-500">
                {jobCard.notes}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
