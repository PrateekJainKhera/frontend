'use client'

import { useState, useEffect } from 'react'
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
  Search,
  FileText,
  Factory,
  Calendar,
  Loader2,
} from 'lucide-react'
import { jobCardService, JobCardResponse } from '@/lib/api/job-cards'
import { ScheduleMachineDialog } from '@/components/scheduling/schedule-machine-dialog'
import { toast } from 'sonner'

export default function SchedulingDashboardPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [jobCards, setJobCards] = useState<JobCardResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedJobCardId, setSelectedJobCardId] = useState<number | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Fetch unscheduled job cards
  useEffect(() => {
    loadJobCards()
  }, [])

  const loadJobCards = async () => {
    try {
      setLoading(true)
      // Fetch all job cards and filter for unscheduled ones with status PLANNED
      const allJobCards = await jobCardService.getAll()
      const unscheduled = allJobCards.filter(jc => jc.status === 'PLANNED')
      setJobCards(unscheduled)
    } catch (error) {
      toast.error('Failed to load job cards')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate statistics
  const stats = {
    total: jobCards.length,
    ready: jobCards.filter(jc => jc.status === 'PLANNED').length,
    highPriority: jobCards.filter(jc => jc.priority === 'HIGH').length,
    mediumPriority: jobCards.filter(jc => jc.priority === 'MEDIUM').length,
  }

  // Filter job cards based on search
  const filteredJobCards = jobCards.filter(jc => {
    const matchesSearch =
      jc.jobCardNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (jc.orderNo && jc.orderNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (jc.processName && jc.processName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (jc.childPartName && jc.childPartName.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesSearch
  })

  // Open scheduling dialog for a job card
  const openScheduleDialog = (jobCardId: number) => {
    setSelectedJobCardId(jobCardId)
    setDialogOpen(true)
  }

  // Handle successful schedule creation
  const handleScheduleSuccess = () => {
    setDialogOpen(false)
    setSelectedJobCardId(null)
    loadJobCards() // Reload to remove scheduled job card from list
    toast.success('Schedule created successfully!')
  }

  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return (
          <Badge variant="outline" className="border-red-500 text-red-700 bg-red-50">
            High
          </Badge>
        )
      case 'MEDIUM':
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-700 bg-yellow-50">
            Medium
          </Badge>
        )
      case 'LOW':
        return (
          <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
            Low
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="border-gray-500 text-gray-700 bg-gray-50">
            {priority}
          </Badge>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
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
            <CardTitle className="text-sm font-medium">Ready to Schedule</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ready}</div>
            <p className="text-xs text-muted-foreground">Planned job cards</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <Clock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.highPriority}</div>
            <p className="text-xs text-muted-foreground">Urgent job cards</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medium Priority</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.mediumPriority}</div>
            <p className="text-xs text-muted-foreground">Standard job cards</p>
          </CardContent>
        </Card>
      </div>

      {/* Job Cards Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Planned Job Cards - Schedule Machines</CardTitle>
              <CardDescription>
                Select machines for job cards using semi-automatic suggestions
              </CardDescription>
            </div>
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
                  <TableHead>Quantity</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobCards.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      {jobCards.length === 0
                        ? 'All job cards have been scheduled!'
                        : 'No job cards found matching your search.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredJobCards.map((jc) => (
                    <TableRow key={jc.id}>
                      <TableCell className="font-medium">
                        {jc.jobCardNo}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{jc.orderNo || 'N/A'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{jc.childPartName || '-'}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Factory className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{jc.processName || 'N/A'}</p>
                            <p className="text-xs text-muted-foreground">{jc.processCode || ''}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{jc.stepNo || '-'}</Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{jc.quantity}</p>
                      </TableCell>
                      <TableCell>
                        {getPriorityBadge(jc.priority)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-blue-500 text-blue-700 bg-blue-50">
                          {jc.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => openScheduleDialog(jc.id)}
                          className="gap-2"
                        >
                          <Calendar className="h-4 w-4" />
                          Schedule
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Machine Dialog */}
      {selectedJobCardId && (
        <ScheduleMachineDialog
          jobCardId={selectedJobCardId}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSuccess={handleScheduleSuccess}
        />
      )}
    </div>
  )
}
