import axios from 'axios'
import { apiClient, ApiResponse } from './axios-config'

export interface OrderResponse {
  id: number
  orderNo: string
  orderDate: string
  dueDate: string
  adjustedDueDate?: string | null

  customerId: number
  customerName?: string
  customerCode?: string

  productId: number
  productName?: string
  productCode?: string

  quantity: number
  originalQuantity: number
  qtyCompleted: number
  qtyRejected: number
  qtyInProgress: number
  qtyScrap: number

  status: string
  priority: string
  planningStatus: string

  orderSource: string
  agentCustomerId?: number | null
  agentCommission?: number | null

  schedulingStrategy: string

  drawingReviewStatus: string
  drawingReviewNotes?: string | null
  drawingReviewedBy?: string | null
  drawingReviewedAt?: string | null
  primaryDrawingId?: number | null
  drawingSource?: string | null
  linkedProductTemplateId?: number | null

  customerMachine?: string | null
  materialGradeRemark?: string | null

  currentProcess?: string | null
  currentMachine?: string | null
  currentOperator?: string | null

  delayReason?: string | null
  rescheduleCount: number
  isDelayed: boolean
  daysUntilDue?: number | null

  completionPercentage: number

  createdAt: string
  createdBy?: string | null
  updatedAt?: string | null
  version: number
}

export interface CreateOrderPayload {
  orderDate?: string
  dueDate: string
  customerId: number
  productId: number
  quantity: number
  priority: string
  orderSource: string
  agentCustomerId?: number
  agentCommission?: number
  schedulingStrategy: string
  primaryDrawingId?: number
  drawingSource?: string
  drawingNotes?: string
  linkedProductTemplateId?: number
  customerMachine?: string
  materialGradeRemark?: string
}

class OrderService {
  private baseUrl = '/orders'

  async getAll(): Promise<OrderResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<OrderResponse[]>>(this.baseUrl)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch orders: ${error.message}`)
      }
      throw error
    }
  }

  async getById(id: number): Promise<OrderResponse> {
    try {
      const response = await apiClient.get<ApiResponse<OrderResponse>>(`${this.baseUrl}/${id}`)
      if (!response.data.data) throw new Error('Order not found')
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch order: ${error.message}`)
      }
      throw error
    }
  }

  async getInProgress(): Promise<OrderResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<OrderResponse[]>>(`${this.baseUrl}/in-progress`)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch in-progress orders: ${error.message}`)
      }
      throw error
    }
  }

  async create(data: CreateOrderPayload): Promise<number> {
    try {
      const response = await apiClient.post<ApiResponse<number>>(this.baseUrl, data)
      if (!response.data.success) throw new Error(response.data.message)
      return response.data.data!
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to create order: ${error.message}`)
      }
      throw error
    }
  }

  async approveDrawingReview(orderId: number, reviewedBy: string, notes: string | null, linkedProductTemplateId: number): Promise<boolean> {
    try {
      const response = await apiClient.post<ApiResponse<boolean>>(`${this.baseUrl}/${orderId}/drawing-review/approve`, {
        reviewedBy,
        notes,
        linkedProductTemplateId,
      })
      if (!response.data.success) throw new Error(response.data.message)
      return response.data.data!
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to approve drawing review: ${error.message}`)
      }
      throw error
    }
  }

  async rejectDrawingReview(orderId: number, reviewedBy: string, reason: string): Promise<boolean> {
    try {
      const response = await apiClient.post<ApiResponse<boolean>>(`${this.baseUrl}/${orderId}/drawing-review/reject`, {
        reviewedBy,
        reason,
      })
      if (!response.data.success) throw new Error(response.data.message)
      return response.data.data!
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to reject drawing review: ${error.message}`)
      }
      throw error
    }
  }

  async generateOrderNo(): Promise<string> {
    try {
      const response = await apiClient.get<ApiResponse<string>>(`${this.baseUrl}/generate-order-no`)
      return response.data.data || ''
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to generate order number: ${error.message}`)
      }
      throw error
    }
  }
}

export const orderService = new OrderService()
