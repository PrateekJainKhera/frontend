"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle, XCircle, Plus, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { purchaseRequestService, PurchaseRequestResponse, ApproveItemRequest } from '@/lib/api/purchase-requests'
import { vendorService, VendorResponse } from '@/lib/api/vendors'
import { CreateVendorDialog } from '@/components/dialogs/create-vendor-dialog'
import { toast } from 'sonner'
import { format } from 'date-fns'

const STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-700',
  Submitted: 'bg-blue-100 text-blue-700',
  UnderApproval: 'bg-yellow-100 text-yellow-700',
  Approved: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
  POGenerated: 'bg-purple-100 text-purple-700',
  Pending: 'bg-gray-100 text-gray-600',
}

interface ItemApprovalState {
  itemId: number
  status: string
  approvedQty: number
  vendorId: number | null
  estimatedUnitCost: number | null
  notes: string
}

export default function PurchaseRequestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const prId = parseInt(id)

  const [pr, setPR] = useState<PurchaseRequestResponse | null>(null)
  const [vendors, setVendors] = useState<VendorResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [approvalStates, setApprovalStates] = useState<Record<number, ItemApprovalState>>({})
  const [rejectionReason, setRejectionReason] = useState('')
  const [generatedPOs, setGeneratedPOs] = useState<any[]>([])
  const [createVendorOpen, setCreateVendorOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [prId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [prData, vendorData] = await Promise.all([
        purchaseRequestService.getById(prId),
        vendorService.getActive(),
      ])
      setPR(prData)
      setVendors(vendorData)
      const states: Record<number, ItemApprovalState> = {}
      prData.items.forEach(item => {
        states[item.id] = {
          itemId: item.id,
          status: item.status === 'Pending' ? 'Approved' : item.status,
          approvedQty: item.approvedQty ?? item.requestedQty,
          vendorId: item.vendorId ?? null,
          estimatedUnitCost: item.estimatedUnitCost ?? null,
          notes: item.notes ?? '',
        }
      })
      setApprovalStates(states)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load PR')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    setActionLoading(true)
    try {
      await purchaseRequestService.submit(prId)
      toast.success('PR submitted for approval')
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit')
    } finally {
      setActionLoading(false)
    }
  }

  const handleStartReview = async () => {
    setActionLoading(true)
    try {
      await purchaseRequestService.startReview(prId)
      toast.success('PR moved to Under Approval')
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start review')
    } finally {
      setActionLoading(false)
    }
  }

  const handleApprove = async () => {
    setActionLoading(true)
    try {
      const items: ApproveItemRequest[] = Object.values(approvalStates).map(s => ({
        itemId: s.itemId,
        status: s.status,
        approvedQty: s.status === 'Approved' ? s.approvedQty : null,
        vendorId: s.status === 'Approved' ? s.vendorId : null,
        estimatedUnitCost: s.estimatedUnitCost,
        notes: s.notes || null,
      }))

      const approvedWithVendor = items.filter(i => i.status === 'Approved')
      const missingVendor = approvedWithVendor.find(i => !i.vendorId)
      if (missingVendor) {
        const itemName = pr?.items.find(i => i.id === missingVendor.itemId)?.itemName
        toast.error(`Please assign a vendor for: ${itemName}`)
        setActionLoading(false)
        return
      }

      const pos = await purchaseRequestService.approve(prId, { items })
      setGeneratedPOs(pos)
      toast.success(`PR approved! ${pos.length} PO(s) generated.`)
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to approve')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) { toast.error('Please enter a rejection reason'); return }
    setActionLoading(true)
    try {
      await purchaseRequestService.reject(prId, rejectionReason)
      toast.success('PR rejected')
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reject')
    } finally {
      setActionLoading(false)
    }
  }

  const setAllStatus = (status: string) => {
    setApprovalStates(prev => {
      const updated = { ...prev }
      Object.keys(updated).forEach(key => {
        updated[parseInt(key)].status = status
      })
      return updated
    })
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>
  if (!pr) return <div className="p-8 text-center text-muted-foreground">PR not found</div>

  const canSubmit = pr.status === 'Draft'
  const canStartReview = pr.status === 'Submitted'
  const canApprove = pr.status === 'UnderApproval' || pr.status === 'Submitted'
  const canReject = pr.status === 'Submitted' || pr.status === 'UnderApproval'
  const isApprovalMode = canApprove

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold">{pr.prNumber}</h1>
            <Badge className={STATUS_COLORS[pr.status] || 'bg-gray-100 text-gray-700'}>{pr.status}</Badge>
            <Badge variant="outline">{pr.itemType === 'RawMaterial' ? 'Raw Material' : 'Component'}</Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            Requested by {pr.requestedBy} on {format(new Date(pr.createdAt), 'dd MMM yyyy')}
          </p>
        </div>
        <Button variant="outline" asChild className="self-start">
          <Link href="/procurement/purchase-requests">← Back</Link>
        </Button>
      </div>

      {/* PR Notes */}
      {pr.notes && (
        <Card className="border-2 border-border">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-muted-foreground mb-1">Notes</p>
            <p className="text-sm">{pr.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Rejection info */}
      {pr.status === 'Rejected' && pr.rejectionReason && (
        <Card className="border-2 border-red-300 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-red-700 mb-1">Rejection Reason</p>
            <p className="text-sm text-red-600">{pr.rejectionReason}</p>
          </CardContent>
        </Card>
      )}

      {/* Generated POs */}
      {(pr.status === 'POGenerated' || generatedPOs.length > 0) && (
        <Card className="border-2 border-green-400 bg-green-50 dark:bg-green-950/20">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-green-700 mb-2">Purchase Orders Generated</p>
            <div className="flex flex-wrap gap-2">
              {generatedPOs.map((po: any) => (
                <Button key={po.id} variant="outline" size="sm" asChild className="border-green-400">
                  <Link href={`/procurement/purchase-orders/${po.id}`}>
                    {po.poNumber} — {po.vendorName}
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              ))}
              {generatedPOs.length === 0 && pr.status === 'POGenerated' && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/procurement/purchase-orders?prId=${pr.id}`}>View POs →</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approval quick actions */}
      {isApprovalMode && (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setAllStatus('Approved')}>
            <CheckCircle className="mr-1 h-4 w-4 text-green-600" /> Approve All
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAllStatus('Rejected')}>
            <XCircle className="mr-1 h-4 w-4 text-red-500" /> Reject All
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCreateVendorOpen(true)}>
            <Plus className="mr-1 h-4 w-4" /> Add Vendor
          </Button>
        </div>
      )}

      {/* Items */}
      <Card className="border-2 border-border">
        <CardHeader>
          <CardTitle>Items ({pr.items.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">

          {/* ── MOBILE: card per item ── */}
          <div className="block lg:hidden divide-y">
            {pr.items.map((item) => {
              const state = approvalStates[item.id]
              return (
                <div key={item.id} className="p-4 space-y-3">
                  {/* Item name */}
                  <div>
                    <p className="font-medium text-sm">{item.itemName}</p>
                    {item.itemCode && <p className="text-xs text-muted-foreground">{item.itemCode}</p>}
                    <p className="text-sm mt-1">
                      <span className="text-muted-foreground">Requested: </span>
                      <span className="font-medium">{item.requestedQty} {item.unit}</span>
                    </p>
                  </div>

                  {/* Cutting list */}
                  {item.itemType === 'RawMaterial' && item.cuttingList && item.cuttingList.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-2">
                      <p className="text-xs font-semibold text-blue-700 mb-1">
                        Cutting List — Total: {item.cuttingList.reduce((s, r) => s + r.totalLengthMeter, 0).toFixed(3)}m
                      </p>
                      <div className="space-y-0.5">
                        {item.cuttingList.map((row) => (
                          <p key={row.id} className="text-xs text-blue-800">
                            {row.lengthMeter}m × {row.pieces} pcs = {row.totalLengthMeter.toFixed(3)}m
                            {row.notes && <span className="text-blue-500 ml-1">({row.notes})</span>}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Approval form on mobile */}
                  {isApprovalMode && state ? (
                    <div className="space-y-3 pt-1">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Approved Qty</label>
                          <Input
                            type="number"
                            value={state.approvedQty}
                            onChange={(e) => setApprovalStates(prev => ({
                              ...prev,
                              [item.id]: { ...prev[item.id], approvedQty: parseFloat(e.target.value) || 0 }
                            }))}
                            disabled={state.status === 'Rejected'}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Unit Cost (₹)</label>
                          <Input
                            type="number"
                            value={state.estimatedUnitCost || ''}
                            onChange={(e) => setApprovalStates(prev => ({
                              ...prev,
                              [item.id]: { ...prev[item.id], estimatedUnitCost: parseFloat(e.target.value) || null }
                            }))}
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Vendor *</label>
                        <Select
                          value={state.vendorId?.toString() || ''}
                          onValueChange={(v) => setApprovalStates(prev => ({
                            ...prev,
                            [item.id]: { ...prev[item.id], vendorId: v ? parseInt(v) : null }
                          }))}
                          disabled={state.status === 'Rejected'}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select vendor" />
                          </SelectTrigger>
                          <SelectContent>
                            {vendors.map(v => (
                              <SelectItem key={v.id} value={v.id.toString()}>{v.vendorName}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Decision</label>
                        <Select
                          value={state.status}
                          onValueChange={(v) => setApprovalStates(prev => ({
                            ...prev,
                            [item.id]: { ...prev[item.id], status: v }
                          }))}
                        >
                          <SelectTrigger className={`w-full ${state.status === 'Approved' ? 'border-green-500 text-green-700' : 'border-red-400 text-red-600'}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Approved">Approve</SelectItem>
                            <SelectItem value="Rejected">Reject</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ) : (
                    /* Read-only view on mobile */
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      <span className="text-muted-foreground">
                        Approved: <span className="text-foreground font-medium">
                          {item.approvedQty != null ? `${item.approvedQty} ${item.unit}` : '—'}
                        </span>
                      </span>
                      <span className="text-muted-foreground">
                        Vendor: <span className="text-foreground font-medium">{item.vendorName || '—'}</span>
                      </span>
                      <Badge className={STATUS_COLORS[item.status] || 'bg-gray-100 text-gray-700'}>
                        {item.status}
                      </Badge>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* ── DESKTOP: table ── */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted border-b">
                  <th className="text-left p-3 font-semibold">Item</th>
                  <th className="text-left p-3 font-semibold">Req. Qty</th>
                  {isApprovalMode && <>
                    <th className="text-left p-3 font-semibold">Approved Qty</th>
                    <th className="text-left p-3 font-semibold">Vendor *</th>
                    <th className="text-left p-3 font-semibold">Unit Cost</th>
                    <th className="text-left p-3 font-semibold">Decision</th>
                  </>}
                  {!isApprovalMode && <>
                    <th className="text-left p-3 font-semibold">Approved Qty</th>
                    <th className="text-left p-3 font-semibold">Vendor</th>
                    <th className="text-left p-3 font-semibold">Status</th>
                  </>}
                </tr>
              </thead>
              <tbody>
                {pr.items.map((item) => {
                  const state = approvalStates[item.id]
                  return (
                    <tr key={item.id} className="border-b">
                      <td className="p-3">
                        <p className="font-medium">{item.itemName}</p>
                        {item.itemCode && <p className="text-xs text-muted-foreground">{item.itemCode}</p>}
                        {item.itemType === 'RawMaterial' && item.cuttingList && item.cuttingList.length > 0 && (
                          <div className="mt-2 bg-blue-50 border border-blue-200 rounded p-2">
                            <p className="text-xs font-semibold text-blue-700 mb-1">
                              Cutting List — Total: {item.cuttingList.reduce((s, r) => s + r.totalLengthMeter, 0).toFixed(3)}m
                            </p>
                            <div className="space-y-0.5">
                              {item.cuttingList.map((row) => (
                                <p key={row.id} className="text-xs text-blue-800">
                                  {row.lengthMeter}m × {row.pieces} pcs = {row.totalLengthMeter.toFixed(3)}m
                                  {row.notes && <span className="text-blue-500 ml-1">({row.notes})</span>}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="p-3">{item.requestedQty} {item.unit}</td>

                      {isApprovalMode && state ? <>
                        <td className="p-3">
                          <Input
                            type="number"
                            value={state.approvedQty}
                            onChange={(e) => setApprovalStates(prev => ({
                              ...prev,
                              [item.id]: { ...prev[item.id], approvedQty: parseFloat(e.target.value) || 0 }
                            }))}
                            className="w-24"
                            disabled={state.status === 'Rejected'}
                          />
                        </td>
                        <td className="p-3">
                          <Select
                            value={state.vendorId?.toString() || ''}
                            onValueChange={(v) => setApprovalStates(prev => ({
                              ...prev,
                              [item.id]: { ...prev[item.id], vendorId: v ? parseInt(v) : null }
                            }))}
                            disabled={state.status === 'Rejected'}
                          >
                            <SelectTrigger className="w-44">
                              <SelectValue placeholder="Select vendor" />
                            </SelectTrigger>
                            <SelectContent>
                              {vendors.map(v => (
                                <SelectItem key={v.id} value={v.id.toString()}>{v.vendorName}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            value={state.estimatedUnitCost || ''}
                            onChange={(e) => setApprovalStates(prev => ({
                              ...prev,
                              [item.id]: { ...prev[item.id], estimatedUnitCost: parseFloat(e.target.value) || null }
                            }))}
                            placeholder="0.00"
                            className="w-28"
                          />
                        </td>
                        <td className="p-3">
                          <Select
                            value={state.status}
                            onValueChange={(v) => setApprovalStates(prev => ({
                              ...prev,
                              [item.id]: { ...prev[item.id], status: v }
                            }))}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Approved">Approve</SelectItem>
                              <SelectItem value="Rejected">Reject</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                      </> : <>
                        <td className="p-3">{item.approvedQty != null ? `${item.approvedQty} ${item.unit}` : '—'}</td>
                        <td className="p-3">{item.vendorName || '—'}</td>
                        <td className="p-3">
                          <Badge className={STATUS_COLORS[item.status] || 'bg-gray-100 text-gray-700'}>
                            {item.status}
                          </Badge>
                        </td>
                      </>}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

        </CardContent>
      </Card>

      {/* Rejection Reason Input */}
      {canReject && (
        <Card className="border-2 border-border">
          <CardContent className="p-4">
            <label className="text-sm font-medium block mb-1.5">Rejection Reason (required to reject)</label>
            <Textarea
              placeholder="Explain why the PR is being rejected..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={2}
            />
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-end">
        {canSubmit && (
          <Button onClick={handleSubmit} disabled={actionLoading}>
            {actionLoading ? 'Submitting...' : 'Submit for Approval'}
          </Button>
        )}
        {canStartReview && (
          <Button variant="outline" onClick={handleStartReview} disabled={actionLoading}>
            Start Review
          </Button>
        )}
        {canApprove && (
          <Button onClick={handleApprove} disabled={actionLoading} className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="mr-2 h-4 w-4" />
            {actionLoading ? 'Processing...' : 'Approve & Generate POs'}
          </Button>
        )}
        {canReject && (
          <Button variant="destructive" onClick={handleReject} disabled={actionLoading || !rejectionReason.trim()}>
            <XCircle className="mr-2 h-4 w-4" />
            Reject PR
          </Button>
        )}
      </div>

      <CreateVendorDialog
        open={createVendorOpen}
        onOpenChange={setCreateVendorOpen}
        onSuccess={async () => {
          const updated = await vendorService.getActive()
          setVendors(updated)
        }}
      />
    </div>
  )
}
