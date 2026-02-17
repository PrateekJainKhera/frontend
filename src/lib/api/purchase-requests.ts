import axios from 'axios'
import { apiClient, ApiResponse } from './axios-config'

export interface CuttingListItemResponse {
  id: number
  prItemId: number
  lengthMeter: number
  pieces: number
  totalLengthMeter: number
  notes?: string | null
}

export interface CuttingListItemRequest {
  lengthMeter: number
  pieces: number
  notes?: string | null
}

export interface PurchaseRequestItemResponse {
  id: number
  purchaseRequestId: number
  itemType: string
  itemId: number
  itemName: string
  itemCode?: string | null
  unit: string
  requestedQty: number
  approvedQty?: number | null
  vendorId?: number | null
  vendorName?: string | null
  estimatedUnitCost?: number | null
  status: string
  notes?: string | null
  cuttingList: CuttingListItemResponse[]
}

export interface PurchaseRequestResponse {
  id: number
  prNumber: string
  itemType: string
  requestedBy: string
  requestDate: string
  notes?: string | null
  status: string
  rejectionReason?: string | null
  approvedBy?: string | null
  approvedAt?: string | null
  createdAt: string
  items: PurchaseRequestItemResponse[]
}

export interface CreatePRItemRequest {
  itemType: string
  itemId: number
  itemName: string
  itemCode?: string | null
  unit: string
  requestedQty: number
  notes?: string | null
  cuttingList?: CuttingListItemRequest[]
}

export interface CreatePurchaseRequestRequest {
  itemType: string
  notes?: string | null
  requestedBy?: string
  items: CreatePRItemRequest[]
}

export interface ApproveItemRequest {
  itemId: number
  status: string
  approvedQty?: number | null
  vendorId?: number | null
  estimatedUnitCost?: number | null
  notes?: string | null
}

export interface ApprovePurchaseRequestRequest {
  approvedBy?: string
  items: ApproveItemRequest[]
}

class PurchaseRequestService {
  private baseUrl = '/purchase-requests'

  async getAll(): Promise<PurchaseRequestResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<PurchaseRequestResponse[]>>(this.baseUrl)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) throw new Error(error.response?.data?.message || 'Failed to fetch PRs')
      throw error
    }
  }

  async getById(id: number): Promise<PurchaseRequestResponse> {
    try {
      const response = await apiClient.get<ApiResponse<PurchaseRequestResponse>>(`${this.baseUrl}/${id}`)
      if (!response.data.data) throw new Error('PR not found')
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) throw new Error(error.response?.data?.message || 'Failed to fetch PR')
      throw error
    }
  }

  async getByStatus(status: string): Promise<PurchaseRequestResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<PurchaseRequestResponse[]>>(`${this.baseUrl}/by-status/${status}`)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) throw new Error(error.response?.data?.message || 'Failed to fetch PRs')
      throw error
    }
  }

  async getByType(itemType: string): Promise<PurchaseRequestResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<PurchaseRequestResponse[]>>(`${this.baseUrl}/by-type/${itemType}`)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) throw new Error(error.response?.data?.message || 'Failed to fetch PRs')
      throw error
    }
  }

  async create(data: CreatePurchaseRequestRequest): Promise<number> {
    try {
      const response = await apiClient.post<ApiResponse<number>>(this.baseUrl, {
        ...data,
        requestedBy: data.requestedBy || 'Admin',
      })
      if (!response.data.data) throw new Error('Failed to create PR')
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) throw new Error(error.response?.data?.message || 'Failed to create PR')
      throw error
    }
  }

  async submit(id: number): Promise<void> {
    try {
      await apiClient.put(`${this.baseUrl}/${id}/submit`)
    } catch (error) {
      if (axios.isAxiosError(error)) throw new Error(error.response?.data?.message || 'Failed to submit PR')
      throw error
    }
  }

  async startReview(id: number): Promise<void> {
    try {
      await apiClient.put(`${this.baseUrl}/${id}/start-review`)
    } catch (error) {
      if (axios.isAxiosError(error)) throw new Error(error.response?.data?.message || 'Failed to start review')
      throw error
    }
  }

  async approve(id: number, data: ApprovePurchaseRequestRequest): Promise<any[]> {
    try {
      const response = await apiClient.post<ApiResponse<any[]>>(`${this.baseUrl}/${id}/approve`, {
        ...data,
        approvedBy: data.approvedBy || 'Admin',
      })
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) throw new Error(error.response?.data?.message || 'Failed to approve PR')
      throw error
    }
  }

  async reject(id: number, rejectionReason: string, rejectedBy = 'Admin'): Promise<void> {
    try {
      await apiClient.put(`${this.baseUrl}/${id}/reject`, { rejectionReason, rejectedBy })
    } catch (error) {
      if (axios.isAxiosError(error)) throw new Error(error.response?.data?.message || 'Failed to reject PR')
      throw error
    }
  }

  async addItem(prId: number, item: CreatePRItemRequest): Promise<void> {
    try {
      await apiClient.post(`${this.baseUrl}/${prId}/items`, item)
    } catch (error) {
      if (axios.isAxiosError(error)) throw new Error(error.response?.data?.message || 'Failed to add item')
      throw error
    }
  }

  async removeItem(prId: number, itemId: number): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/${prId}/items/${itemId}`)
    } catch (error) {
      if (axios.isAxiosError(error)) throw new Error(error.response?.data?.message || 'Failed to remove item')
      throw error
    }
  }
}

export const purchaseRequestService = new PurchaseRequestService()
