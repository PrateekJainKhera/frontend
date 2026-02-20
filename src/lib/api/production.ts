import axios from 'axios'
import { apiClient, ApiResponse } from './axios-config'

export interface ProductionOrderSummary {
  orderId: number
  orderItemId?: number | null  // present for multi-product orders
  orderNo: string              // e.g. "ORD-202602-0001-A"
  customerName?: string | null
  productName?: string | null
  priority: string
  dueDate?: string | null
  totalSteps: number
  completedSteps: number
  inProgressSteps: number
  readySteps: number
  totalChildParts: number
  completedChildParts: number
  productionStatus: string     // "Pending" | "InProgress" | "Completed"
}

class ProductionService {
  /** GET /api/production/order-items — multi-product orders (NEW) */
  async getOrderItems(): Promise<ProductionOrderSummary[]> {
    try {
      const response = await apiClient.get<ApiResponse<ProductionOrderSummary[]>>(
        '/production/order-items'
      )
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to load production order items: ${error.message}`)
      }
      throw error
    }
  }

  /** GET /api/production/orders — legacy single-product orders */
  async getOrders(): Promise<ProductionOrderSummary[]> {
    try {
      const response = await apiClient.get<ApiResponse<ProductionOrderSummary[]>>(
        '/production/orders'
      )
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to load production orders: ${error.message}`)
      }
      throw error
    }
  }
}

export const productionService = new ProductionService()
