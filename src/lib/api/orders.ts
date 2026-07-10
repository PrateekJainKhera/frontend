import axios from 'axios'
import { apiClient, ApiResponse } from './axios-config'

export interface OrderItemResponse {
  id: number
  orderId: number
  itemSequence: string  // A, B, C, D...
  productId: number
  productName?: string
  partCode?: string
  rollerType?: string
  numberOfTeeth?: number
  quantity: number
  originalQuantity: number
  qtyCompleted: number
  qtyRejected: number
  qtyInProgress: number
  qtyScrap: number
  qtyDispatched: number
  dueDate: string
  adjustedDueDate?: string | null
  priority: string
  status: string
  planningStatus: string
  drawingReviewStatus: string
  primaryDrawingId?: number | null
  linkedProductTemplateId?: number | null
  materialGradeApproved: boolean
  materialGradeApprovalDate?: string | null
  materialGradeApprovedBy?: string | null
  materialGradeRemark?: string | null
  remarks?: string | null
  createdAt: string
  createdBy?: string | null
  updatedAt?: string | null
  updatedBy?: string | null
}

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
  rollerType?: string
  numberOfTeeth?: number

  quantity: number
  originalQuantity: number
  qtyCompleted: number
  qtyRejected: number
  qtyInProgress: number
  qtyScrap: number
  qtyDispatched: number

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

  // Multi-Product Support
  items?: OrderItemResponse[]
}

export interface CreateOrderPayload {
  orderDate?: string
  dueDate?: string
  customerId: number
  productId?: number
  quantity?: number
  priority?: string
  primaryDrawingId?: number
  drawingNotes?: string
  linkedProductTemplateId?: number
  orderValue?: number
  advancePayment?: number
  createdBy?: string
  items?: {
    productId: number
    quantity: number
    dueDate: string
    priority: string
    linkedProductTemplateId?: number
  }[]
}

export interface OrderCustomerDrawing {
  id: number
  orderId: number
  originalFileName: string
  drawingType: string
  notes?: string | null
  fileSize?: number | null
  mimeType?: string | null
  downloadUrl: string
  uploadedAt: string
  uploadedBy?: string | null
}

export interface UpdateOrderPayload {
  id: number
  orderDate?: string
  dueDate?: string
  adjustedDueDate?: string
  customerId?: number
  productId?: number
  quantity?: number
  status?: string
  priority?: string
  planningStatus?: string
  primaryDrawingId?: number
  linkedProductTemplateId?: number
  delayReason?: string
  orderValue?: number
  advancePayment?: number
  balancePayment?: number
  version?: number  // Required for optimistic locking
  updatedBy?: string
}

