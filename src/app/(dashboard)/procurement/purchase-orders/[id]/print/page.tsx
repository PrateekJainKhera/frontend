"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
        // Load PR cutting list data if PO came from a PR
        if (poData.purchaseRequestId) {
          purchaseRequestService.getById(poData.purchaseRequestId)
            .then(setPR)
            .catch(() => {})
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  // Helper: get cutting list for a PO item via PRItemId
  const getCuttingList = (prItemId?: number | null) => {
    if (!pr || !prItemId) return []
    const prItem = pr.items.find(i => i.id === prItemId)
    return prItem?.cuttingList || []
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>
  if (!po) return <div className="p-8 text-center">PO not found</div>

  const totalAmount = po.items.reduce((sum, item) => sum + (item.totalCost ?? 0), 0)

  return (
    <>
      {/* Print controls - hidden when printing */}
      <div className="print:hidden flex gap-3 items-center p-4 border-b bg-white">
        <Button onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/procurement/purchase-orders/${id}`}>← Back to PO</Link>
        </Button>
      </div>

      {/* Printable document */}
      <div className="print-document bg-white p-10 max-w-4xl mx-auto font-sans text-sm text-gray-900">

        {/* Header */}
        <div className="flex justify-between items-start mb-8 border-b pb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">MultiHitech</h1>
            <p className="text-gray-500 text-xs mt-1">Engineering Solutions</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold uppercase tracking-wide text-gray-700">Purchase Order</h2>
            <p className="text-lg font-semibold text-gray-900 mt-1">{po.poNumber}</p>
            <p className="text-xs text-gray-500 mt-1">
              Date: {format(new Date(po.createdAt), 'dd MMMM yyyy')}
            </p>
            {po.prNumber && (
              <p className="text-xs text-gray-500">Ref PR: {po.prNumber}</p>
            )}
          </div>
        </div>

        {/* Vendor & Delivery Info */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-400 mb-2 tracking-wider">Vendor</p>
            <p className="font-semibold text-base">{po.vendorName}</p>
            <p className="text-gray-500 text-xs">{po.vendorCode}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-400 mb-2 tracking-wider">Bill To</p>
            <p className="font-semibold">MultiHitech</p>
            {po.expectedDeliveryDate && (
              <p className="text-gray-500 text-xs mt-1">
                Expected Delivery: {format(new Date(po.expectedDeliveryDate), 'dd MMMM yyyy')}
              </p>
            )}
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full border-collapse mb-8">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-left text-xs font-semibold uppercase">#</th>
              <th className="border border-gray-300 p-2 text-left text-xs font-semibold uppercase">Item Description</th>
              <th className="border border-gray-300 p-2 text-left text-xs font-semibold uppercase">Code</th>
              <th className="border border-gray-300 p-2 text-right text-xs font-semibold uppercase">Qty</th>
              <th className="border border-gray-300 p-2 text-right text-xs font-semibold uppercase">Unit Cost (₹)</th>
              <th className="border border-gray-300 p-2 text-right text-xs font-semibold uppercase">Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            {po.items.map((item, index) => {
              const cuttingList = getCuttingList(item.purchaseRequestItemId)
              return (
                <>
                  <tr key={item.id} className="even:bg-gray-50">
                    <td className="border border-gray-300 p-2 text-center">{index + 1}</td>
                    <td className="border border-gray-300 p-2">{item.itemName}</td>
                    <td className="border border-gray-300 p-2 text-gray-500">{item.itemCode || '—'}</td>
                    <td className="border border-gray-300 p-2 text-right">{item.orderedQty} {item.unit}</td>
                    <td className="border border-gray-300 p-2 text-right">
                      {item.unitCost != null ? item.unitCost.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—'}
                    </td>
                    <td className="border border-gray-300 p-2 text-right font-medium">
                      {item.totalCost != null ? item.totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—'}
                    </td>
                  </tr>
                  {/* Cutting list sub-row for raw material items */}
                  {cuttingList.length > 0 && (() => {
                    const prItem = pr?.items.find(i => i.id === item.purchaseRequestItemId)
                    const wPerMm = prItem?.materialWeightKgPerMm ?? null
                    const totalMM = cuttingList.reduce((s, r) => s + r.totalLengthMeter, 0) * 1000
                    const totalKg = wPerMm != null ? totalMM * wPerMm : null
                    return (
                      <tr key={`cl-${item.id}`}>
                        <td></td>
                        <td colSpan={5} className="border border-gray-300 px-3 pb-2 bg-blue-50">
                          <p className="text-xs font-semibold text-blue-700 mt-1 mb-1">
                            Cutting Specification — Total: {totalMM.toFixed(0)}mm
                            {totalKg != null && <span className="ml-2">| {totalKg.toFixed(3)}kg</span>}
                          </p>
                          <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                            {cuttingList.map((row) => {
                              const rowMM = row.totalLengthMeter * 1000
                              const rowKg = wPerMm != null ? rowMM * wPerMm : null
                              return (
                                <span key={row.id} className="text-xs text-blue-800">
                                  {(row.lengthMeter * 1000).toFixed(0)}mm × {row.pieces} pcs = {rowMM.toFixed(0)}mm
                                  {rowKg != null && <span className="text-blue-600 ml-1">({rowKg.toFixed(3)}kg)</span>}
                                </span>
                              )
                            })}
                          </div>
                        </td>
                      </tr>
                    )
                  })()}
                </>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-bold">
              <td colSpan={5} className="border border-gray-300 p-2 text-right">Grand Total</td>
              <td className="border border-gray-300 p-2 text-right">
                ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Notes */}
        {po.notes && (
          <div className="mb-8 p-3 bg-gray-50 border border-gray-200 rounded">
            <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Notes</p>
            <p className="text-sm">{po.notes}</p>
          </div>
        )}

        {/* Signatures */}
        <div className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t">
          <div className="text-center">
            <div className="border-b border-gray-400 mb-2 h-10"></div>
            <p className="text-xs text-gray-500">Prepared By</p>
          </div>
          <div className="text-center">
            <div className="border-b border-gray-400 mb-2 h-10"></div>
            <p className="text-xs text-gray-500">Approved By</p>
          </div>
          <div className="text-center">
            <div className="border-b border-gray-400 mb-2 h-10"></div>
            <p className="text-xs text-gray-500">Vendor Acknowledgement</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t text-center text-xs text-gray-400">
          <p>This is a computer-generated Purchase Order.</p>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { margin: 0; }
          .print-document { padding: 1.5cm; max-width: 100%; }
          @page { size: A4; margin: 1cm; }
        }
      `}</style>
    </>
  )
}
