import axios from 'axios'
import { apiClient, ApiResponse } from './axios-config'

export interface ScrapMaterialSummary {
  materialId?: number | null
  materialCode?: string | null
  materialName?: string | null
  wastagePieces: number
  wastageWeightKG: number
  soldWeightKG: number
  remainingWeightKG: number
}

export interface ScrapSale {
  id: number
  materialId?: number | null
  materialCode?: string | null
  materialName?: string | null
  weightKG: number
  ratePerKG: number
  totalAmount: number
  buyerName: string
  saleDate: string
  remarks?: string | null
  createdAt: string
  createdBy?: string | null
}

export interface ScrapOverview {
  materials: ScrapMaterialSummary[]
  sales: ScrapSale[]
  totalWastageWeightKG: number
  totalSoldWeightKG: number
  totalSaleAmount: number
}

export interface CreateScrapSaleRequest {
  materialId?: number | null
  materialCode?: string | null
  materialName?: string | null
  weightKG: number
  ratePerKG: number
  buyerName: string
  saleDate?: string
  remarks?: string
  createdBy?: string
}

class ScrapSalesService {
  private baseUrl = '/scrap-sales'

  async getOverview(): Promise<ScrapOverview> {
    try {
      const res = await apiClient.get<ApiResponse<ScrapOverview>>(`${this.baseUrl}/overview`)
      if (!res.data.data) throw new Error(res.data.message || 'Failed to load scrap overview')
      return res.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) throw new Error(error.response?.data?.message || `Failed to load scrap overview: ${error.message}`)
      throw error
    }
  }

  async create(data: CreateScrapSaleRequest): Promise<number> {
    try {
      const res = await apiClient.post<ApiResponse<number>>(this.baseUrl, data)
      if (!res.data.success) throw new Error(res.data.message || 'Failed to record scrap sale')
      return res.data.data as number
    } catch (error) {
      if (axios.isAxiosError(error)) throw new Error(error.response?.data?.message || `Failed to record scrap sale: ${error.message}`)
      throw error
    }
  }
}

export const scrapSalesService = new ScrapSalesService()
