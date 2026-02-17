import axios from 'axios'
import { apiClient, ApiResponse } from './axios-config'

export interface PurchaseOrderItemResponse {
  id: number
  purchaseOrderId: number
  purchaseRequestItemId?: number | null
  itemType: string
  itemId: number
  itemName: string
  itemCode?: string | null
  unit: string
  orderedQty: number
  unitCost?: number | null
  totalCost?: number | null
}

export interface PurchaseOrderResponse {
  id: number
  poNumber: string
  purchaseRequestId?: number | null
  prNumber?: string | null
  vendorId: number
  vendorName: string
  vendorCode: string
  status: string
  totalAmount?: number | null
  expectedDeliveryDate?: string | null
  notes?: string | null
  createdAt: string
  createdBy?: string | null
  items: PurchaseOrderItemResponse[]
}

class PurchaseOrderService {
  private baseUrl = '/purchase-orders'

  async getAll(): Promise<PurchaseOrderResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<PurchaseOrderResponse[]>>(this.baseUrl)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) throw new Error(error.response?.data?.message || 'Failed to fetch POs')
      throw error
    }
  }

  async getById(id: number): Promise<PurchaseOrderResponse> {
    try {
      const response = await apiClient.get<ApiResponse<PurchaseOrderResponse>>(`${this.baseUrl}/${id}`)
      if (!response.data.data) throw new Error('PO not found')
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) throw new Error(error.response?.data?.message || 'Failed to fetch PO')
      throw error
    }
  }

  async getByPR(prId: number): Promise<PurchaseOrderResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<PurchaseOrderResponse[]>>(`${this.baseUrl}/by-pr/${prId}`)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) throw new Error(error.response?.data?.message || 'Failed to fetch POs')
      throw error
    }
  }

  async send(id: number): Promise<void> {
    try {
      await apiClient.put(`${this.baseUrl}/${id}/send`)
    } catch (error) {
      if (axios.isAxiosError(error)) throw new Error(error.response?.data?.message || 'Failed to send PO')
      throw error
    }
  }

  async cancel(id: number): Promise<void> {
    try {
      await apiClient.put(`${this.baseUrl}/${id}/cancel`)
    } catch (error) {
      if (axios.isAxiosError(error)) throw new Error(error.response?.data?.message || 'Failed to cancel PO')
      throw error
    }
  }
}

export const purchaseOrderService = new PurchaseOrderService()
