// Ordered 6-stage order pipeline + display metadata (colours match the app theme).
// Kept in one place so the Orders table, order detail and dashboard stay consistent.

export const WORKFLOW_STAGES = [
  'Drawing Pending',
  'Pending',
  'Ready for Cutting',
  'Ready for Scheduling',
  'In Production',
  'Pending QC',
  'Ready to Dispatch',
  'Dispatched',
] as const

export type WorkflowStage = (typeof WORKFLOW_STAGES)[number]

// Slug used by the API status filter (matches backend EffectiveStatusFilter).
export const stageSlug = (stage: string) => stage.toLowerCase().replace(/\s+/g, '-')

interface StageMeta { label: string; className: string; order: number }

const META: Record<string, StageMeta> = {
  'Drawing Pending':      { label: 'Drawing Pending',      order: 1, className: 'bg-rose-100 text-rose-700 border-rose-200' },
  'Pending':              { label: 'Pending',              order: 2, className: 'bg-slate-100 text-slate-700 border-slate-200' },
  'Ready for Cutting':    { label: 'Ready for Cutting',    order: 3, className: 'bg-sky-100 text-sky-700 border-sky-200' },
  'Ready for Scheduling': { label: 'Ready for Scheduling', order: 4, className: 'bg-violet-100 text-violet-700 border-violet-200' },
  'In Production':        { label: 'In Production',        order: 5, className: 'bg-amber-100 text-amber-800 border-amber-200' },
  'Pending QC':           { label: 'Pending QC',           order: 6, className: 'bg-orange-100 text-orange-700 border-orange-200' },
  'Ready to Dispatch':    { label: 'Ready to Dispatch',    order: 7, className: 'bg-green-100 text-green-700 border-green-200' },
  'Dispatched':           { label: 'Dispatched',           order: 8, className: 'bg-emerald-600 text-white border-emerald-600' },
  // legacy label (kept so old data still renders) + exception states
  'Planning Done':        { label: 'Ready for Cutting',    order: 3, className: 'bg-sky-100 text-sky-700 border-sky-200' },
  'On Hold':              { label: 'On Hold',              order: 0, className: 'bg-orange-100 text-orange-700 border-orange-200' },
  'Cancelled':            { label: 'Cancelled',            order: 0, className: 'bg-zinc-200 text-zinc-600 border-zinc-300' },
  'Rejected':             { label: 'Rejected',             order: 0, className: 'bg-red-100 text-red-700 border-red-200' },
}

export function stageMeta(stage?: string | null): StageMeta {
  if (stage && META[stage]) return META[stage]
  return { label: stage || '—', className: 'bg-slate-100 text-slate-600 border-slate-200', order: 0 }
}
