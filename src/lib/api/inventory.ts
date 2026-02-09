import axios from 'axios'
import { apiClient, ApiResponse } from './axios-config'

export interface InventoryResponse {
  id: number
  materialId: number
  materialCode: string
  materialName: string
  materialCategory: string
  totalQuantity: number
  availableQuantity: number
  allocatedQuantity: number
  issuedQuantity: number
  reservedQuantity: number
  uom: string
  minimumStock: number
  maximumStock: number
  reorderLevel: number
  reorderQuantity: number
  primaryStorageLocation?: string
  warehouseCode?: string
  averageCostPerUnit: number
  totalStockValue: number
  isLowStock: boolean
  isOutOfStock: boolean
  isActive: boolean
  lastStockInDate?: Date
  lastStockOutDate?: Date
  lastCountDate?: Date
  createdAt: Date
  updatedAt?: Date
  updatedBy?: string
}

class InventoryService {
  private baseUrl = '/inventory'

  async getAll(): Promise<InventoryResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<InventoryResponse[]>>(this.baseUrl)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch inventory: ${error.message}`)
      }
      throw error
    }
  }

  async getById(id: number): Promise<InventoryResponse> {
    try {
      const response = await apiClient.get<ApiResponse<InventoryResponse>>(`${this.baseUrl}/${id}`)
      if (!response.data.data) throw new Error('Inventory record not found')
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch inventory: ${error.message}`)
      }
      throw error
    }
  }

  async getByMaterialId(materialId: number): Promise<InventoryResponse | null> {
    try {
      const response = await apiClient.get<ApiResponse<InventoryResponse>>(
        `${this.baseUrl}/by-material/${materialId}`
      )
      return response.data.data || null
    } catch (error) {
      // If material not found in inventory, return null instead of throwing
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null
      }
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch inventory by material: ${error.message}`)
      }
      throw error
    }
  }

  async getLowStock(): Promise<InventoryResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<InventoryResponse[]>>(`${this.baseUrl}/low-stock`)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch low stock items: ${error.message}`)
      }
      throw error
    }
  }

  async getOutOfStock(): Promise<InventoryResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<InventoryResponse[]>>(`${this.baseUrl}/out-of-stock`)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch out of stock items: ${error.message}`)
      }
      throw error
    }
  }

  async getActive(): Promise<InventoryResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<InventoryResponse[]>>(`${this.baseUrl}/active`)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch active inventory: ${error.message}`)
      }
      throw error
    }
  }
}

export const inventoryService = new InventoryService()
