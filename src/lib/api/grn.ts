import axios from 'axios'
import { apiClient, ApiResponse } from './axios-config'

// Request Types
export interface CreateGRNLineRequest {
  sequenceNo: number
  materialId: number
  materialName: string
  grade?: string
  materialType: 'Rod' | 'Pipe' | 'Sheet' | 'Forged'
  diameter?: number
  outerDiameter?: number
  innerDiameter?: number
  width?: number
  thickness?: number
  materialDensity: number
  totalWeightKG: number
  numberOfPieces: number
  lengthPerPieceMM?: number
  unitPrice?: number
  remarks?: string
}

export interface CreateGRNRequest {
  grnNo: string
  grnDate: string
  supplierId?: number
  supplierName?: string
  supplierBatchNo?: string
  poNo?: string
  poDate?: string
  invoiceNo?: string
  invoiceDate?: string
  lines: CreateGRNLineRequest[]
  remarks?: string
  createdBy?: string
}

// Response Types
export interface GRNLineResponse {
  id: number
  grnId: number
  sequenceNo: number
  materialId: number
  materialName?: string
  grade?: string
  materialType: string
  diameter?: number
  outerDiameter?: number
  innerDiameter?: number
  width?: number
  thickness?: number
  materialDensity?: number
  totalWeightKG: number
  calculatedLengthMM?: number
  weightPerMeterKG?: number
  numberOfPieces: number
  lengthPerPieceMM?: number
  unitPrice?: number
  lineTotal?: number
  remarks?: string
}

export interface GRNResponse {
  id: number
  grnNo: string
  grnDate: string
  supplierId?: number
  supplierName?: string
  supplierBatchNo?: string
  poNo?: string
  poDate?: string
  invoiceNo?: string
  invoiceDate?: string
  totalPieces: number
  totalWeight?: number
  totalValue?: number
  status: string
  qualityCheckStatus?: string
  qualityCheckedBy?: string
  qualityCheckedAt?: string
  qualityRemarks?: string
  remarks?: string
  createdAt: string
  createdBy?: string
  updatedAt?: string
  updatedBy?: string
  lines?: GRNLineResponse[]
}

class GRNService {
  private baseUrl = '/grn'

  async create(data: CreateGRNRequest): Promise<GRNResponse> {
    try {
      const response = await apiClient.post<ApiResponse<GRNResponse>>(this.baseUrl, data)
      if (!response.data.data) {
        throw new Error('Failed to create GRN')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to create GRN: ${error.message}`)
      }
      throw error
    }
  }

  async getAll(): Promise<GRNResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<GRNResponse[]>>(this.baseUrl)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch GRNs: ${error.message}`)
      }
      throw error
    }
  }

  async getById(id: number): Promise<GRNResponse> {
    try {
      const response = await apiClient.get<ApiResponse<GRNResponse>>(`${this.baseUrl}/${id}`)
      if (!response.data.data) {
        throw new Error('GRN not found')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch GRN: ${error.message}`)
      }
      throw error
    }
  }

  async getWithLines(id: number): Promise<GRNResponse> {
    try {
      const response = await apiClient.get<ApiResponse<GRNResponse>>(`${this.baseUrl}/${id}/with-lines`)
      if (!response.data.data) {
        throw new Error('GRN not found')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch GRN: ${error.message}`)
      }
      throw error
    }
  }

  async getByGRNNo(grnNo: string): Promise<GRNResponse> {
    try {
      const response = await apiClient.get<ApiResponse<GRNResponse>>(`${this.baseUrl}/by-grn-no/${grnNo}`)
      if (!response.data.data) {
        throw new Error('GRN not found')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch GRN: ${error.message}`)
      }
      throw error
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/${id}`)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to delete GRN: ${error.message}`)
      }
      throw error
    }
  }
}

export const grnService = new GRNService()
