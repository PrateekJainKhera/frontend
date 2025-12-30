"use client"

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import {
  XCircle,
  AlertTriangle,
  Package,
  User,
  Wrench,
  ArrowLeft,
  Save,
  FileText
} from 'lucide-react'
import { simulateApiCall } from '@/lib/utils/mock-api'
import { toast } from 'sonner'
import Link from 'next/link'

// Rejection reasons enum
const rejectionReasons = [
  'Dimensional Out of Tolerance',
  'Surface Defect',
  'Material Defect',
  'Machine Error',
  'Operator Error',
  'Tool Wear',
  'Setup Issue',
  'Quality Check Failure',
  'Customer Specification Not Met',
  'Other'
] as const

type RejectionReason = typeof rejectionReasons[number]

// Impact assessment
const impactLevels = ['Low', 'Medium', 'High', 'Critical'] as const
type ImpactLevel = typeof impactLevels[number]

// Mock job card data
interface JobCard {
  id: string
  orderNo: string
  customerName: string
  productName: string
  processName: string
  quantity: number
  completedQty: number
  rejectedQty: number
  machine: string
}

const mockJobCards: Record<string, JobCard> = {
  'JC-001': {
    id: 'JC-001',
    orderNo: 'ORD-128',
    customerName: 'ABC Industries',
    productName: 'Magnetic Roller 250mm',
    processName: 'CNC Turning',
    quantity: 10,
    completedQty: 5,
    rejectedQty: 0,
    machine: 'CNC-01'
  },
  'JC-002': {
    id: 'JC-002',
    orderNo: 'ORD-125',
    customerName: 'XYZ Manufacturing',
    productName: 'Rubber Roller 300mm',
    processName: 'Grinding',
    quantity: 8,
    completedQty: 6,
    rejectedQty: 1,
    machine: 'GRN-01'
  },
}

interface RejectionRecord {
  jobCardId: string
  rejectedQty: number
  reason: RejectionReason
  detailedDescription: string
  impactLevel: ImpactLevel
  canBeReworked: boolean
  inspectorName: string
  photosAttached: boolean
  correctiveAction: string
}