export interface PagedOrders {
  items: OrderResponse[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

// Per-column filters for the Orders list (all combined with AND on the server)
export interface OrderColumnFilters {
  orderNo?: string
  customer?: string
  product?: string        // matches PartCode/Model/Roller/Teeth — "110" hits "110T"
  source?: string
  orderDateFrom?: string  // yyyy-mm-dd
  orderDateTo?: string    // yyyy-mm-dd
}

export interface OrderLite {
  orderId: number
  orderItemId: number
  itemSequence?: string | null
  orderNo: string          // base order no (without -A/-B)
  customerName?: string | null
  machineModel?: string | null
  rollerType?: string | null
  numberOfTeeth?: number | null
  orderDate: string
}

export interface OrderSummary {
  total: number
  pending: number
  inProgress: number
  readyToDispatch: number
  completed: number
}

export interface PlanningItem {
  itemId: number
  orderId: number
  orderNo: string
  itemSequence?: string
  productId: number
  productName?: string
  partCode?: string
  rollerType?: string
  numberOfTeeth?: number
  quantity: number
  dueDate?: string
  itemPriority?: string
  itemStatus?: string
  planningStatus?: string
  drawingReviewStatus?: string
  customerName?: string
  orderStatus?: string
  orderPriority?: string
  jobCardCount: number
  completedJobCardCount: number
}

export interface PagedPlanningItems {
  items: PlanningItem[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

export interface PlanningSummary {
  totalOrders: number
  pendingPlanning: number
  planned: number
  materialShortage: number
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

  async getPaged(page: number, pageSize: number, search?: string, status?: string, filters?: OrderColumnFilters): Promise<PagedOrders> {
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      if (search && search.trim()) params.append('search', search.trim())
      if (status && status !== 'all') params.append('status', status)
      if (filters?.orderNo?.trim()) params.append('orderNo', filters.orderNo.trim())
      if (filters?.customer?.trim()) params.append('customer', filters.customer.trim())
      if (filters?.product?.trim()) params.append('product', filters.product.trim())
      if (filters?.source && filters.source !== 'all') params.append('source', filters.source)
      if (filters?.orderDateFrom) params.append('orderDateFrom', filters.orderDateFrom)
      if (filters?.orderDateTo) params.append('orderDateTo', filters.orderDateTo)
      const response = await apiClient.get<ApiResponse<PagedOrders>>(`${this.baseUrl}/paged?${params.toString()}`)
      return response.data.data || { items: [], totalCount: 0, page, pageSize, totalPages: 0 }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch orders: ${error.message}`)
      }
      throw error
    }
  }

  async changeCustomer(orderId: number, customerId: number, changedBy?: string, notes?: string): Promise<string> {
    try {
      const res = await apiClient.post<ApiResponse<boolean>>(
        `${this.baseUrl}/${orderId}/change-customer`, { customerId, changedBy, notes })
      if (!res.data.success) throw new Error(res.data.message || 'Failed to change customer')
      return res.data.message || 'Customer changed'
    } catch (error) {
      if (axios.isAxiosError(error)) throw new Error(error.response?.data?.message || `Failed to change customer: ${error.message}`)
      throw error
    }
  }

  async getLite(): Promise<OrderLite[]> {
    try {
      const response = await apiClient.get<ApiResponse<OrderLite[]>>(`${this.baseUrl}/lite`)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch orders: ${error.message}`)
      }
      throw error
    }
  }

  async getSummary(): Promise<OrderSummary> {
    try {
      const response = await apiClient.get<ApiResponse<OrderSummary>>(`${this.baseUrl}/summary`)
      return response.data.data || { total: 0, pending: 0, inProgress: 0, readyToDispatch: 0, completed: 0 }
    } catch {
      return { total: 0, pending: 0, inProgress: 0, readyToDispatch: 0, completed: 0 }
    }
  }

  async getPlanningItems(type: 'pending' | 'planned', page: number, pageSize: number, search?: string): Promise<PagedPlanningItems> {
    try {
      const params = new URLSearchParams({ type, page: String(page), pageSize: String(pageSize) })
      if (search && search.trim()) params.append('search', search.trim())
      const response = await apiClient.get<ApiResponse<PagedPlanningItems>>(`${this.baseUrl}/planning-items?${params.toString()}`)
      return response.data.data || { items: [], totalCount: 0, page, pageSize, totalPages: 0 }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch planning items: ${error.message}`)
      }
      throw error
    }
  }

  async getPlanningSummary(): Promise<PlanningSummary> {
    try {
      const response = await apiClient.get<ApiResponse<PlanningSummary>>(`${this.baseUrl}/planning-summary`)
      return response.data.data || { totalOrders: 0, pendingPlanning: 0, planned: 0, materialShortage: 0 }
    } catch {
      return { totalOrders: 0, pendingPlanning: 0, planned: 0, materialShortage: 0 }
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

  async getReadyForPlanning(): Promise<OrderResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<OrderResponse[]>>(`${this.baseUrl}/ready-for-planning`)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch orders ready for planning: ${error.message}`)
      }
      throw error
    }
  }

  async getOrderDrawings(orderId: number): Promise<any[]> {
    try {
      const response = await apiClient.get<ApiResponse<any[]>>(`${this.baseUrl}/${orderId}/drawings`)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch order drawings: ${error.message}`)
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

  async update(id: number, data: UpdateOrderPayload): Promise<OrderResponse> {
    try {
      const response = await apiClient.put<ApiResponse<OrderResponse>>(`${this.baseUrl}/${id}`, {
        ...data,
        id,
      })
      if (!response.data.success) throw new Error(response.data.message)
      return response.data.data!
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to update order: ${error.message}`)
      }
      throw error
    }
  }

  async getCustomerDrawings(orderId: number): Promise<OrderCustomerDrawing[]> {
    try {
      const response = await apiClient.get<ApiResponse<OrderCustomerDrawing[]>>(`${this.baseUrl}/${orderId}/customer-drawings`)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch drawings: ${error.message}`)
      }
      throw error
    }
  }

  async uploadCustomerDrawing(orderId: number, file: File, drawingType: string, notes?: string): Promise<OrderCustomerDrawing> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('drawingType', drawingType)
      if (notes) formData.append('notes', notes)
      const response = await apiClient.post<ApiResponse<OrderCustomerDrawing>>(
        `${this.baseUrl}/${orderId}/customer-drawings`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      if (!response.data.success) throw new Error(response.data.message)
      return response.data.data!
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to upload drawing: ${error.message}`)
      }
      throw error
    }
  }

  async deleteCustomerDrawing(orderId: number, drawingId: number): Promise<void> {
    try {
      const response = await apiClient.delete<ApiResponse<boolean>>(`${this.baseUrl}/${orderId}/customer-drawings/${drawingId}`)
      if (!response.data.success) throw new Error(response.data.message)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to delete drawing: ${error.message}`)
      }
      throw error
    }
  }

  async delete(id: number): Promise<void> {
    try {
      const response = await apiClient.delete<ApiResponse<boolean>>(`${this.baseUrl}/${id}`)
      if (!response.data.success) throw new Error(response.data.message)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to delete order: ${error.message}`)
      }
      throw error
    }
  }

  async updateItemPlanningStatus(itemId: number, planningStatus: string): Promise<void> {
    try {
      const response = await apiClient.patch(`${this.baseUrl}/items/${itemId}/planning-status`, { planningStatus })
      if (!response.data.success) throw new Error(response.data.message)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to update planning status: ${error.message}`)
      }
      throw error
    }
  }

  async deleteOrderItem(orderId: number, itemId: number): Promise<void> {
    try {
      const response = await apiClient.delete<ApiResponse<boolean>>(`${this.baseUrl}/${orderId}/items/${itemId}`)
      if (!response.data.success) throw new Error(response.data.message)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to delete order item: ${error.message}`)
      }
      throw error
    }
  }

  async updateOrderItem(orderId: number, itemId: number, data: {
    productId?: number
    productName?: string
    quantity?: number
    dueDate?: string
    priority?: string
    remarks?: string
    updatedBy?: string
  }): Promise<void> {
    try {
      const response = await apiClient.patch<ApiResponse<boolean>>(
        `${this.baseUrl}/${orderId}/items/${itemId}`,
        data
      )
      if (!response.data.success) throw new Error(response.data.message)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to update order item: ${error.message}`)
      }
      throw error
    }
  }

  async updateQuantity(orderId: number, newQuantity: number, orderItemId?: number): Promise<void> {
    try {
      const response = await apiClient.patch<ApiResponse<boolean>>(
        `${this.baseUrl}/${orderId}/update-quantity`,
        { newQuantity, orderItemId: orderItemId ?? null, updatedBy: 'Admin' }
      )
      if (!response.data.success) throw new Error(response.data.message)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to update quantity: ${error.message}`)
      }
      throw error
    }
  }
}

export const orderService = new OrderService()
