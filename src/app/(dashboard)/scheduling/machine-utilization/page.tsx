'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Loader2, RefreshCw, CheckCircle2, Clock, Wrench, LayoutGrid, GanttChartSquare, Printer } from 'lucide-react'
import {
  machineService,
  MachineUtilizationResponse,
  MachineScheduleJobResponse,
  MachineDailyScheduleResponse,
} from '@/lib/api/machines'
import { toast } from 'sonner'

// The API returns schedule/actual timestamps as UTC but without a trailing "Z"
// (e.g. "2026-08-26T03:30:00"), so the browser's Date parser treats them as
// already-local wall-clock time and never converts to the viewer's timezone —
// a 09:00 IST shift start silently displays as "03:30". Appending "Z" tells it
// these are UTC instants, so toLocaleTimeString correctly converts to local time.
function parseServerDate(iso: string): Date {
  const hasTz = /Z$|[+-]\d{2}:?\d{2}$/.test(iso)
  return new Date(hasTz ? iso : `${iso}Z`)
}

function formatTime(iso: string | null): string {
  if (!iso) return '—'
  return parseServerDate(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

// ── Printable machine-wise / process-wise daily schedule slip ────────────────
interface PrintRow {
  sNo: number
  groupLabel: string    // Machine name+code (machine-wise print) or Process name (process-wise print)
  secondaryLabel: string // the other dimension — Process (machine-wise) or Machine (process-wise)
  time: string
  jobCardNo: string
  orderItem: string
  childPartName: string
  qty: number
  status: string
}

function buildMachineWiseRows(schedule: MachineDailyScheduleResponse[]): PrintRow[] {
  const rows: PrintRow[] = []
  for (const m of [...schedule].sort((a, b) => a.machineName.localeCompare(b.machineName))) {
    for (const job of m.jobs) {
      rows.push({
        sNo: 0,
        groupLabel: `${m.machineName} (${m.machineCode})`,
        secondaryLabel: job.processName ?? '—',
        time: `${formatTime(job.scheduledStartTime)} – ${formatTime(job.scheduledEndTime)}`,
        jobCardNo: job.jobCardNo,
        orderItem: job.orderNo ? `${job.orderNo}${job.itemSequence ? `-${job.itemSequence}` : ''}` : '—',
        childPartName: job.childPartName ?? '—',
        qty: job.quantity,
        status: job.status,
      })
    }
  }
  rows.forEach((r, i) => { r.sNo = i + 1 })
  return rows
}

function buildProcessWiseRows(schedule: MachineDailyScheduleResponse[]): PrintRow[] {
  const flat = schedule.flatMap(m => m.jobs.map(job => ({ job, machine: m })))
  flat.sort((a, b) =>
    (a.job.processName ?? '').localeCompare(b.job.processName ?? '') ||
    a.job.scheduledStartTime.localeCompare(b.job.scheduledStartTime)
  )
  const rows: PrintRow[] = flat.map(({ job, machine }) => ({
    sNo: 0,
    groupLabel: job.processName ?? 'Unspecified Process',
    secondaryLabel: `${machine.machineName} (${machine.machineCode})`,
    time: `${formatTime(job.scheduledStartTime)} – ${formatTime(job.scheduledEndTime)}`,
    jobCardNo: job.jobCardNo,
    orderItem: job.orderNo ? `${job.orderNo}${job.itemSequence ? `-${job.itemSequence}` : ''}` : '—',
    childPartName: job.childPartName ?? '—',
    qty: job.quantity,
    status: job.status,
  }))
  rows.forEach((r, i) => { r.sNo = i + 1 })
  return rows
}

function DailySchedulePrintSlip({
  rows,
  title,
  secondaryColumnLabel,
  groupColumnLabel,
  scheduledDate,
}: {
  rows: PrintRow[]
  title: string
  secondaryColumnLabel: string
  groupColumnLabel: string
  scheduledDate: string
}) {
  const fmtDate = (d: string) => {
    try { return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) }
    catch { return d }
  }
  if (typeof document === 'undefined') return null

  return createPortal(
    <div id="daily-schedule-print-slip" style={{ position: 'fixed', top: 0, left: '-9999px', width: '210mm', background: 'white' }}>
      <style>{`
        @media print {
          body > *:not(#daily-schedule-print-slip) { display: none !important; }
          #daily-schedule-print-slip {
            position: static !important;
            width: 100% !important;
            background: white !important;
            font-family: Arial, sans-serif !important;
          }
        }
        #daily-schedule-print-slip { padding: 24px; font-family: Arial, sans-serif; font-size: 11px; color: #111; }
        #daily-schedule-print-slip table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        #daily-schedule-print-slip th, #daily-schedule-print-slip td { border: 1px solid #555; padding: 5px 7px; text-align: left; vertical-align: top; }
        #daily-schedule-print-slip th { background: #222; color: #fff; font-size: 10px; font-weight: 600; }
        #daily-schedule-print-slip tr:nth-child(even) td { background: #f5f5f5; }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>MultiHitech ERP</p>
          <p style={{ fontWeight: 600, fontSize: 13, margin: '4px 0 0 0' }}>{title}</p>
        </div>
        <div style={{ textAlign: 'right', fontSize: 11 }}>
          <p style={{ margin: 0 }}>Date: <strong>{fmtDate(scheduledDate)}</strong></p>
          <p style={{ margin: '2px 0 0 0' }}>Total: <strong>{rows.length} job card{rows.length !== 1 ? 's' : ''}</strong></p>
          <p style={{ margin: '2px 0 0 0' }}>Printed: {new Date().toLocaleString('en-IN')}</p>
        </div>
      </div>
      <hr style={{ borderTop: '2px solid #333', marginBottom: 0 }} />
      <table>
        <thead>
          <tr>
            <th style={{ width: 32 }}>S.No</th>
            <th style={{ width: 90 }}>Time</th>
            <th>{groupColumnLabel}</th>
            <th>{secondaryColumnLabel}</th>
            <th>Job Card No</th>
            <th>Order (Item)</th>
            <th>Child Part</th>
            <th style={{ width: 40, textAlign: 'center' }}>Qty</th>
          </tr>
        </thead>
        <tbody>
          {(() => {
            const span = (startIdx: number) => {
              let n = 1
              for (let j = startIdx + 1; j < rows.length; j++) {
                if (rows[j].groupLabel === rows[startIdx].groupLabel) n++; else break
              }
              return n
            }
            return rows.map((row, i) => {
              const groupChanged = i === 0 || rows[i - 1].groupLabel !== row.groupLabel
              const groupSpan = groupChanged ? span(i) : 0
              return (
                <tr key={row.sNo}>
                  <td style={{ textAlign: 'center' }}>{row.sNo}</td>
                  <td>{row.time}</td>
                  {groupSpan > 0 && (
                    <td rowSpan={groupSpan} style={{ fontWeight: 600, verticalAlign: 'middle', background: '#f0f4ff' }}>{row.groupLabel}</td>
                  )}
                  <td>{row.secondaryLabel}</td>
                  <td>{row.jobCardNo}</td>
                  <td>{row.orderItem}</td>
                  <td>{row.childPartName}</td>
                  <td style={{ textAlign: 'center' }}>{row.qty}</td>
                </tr>
              )
            })
          })()}
        </tbody>
      </table>
    </div>,
    document.body
  )
}

function JobStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'Completed':
      return <Badge className="bg-green-100 text-green-800 border-green-300">Completed</Badge>
    case 'InProgress':
      return <Badge className="bg-blue-100 text-blue-800 border-blue-300">In Progress</Badge>
    default:
      return <Badge variant="outline">Scheduled</Badge>
  }
}

// ── Timeline (Gantt-style) grid: every machine's whole day, organized by process ──
const HOUR_WIDTH = 90
const ROW_HEIGHT = 56
const LABEL_WIDTH = 190

function hoursSince(from: Date, iso: string): number {
  return (parseServerDate(iso).getTime() - from.getTime()) / (1000 * 60 * 60)
}

function barColor(status: string): string {
  if (status === 'Completed') return 'bg-green-500'
  if (status === 'InProgress') return 'bg-blue-500'
  return 'bg-gray-300 border border-gray-400'
}

function DailyScheduleGrid({
  schedule,
  date,
  onSelectJob,
}: {
  schedule: MachineDailyScheduleResponse[]
  date: string
  onSelectJob: (job: MachineScheduleJobResponse, machine: MachineDailyScheduleResponse) => void
}) {
  const isToday = date === todayIso()

  const { windowStart, hours } = useMemo(() => {
    const allTimes = schedule.flatMap(m => m.jobs.flatMap(j => [j.scheduledStartTime, j.scheduledEndTime]))
    if (allTimes.length === 0) {
      const base = new Date(`${date}T07:00:00`)
      return { windowStart: base, hours: 12 }
    }
    const min = new Date(Math.min(...allTimes.map(t => parseServerDate(t).getTime())))
    const max = new Date(Math.max(...allTimes.map(t => parseServerDate(t).getTime())))
    const start = new Date(min); start.setMinutes(0, 0, 0)
    const end = new Date(max); end.setMinutes(0, 0, 0); end.setHours(end.getHours() + 1)
    const span = Math.max(6, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60)))
    return { windowStart: start, hours: span }
  }, [schedule, date])

  const trackWidth = hours * HOUR_WIDTH
  const nowOffset = isToday ? hoursSince(windowStart, new Date().toISOString()) * HOUR_WIDTH : null

  return (
    <div className="border rounded-lg overflow-auto" style={{ maxHeight: '70vh' }}>
      <div style={{ width: LABEL_WIDTH + trackWidth, minWidth: '100%' }}>
        {/* Hour header */}
        <div className="flex sticky top-0 z-20 bg-background border-b">
          <div className="shrink-0 border-r bg-muted/50" style={{ width: LABEL_WIDTH }} />
          <div className="relative flex" style={{ width: trackWidth }}>
            {Array.from({ length: hours }).map((_, i) => {
              const t = new Date(windowStart); t.setHours(t.getHours() + i)
              return (
                <div
                  key={i}
                  className="shrink-0 border-r text-xs text-muted-foreground px-1 py-2"
                  style={{ width: HOUR_WIDTH }}
                >
                  {t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )
            })}
          </div>
        </div>

        {/* Machine rows */}
        <div className="relative">
          {nowOffset !== null && nowOffset >= 0 && nowOffset <= trackWidth && (
            <div
              className="absolute top-0 bottom-0 w-px bg-red-500 z-10"
              style={{ left: LABEL_WIDTH + nowOffset }}
              title="Now"
            />
          )}
          {schedule.map((m) => (
            <div key={m.machineId} className="flex border-b" style={{ height: ROW_HEIGHT }}>
              <div className="shrink-0 border-r p-2 flex flex-col justify-center bg-muted/30" style={{ width: LABEL_WIDTH }}>
                <p className="text-sm font-medium truncate">{m.machineName}</p>
                <p className="text-xs text-muted-foreground truncate">{m.machineCode}</p>
              </div>
              <div className="relative" style={{ width: trackWidth }}>
                {m.jobs.map((job) => {
                  const barStartIso = job.actualStartTime ?? job.scheduledStartTime
                  const barEndIso = job.actualEndTime ?? (job.status === 'InProgress' ? new Date().toISOString() : job.scheduledEndTime)
                  const left = Math.max(0, hoursSince(windowStart, barStartIso) * HOUR_WIDTH)
                  const width = Math.max(6, (hoursSince(windowStart, barEndIso) - hoursSince(windowStart, barStartIso)) * HOUR_WIDTH)

                  return (
                    <div key={job.scheduleId}>
                      <button
                        onClick={() => onSelectJob(job, m)}
                        title={`${job.jobCardNo} · ${job.processName ?? ''}`}
                        className={`absolute top-2 h-9 rounded px-1.5 text-[11px] text-white text-left overflow-hidden hover:opacity-90 transition-opacity ${barColor(job.status)}`}
                        style={{ left, width }}
                      >
                        <span className="block truncate leading-tight">{job.processName ?? job.jobCardNo}</span>
                      </button>
                      {job.finishedEarly && (
                        <div
                          className="absolute top-2 h-9 rounded border border-dashed border-amber-400 bg-amber-50"
                          style={{
                            left: left + width,
                            width: Math.max(0, hoursSince(windowStart, job.scheduledEndTime) * HOUR_WIDTH - (left + width)),
                          }}
                          title="Freed up — finished early"
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function MachineUtilizationPage() {
  const [view, setView] = useState<'timeline' | 'cards'>('timeline')

  const [machines, setMachines] = useState<MachineUtilizationResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [selectedMachine, setSelectedMachine] = useState<MachineUtilizationResponse | null>(null)
  const [jobs, setJobs] = useState<MachineScheduleJobResponse[]>([])
  const [jobsLoading, setJobsLoading] = useState(false)

  const [scheduleDate, setScheduleDate] = useState(todayIso())
  const [dailySchedule, setDailySchedule] = useState<MachineDailyScheduleResponse[]>([])
  const [dailyLoading, setDailyLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState<{ job: MachineScheduleJobResponse; machine: MachineDailyScheduleResponse } | null>(null)

  const [printMode, setPrintMode] = useState<'machine' | 'process' | null>(null)
  useEffect(() => {
    if (printMode) window.print()
  }, [printMode])
  useEffect(() => {
    const reset = () => setPrintMode(null)
    window.addEventListener('afterprint', reset)
    return () => window.removeEventListener('afterprint', reset)
  }, [])

  const loadMachines = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const data = await machineService.getUtilization()
      setMachines(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load machine utilization')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  const loadDailySchedule = useCallback(async (silent = false) => {
    if (!silent) setDailyLoading(true)
    try {
      const data = await machineService.getDailySchedule(scheduleDate)
      setDailySchedule(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load daily schedule')
    } finally {
      setDailyLoading(false)
    }
  }, [scheduleDate])

  useEffect(() => {
    loadMachines()
    const interval = setInterval(() => loadMachines(true), 30000)
    return () => clearInterval(interval)
  }, [loadMachines])

  useEffect(() => {
    loadDailySchedule()
    const interval = setInterval(() => loadDailySchedule(true), 30000)
    return () => clearInterval(interval)
  }, [loadDailySchedule])

  const openMachine = async (machine: MachineUtilizationResponse) => {
    setSelectedMachine(machine)
    setJobsLoading(true)
    try {
      const data = await machineService.getMachineJobs(machine.machineId)
      setJobs(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load machine jobs')
      setJobs([])
    } finally {
      setJobsLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Machine Utilization</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Machine-wise daily schedule, organized by process. A job that finishes early frees its
            machine immediately — it doesn&apos;t wait for the originally scheduled end time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border p-0.5">
            <Button
              variant={view === 'timeline' ? 'default' : 'ghost'}
              size="sm"
              className="h-8"
              onClick={() => setView('timeline')}
            >
              <GanttChartSquare className="h-4 w-4 mr-1.5" /> Timeline
            </Button>
            <Button
              variant={view === 'cards' ? 'default' : 'ghost'}
              size="sm"
              className="h-8"
              onClick={() => setView('cards')}
            >
              <LayoutGrid className="h-4 w-4 mr-1.5" /> Cards
            </Button>
          </div>
          {view === 'timeline' && (
            <Input
              type="date"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="w-40 h-8"
            />
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => (view === 'timeline' ? loadDailySchedule(true) : loadMachines(true))}
            disabled={refreshing || dailyLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {view === 'timeline' && dailySchedule.length > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={() => setPrintMode('machine')}>
                <Printer className="h-4 w-4 mr-2" /> Print (Machine-wise)
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPrintMode('process')}>
                <Printer className="h-4 w-4 mr-2" /> Print (Process-wise)
              </Button>
            </>
          )}
        </div>
      </div>

      {view === 'timeline' ? (
        dailyLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : dailySchedule.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Wrench className="h-10 w-10 mx-auto mb-3" />
            <p>No active machines found</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-gray-300 border border-gray-400 inline-block" /> Scheduled</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-blue-500 inline-block" /> In Progress</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-green-500 inline-block" /> Completed</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm border border-dashed border-amber-400 bg-amber-50 inline-block" /> Freed up (finished early)</span>
            </div>
            <DailyScheduleGrid
              schedule={dailySchedule}
              date={scheduleDate}
              onSelectJob={(job, machine) => setSelectedJob({ job, machine })}
            />
          </>
        )
      ) : loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {machines.map((m) => (
            <Card
              key={m.machineId}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => openMachine(m)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{m.machineName}</CardTitle>
                    <p className="text-xs text-muted-foreground">{m.machineCode}{m.machineType ? ` · ${m.machineType}` : ''}</p>
                  </div>
                  {m.isCurrentlyBusy ? (
                    <Badge className="bg-red-100 text-red-800 border-red-300">Busy</Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-800 border-green-300">Free</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {m.isCurrentlyBusy ? (
                  <div className="text-xs space-y-0.5">
                    <p className="font-medium truncate">{m.currentJobCardNo}</p>
                    <p className="text-muted-foreground truncate">{m.currentProcessName ?? '—'}</p>
                    {m.currentJobExpectedFreeAt && (
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Expected free {formatTime(m.currentJobExpectedFreeAt)}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-600" /> Available now
                  </div>
                )}

                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Utilization today</span>
                    <span className="font-medium">{m.utilizationPercentToday}%</span>
                  </div>
                  <Progress value={m.utilizationPercentToday} className="h-1.5" />
                </div>

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{m.scheduledJobsToday} job{m.scheduledJobsToday === 1 ? '' : 's'} today</span>
                  <span>{m.completedJobsToday} completed</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Per-machine jobs drill-down (Cards view) */}
      <Dialog open={!!selectedMachine} onOpenChange={(open) => { if (!open) setSelectedMachine(null) }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedMachine?.machineName} — Today&apos;s Jobs</DialogTitle>
            <DialogDescription>{selectedMachine?.machineCode}</DialogDescription>
          </DialogHeader>

          {jobsLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No jobs scheduled on this machine today</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Card</TableHead>
                  <TableHead>Process</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Actual</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.scheduleId}>
                    <TableCell>
                      <div className="font-medium text-sm">{job.jobCardNo}</div>
                      <div className="text-xs text-muted-foreground">{job.orderNo}</div>
                    </TableCell>
                    <TableCell className="text-sm">{job.processName ?? '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatTime(job.scheduledStartTime)} – {formatTime(job.scheduledEndTime)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {job.actualStartTime || job.actualEndTime ? (
                        <>
                          {formatTime(job.actualStartTime)} – {formatTime(job.actualEndTime)}
                          {job.finishedEarly && (
                            <div>
                              <Badge className="mt-1 bg-amber-100 text-amber-800 border-amber-300 text-[10px]">
                                Finished early — machine freed
                              </Badge>
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell><JobStatusBadge status={job.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      {/* Single job detail (Timeline view) */}
      <Dialog open={!!selectedJob} onOpenChange={(open) => { if (!open) setSelectedJob(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedJob?.job.jobCardNo}</DialogTitle>
            <DialogDescription>{selectedJob?.machine.machineName} · {selectedJob?.machine.machineCode}</DialogDescription>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Order</span><span>{selectedJob.job.orderNo ?? '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Process</span><span>{selectedJob.job.processName ?? '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Scheduled</span><span>{formatTime(selectedJob.job.scheduledStartTime)} – {formatTime(selectedJob.job.scheduledEndTime)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Actual</span><span>{formatTime(selectedJob.job.actualStartTime)} – {formatTime(selectedJob.job.actualEndTime)}</span></div>
              <div className="flex justify-between items-center"><span className="text-muted-foreground">Status</span><JobStatusBadge status={selectedJob.job.status} /></div>
              {selectedJob.job.finishedEarly && (
                <Badge className="w-full justify-center bg-amber-100 text-amber-800 border-amber-300">Finished early — machine freed up</Badge>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {printMode === 'machine' && (
        <DailySchedulePrintSlip
          rows={buildMachineWiseRows(dailySchedule)}
          title="Machine-wise Daily Schedule"
          groupColumnLabel="Machine"
          secondaryColumnLabel="Process"
          scheduledDate={scheduleDate}
        />
      )}
      {printMode === 'process' && (
        <DailySchedulePrintSlip
          rows={buildProcessWiseRows(dailySchedule)}
          title="Process-wise Daily Schedule"
          groupColumnLabel="Process"
          secondaryColumnLabel="Machine"
          scheduledDate={scheduleDate}
        />
      )}
    </div>
  )
}
