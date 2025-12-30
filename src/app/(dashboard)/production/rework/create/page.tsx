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
import { Separator } from '@/components/ui/separator'
import {
  RefreshCw,
  AlertTriangle,
  Package,
  User,
  Wrench,
  ArrowLeft,
  Save,
  Link as LinkIcon,
  FileText,
  Clock
} from 'lucide-react'
import { simulateApiCall } from '@/lib/utils/mock-api'
import { toast } from 'sonner'
import Link from 'next/link'

// Rework process types
const reworkProcesses = [
  'Re-Grinding',
  'Re-Polishing',
  'Re-Machining',
  'Re-Assembly',
  'Re-Coating',
  'Re-Balancing',
  'Dimensional Correction',
  'Surface Treatment',
  'Quality Re-Inspection',
  'Other'
] as const

type ReworkProcess = typeof reworkProcesses[number]

// Priority levels
const priorityLevels = ['Low', 'Medium', 'High', 'Urgent'] as const
type Priority = typeof priorityLevels[number]

// Mock job card data
interface ParentJobCard {
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
  machine: string
  machineCode: string
}

const mockJobCards: Record<string, ParentJobCard> = {
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
    completedQty: 5,
    rejectedQty: 2,
    machine: 'CNC-01',
    machineCode: 'MCH-CNC-001'
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
    completedQty: 6,
    rejectedQty: 1,
    machine: 'GRN-01',
    machineCode: 'MCH-GRN-001'
  },
}

// Mock machines
const availableMachines = [
  { code: 'MCH-CNC-001', name: 'CNC-01', type: 'CNC Turning' },
  { code: 'MCH-CNC-002', name: 'CNC-02', type: 'CNC Turning' },
  { code: 'MCH-GRN-001', name: 'GRN-01', type: 'Grinding' },
  { code: 'MCH-GRN-002', name: 'GRN-02', type: 'Grinding' },
  { code: 'MCH-PLT-001', name: 'PLT-01', type: 'Plating' },
]

interface ReworkOrder {
  reworkJobCardId: string
  parentJobCardId: string
  orderNo: string
  reworkQuantity: number
  reworkProcess: ReworkProcess
  assignedMachine: string
  priority: Priority
  estimatedTimeHours: number
  reworkInstructions: string
  qualityCheckpoints: string
  targetCompletionDate: string
}

