import axios from 'axios'
import { apiClient, ApiResponse } from './axios-config'

export interface CreateComponentIssueRequest {
  componentId: number
  issuedQty: number
  requestedBy: string
  issuedBy: string
  remarks?: string
  createdBy?: string
}

export interface ComponentWithStock {
  id: number
  partNumber: string
  componentName: string
  category: string
  unit: string
  availableStock: number
  currentStock: number
  stockLocation: string
  sourceRef?: string  // e.g. "OS-202602-001" or "GRN-202602-001"
}

export interface ComponentIssueResponse {
  id: number
  issueNo: string
  issueDate: string
  componentId: number
  componentName: string
  partNumber?: string
  unit: string
  issuedQty: number
  requestedBy: string
  issuedBy: string
  remarks?: string
  createdAt: string
}

export interface ShopFloorComponentStock {
  componentId: number
  componentName?: string
  partNumber?: string
  uom?: string
  quantity: number
  reservedQty: number
  availableQty: number
}

class ComponentIssueService {
  private baseUrl = '/component-issues'

  async create(data: CreateComponentIssueRequest): Promise<ComponentIssueResponse> {
    try {
      const response = await apiClient.post<ApiResponse<ComponentIssueResponse>>(this.baseUrl, data)
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to create component issue')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to issue component: ${error.message}`)
      }
      throw error
    }
  }

  async getAll(): Promise<ComponentIssueResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<ComponentIssueResponse[]>>(this.baseUrl)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch issues: ${error.message}`)
      }
      throw error
    }
  }

  async getComponentsWithStock(): Promise<ComponentWithStock[]> {
    try {
      const response = await apiClient.get<ApiResponse<ComponentWithStock[]>>(
        `${this.baseUrl}/components-in-stock`
      )
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch components: ${error.message}`)
      }
      throw error
    }
  }

  async getShopFloorStock(): Promise<ShopFloorComponentStock[]> {
    try {
      const response = await apiClient.get<ApiResponse<ShopFloorComponentStock[]>>(
        `${this.baseUrl}/shop-floor-stock`
      )
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch shop-floor stock: ${error.message}`)
      }
      throw error
    }
  }

  async getByComponent(componentId: number): Promise<ComponentIssueResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<ComponentIssueResponse[]>>(
        `${this.baseUrl}/by-component/${componentId}`
      )
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch issues: ${error.message}`)
      }
      throw error
    }
  }
}

export const componentIssueService = new ComponentIssueService()
