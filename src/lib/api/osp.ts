import axios from 'axios'
import { apiClient, ApiResponse } from './axios-config'

export interface OSPTrackingEntry {
  id: number
  jobCardId: number
  jobCardNo: string
  orderId: number
  orderNo: string | null
  orderItemId: number | null
  itemSequence: string | null
  childPartName: string | null
  processName: string | null
  vendorId: number
  vendorName: string | null
  quantity: number
  receivedQty: number
  rejectedQty: number
  sentDate: string          // ISO date
  expectedReturnDate: string
  actualReturnDate: string | null
  status: 'Sent' | 'Received'
  notes: string | null
  createdAt: string
  createdBy: string | null
  updatedAt: string | null
  updatedBy: string | null
}

export interface OSPJobCardOption {
  jobCardId: number
  jobCardNo: string
  orderId: number
  orderNo: string | null
  orderItemId: number | null
  itemSequence: string | null
  childPartName: string | null
  processName: string | null
  quantity: number
}

export interface CreateOSPRequest {
  jobCardId: number
  vendorId: number
  quantity: number
  sentDate: string
  expectedReturnDate: string
  notes?: string | null
  createdBy?: string
}

export interface BatchCreateOSPRequest {
  jobCardIds: number[]
  vendorId: number
  sentDate: string
  expectedReturnDate: string
  notes?: string | null
  createdBy?: string
}

export interface ReceiveOSPRequest {
  actualReturnDate: string
  receivedQty: number
  rejectedQty: number
  notes?: string | null
  updatedBy?: string
}

class OSPService {
  private base = '/osp'

  async getAll(): Promise<OSPTrackingEntry[]> {
    try {
      const res = await apiClient.get<ApiResponse<OSPTrackingEntry[]>>(this.base)
      return res.data.data || []
    } catch (err) {
      if (axios.isAxiosError(err)) throw new Error(err.response?.data?.message || 'Failed to load OSP entries')
      throw err
    }
  }

  async getAvailableJobCards(): Promise<OSPJobCardOption[]> {
    try {
      const res = await apiClient.get<ApiResponse<OSPJobCardOption[]>>(`${this.base}/available-job-cards`)
      return res.data.data || []
    } catch (err) {
      if (axios.isAxiosError(err)) throw new Error(err.response?.data?.message || 'Failed to load job cards')
      throw err
    }
  }

  async create(data: CreateOSPRequest): Promise<number> {
    try {
      const res = await apiClient.post<ApiResponse<number>>(this.base, data)
      if (!res.data.data) throw new Error('Failed to create OSP entry')
      return res.data.data
    } catch (err) {
      if (axios.isAxiosError(err)) throw new Error(err.response?.data?.message || 'Failed to create OSP entry')
      throw err
    }
  }

  async batchCreate(data: BatchCreateOSPRequest): Promise<number[]> {
    try {
      const res = await apiClient.post<ApiResponse<number[]>>(`${this.base}/batch`, data)
      return res.data.data || []
    } catch (err) {
      if (axios.isAxiosError(err)) throw new Error(err.response?.data?.message || 'Failed to batch send to vendor')
      throw err
    }
  }

  async markReceived(id: number, data: ReceiveOSPRequest): Promise<string> {
    try {
      const res = await apiClient.post<ApiResponse<boolean>>(`${this.base}/${id}/receive`, data)
      return res.data.message || 'Updated'
    } catch (err) {
      if (axios.isAxiosError(err)) throw new Error(err.response?.data?.message || 'Failed to mark as received')
      throw err
    }
  }
}

export const ospService = new OSPService()
