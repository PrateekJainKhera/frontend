'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { apiClient as api } from '@/lib/api/axios-config'

// ── Types ──────────────────────────────────────────────────────────────────────

interface PendingRework {
  jobCardId: number
  jobCardNo: string
  orderId: number
  orderNo: string | null
  orderItemId: number | null
  itemSequence: string | null
  childPartName: string | null
  processName: string | null
  quantity: number
  rejectedQty: number
  reworkCreatedAt: string
  reworkCreatedBy: string | null
  requisitionId: number
  requisitionNo: string
  mrCreatedAt: string
  itemCount: number
}

// ── API helpers ────────────────────────────────────────────────────────────────

async function fetchPending(): Promise<PendingRework[]> {
  const res = await api.get('/rework/pending')
  return res.data
}

async function approveRework(jobCardId: number): Promise<void> {
  await api.post(`/rework/${jobCardId}/approve`, { approvedBy: 'Admin' })
}

async function rejectRework(jobCardId: number): Promise<void> {
  await api.post(`/rework/${jobCardId}/reject`, { approvedBy: 'Admin' })
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

const orderLabel = (r: PendingRework) =>
  `${r.orderNo ?? r.orderId}${r.itemSequence ? `-${r.itemSequence}` : ''}`

// ── Confirm Dialog ─────────────────────────────────────────────────────────────

function ConfirmDialog({
  open, onClose, onConfirm, title, description, confirmLabel, variant,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  title: string
  description: string
  confirmLabel: string
  variant: 'approve' | 'reject'
}) {
  const [busy, setBusy] = useState(false)

  const handle = async () => {
    setBusy(true)
    try {
      await onConfirm()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{description}</p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button
            onClick={handle}
            disabled={busy}
            variant={variant === 'reject' ? 'destructive' : 'default'}
          >
            {busy ? 'Processing…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function ReworkApprovalPage() {
  const [rows, setRows] = useState<PendingRework[]>([])
  const [loading, setLoading] = useState(true)

  const [approveTarget, setApproveTarget] = useState<PendingRework | null>(null)
  const [rejectTarget, setRejectTarget] = useState<PendingRework | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setRows(await fetchPending())
    } catch {
      toast.error('Failed to load pending rework requests')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleApprove = async () => {
    if (!approveTarget) return
    await approveRework(approveTarget.jobCardId)
    toast.success(`Rework approved — MR ${approveTarget.requisitionNo} is now in Cutting Planning`)
    setApproveTarget(null)
    load()
  }

  const handleReject = async () => {
    if (!rejectTarget) return
    await rejectRework(rejectTarget.jobCardId)
    toast.success('Rework request rejected')
    setRejectTarget(null)
    load()
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rework Approval</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Approve rework requests before material goes to Cutting Planning
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary */}
      {!loading && rows.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <span className="text-sm text-yellow-800">
            <strong>{rows.length}</strong> rework request{rows.length !== 1 ? 's' : ''} pending admin approval
          </span>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job Card</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Child Part</TableHead>
              <TableHead>Process</TableHead>
              <TableHead>Qty / Rejected</TableHead>
              <TableHead>MR No</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No pending rework approvals
                </TableCell>
              </TableRow>
            ) : rows.map(r => (
              <TableRow key={r.jobCardId}>
                <TableCell className="font-mono text-sm">{r.jobCardNo}</TableCell>
                <TableCell>{orderLabel(r)}</TableCell>
                <TableCell>{r.childPartName ?? '—'}</TableCell>
                <TableCell>{r.processName ?? '—'}</TableCell>
                <TableCell>
                  <span>{r.quantity}</span>
                  {r.rejectedQty > 0 && (
                    <span className="ml-1 text-red-600">/ {r.rejectedQty} rej</span>
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs">{r.requisitionNo}</TableCell>
                <TableCell>{r.itemCount}</TableCell>
                <TableCell className="text-sm">{fmt(r.mrCreatedAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600 border-green-300 hover:bg-green-50"
                      onClick={() => setApproveTarget(r)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                      onClick={() => setRejectTarget(r)}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Approve Confirm Dialog */}
      <ConfirmDialog
        open={approveTarget !== null}
        onClose={() => setApproveTarget(null)}
        onConfirm={handleApprove}
        title="Approve Rework?"
        description={approveTarget
          ? `Approve rework for job card ${approveTarget.jobCardNo} (${approveTarget.childPartName ?? 'child part'})? The material requisition ${approveTarget.requisitionNo} will become visible in Cutting Planning.`
          : ''}
        confirmLabel="Approve"
        variant="approve"
      />

      {/* Reject Confirm Dialog */}
      <ConfirmDialog
        open={rejectTarget !== null}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleReject}
        title="Reject Rework?"
        description={rejectTarget
          ? `Reject the rework request for job card ${rejectTarget.jobCardNo}? The material requisition will be marked as Rejected and will NOT go to Cutting Planning.`
          : ''}
        confirmLabel="Reject"
        variant="reject"
      />
    </div>
  )
}