export default function RejectionRecordPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const jobId = searchParams.get('jobId')

  const [jobCard, setJobCard] = useState<JobCard | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [rejectedQty, setRejectedQty] = useState<string>('')
  const [reason, setReason] = useState<RejectionReason | ''>('')
  const [detailedDescription, setDetailedDescription] = useState('')
  const [impactLevel, setImpactLevel] = useState<ImpactLevel | ''>('')
  const [canBeReworked, setCanBeReworked] = useState(false)
  const [inspectorName, setInspectorName] = useState('')
  const [photosAttached, setPhotosAttached] = useState(false)
  const [correctiveAction, setCorrectiveAction] = useState('')

  useEffect(() => {
    loadJobCard()
  }, [jobId])

  const loadJobCard = async () => {
    setLoading(true)
    const data = await simulateApiCall(
      jobId && mockJobCards[jobId] ? mockJobCards[jobId] : null,
      500
    )
    setJobCard(data)
    setLoading(false)
  }

  const getMaxRejectionQty = () => {
    if (!jobCard) return 0
    // Can reject from completed quantity only
    return jobCard.completedQty
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!jobCard) return

    // Validation
    const qtyToReject = parseInt(rejectedQty)

    if (isNaN(qtyToReject) || qtyToReject <= 0) {
      toast.error('Please enter a valid quantity')
      return
    }

    if (qtyToReject > getMaxRejectionQty()) {
      toast.error(`Cannot reject more than ${getMaxRejectionQty()} completed units`)
      return
    }

    if (!reason) {
      toast.error('Please select a rejection reason')
      return
    }

    if (!detailedDescription.trim()) {
      toast.error('Please provide a detailed description')
      return
    }

    if (!impactLevel) {
      toast.error('Please select impact level')
      return
    }

    if (!inspectorName.trim()) {
      toast.error('Please enter inspector name')
      return
    }

    if (!correctiveAction.trim()) {
      toast.error('Please provide corrective action')
      return
    }

    const rejectionRecord: RejectionRecord = {
      jobCardId: jobCard.id,
      rejectedQty: qtyToReject,
      reason,
      detailedDescription,
      impactLevel,
      canBeReworked,
      inspectorName,
      photosAttached,
      correctiveAction
    }

    setIsSubmitting(true)
    await simulateApiCall(null, 1000)

    console.log('Rejection Record:', rejectionRecord)

    // Update job card quantities
    const newRejectedQty = jobCard.rejectedQty + qtyToReject
    const newCompletedQty = jobCard.completedQty - qtyToReject

    toast.success(
      `Rejection recorded: ${qtyToReject} units rejected. ${
        canBeReworked ? 'Rework order can be created.' : 'Units marked as scrap.'
      }`
    )

    setIsSubmitting(false)

    // Navigate based on whether rework is needed
    if (canBeReworked) {
      router.push(`/production/rework/create?jobId=${jobCard.id}&rejectedQty=${qtyToReject}`)
    } else {
      router.push('/production/job-cards')
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'Critical': return 'text-red-600 bg-red-50'
      case 'High': return 'text-orange-600 bg-orange-50'
      case 'Medium': return 'text-amber-600 bg-amber-50'
      case 'Low': return 'text-blue-600 bg-blue-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!jobCard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <AlertTriangle className="h-16 w-16 text-red-600 mb-4" />
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
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background p-4 border-b">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/production/job-cards/${jobId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold text-red-600 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Record Rejection
            </h1>
            <p className="text-sm text-muted-foreground">Job Card: {jobCard.id}</p>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Job Summary Card */}
        <Card className="border-l-4 border-l-red-500 bg-red-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Job Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
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
              <span className="text-muted-foreground">{jobCard.processName} - {jobCard.machine}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="text-muted-foreground">Completed Units</span>
              <span className="font-bold">{jobCard.completedQty}/{jobCard.quantity}</span>
            </div>
            {jobCard.rejectedQty > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Already Rejected</span>
                <span className="font-bold text-red-600">{jobCard.rejectedQty}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rejection Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quantity Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rejection Details</CardTitle>
              <CardDescription>Enter the number of units and reason for rejection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rejectedQty" className="text-base">
                  Quantity to Reject *
                </Label>
                <Input
                  id="rejectedQty"
                  type="number"
                  min="1"
                  max={getMaxRejectionQty()}
                  value={rejectedQty}
                  onChange={(e) => setRejectedQty(e.target.value)}
                  placeholder="Enter quantity"
                  className="h-12 text-lg"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Maximum: {getMaxRejectionQty()} completed units
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason" className="text-base">
                  Rejection Reason *
                </Label>
                <Select value={reason} onValueChange={(val) => setReason(val as RejectionReason)} required>
                  <SelectTrigger id="reason" className="h-12">
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {rejectionReasons.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-base">
                  Detailed Description *
                </Label>
                <Textarea
                  id="description"
                  value={detailedDescription}
                  onChange={(e) => setDetailedDescription(e.target.value)}
                  placeholder="Describe the defect in detail..."
                  className="min-h-[100px]"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Impact Assessment Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Impact Assessment</CardTitle>
              <CardDescription>Evaluate the severity and rework possibility</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="impact" className="text-base">
                  Impact Level *
                </Label>
                <Select value={impactLevel} onValueChange={(val) => setImpactLevel(val as ImpactLevel)} required>
                  <SelectTrigger id="impact" className="h-12">
                    <SelectValue placeholder="Select impact level" />
                  </SelectTrigger>
                  <SelectContent>
                    {impactLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        <div className="flex items-center gap-2">
                          <span>{level}</span>
                          {level === 'Critical' && <Badge variant="destructive" className="text-xs">Urgent</Badge>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {impactLevel && (
                  <div className={`p-3 rounded text-sm font-medium ${getImpactColor(impactLevel)}`}>
                    Impact Level: {impactLevel}
                  </div>
                )}
              </div>

              <div className="flex items-start space-x-3 rounded-md border p-4">
                <Checkbox
                  id="rework"
                  checked={canBeReworked}
                  onCheckedChange={(checked) => setCanBeReworked(checked as boolean)}
                />
                <div className="space-y-1 leading-none">
                  <Label htmlFor="rework" className="text-base cursor-pointer">
                    Can be Reworked
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Check if the rejected units can be salvaged through rework
                  </p>
                </div>
              </div>

              {canBeReworked && (
                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                  <p className="text-sm text-blue-900 font-medium">
                    ℹ️ A rework order will be created after submission
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Inspector & Documentation Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quality Inspector Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inspector" className="text-base">
                  Inspector Name *
                </Label>
                <Input
                  id="inspector"
                  type="text"
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                  placeholder="Enter inspector name"
                  className="h-12"
                  required
                />
              </div>

              <div className="flex items-start space-x-3 rounded-md border p-4">
                <Checkbox
                  id="photos"
                  checked={photosAttached}
                  onCheckedChange={(checked) => setPhotosAttached(checked as boolean)}
                />
                <div className="space-y-1 leading-none">
                  <Label htmlFor="photos" className="text-base cursor-pointer">
                    Photos/Evidence Attached
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Confirm if photographic evidence has been collected
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Corrective Action Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Corrective Action</CardTitle>
              <CardDescription>Document steps to prevent recurrence</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="corrective" className="text-base">
                  Corrective Action Plan *
                </Label>
                <Textarea
                  id="corrective"
                  value={correctiveAction}
                  onChange={(e) => setCorrectiveAction(e.target.value)}
                  placeholder="Describe actions to prevent this issue in the future..."
                  className="min-h-[100px]"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <Button
                type="submit"
                className="w-full h-14 text-lg bg-red-600 hover:bg-red-700"
                disabled={isSubmitting}
              >
                <Save className="mr-2 h-5 w-5" />
                {isSubmitting ? 'Recording...' : 'Record Rejection'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full h-12"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}
