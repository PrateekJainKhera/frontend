import axios from 'axios'
import { apiClient, ApiResponse } from './axios-config'

export interface ProductDefaultMaterialResponse {
  id: number
  productId: number
  childPartTemplateId?: number | null
  rawMaterialId?: number | null
  rawMaterialName: string
  materialGrade: string
  requiredQuantity: number
  unit: string
  wastageMM: number
  notes?: string | null
}

export interface ProductDefaultMaterialItem {
  childPartTemplateId?: number | null
  rawMaterialId?: number | null
  rawMaterialName: string
  materialGrade?: string
  requiredQuantity: number
  unit: string
  wastageMM?: number
  notes?: string | null
}

export interface SaveProductDefaultMaterialsRequest {
  materials: ProductDefaultMaterialItem[]
  updatedBy?: string
}

class ProductDefaultMaterialService {
  private baseUrl = '/products'

  async getByProductId(productId: number): Promise<ProductDefaultMaterialResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<ProductDefaultMaterialResponse[]>>(
        `${this.baseUrl}/${productId}/default-materials`
      )
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch default materials: ${error.message}`)
      }
      throw error
    }
  }

  async saveDefaults(productId: number, data: SaveProductDefaultMaterialsRequest): Promise<void> {
    try {
      const response = await apiClient.post<ApiResponse<boolean>>(
        `${this.baseUrl}/${productId}/default-materials`,
        data
      )
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to save default materials')
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to save default materials: ${error.message}`)
      }
      throw error
    }
  }
}

export const productDefaultMaterialService = new ProductDefaultMaterialService()
