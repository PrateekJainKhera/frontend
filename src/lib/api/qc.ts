import { apiClient, ApiResponse } from './axios-config'

export interface QCPendingItem {
  orderItemId: number
  orderId: number
  orderNo: string
  itemSequence: string
  productName: string
  customerName: string
  quantity: number

  // null if no QC submitted yet
  qcRecordId: number | null
  qcStatus: string | null      // null | 'Pending' | 'Passed' | 'Failed'
  certificatePath: string | null
  qcCompletedAt: string | null
  qcCompletedBy: string | null
  notes: string | null
}

export interface OrderItemQCResponse {
  id: number
  orderItemId: number
  orderId: number
  qcStatus: string
  certificatePath: string | null
  qcCompletedAt: string | null
  qcCompletedBy: string | null
  notes: string | null
  createdAt: string
}

export const qcService = {
  /** Order items with completed assembly but QC not yet Passed */
  async getPending(): Promise<QCPendingItem[]> {
    const res = await apiClient.get<ApiResponse<QCPendingItem[]>>('/order-item-qc/pending')
    return res.data.data ?? []
  },

  /** Latest QC record for a specific order item (null if never submitted) */
  async getByOrderItem(orderItemId: number): Promise<OrderItemQCResponse | null> {
    const res = await apiClient.get<{ success: boolean; data: OrderItemQCResponse | null }>(
      `/order-item-qc/${orderItemId}`
    )
    return res.data.data ?? null
  },

  /** Submit QC result (Passed or Failed) with optional PDF certificate */
  async submitQC(
    orderItemId: number,
    orderId: number,
    qcStatus: 'Passed' | 'Failed',
    qcBy: string,
    notes: string,
    certificate: File | null
  ): Promise<OrderItemQCResponse> {
    const form = new FormData()
    form.append('orderId', String(orderId))
    form.append('qcStatus', qcStatus)
    form.append('qcBy', qcBy)
    form.append('notes', notes)
    if (certificate) form.append('certificate', certificate)

    const res = await apiClient.post<ApiResponse<OrderItemQCResponse>>(
      `/order-item-qc/${orderItemId}/submit`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    if (!res.data.success) throw new Error(res.data.message || 'QC submit failed')
    return res.data.data!
  },
}
