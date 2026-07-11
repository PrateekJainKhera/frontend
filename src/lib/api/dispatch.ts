import { apiClient, ApiResponse } from './axios-config'
import { ReadyToDispatchItem, DeliveryChallanApi, ConsolidatedChallanItem } from '@/types/dispatch'

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

  async getChallanItems(challanId: number): Promise<ConsolidatedChallanItem[]> {
    try {
      const res = await apiClient.get<ApiResponse<ConsolidatedChallanItem[]>>(`${this.baseUrl}/${challanId}/items`)
      return res.data.data ?? []
    } catch {
      return []
    }
  }

  async consolidatedDispatch(
    data: {
      customerId: number
      dispatchDate: string
      items: { orderItemId: number; qtyToDispatch: number }[]
      invoiceNo?: string
      invoiceDate?: string
      deliveryAddress?: string
      transportMode?: string
      vehicleNumber?: string
      driverName?: string
      driverContact?: string
      remarks?: string
      createdBy?: string
    },
    file?: File
  ): Promise<{ success: boolean; message: string; challanId?: number }> {
    try {
      const fd = new FormData()
      fd.append('customerId', String(data.customerId))
      fd.append('dispatchDate', data.dispatchDate)
      fd.append('itemsJson', JSON.stringify(data.items))
      if (data.invoiceNo) fd.append('invoiceNo', data.invoiceNo)
      if (data.invoiceDate) fd.append('invoiceDate', data.invoiceDate)
      if (data.deliveryAddress) fd.append('deliveryAddress', data.deliveryAddress)
      if (data.transportMode) fd.append('transportMode', data.transportMode)
      if (data.vehicleNumber) fd.append('vehicleNumber', data.vehicleNumber)
      if (data.driverName) fd.append('driverName', data.driverName)
      if (data.driverContact) fd.append('driverContact', data.driverContact)
      if (data.remarks) fd.append('remarks', data.remarks)
      if (data.createdBy) fd.append('createdBy', data.createdBy)
      if (file) fd.append('invoiceDocument', file)

      const res = await apiClient.post<ApiResponse<number>>(
        `${this.baseUrl}/consolidated-dispatch`,
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      return { success: res.data.success, message: res.data.message ?? 'Dispatched', challanId: res.data.data }
    } catch (error: any) {
      return { success: false, message: error?.response?.data?.message ?? 'Failed to dispatch' }
    }
  }

}

export const dispatchService = new DispatchService()
