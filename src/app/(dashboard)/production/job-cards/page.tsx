"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import {
  Play,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Package,
  Wrench,
  Plus,
  Lock,
  Unlock,
  Factory
} from 'lucide-react'
import { simulateApiCall } from '@/lib/utils/mock-api'
import { mockJobCards } from '@/lib/mock-data'
import { JobCard, JobCardStatus } from '@/types'
import Link from 'next/link'
import { format } from 'date-fns'

export default function JobCardsPage() {
  const [jobCards, setJobCards] = useState<JobCard[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'ready' | 'in-progress' | 'blocked'>('all')

  useEffect(() => {
    loadJobCards()
  }, [])

  const loadJobCards = async () => {
    setLoading(true)
    const data = await simulateApiCall(mockJobCards, 800)
    setJobCards(data)
    setLoading(false)
  }

  const filteredCards = jobCards.filter(card => {
    if (filter === 'ready') return card.status === JobCardStatus.READY
    if (filter === 'in-progress') return card.status === JobCardStatus.IN_PROGRESS
    if (filter === 'blocked') return card.status === JobCardStatus.BLOCKED
    return card.status !== JobCardStatus.COMPLETED
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'destructive'
      case 'High': return 'default'
      case 'Medium': return 'secondary'
      default: return 'outline'
    }
  }

  const getStatusIcon = (status: JobCardStatus) => {
    switch (status) {
      case JobCardStatus.BLOCKED: return <Lock className="h-4 w-4 text-orange-500" />
      case JobCardStatus.READY: return <Unlock className="h-4 w-4 text-green-500" />
      case JobCardStatus.IN_PROGRESS: return <Play className="h-4 w-4 text-blue-500" />
      case JobCardStatus.COMPLETED: return <CheckCircle className="h-4 w-4 text-green-600" />
      case JobCardStatus.PAUSED: return <Clock className="h-4 w-4 text-yellow-500" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: JobCardStatus) => {
    switch (status) {
      case JobCardStatus.BLOCKED:
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">🔒 Blocked</Badge>
      case JobCardStatus.READY:
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">🔓 Ready</Badge>
      case JobCardStatus.IN_PROGRESS:
        return <Badge variant="secondary">⚡ In Progress</Badge>
      case JobCardStatus.COMPLETED:
        return <Badge variant="default" className="bg-green-600">✓ Completed</Badge>
      case JobCardStatus.PAUSED:
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">⏸ Paused</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-10 w-full" />
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h1 className="sr-only">Job Cards</h1>
          <Button asChild>
            <Link href="/production/job-cards/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Job Card
            </Link>
          </Button>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 overflow-x-auto">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className="whitespace-nowrap"
          >
            All Active ({jobCards.filter(c => c.status !== JobCardStatus.COMPLETED).length})
          </Button>
          <Button
            variant={filter === 'ready' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('ready')}
            className="whitespace-nowrap"
          >
            🔓 Ready ({jobCards.filter(c => c.status === JobCardStatus.READY).length})
          </Button>
          <Button
            variant={filter === 'in-progress' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('in-progress')}
            className="whitespace-nowrap"
          >
            ⚡ In Progress ({jobCards.filter(c => c.status === JobCardStatus.IN_PROGRESS).length})
          </Button>
          <Button
            variant={filter === 'blocked' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('blocked')}
            className="whitespace-nowrap"
          >
            🔒 Blocked ({jobCards.filter(c => c.status === JobCardStatus.BLOCKED).length})
          </Button>
        </div>
      </div>

      {/* Job Cards List */}
      <div className="px-4 space-y-4">
        {filteredCards.length === 0 ? (
          <Card className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <p className="text-lg font-medium">All caught up!</p>
            <p className="text-sm text-muted-foreground">No active job cards in this category</p>
          </Card>
        ) : (
          filteredCards.map((card) => {
            const progressPercentage = card.quantity > 0 ? (card.completedQty / card.quantity) * 100 : 0

            return (
              <Card
                key={card.id}
                className={`${
                  card.priority === 'Urgent' ? 'border-red-300 shadow-md' : ''
                } hover:shadow-lg transition-shadow`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{card.jobCardNo}</CardTitle>
                        {card.priority === 'Urgent' && (
                          <Badge variant="destructive" className="text-xs">URGENT</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {getStatusIcon(card.status)}
                        {getStatusBadge(card.status)}
                        <Badge variant="outline" className="text-xs">
                          Step {card.stepNo}
                        </Badge>
                      </div>
                    </div>
                    <Badge variant={getPriorityColor(card.priority)}>
                      {card.priority}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Process Info */}
                  <div className="flex items-center gap-2 text-sm">
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{card.processName}</span>
                    <span className="text-muted-foreground">({card.processCode})</span>
                  </div>

                  {/* Order & Product Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{card.productName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{card.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Order: {card.orderNo}</span>
                      {card.assignedMachineName && (
                        <>
                          <span>•</span>
                          <Factory className="h-3 w-3" />
                          <span>{card.assignedMachineName}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Dependency Status */}
                  {card.status === JobCardStatus.BLOCKED && card.blockedBy.length > 0 && (
                    <div className="rounded-lg bg-orange-50 border border-orange-200 p-3">
                      <div className="flex items-center gap-2 text-xs text-orange-700">
                        <Lock className="h-3 w-3" />
                        <span className="font-medium">
                          Waiting for: {card.blockedBy.join(', ')}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Material Allocation Status */}
                  {card.allocatedMaterials && card.allocatedMaterials.length > 0 && (
                    <div className="rounded-lg bg-muted p-2 text-xs">
                      <span className="text-muted-foreground">
                        Materials: {card.allocatedMaterials.every(m => m.isAllocated) ? '✓' : '⚠'}
                        {' '}{card.allocatedMaterials.filter(m => m.isAllocated).length}/{card.allocatedMaterials.length} allocated
                      </span>
                    </div>
                  )}

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold">
                        {card.completedQty}/{card.quantity} units
                      </span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      {progressPercentage.toFixed(0)}% complete
                      {card.inProgressQty > 0 && (
                        <span> • {card.inProgressQty} in progress</span>
                      )}
                      {card.rejectedQty > 0 && (
                        <span className="text-red-600"> • {card.rejectedQty} rejected</span>
                      )}
                    </div>
                  </div>

                  {/* Time Info */}
                  {card.actualStartTime && (
                    <div className="text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 inline mr-1" />
                      Started: {format(new Date(card.actualStartTime), 'MMM dd, yyyy HH:mm')}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {card.status === JobCardStatus.READY && (
                      <Button size="sm" className="flex-1">
                        <Play className="mr-2 h-4 w-4" />
                        Start Job
                      </Button>
                    )}
                    {card.status === JobCardStatus.IN_PROGRESS && (
                      <Button size="sm" variant="secondary" className="flex-1">
                        Enter Quantity
                      </Button>
                    )}
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/production/job-cards/${card.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
