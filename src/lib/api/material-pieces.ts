import axios from 'axios'
import { apiClient, ApiResponse } from './axios-config'

export interface MaterialPieceResponse {
  id: number
  pieceNo: string
  materialId: number
  materialCode?: string
  materialName?: string
  grade?: string
  diameter?: number
  originalLengthMM: number
  currentLengthMM: number
  originalWeightKG: number
  currentWeightKG: number
  currentLengthMeters: number
  originalLengthMeters: number
  usagePercentage: number
  status: string
  allocatedToRequisitionId?: number
  issuedToJobCardId?: number
  storageLocation?: string
  binNumber?: string
  rackNumber?: string
  grnId?: number
  grnNo?: string
  receivedDate: string
  supplierBatchNo?: string
  supplierId?: number
  unitCost?: number
  isWastage: boolean
  wastageReason?: string
  scrapValue?: number
  currentValue?: number
  createdAt: string
  createdBy?: string
  updatedAt?: string
  updatedBy?: string
}

class MaterialPieceService {
  private baseUrl = '/material-pieces'

  async getAll(): Promise<MaterialPieceResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<MaterialPieceResponse[]>>(this.baseUrl)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch material pieces: ${error.message}`)
      }
      throw error
    }
  }

  async getById(id: number): Promise<MaterialPieceResponse> {
    try {
      const response = await apiClient.get<ApiResponse<MaterialPieceResponse>>(`${this.baseUrl}/${id}`)
      if (!response.data.data) {
        throw new Error('Material piece not found')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch material piece: ${error.message}`)
      }
      throw error
    }
  }

  async getByMaterialId(materialId: number): Promise<MaterialPieceResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<MaterialPieceResponse[]>>(
        `${this.baseUrl}/by-material/${materialId}`
      )
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch pieces: ${error.message}`)
      }
      throw error
    }
  }

  async getByStatus(status: string): Promise<MaterialPieceResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<MaterialPieceResponse[]>>(
        `${this.baseUrl}/by-status/${status}`
      )
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch pieces: ${error.message}`)
      }
      throw error
    }
  }

  async getAvailable(): Promise<MaterialPieceResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<MaterialPieceResponse[]>>(`${this.baseUrl}/available`)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch available pieces: ${error.message}`)
      }
      throw error
    }
  }

  async getWastage(): Promise<MaterialPieceResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<MaterialPieceResponse[]>>(`${this.baseUrl}/wastage`)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch wastage pieces: ${error.message}`)
      }
      throw error
    }
  }

  async getByGRNId(grnId: number): Promise<MaterialPieceResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<MaterialPieceResponse[]>>(
        `${this.baseUrl}/by-grn/${grnId}`
      )
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch pieces: ${error.message}`)
      }
      throw error
    }
  }

  async getTotalStock(materialId: number): Promise<number> {
    try {
      const response = await apiClient.get<ApiResponse<number>>(
        `${this.baseUrl}/stock/total/${materialId}`
      )
      return response.data.data || 0
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch stock: ${error.message}`)
      }
      throw error
    }
  }

  async getAvailableStock(materialId: number): Promise<number> {
    try {
      const response = await apiClient.get<ApiResponse<number>>(
        `${this.baseUrl}/stock/available/${materialId}`
      )
      return response.data.data || 0
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch available stock: ${error.message}`)
      }
      throw error
    }
  }

  async checkAvailability(materialId: number, requiredLengthMM: number): Promise<boolean> {
    try {
      const response = await apiClient.get<ApiResponse<boolean>>(
        `${this.baseUrl}/check-availability/${materialId}/${requiredLengthMM}`
      )
      return response.data.data || false
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to check availability: ${error.message}`)
      }
      throw error
    }
  }
}

export const materialPieceService = new MaterialPieceService()
