import axios from 'axios'
import { apiClient, ApiResponse } from './axios-config'

export interface WarehouseResponse {
  id: number
  name: string
  rack: string
  rackNo: string
  materialType: string // 'RawMaterial' | 'Component'
  minStockPieces: number
  minStockLengthMM: number
  isActive: boolean
  createdAt: string
  createdBy?: string
  updatedAt: string
  updatedBy?: string
}

export interface CreateWarehouseRequest {
  name: string
  rack: string
  rackNo: string
  materialType: string
  minStockPieces: number
  minStockLengthMM: number
  createdBy?: string
}

export interface UpdateWarehouseRequest {
  id: number
  name: string
  rack: string
  rackNo: string
  materialType: string
  minStockPieces: number
  minStockLengthMM: number
  isActive: boolean
  updatedBy?: string
}

export interface LowStockAlertResponse {
  warehouseId: number
  warehouseName: string
  rack: string
  rackNo: string
  materialType: string
  currentPieces: number
  currentLengthMM: number
  minStockPieces: number
  minStockLengthMM: number
  piecesAlert: boolean
  lengthAlert: boolean
  isAlert: boolean
}

class WarehouseService {
  private baseUrl = '/warehouses'

  async getAll(): Promise<WarehouseResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<WarehouseResponse[]>>(this.baseUrl)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch warehouses: ${error.message}`)
      }
      throw error
    }
  }

  async getById(id: number): Promise<WarehouseResponse> {
    try {
      const response = await apiClient.get<ApiResponse<WarehouseResponse>>(`${this.baseUrl}/${id}`)
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Warehouse not found')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch warehouse: ${error.message}`)
      }
      throw error
    }
  }

  async create(data: CreateWarehouseRequest): Promise<number> {
    try {
      const response = await apiClient.post<ApiResponse<number>>(this.baseUrl, data)
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create warehouse')
      }
      return response.data.data!
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to create warehouse: ${error.message}`)
      }
      throw error
    }
  }

  async update(id: number, data: UpdateWarehouseRequest): Promise<void> {
    try {
      const response = await apiClient.put<ApiResponse<boolean>>(`${this.baseUrl}/${id}`, { ...data, id })
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update warehouse')
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to update warehouse: ${error.message}`)
      }
      throw error
    }
  }

  async delete(id: number): Promise<void> {
    try {
      const response = await apiClient.delete<ApiResponse<boolean>>(`${this.baseUrl}/${id}`)
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete warehouse')
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to delete warehouse: ${error.message}`)
      }
      throw error
    }
  }

  async getLowStockStatus(): Promise<LowStockAlertResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<LowStockAlertResponse[]>>(`${this.baseUrl}/low-stock`)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch low stock status: ${error.message}`)
      }
      throw error
    }
  }
}

export const warehouseService = new WarehouseService()
