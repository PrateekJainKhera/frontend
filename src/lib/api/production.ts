import axios from 'axios'
import { apiClient, ApiResponse } from './axios-config'

export interface ProductionOrderSummary {
  orderId: number
  orderItemId?: number | null  // present for multi-product orders
  orderNo: string              // e.g. "ORD-202602-0001-A"
  customerName?: string | null
  productName?: string | null
  machineModel?: string | null
  rollerType?: string | null
  numberOfTeeth?: number | null
  priority: string
  dueDate?: string | null
  totalSteps: number
  completedSteps: number
  inProgressSteps: number
  readySteps: number
  machineScheduledSteps: number
  totalChildParts: number
  completedChildParts: number
  productionStatus: string     // "Pending" | "InProgress" | "Completed"
  quantity: number
  qtyDispatched: number
}

// ── Execution View types ────────────────────────────────────────────────────

export interface ExecutionViewRow {
  jobCardId: number
  jobCardNo: string
  orderId: number
  orderItemId?: number | null
  productId?: number | null
  orderNo: string
  machineModel?: string | null
  rollerType?: string | null
  numberOfTeeth?: number | null
  childPartName?: string | null
  processName?: string | null
  stepNo?: number | null
  quantity: number
  completedQty: number
  rejectedQty: number
  productionStatus: string   // Pending | Ready | InProgress | Paused | Completed
  isLocked: boolean
  waitingFor?: string | null // ProcessName of blocking step
  machineName?: string | null
  actualStartTime?: string | null
  actualEndTime?: string | null
  isOsp: boolean
  ospStatus?: string | null   // null = not sent | 'Sent' = at vendor
  isRework?: boolean
  jobCardType?: string | null
}

export interface ExecutionViewChildPart {
  childPartName: string
  childPartId?: number | null
  isReadyForAssembly: boolean
  jobCards: ExecutionViewRow[]
}

export interface ExecutionViewCategory {
  processCategoryId?: number | null
  categoryName: string
  categoryCode?: string | null
  totalJobs: number
  readyJobs: number
  inProgressJobs: number
  completedJobs: number
  childParts: ExecutionViewChildPart[]
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

  /** GET /api/production/execution-view — process-category based view */
  async getExecutionView(): Promise<ExecutionViewCategory[]> {
    try {
      const response = await apiClient.get<ApiResponse<ExecutionViewCategory[]>>(
        '/production/execution-view'
      )
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to load execution view: ${error.message}`)
      }
      throw error
    }
  }

  /** POST /api/production/order-items/{id}/complete-all */
  async completeAll(orderItemId: number): Promise<void> {
    try {
      const response = await apiClient.post(`/production/order-items/${orderItemId}/complete-all`)
      if (!response.data.success) throw new Error(response.data.message)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to complete all: ${error.message}`)
      }
      throw error
    }
  }

  /** POST /api/production/job-cards/{id}/action */
  async jobCardAction(
    jobCardId: number,
    action: 'start' | 'pause' | 'resume' | 'complete' | 'direct-complete',
    completedQty = 0,
    rejectedQty = 0
  ): Promise<string> {
    try {
      const response = await apiClient.post<ApiResponse<boolean>>(`/production/job-cards/${jobCardId}/action`, {
        action,
        completedQty,
        rejectedQty,
      })
      return response.data.message ?? ''
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Action failed: ${error.message}`)
      }
      throw error
    }
  }
}

export const productionService = new ProductionService()
