import { apiClient, ApiResponse } from './axios-config'
import { ReadyToDispatchItem, DeliveryChallanApi, SimpleDispatchRequest } from '@/types/dispatch'

class DispatchService {
  private baseUrl = '/dispatch'

  async getReadyToDispatch(): Promise<ReadyToDispatchItem[]> {
    try {
      const response = await apiClient.get<ApiResponse<ReadyToDispatchItem[]>>(`${this.baseUrl}/ready`)
      return response.data.data ?? []
    } catch {
      return []
    }
  }

  async getAllChallans(): Promise<DeliveryChallanApi[]> {
    try {
      const response = await apiClient.get<ApiResponse<DeliveryChallanApi[]>>(this.baseUrl)
      return response.data.data ?? []
    } catch {
      return []
    }
  }

  async simpleDispatch(data: SimpleDispatchRequest, file?: File): Promise<{ success: boolean; message: string; challanId?: number }> {
    try {
      const formData = new FormData()
      formData.append('orderItemId', data.orderItemId.toString())
      formData.append('qtyToDispatch', data.qtyToDispatch.toString())
      formData.append('dispatchDate', data.dispatchDate)
      if (data.invoiceNo) formData.append('invoiceNo', data.invoiceNo)
      if (data.invoiceDate) formData.append('invoiceDate', data.invoiceDate)
      if (data.remarks) formData.append('remarks', data.remarks)
      if (file) formData.append('invoiceDocument', file)

      const response = await apiClient.post<ApiResponse<number>>(
        `${this.baseUrl}/simple-dispatch`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      return {
        success: response.data.success,
        message: response.data.message ?? 'Dispatched successfully',
        challanId: response.data.data
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message ?? 'Failed to dispatch'
      return { success: false, message: msg }
    }
  }
}

export const dispatchService = new DispatchService()
