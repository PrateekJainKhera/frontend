"use client"

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { purchaseRequestService, PurchaseRequestResponse } from '@/lib/api/purchase-requests'
import { format } from 'date-fns'

export default function PrintPurchaseRequestPage() {
  const { id } = useParams<{ id: string }>()
  const [pr, setPR] = useState<PurchaseRequestResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    purchaseRequestService.getById(parseInt(id))
      .then(setPR)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div style={{ padding: 32, textAlign: 'center' }}>Loading...</div>
  if (!pr) return <div style={{ padding: 32, textAlign: 'center' }}>PR not found</div>

  const isRM = pr.itemType === 'RawMaterial'
  const hasApproved = pr.items.some(i => i.approvedQty != null)
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <>
      {/* Controls — hidden on print */}
      <div className="print:hidden" style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #e5e7eb', background: '#fff' }}>
        <Button onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/procurement/purchase-requests/${id}`}>← Back to PR</Link>
        </Button>
      </div>

      {/* Print area */}
      <div id="pr-print-area" style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', background: '#fff' }}>
        <div style={{ padding: '28px 32px', maxWidth: '210mm', margin: '0 auto' }}>

          {/* ── Header ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #000', paddingBottom: 12, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 'bold', letterSpacing: 1 }}>PURCHASE REQUEST</div>
              <div style={{ fontSize: 11, color: '#555', marginTop: 3 }}>MultiHitech Engineering Solutions</div>
              <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ background: '#e8ecf8', border: '1px solid #c5d0f5', borderRadius: 3, padding: '1px 8px', fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold' }}>{pr.prNumber}</span>
                <span style={{ background: isRM ? '#fef3c7' : '#ede9fe', border: `1px solid ${isRM ? '#fbbf24' : '#c4b5fd'}`, borderRadius: 3, padding: '1px 8px', fontSize: 10 }}>
                  {isRM ? 'Raw Material' : 'Component'}
                </span>
                <span style={{ background: pr.status === 'Approved' || pr.status === 'POGenerated' ? '#d1fae5' : '#f3f4f6', border: `1px solid ${pr.status === 'Approved' || pr.status === 'POGenerated' ? '#6ee7b7' : '#d1d5db'}`, borderRadius: 3, padding: '1px 8px', fontSize: 10 }}>
                  {pr.status}
                </span>
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 11, color: '#444' }}>
              <div>Date: <strong>{today}</strong></div>
              <div style={{ marginTop: 3 }}>Request Date: <strong>{format(new Date(pr.requestDate), 'dd MMM yyyy')}</strong></div>
              <div style={{ marginTop: 3 }}>Requested By: <strong>{pr.requestedBy}</strong></div>
              {pr.approvedBy && <div style={{ marginTop: 3 }}>Approved By: <strong>{pr.approvedBy}</strong></div>}
            </div>
          </div>

          {/* ── Notes ── */}
          {pr.notes && (
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 4, padding: '6px 10px', marginBottom: 14, fontSize: 11, color: '#444' }}>
              <strong>Notes:</strong> {pr.notes}
            </div>
          )}

          {/* ── Items table ── */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#ececec' }}>
                <th style={{ border: '1px solid #bbb', padding: '6px 8px', textAlign: 'left', width: 30 }}>#</th>
                <th style={{ border: '1px solid #bbb', padding: '6px 8px', textAlign: 'left' }}>Item Description</th>
                <th style={{ border: '1px solid #bbb', padding: '6px 8px', textAlign: 'left', width: 90 }}>Code</th>
                <th style={{ border: '1px solid #bbb', padding: '6px 8px', textAlign: 'right', width: 90 }}>Req. Qty</th>
                {hasApproved && <th style={{ border: '1px solid #bbb', padding: '6px 8px', textAlign: 'right', width: 90 }}>Appr. Qty</th>}
                <th style={{ border: '1px solid #bbb', padding: '6px 8px', textAlign: 'left', width: 110 }}>Vendor</th>
                <th style={{ border: '1px solid #bbb', padding: '6px 8px', textAlign: 'center', width: 80 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {pr.items.map((item, idx) => {
                const hasCL = isRM && item.cuttingList?.length > 0
                const wPerMm = item.materialWeightKgPerMm ?? null
                const totalMM = hasCL ? item.cuttingList.reduce((s, r) => s + r.totalLengthMeter, 0) * 1000 : 0
                const totalKg = hasCL && wPerMm != null ? totalMM * wPerMm : null

                return (
                  <React.Fragment key={item.id}>
                    <tr style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'center', color: '#777' }}>{idx + 1}</td>
                      <td style={{ border: '1px solid #ddd', padding: '6px 8px', fontWeight: 'bold' }}>{item.itemName}</td>
                      <td style={{ border: '1px solid #ddd', padding: '6px 8px', fontFamily: 'monospace', fontSize: 11, color: '#555' }}>{item.itemCode || '—'}</td>
                      <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>{item.requestedQty} {item.unit}</td>
                      {hasApproved && (
                        <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
                          {item.approvedQty != null ? `${item.approvedQty} ${item.unit}` : '—'}
                        </td>
                      )}
                      <td style={{ border: '1px solid #ddd', padding: '6px 8px', color: '#444' }}>{item.vendorName || '—'}</td>
                      <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'center' }}>
                        <span style={{
                          fontSize: 10, fontWeight: 'bold', padding: '2px 6px', borderRadius: 3,
                          background: item.status === 'Approved' ? '#d1fae5' : item.status === 'Rejected' ? '#fee2e2' : '#f3f4f6',
                          color: item.status === 'Approved' ? '#065f46' : item.status === 'Rejected' ? '#991b1b' : '#374151',
                        }}>{item.status}</span>
                      </td>
                    </tr>

                    {/* Cutting list sub-row */}
                    {hasCL && (
                      <tr>
                        <td style={{ border: '1px solid #ddd' }} />
                        <td colSpan={hasApproved ? 6 : 5} style={{ border: '1px solid #ddd', padding: '6px 10px', background: '#eff6ff' }}>
                          <div style={{ fontSize: 11, fontWeight: 'bold', color: '#1d4ed8', marginBottom: 4 }}>
                            Cutting Specification — Total: {totalMM.toFixed(0)}mm
                            {totalKg != null && <span style={{ marginLeft: 10, color: '#1e40af' }}>| {totalKg.toFixed(3)} kg</span>}
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
                            {item.cuttingList.map(row => {
                              const rowMM = row.totalLengthMeter * 1000
                              const rowKg = wPerMm != null ? rowMM * wPerMm : null
                              return (
                                <span key={row.id} style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 'bold', color: '#1e3a8a' }}>
                                  {(row.lengthMeter * 1000).toFixed(0)}mm × {row.pieces}pcs = {rowMM.toFixed(0)}mm
                                  {rowKg != null && <span style={{ fontWeight: 'normal', color: '#3b82f6', marginLeft: 4 }}>({rowKg.toFixed(3)}kg)</span>}
                                  {row.notes && <span style={{ fontWeight: 'normal', color: '#93c5fd', marginLeft: 4 }}>· {row.notes}</span>}
                                </span>
                              )
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>

          {/* ── Signatures ── */}
          <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 48 }}>
            {['Requested By', 'Reviewed By', 'Approved By'].map(label => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ borderBottom: '1px solid #000', paddingBottom: 36, marginBottom: 6 }} />
                <div style={{ fontSize: 10, color: '#666' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* ── Footer ── */}
          <div style={{ marginTop: 24, paddingTop: 10, borderTop: '1px solid #ddd', textAlign: 'center', fontSize: 10, color: '#999' }}>
            Computer-generated Purchase Request · {pr.prNumber} · {today}
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #pr-print-area, #pr-print-area * { visibility: visible; }
          #pr-print-area { position: absolute; top: 0; left: 0; width: 100%; }
          @page { size: A4; margin: 0.8cm; }
          body { margin: 0; background: white; }
        }
      `}</style>
    </>
  )
}
