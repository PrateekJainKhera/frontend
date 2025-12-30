"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Play,
  Square,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Package,
  Wrench
} from 'lucide-react'
import { simulateApiCall } from '@/lib/utils/mock-api'
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

const mockJobCards: JobCard[] = [
  {
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
  {
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
  {
    id: 'JC-003',
    orderNo: 'ORD-130',
    customerName: 'Global Prints',
    productName: 'Anilox Roller 200mm',
    processName: 'Chrome Plating',
    quantity: 5,
    completedQty: 5,
    status: 'Completed',
    priority: 'Medium',
    machine: 'PLT-01',
    estimatedTime: 6.0
  },
  {
    id: 'JC-004',
    orderNo: 'ORD-127',
    customerName: 'Mega Corp',
    productName: 'Printing Roller 350mm',
    processName: 'Balancing',
    quantity: 12,
    completedQty: 0,
    status: 'Pending',
    priority: 'Medium',
    machine: 'BAL-01',
    estimatedTime: 1.5
  },
]

export default function JobCardsPage() {
  const [jobCards, setJobCards] = useState<JobCard[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'in-progress'>('all')

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
    if (filter === 'pending') return card.status === 'Pending'
    if (filter === 'in-progress') return card.status === 'In Progress'
    return card.status !== 'Completed'
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'destructive'
      case 'High': return 'default'
      case 'Medium': return 'secondary'
      default: return 'outline'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending': return <Clock className="h-4 w-4" />
      case 'In Progress': return <Play className="h-4 w-4" />
      case 'Completed': return <CheckCircle className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
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
      {/* Header - Mobile Optimized */}
      <div className="sticky top-0 z-10 bg-background p-4 border-b">
        <h1 className="text-2xl font-bold text-primary mb-4">My Job Cards</h1>

        {/* Filter Buttons */}
        <div className="flex gap-2 overflow-x-auto">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className="whitespace-nowrap"
          >
            All Active ({jobCards.filter(c => c.status !== 'Completed').length})
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('pending')}
            className="whitespace-nowrap"
          >
            Pending ({jobCards.filter(c => c.status === 'Pending').length})
          </Button>
          <Button
            variant={filter === 'in-progress' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('in-progress')}
            className="whitespace-nowrap"
          >
            In Progress ({jobCards.filter(c => c.status === 'In Progress').length})
          </Button>
        </div>
      </div>

      {/* Job Cards List - Mobile First */}
      <div className="px-4 space-y-4">
        {filteredCards.length === 0 ? (
          <Card className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <p className="text-lg font-medium">All caught up!</p>
            <p className="text-sm text-muted-foreground">No active job cards</p>
          </Card>
        ) : (
          filteredCards.map((card) => (
            <Card
              key={card.id}
              className={`${
                card.status === 'In Progress'
                  ? 'border-l-4 border-l-blue-500 bg-blue-50/50'
                  : ''
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-muted-foreground">
                        {card.id}
                      </span>
                      <Badge variant={getPriorityColor(card.priority)} className="text-xs">
                        {card.priority}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{card.processName}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    {getStatusIcon(card.status)}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Order Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{card.productName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{card.customerName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{card.machine}</span>
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">
                      {card.completedQty}/{card.quantity} units
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${(card.completedQty / card.quantity) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Time Info */}
                {card.startTime && (
                  <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded">
                    <Clock className="h-4 w-4" />
                    <span>Started at {card.startTime}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  {card.status === 'Pending' && (
                    <Button className="flex-1" size="lg">
                      <Play className="mr-2 h-4 w-4" />
                      Start Job
                    </Button>
                  )}
                  {card.status === 'In Progress' && (
                    <>
                      <Button variant="outline" className="flex-1" size="lg">
                        <Square className="mr-2 h-4 w-4" />
                        Pause
                      </Button>
                      <Button asChild className="flex-1" size="lg">
                        <Link href={`/production/entry?jobId=${card.id}`}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Enter Qty
                        </Link>
                      </Button>
                    </>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
                  <span>Est. Time: {card.estimatedTime}h</span>
                  <span>Order: {card.orderNo}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