export default function CreateReworkOrderPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const parentJobId = searchParams.get('jobId')
  const rejectedQtyParam = searchParams.get('rejectedQty')

  const [parentJob, setParentJob] = useState<ParentJobCard | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [reworkQuantity, setReworkQuantity] = useState(rejectedQtyParam || '')
  const [reworkProcess, setReworkProcess] = useState<ReworkProcess | ''>('')
  const [assignedMachine, setAssignedMachine] = useState('')
  const [priority, setPriority] = useState<Priority>('High')
  const [estimatedTime, setEstimatedTime] = useState('')
  const [reworkInstructions, setReworkInstructions] = useState('')
  const [qualityCheckpoints, setQualityCheckpoints] = useState('')
  const [targetDate, setTargetDate] = useState('')

  useEffect(() => {
    loadParentJob()

    // Set default target date (3 days from now)
    const defaultDate = new Date()
    defaultDate.setDate(defaultDate.getDate() + 3)
    setTargetDate(defaultDate.toISOString().split('T')[0])
  }, [parentJobId])

  const loadParentJob = async () => {
    setLoading(true)
    const data = await simulateApiCall(
      parentJobId && mockJobCards[parentJobId] ? mockJobCards[parentJobId] : null,
      500
    )
    setParentJob(data)
    setLoading(false)
  }

  const generateReworkJobCardId = () => {
    if (!parentJob) return ''
    // Generate rework ID: RW-{ParentID}-{timestamp}
    return `RW-${parentJob.id}-${Date.now().toString().slice(-4)}`
  }

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'Urgent': return 'destructive'
      case 'High': return 'default'
      case 'Medium': return 'secondary'
      default: return 'outline'
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!parentJob) return

    // Validation
    const qty = parseInt(reworkQuantity)

    if (isNaN(qty) || qty <= 0) {
      toast.error('Please enter a valid rework quantity')
      return
    }

    if (qty > parentJob.rejectedQty) {
      toast.error(`Cannot rework more than ${parentJob.rejectedQty} rejected units`)
      return
    }

    if (!reworkProcess) {
      toast.error('Please select a rework process')
      return
    }

    if (!assignedMachine) {
      toast.error('Please select a machine')
      return
    }

    const estTime = parseFloat(estimatedTime)
    if (isNaN(estTime) || estTime <= 0) {
      toast.error('Please enter valid estimated time')
      return
    }

    if (!reworkInstructions.trim()) {
      toast.error('Please provide rework instructions')
      return
    }

    if (!qualityCheckpoints.trim()) {
      toast.error('Please provide quality checkpoints')
      return
    }

    if (!targetDate) {
      toast.error('Please select target completion date')
      return
    }

    const reworkJobCardId = generateReworkJobCardId()

    const reworkOrder: ReworkOrder = {
      reworkJobCardId,
      parentJobCardId: parentJob.id,
      orderNo: parentJob.orderNo,
      reworkQuantity: qty,
      reworkProcess,
      assignedMachine,
      priority,
      estimatedTimeHours: estTime,
      reworkInstructions,
      qualityCheckpoints,
      targetCompletionDate: targetDate
    }

    setIsSubmitting(true)
    await simulateApiCall(null, 1200)

    console.log('Rework Order Created:', reworkOrder)

    toast.success(
      `Rework order ${reworkJobCardId} created successfully! Linked to parent job ${parentJob.id}`,
      { duration: 5000 }
    )

    setIsSubmitting(false)

    // Navigate to job cards list
    router.push('/production/job-cards')
  }

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!parentJob) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <AlertTriangle className="h-16 w-16 text-red-600 mb-4" />
        <h2 className="text-2xl font-bold text-primary mb-2">Parent Job Not Found</h2>
        <p className="text-muted-foreground mb-6">Cannot create rework order</p>
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
            <Link href="/production/job-cards">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold text-primary flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Create Rework Order
            </h1>
            <p className="text-sm text-muted-foreground">
              Parent Job: {parentJob.id}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Parent Job Info Card */}
        <Card className="border-l-4 border-l-blue-500 bg-blue-50/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Parent Job Card
              </CardTitle>
              <Badge variant="outline" className="font-mono text-xs">
                {parentJob.id}
              </Badge>
            </div>
            <CardDescription>Original job details (read-only)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Order No</p>
                <p className="font-medium">{parentJob.orderNo}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Customer</p>
                <p className="font-medium">{parentJob.customerName}</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{parentJob.productName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {parentJob.processName} - {parentJob.machine}
              </span>
            </div>

            <Separator />

            <div className="grid grid-cols-3 gap-2 bg-white p-2 rounded">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-bold text-primary">{parentJob.quantity}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-lg font-bold text-green-600">{parentJob.completedQty}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Rejected</p>
                <p className="text-lg font-bold text-red-600">{parentJob.rejectedQty}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rework Order Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rework Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rework Order Details</CardTitle>
              <CardDescription>
                New job card will be: <span className="font-mono text-primary">{generateReworkJobCardId()}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reworkQty" className="text-base">
                  Rework Quantity *
                </Label>
                <Input
                  id="reworkQty"
                  type="number"
                  min="1"
                  max={parentJob.rejectedQty}
                  value={reworkQuantity}
                  onChange={(e) => setReworkQuantity(e.target.value)}
                  placeholder="Enter quantity"
                  className="h-12 text-lg"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Maximum: {parentJob.rejectedQty} rejected units available
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="process" className="text-base">
                  Rework Process *
                </Label>
                <Select value={reworkProcess} onValueChange={(val) => setReworkProcess(val as ReworkProcess)} required>
                  <SelectTrigger id="process" className="h-12">
                    <SelectValue placeholder="Select rework process" />
                  </SelectTrigger>
                  <SelectContent>
                    {reworkProcesses.map((proc) => (
                      <SelectItem key={proc} value={proc}>
                        {proc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="machine" className="text-base">
                  Assign Machine *
                </Label>
                <Select value={assignedMachine} onValueChange={setAssignedMachine} required>
                  <SelectTrigger id="machine" className="h-12">
                    <SelectValue placeholder="Select machine" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMachines.map((machine) => (
                      <SelectItem key={machine.code} value={machine.code}>
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium">{machine.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">{machine.type}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-base">
                    Priority *
                  </Label>
                  <Select value={priority} onValueChange={(val) => setPriority(val as Priority)} required>
                    <SelectTrigger id="priority" className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityLevels.map((p) => (
                        <SelectItem key={p} value={p}>
                          <Badge variant={getPriorityColor(p)} className="text-xs">
                            {p}
                          </Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estTime" className="text-base">
                    Est. Time (hours) *
                  </Label>
                  <Input
                    id="estTime"
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={estimatedTime}
                    onChange={(e) => setEstimatedTime(e.target.value)}
                    placeholder="0.0"
                    className="h-12"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetDate" className="text-base">
                  Target Completion Date *
                </Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="h-12"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Rework Instructions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Rework Instructions
              </CardTitle>
              <CardDescription>Detailed steps for rework process</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="instructions" className="text-base">
                  Step-by-Step Instructions *
                </Label>
                <Textarea
                  id="instructions"
                  value={reworkInstructions}
                  onChange={(e) => setReworkInstructions(e.target.value)}
                  placeholder="1. Clean the part thoroughly...&#10;2. Check for dimensional accuracy...&#10;3. Perform rework operation...&#10;4. Final inspection..."
                  className="min-h-[120px] font-mono text-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="checkpoints" className="text-base">
                  Quality Checkpoints *
                </Label>
                <Textarea
                  id="checkpoints"
                  value={qualityCheckpoints}
                  onChange={(e) => setQualityCheckpoints(e.target.value)}
                  placeholder="• Verify dimensions within ±0.05mm tolerance&#10;• Check surface finish for any defects&#10;• Ensure concentricity within specifications&#10;• Final balance check required"
                  className="min-h-[120px] font-mono text-sm"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Warning Card */}
          <Card className="border-amber-500 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-900">
                    Important Notes
                  </p>
                  <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                    <li>A new job card will be created and linked to parent job {parentJob.id}</li>
                    <li>Rework quantity will be deducted from rejected units</li>
                    <li>Both jobs will be trackable separately in the system</li>
                    <li>Operators will see this as a high-priority rework job</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <Button
                type="submit"
                className="w-full h-14 text-lg bg-blue-600 hover:bg-blue-700"
                disabled={isSubmitting}
              >
                <RefreshCw className="mr-2 h-5 w-5" />
                {isSubmitting ? 'Creating Rework Order...' : 'Create Rework Order'}
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
