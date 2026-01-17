'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  FileText,
  Factory,
  Send,
  SendHorizonal,
} from 'lucide-react'
import { mockJobCardsComplete as mockJobCards } from '@/lib/mock-data/job-cards-complete'
import { JobCard, JobCardStatus, MaterialStatus, ScheduleStatus } from '@/types/job-card'

export default function SchedulingDashboardPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedJobCards, setSelectedJobCards] = useState<string[]>([])

  // Filter job cards that are planned but not yet scheduled
  const unscheduledJobCards = mockJobCards.filter(jc => jc.scheduleStatus === ScheduleStatus.UNSCHEDULED)

  // Calculate statistics
  const stats = {
    total: unscheduledJobCards.length,
    ready: unscheduledJobCards.filter(jc =>
      jc.materialStatus === MaterialStatus.AVAILABLE &&
      jc.blockedBy.length === 0
    ).length,
    blocked: unscheduledJobCards.filter(jc => jc.blockedBy.length > 0).length,
    pendingMaterial: unscheduledJobCards.filter(jc =>
      jc.materialStatus === MaterialStatus.PENDING ||
      jc.materialStatus === MaterialStatus.PARTIAL
    ).length,
  }

  // Filter job cards based on search
  const filteredJobCards = unscheduledJobCards.filter(jc => {
    const matchesSearch =
      jc.jobCardNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      jc.orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      jc.processName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      jc.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (jc.childPartName && jc.childPartName.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesSearch
  })

  // Determine if job card is ready to be sent to production
  const isJobCardReady = (jc: JobCard): boolean => {
    return jc.materialStatus === MaterialStatus.AVAILABLE && jc.blockedBy.length === 0
  }

  // Send individual job card to production
  const sendToProduction = (jobCardId: string) => {
    // In real app, this would call an API
    console.log('Sending to production:', jobCardId)
    alert(`Job Card sent to Production! (This is a demo)`)
  }

  // Send all ready job cards to production
  const sendAllReady = () => {
    const readyJobCards = filteredJobCards.filter(isJobCardReady)
    if (readyJobCards.length === 0) {
      alert('No job cards are ready to be sent to production.')
      return
    }

    // In real app, this would call an API
    console.log('Sending all ready job cards:', readyJobCards.map(jc => jc.id))
    alert(`${readyJobCards.length} job cards sent to Production! (This is a demo)`)
  }

  // Get status badge for job card
  const getStatusBadge = (jc: JobCard) => {
    if (isJobCardReady(jc)) {
      return (
        <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Ready
        </Badge>
      )
    }

    if (jc.blockedBy.length > 0) {
      return (
        <Badge variant="outline" className="border-yellow-500 text-yellow-700 bg-yellow-50">
          <Clock className="mr-1 h-3 w-3" />
          Blocked
        </Badge>
      )
    }

    if (jc.materialStatus === MaterialStatus.PENDING || jc.materialStatus === MaterialStatus.PARTIAL) {
      return (
        <Badge variant="outline" className="border-red-500 text-red-700 bg-red-50">
          <XCircle className="mr-1 h-3 w-3" />
          Pending Material
        </Badge>
      )
    }

    return (
      <Badge variant="outline" className="border-gray-500 text-gray-700 bg-gray-50">
        Pending
      </Badge>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Job Cards</CardTitle>
            <FileText className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Awaiting scheduling</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready to Send</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ready}</div>
            <p className="text-xs text-muted-foreground">Can be sent to production</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.blocked}</div>
            <p className="text-xs text-muted-foreground">Waiting for dependencies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Material</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingMaterial}</div>
            <p className="text-xs text-muted-foreground">Waiting for material</p>
          </CardContent>
        </Card>
      </div>

      {/* Job Cards Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Planned Job Cards</CardTitle>
              <CardDescription>
                Review and send job cards to Production
              </CardDescription>
            </div>
            <Button
              onClick={sendAllReady}
              disabled={stats.ready === 0}
              className="gap-2"
            >
              <SendHorizonal className="h-4 w-4" />
              Send All Ready ({stats.ready})
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search job cards, orders, processes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Card No</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Child Part</TableHead>
                  <TableHead>Process</TableHead>
                  <TableHead>Step</TableHead>
                  <TableHead>Machine</TableHead>
                  <TableHead>Est. Time</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobCards.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                      {unscheduledJobCards.length === 0
                        ? 'All job cards have been sent to production!'
                        : 'No job cards found matching your search.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredJobCards.map((jc) => {
                    const isReady = isJobCardReady(jc)

                    return (
                      <TableRow
                        key={jc.id}
                        className={isReady ? 'bg-green-50/30' : ''}
                      >
                        <TableCell className="font-medium">
                          {jc.jobCardNo}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{jc.orderNo}</p>
                            <p className="text-xs text-muted-foreground">{jc.customerName}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            {jc.childPartName ? (
                              <>
                                <p className="font-medium text-sm">{jc.childPartName}</p>
                                <p className="text-xs text-muted-foreground">{jc.productName}</p>
                              </>
                            ) : (
                              <p className="font-medium text-sm">{jc.productName}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Factory className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-sm">{jc.processName}</p>
                              <p className="text-xs text-muted-foreground">{jc.processCode}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{jc.stepNo}</Badge>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">
                            {jc.assignedMachineName || 'Not Assigned'}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{jc.estimatedTotalTimeMin} min</p>
                        </TableCell>
                        <TableCell>
                          {jc.materialStatus === MaterialStatus.AVAILABLE ? (
                            <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
                              Available
                            </Badge>
                          ) : jc.materialStatus === MaterialStatus.PARTIAL ? (
                            <Badge variant="outline" className="border-yellow-500 text-yellow-700 bg-yellow-50">
                              Partial
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-red-500 text-red-700 bg-red-50">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(jc)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => sendToProduction(jc.id)}
                            disabled={!isReady}
                            className="gap-2"
                          >
                            <Send className="h-4 w-4" />
                            Send to Production
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
