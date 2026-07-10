import axios from 'axios'
import { apiClient, ApiResponse } from './axios-config'

export interface ComponentQtyItem {
  componentId: number
  componentName?: string | null
  partNumber?: string | null
  uom?: string | null
  quantity: number
}

export interface ReserveComponentsRequest {
  orderId: number
  orderItemId?: number | null
  orderNo?: string | null
  reservedBy?: string
  components: ComponentQtyItem[]
}

export interface ConsumeComponentItem {
  orderId: number
  orderItemId?: number | null
  orderNo?: string | null
  componentId: number
  componentName?: string | null
  partNumber?: string | null
  uom?: string | null
  quantity: number
}

export interface ConsumeComponentsRequest {
  consumedBy?: string
  items: ConsumeComponentItem[]
}

export interface ConsumeResult {
  orderId: number
  orderNo?: string | null
  componentId: number
  componentName?: string | null
  quantity: number
  success: boolean
  message?: string | null
}

export interface OrderComponent {
  orderId: number
  orderItemId?: number | null
  orderNo?: string | null
  componentId: number
  componentName?: string | null
  partNumber?: string | null
  uom?: string | null
  reservedQty: number
  consumedQty: number
  status: string
}

class OrderComponentService {
  private baseUrl = '/order-components'

  async reserve(data: ReserveComponentsRequest): Promise<void> {
    try {
      const res = await apiClient.post<ApiResponse<boolean>>(`${this.baseUrl}/reserve`, data)
      if (!res.data.success) throw new Error(res.data.message || 'Failed to reserve components')
    } catch (error) {
      if (axios.isAxiosError(error)) throw new Error(error.response?.data?.message || `Failed to reserve components: ${error.message}`)
      throw error
    }
  }

  async consume(data: ConsumeComponentsRequest): Promise<ConsumeResult[]> {
    try {
      const res = await apiClient.post<ApiResponse<ConsumeResult[]>>(`${this.baseUrl}/consume`, data)
      return res.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) throw new Error(error.response?.data?.message || `Failed to consume components: ${error.message}`)
      throw error
    }
  }

  async getByOrder(orderId: number): Promise<OrderComponent[]> {
    try {
      const res = await apiClient.get<ApiResponse<OrderComponent[]>>(`${this.baseUrl}/by-order/${orderId}`)
      return res.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) throw new Error(error.response?.data?.message || `Failed to fetch order components: ${error.message}`)
      throw error
    }
  }
}

export const orderComponentService = new OrderComponentService()
