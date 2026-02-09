'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Loader2,
  Factory,
  Clock,
  Calendar,
  Star,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'
import { scheduleService } from '@/lib/api/schedules'
import { jobCardService } from '@/lib/api/job-cards'
import { MachineSuggestion } from '@/types/schedule'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface ScheduleMachineDialogProps {
  jobCardId: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ScheduleMachineDialog({
  jobCardId,
  open,
  onOpenChange,
  onSuccess,
}: ScheduleMachineDialogProps) {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [suggestions, setSuggestions] = useState<MachineSuggestion[]>([])
  const [selectedMachineId, setSelectedMachineId] = useState<number | null>(null)
  const [scheduledStart, setScheduledStart] = useState('')
  const [scheduledEnd, setScheduledEnd] = useState('')
  const [jobCardNo, setJobCardNo] = useState('')

  useEffect(() => {
    if (open) {
      loadSuggestions()
    }
  }, [open, jobCardId])

  const loadSuggestions = async () => {
    try {
      setLoading(true)

      // Fetch job card details
      const jobCard = await jobCardService.getById(jobCardId)
      setJobCardNo(jobCard.jobCardNo)

      // Fetch machine suggestions
      const machineSuggestions = await scheduleService.getMachineSuggestions(jobCardId)
      setSuggestions(machineSuggestions)

      // Auto-select the best machine (first one, as they're sorted by preference)
      if (machineSuggestions.length > 0) {
        const bestMachine = machineSuggestions[0]
        setSelectedMachineId(bestMachine.machineId)

        // Set suggested times
        if (bestMachine.suggestedStart) {
          setScheduledStart(format(new Date(bestMachine.suggestedStart), "yyyy-MM-dd'T'HH:mm"))
        }
        if (bestMachine.suggestedEnd) {
          setScheduledEnd(format(new Date(bestMachine.suggestedEnd), "yyyy-MM-dd'T'HH:mm"))
        }
      }
    } catch (error) {
      toast.error('Failed to load machine suggestions')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleMachineSelect = (suggestion: MachineSuggestion) => {
    setSelectedMachineId(suggestion.machineId)

    // Update suggested times when selecting a different machine
    if (suggestion.suggestedStart) {
      setScheduledStart(format(new Date(suggestion.suggestedStart), "yyyy-MM-dd'T'HH:mm"))
    }
    if (suggestion.suggestedEnd) {
      setScheduledEnd(format(new Date(suggestion.suggestedEnd), "yyyy-MM-dd'T'HH:mm"))
    }
  }

  const handleSchedule = async () => {
    if (!selectedMachineId || !scheduledStart || !scheduledEnd) {
      toast.error('Please select a machine and schedule times')
      return
    }

    const selectedSuggestion = suggestions.find(s => s.machineId === selectedMachineId)
    if (!selectedSuggestion) return

    try {
      setSubmitting(true)

      // Create schedule
      await scheduleService.create({
        jobCardId,
        machineId: selectedMachineId,
        scheduledStartTime: new Date(scheduledStart),
        scheduledEndTime: new Date(scheduledEnd),
        estimatedDurationMinutes: selectedSuggestion.totalEstimatedMinutes,
        schedulingMethod: 'Semi-Automatic',
        suggestedBySystem: true,
        confirmedBy: 'User', // In a real app, get from auth context
        createdBy: 'User',
      })

      onSuccess()
    } catch (error) {
      toast.error('Failed to create schedule')
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Machine - {jobCardNo}</DialogTitle>
          <DialogDescription>
            Select the best machine for this job card. Machines are sorted by preference and availability.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : suggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No capable machines found</p>
            <p className="text-sm text-muted-foreground">
              No machines are configured to perform this process
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Machine Suggestions */}
            <div className="space-y-3">
              <Label>Available Machines ({suggestions.length})</Label>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <Card
                    key={suggestion.machineId}
                    className={`cursor-pointer transition-all ${
                      selectedMachineId === suggestion.machineId
                        ? 'border-primary ring-2 ring-primary'
                        : 'hover:border-gray-400'
                    }`}
                    onClick={() => handleMachineSelect(suggestion)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Machine Header */}
                          <div className="flex items-center gap-2 mb-2">
                            <Factory className="h-5 w-5 text-primary" />
                            <h4 className="font-semibold text-lg">
                              {suggestion.machineName}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {suggestion.machineCode}
                            </Badge>
                            {suggestion.isPreferredMachine && (
                              <Badge className="bg-yellow-500 text-white gap-1">
                                <Star className="h-3 w-3" />
                                Preferred
                              </Badge>
                            )}
                            {index === 0 && (
                              <Badge className="bg-green-500 text-white gap-1">
                                <TrendingUp className="h-3 w-3" />
                                Best Match
                              </Badge>
                            )}
                          </div>

                          {/* Machine Details Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                            <div>
                              <p className="text-xs text-muted-foreground">Setup Time</p>
                              <p className="text-sm font-medium">
                                {suggestion.estimatedSetupMinutes} min
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Cycle Time</p>
                              <p className="text-sm font-medium">
                                {suggestion.estimatedCycleMinutes} min
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Total Time</p>
                              <p className="text-sm font-medium text-primary">
                                {suggestion.totalEstimatedMinutes} min
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Preference</p>
                              <p className="text-sm font-medium">
                                Level {suggestion.preferenceLevel}
                              </p>
                            </div>
                          </div>

                          {/* Availability Info */}
                          <div className="mt-3 pt-3 border-t">
                            <div className="flex items-center gap-4">
                              {suggestion.isCurrentlyAvailable ? (
                                <div className="flex items-center gap-2 text-green-600">
                                  <CheckCircle2 className="h-4 w-4" />
                                  <span className="text-sm font-medium">Available Now</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-yellow-600">
                                  <Clock className="h-4 w-4" />
                                  <span className="text-sm font-medium">
                                    {suggestion.scheduledJobsCount} jobs scheduled
                                  </span>
                                </div>
                              )}

                              {suggestion.nextAvailableStart && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Calendar className="h-4 w-4" />
                                  <span className="text-sm">
                                    Next available: {format(new Date(suggestion.nextAvailableStart), 'MMM dd, HH:mm')}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Suggested Time Slot */}
                          {suggestion.suggestedStart && suggestion.suggestedEnd && (
                            <div className="mt-2 p-2 bg-blue-50 rounded-md">
                              <p className="text-xs text-blue-700 font-medium mb-1">
                                Suggested Schedule:
                              </p>
                              <p className="text-sm text-blue-900">
                                {format(new Date(suggestion.suggestedStart), 'MMM dd, yyyy HH:mm')}
                                {' → '}
                                {format(new Date(suggestion.suggestedEnd), 'MMM dd, yyyy HH:mm')}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Schedule Times */}
            {selectedMachineId && (
              <div className="border-t pt-4">
                <Label className="text-base font-semibold mb-3 block">
                  Confirm Schedule Times
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-time">Start Time</Label>
                    <Input
                      id="start-time"
                      type="datetime-local"
                      value={scheduledStart}
                      onChange={(e) => setScheduledStart(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-time">End Time</Label>
                    <Input
                      id="end-time"
                      type="datetime-local"
                      value={scheduledEnd}
                      onChange={(e) => setScheduledEnd(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSchedule}
            disabled={!selectedMachineId || !scheduledStart || !scheduledEnd || submitting}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
