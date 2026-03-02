"use client"

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { purchaseOrderService, PurchaseOrderResponse } from '@/lib/api/purchase-orders'
import { purchaseRequestService, PurchaseRequestResponse } from '@/lib/api/purchase-requests'
import { format } from 'date-fns'

export default function PrintPurchaseOrderPage() {
  const { id } = useParams<{ id: string }>()
  const [po, setPO] = useState<PurchaseOrderResponse | null>(null)
  const [pr, setPR] = useState<PurchaseRequestResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    purchaseOrderService.getById(parseInt(id))
      .then(async (poData) => {
        setPO(poData)
        if (poData.purchaseRequestId) {
          purchaseRequestService.getById(poData.purchaseRequestId)
            .then(setPR)
            .catch(() => {})
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const getCuttingList = (prItemId?: number | null) => {
    if (!pr || !prItemId) return []
    return pr.items.find(i => i.id === prItemId)?.cuttingList || []
  }

  if (loading) return <div style={{ padding: 32, textAlign: 'center', fontFamily: 'Arial' }}>Loading...</div>
  if (!po) return <div style={{ padding: 32, textAlign: 'center', fontFamily: 'Arial' }}>PO not found</div>

  const totalAmount = po.items.reduce((sum, item) => sum + (item.totalCost ?? 0), 0)
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', background: '#fff' }}>

      {/* Controls — hidden when printing */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }} className="print:hidden">
        <button
          onClick={() => window.print()}
          style={{ background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 5, padding: '7px 18px', cursor: 'pointer', fontSize: 13, fontFamily: 'Arial' }}
        >
          🖨 Print
        </button>
        <button
          onClick={() => window.history.back()}
          style={{ background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: 5, padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontFamily: 'Arial' }}
        >
          ← Back
        </button>
      </div>

      {/* Document */}
      <div style={{ padding: '28px 36px', maxWidth: '210mm', margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #000', paddingBottom: 12, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 'bold', letterSpacing: 1 }}>PURCHASE ORDER</div>
            <div style={{ fontSize: 11, color: '#555', marginTop: 3 }}>MultiHitech Engineering Solutions</div>
            <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ background: '#e8ecf8', border: '1px solid #c5d0f5', borderRadius: 3, padding: '1px 8px', fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold' }}>{po.poNumber}</span>
              <span style={{ background: po.status === 'Sent' ? '#d1fae5' : po.status === 'Cancelled' ? '#fee2e2' : '#f3f4f6', border: `1px solid ${po.status === 'Sent' ? '#6ee7b7' : po.status === 'Cancelled' ? '#fca5a5' : '#d1d5db'}`, borderRadius: 3, padding: '1px 8px', fontSize: 10 }}>
                {po.status}
              </span>
              {po.prNumber && (
                <span style={{ background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: 3, padding: '1px 8px', fontSize: 10 }}>
                  Ref: {po.prNumber}
                </span>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 11, color: '#444' }}>
            <div>Date: <strong>{today}</strong></div>
            <div style={{ marginTop: 3 }}>PO Date: <strong>{format(new Date(po.createdAt), 'dd MMM yyyy')}</strong></div>
            {po.expectedDeliveryDate && (
              <div style={{ marginTop: 3 }}>Expected Delivery: <strong>{format(new Date(po.expectedDeliveryDate), 'dd MMM yyyy')}</strong></div>
            )}
            {po.createdBy && <div style={{ marginTop: 3 }}>Prepared By: <strong>{po.createdBy}</strong></div>}
          </div>
        </div>

        {/* ── Vendor & Bill To ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 16 }}>
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 4, padding: '8px 12px' }}>
            <div style={{ fontSize: 10, fontWeight: 'bold', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>Vendor / Supplier</div>
            <div style={{ fontWeight: 'bold', fontSize: 13 }}>{po.vendorName}</div>
            <div style={{ color: '#666', fontSize: 11, marginTop: 2, fontFamily: 'monospace' }}>{po.vendorCode}</div>
          </div>
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 4, padding: '8px 12px' }}>
            <div style={{ fontSize: 10, fontWeight: 'bold', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 }}>Bill To</div>
            <div style={{ fontWeight: 'bold', fontSize: 13 }}>MultiHitech Engineering Solutions</div>
            <div style={{ color: '#666', fontSize: 11, marginTop: 2 }}>Pune, Maharashtra</div>
          </div>
        </div>

        {/* ── Notes ── */}
        {po.notes && (
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 4, padding: '6px 10px', marginBottom: 14, fontSize: 11, color: '#444' }}>
            <strong>Notes:</strong> {po.notes}
          </div>
        )}

        {/* ── Items table ── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#ececec' }}>
              <th style={{ border: '1px solid #bbb', padding: '6px 8px', textAlign: 'left', width: 30 }}>#</th>
              <th style={{ border: '1px solid #bbb', padding: '6px 8px', textAlign: 'left' }}>Item Description</th>
              <th style={{ border: '1px solid #bbb', padding: '6px 8px', textAlign: 'left', width: 90 }}>Code</th>
              <th style={{ border: '1px solid #bbb', padding: '6px 8px', textAlign: 'left', width: 55 }}>Type</th>
              <th style={{ border: '1px solid #bbb', padding: '6px 8px', textAlign: 'right', width: 80 }}>Qty</th>
              <th style={{ border: '1px solid #bbb', padding: '6px 8px', textAlign: 'right', width: 90 }}>Unit Cost (₹)</th>
              <th style={{ border: '1px solid #bbb', padding: '6px 8px', textAlign: 'right', width: 90 }}>Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            {po.items.map((item, idx) => {
              const cuttingList = getCuttingList(item.purchaseRequestItemId)
              const prItem = pr?.items.find(i => i.id === item.purchaseRequestItemId)
              const wPerMm = prItem?.materialWeightKgPerMm ?? null
              const totalMM = cuttingList.length > 0 ? cuttingList.reduce((s, r) => s + r.totalLengthMeter, 0) * 1000 : 0
              const totalKg = cuttingList.length > 0 && wPerMm != null ? totalMM * wPerMm : null

              return (
                <React.Fragment key={item.id}>
                  <tr style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'center', color: '#777' }}>{idx + 1}</td>
                    <td style={{ border: '1px solid #ddd', padding: '6px 8px', fontWeight: 'bold' }}>{item.itemName}</td>
                    <td style={{ border: '1px solid #ddd', padding: '6px 8px', fontFamily: 'monospace', fontSize: 11, color: '#555' }}>{item.itemCode || '—'}</td>
                    <td style={{ border: '1px solid #ddd', padding: '6px 8px', fontSize: 10, color: '#666' }}>
                      {item.itemType === 'RawMaterial' ? 'RM' : 'Comp'}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>{item.orderedQty} {item.unit}</td>
                    <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right' }}>
                      {item.unitCost != null ? `₹${item.unitCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                    </td>
                    <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>
                      {item.totalCost != null ? `₹${item.totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                    </td>
                  </tr>

                  {/* Cutting list sub-row */}
                  {cuttingList.length > 0 && (
                    <tr>
                      <td style={{ border: '1px solid #ddd' }} />
                      <td colSpan={6} style={{ border: '1px solid #ddd', padding: '6px 10px', background: '#eff6ff' }}>
                        <div style={{ fontSize: 11, fontWeight: 'bold', color: '#1d4ed8', marginBottom: 4 }}>
                          Cutting Specification — Total: {totalMM.toFixed(0)}mm
                          {totalKg != null && <span style={{ marginLeft: 10, color: '#1e40af' }}>| {totalKg.toFixed(3)} kg</span>}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
                          {cuttingList.map(row => {
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
          {totalAmount > 0 && (
            <tfoot>
              <tr style={{ background: '#ececec', fontWeight: 'bold' }}>
                <td colSpan={6} style={{ border: '1px solid #bbb', padding: '7px 8px', textAlign: 'right', fontSize: 13 }}>
                  Grand Total
                </td>
                <td style={{ border: '1px solid #bbb', padding: '7px 8px', textAlign: 'right', fontSize: 13 }}>
                  ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          )}
        </table>

        {/* ── Terms (optional placeholder) ── */}
        <div style={{ marginTop: 16, fontSize: 10, color: '#888', border: '1px solid #e5e7eb', borderRadius: 4, padding: '6px 10px' }}>
          <strong>Terms & Conditions:</strong> Payment as per agreed terms. Delivery as per schedule mentioned above. All goods subject to inspection on receipt.
        </div>

        {/* ── Signatures ── */}
        <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 48 }}>
          {['Prepared By', 'Approved By', 'Vendor Acknowledgement'].map(label => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ borderBottom: '1px solid #000', paddingBottom: 36, marginBottom: 6 }} />
              <div style={{ fontSize: 10, color: '#666' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* ── Footer ── */}
        <div style={{ marginTop: 24, paddingTop: 10, borderTop: '1px solid #ddd', textAlign: 'center', fontSize: 10, color: '#999' }}>
          Computer-generated Purchase Order · {po.poNumber} · {today}
        </div>
      </div>

      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          @page { size: A4; margin: 0.8cm; }
          body { margin: 0; background: white; }
        }
      `}</style>
    </div>
  )
}
