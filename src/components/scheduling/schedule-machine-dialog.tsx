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
  isOsp?: boolean
  minStartTime?: string | null  // end time of previous step — this step cannot start before it
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ScheduleMachineDialog({
  jobCardId,
  isOsp = false,
  minStartTime = null,
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
  // OSP duration fields
  const [ospDays, setOspDays] = useState('1')
  const [ospHours, setOspHours] = useState('0')

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

      if (isOsp) {
        // OSP: no machine needed — start = max(now, minStartTime)
        const nowStr = format(new Date(), "yyyy-MM-dd'T'HH:mm")
        const start = effectiveStart(nowStr)
        setScheduledStart(start)
        const mins = (parseInt(ospDays) * 24 * 60) + (parseInt(ospHours) * 60)
        setScheduledEnd(calcEnd(start, mins))
        return
      }

      // Fetch machine suggestions
      const machineSuggestions = await scheduleService.getMachineSuggestions(jobCardId)
      setSuggestions(machineSuggestions)

      // Auto-select the best machine (first one, as they're sorted by preference)
      if (machineSuggestions.length > 0) {
        const bestMachine = machineSuggestions[0]
        setSelectedMachineId(bestMachine.machineId)

        // Start = max(machine's suggested start, previous step's end time)
        const rawStart = bestMachine.suggestedStart
          ? format(new Date(bestMachine.suggestedStart), "yyyy-MM-dd'T'HH:mm")
          : format(new Date(), "yyyy-MM-dd'T'HH:mm")
        const start = effectiveStart(rawStart)
        setScheduledStart(start)
        setScheduledEnd(calcEnd(start, bestMachine.totalEstimatedMinutes))
      }
    } catch (error) {
      toast.error('Failed to load machine suggestions')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // Auto-calculate end time from start + duration minutes
  const calcEnd = (startValue: string, durationMinutes: number) => {
    if (!startValue || !durationMinutes) return ''
    const end = new Date(new Date(startValue).getTime() + durationMinutes * 60 * 1000)
    return format(end, "yyyy-MM-dd'T'HH:mm")
  }

  // Return the effective start time: max(proposed, minStartTime)
  const effectiveStart = (proposed: string) => {
    if (!minStartTime) return proposed
    const propDate = new Date(proposed)
    const minDate = new Date(minStartTime)
    return propDate >= minDate ? proposed : format(minDate, "yyyy-MM-dd'T'HH:mm")
  }

  const handleMachineSelect = (suggestion: MachineSuggestion) => {
    setSelectedMachineId(suggestion.machineId)
    // start = max(machine's next available, previous step's end time)
    const rawStart = suggestion.suggestedStart
      ? format(new Date(suggestion.suggestedStart), "yyyy-MM-dd'T'HH:mm")
      : scheduledStart
    const start = effectiveStart(rawStart)
    setScheduledStart(start)
    setScheduledEnd(calcEnd(start, suggestion.totalEstimatedMinutes))
  }

  // When start time is changed manually — no clamping, user can override freely
  const handleStartChange = (value: string) => {
    setScheduledStart(value)
    if (isOsp) {
      const mins = (parseInt(ospDays) * 24 * 60) + (parseInt(ospHours) * 60)
      setScheduledEnd(calcEnd(value, mins || 1440))
    } else {
      const sel = suggestions.find(s => s.machineId === selectedMachineId)
      if (sel) setScheduledEnd(calcEnd(value, sel.totalEstimatedMinutes))
    }
  }

  // True when user has set a start time earlier than the previous step's end
  const startBeforePrev = !!(minStartTime && scheduledStart && new Date(scheduledStart) < new Date(minStartTime))

  // Recalculate OSP end time when days/hours change
  const handleOspDurationChange = (days: string, hours: string) => {
    const mins = (parseInt(days || '0') * 24 * 60) + (parseInt(hours || '0') * 60)
    setScheduledEnd(calcEnd(scheduledStart, mins || 1440))
  }

  const handleSchedule = async () => {
    if (!scheduledStart || !scheduledEnd) {
      toast.error('Please set schedule times')
      return
    }
    if (!isOsp && !selectedMachineId) {
      toast.error('Please select a machine')
      return
    }

    try {
      setSubmitting(true)

      if (isOsp) {
        const totalMins = (parseInt(ospDays) * 24 * 60) + (parseInt(ospHours) * 60)
        await scheduleService.create({
          jobCardId,
          machineId: 0,
          scheduledStartTime: new Date(scheduledStart),
          scheduledEndTime: new Date(scheduledEnd),
          estimatedDurationMinutes: totalMins || 1440,
          schedulingMethod: 'OSP',
          isOsp: true,
          suggestedBySystem: false,
          createdBy: 'User',
        })
      } else {
        const selectedSuggestion = suggestions.find(s => s.machineId === selectedMachineId)
        if (!selectedSuggestion) return
        await scheduleService.create({
          jobCardId,
          machineId: selectedMachineId!,
          scheduledStartTime: new Date(scheduledStart),
          scheduledEndTime: new Date(scheduledEnd),
          estimatedDurationMinutes: selectedSuggestion.totalEstimatedMinutes,
          schedulingMethod: 'Semi-Automatic',
          suggestedBySystem: true,
          confirmedBy: 'User',
          createdBy: 'User',
        })
      }

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
          <DialogTitle>{isOsp ? 'OSP Lead Time' : 'Schedule Machine'} — {jobCardNo}</DialogTitle>
          <DialogDescription>
            {isOsp
              ? 'Set the vendor lead time for this outside service process. No machine is required.'
              : 'Select the best machine for this job card. Machines are sorted by preference and availability.'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : isOsp ? (
          /* ── OSP Mode: no machine, just set lead time ── */
          <div className="space-y-5">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 border border-orange-200">
              <AlertCircle className="h-5 w-5 text-orange-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-orange-800">Outside Service Process (OSP)</p>
                <p className="text-xs text-orange-600">No machine is assigned — set the vendor lead time below.</p>
              </div>
            </div>

            {/* OSP Lead Time */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">OSP Lead Time</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="osp-days" className="text-xs">Days</Label>
                  <Input
                    id="osp-days"
                    type="number"
                    min="0"
                    value={ospDays}
                    onChange={(e) => {
                      setOspDays(e.target.value)
                      handleOspDurationChange(e.target.value, ospHours)
                    }}
                    className="mt-1 h-9 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="osp-hours" className="text-xs">Additional Hours</Label>
                  <Input
                    id="osp-hours"
                    type="number"
                    min="0"
                    max="23"
                    value={ospHours}
                    onChange={(e) => {
                      setOspHours(e.target.value)
                      handleOspDurationChange(ospDays, e.target.value)
                    }}
                    className="mt-1 h-9 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* OSP Start / End Times */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Schedule</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="osp-start" className="text-xs">Send to Vendor</Label>
                  <Input
                    id="osp-start"
                    type="datetime-local"
                    value={scheduledStart}
                    onChange={(e) => handleStartChange(e.target.value)}
                    className="mt-1 h-9 text-sm"
                  />
                  {minStartTime && !startBeforePrev && (
                    <p className="text-[11px] text-blue-600 mt-1">
                      Prev step ends: {format(new Date(minStartTime), 'dd MMM HH:mm')}
                    </p>
                  )}
                  {startBeforePrev && (
                    <p className="text-[11px] text-amber-600 mt-1">
                      ⚠ Before prev step end — confirm this is intentional
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="osp-end" className="text-xs">Expected Return <span className="text-muted-foreground font-normal">(auto)</span></Label>
                  <Input
                    id="osp-end"
                    type="datetime-local"
                    value={scheduledEnd}
                    readOnly
                    className="mt-1 h-9 text-sm bg-muted/40"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    = Send date + {ospDays}d {ospHours}h
                  </p>
                </div>
              </div>
            </div>
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
            {selectedMachineId && (() => {
              const sel = suggestions.find(s => s.machineId === selectedMachineId)
              const durationMins = sel?.totalEstimatedMinutes ?? 0
              const hours = Math.floor(durationMins / 60)
              const mins  = durationMins % 60
              const durationLabel = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
              return (
                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Confirm Schedule Times</Label>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      Duration: <span className="font-semibold text-primary">{durationLabel}</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start-time" className="text-xs">Start Time</Label>
                      <Input
                        id="start-time"
                        type="datetime-local"
                        value={scheduledStart}
                        onChange={(e) => handleStartChange(e.target.value)}
                        className="mt-1 h-9 text-sm"
                      />
                      {minStartTime && !startBeforePrev && (
                        <p className="text-[11px] text-blue-600 mt-1">
                          Prev step ends: {format(new Date(minStartTime), 'dd MMM HH:mm')}
                        </p>
                      )}
                      {startBeforePrev && (
                        <p className="text-[11px] text-amber-600 mt-1">
                          ⚠ Before prev step end — confirm this is intentional
                        </p>
                      )}
                      {!minStartTime && sel && !sel.isCurrentlyAvailable && (
                        <p className="text-[11px] text-amber-600 mt-1">
                          Machine busy — starts after current jobs
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="end-time" className="text-xs">End Time <span className="text-muted-foreground font-normal">(auto)</span></Label>
                      <Input
                        id="end-time"
                        type="datetime-local"
                        value={scheduledEnd}
                        onChange={(e) => setScheduledEnd(e.target.value)}
                        className="mt-1 h-9 text-sm"
                      />
                      <p className="text-[11px] text-muted-foreground mt-1">
                        = Start + {durationLabel} total
                      </p>
                    </div>
                  </div>
                </div>
              )
            })()}
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
            disabled={(!isOsp && !selectedMachineId) || !scheduledStart || !scheduledEnd || submitting}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isOsp ? 'Confirm OSP Lead Time' : 'Confirm Schedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
