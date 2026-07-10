import axios from 'axios'
import { apiClient, ApiResponse } from './axios-config'

export interface ProductDefaultComponentResponse {
  id: number
  productId: number
  componentId: number
  componentName?: string | null
  partNumber?: string | null
  noOfPieces: number
  uom?: string | null
  notes?: string | null
}

export interface ProductDefaultComponentItem {
  componentId: number
  componentName?: string | null
  partNumber?: string | null
  noOfPieces: number
  uom?: string | null
  notes?: string | null
}

export interface SaveProductDefaultComponentsRequest {
  components: ProductDefaultComponentItem[]
  updatedBy?: string
}

class ProductDefaultComponentService {
  private baseUrl = '/products'

  async getByProductId(productId: number): Promise<ProductDefaultComponentResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<ProductDefaultComponentResponse[]>>(
        `${this.baseUrl}/${productId}/default-components`
      )
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch default components: ${error.message}`)
      }
      throw error
    }
  }

  async saveDefaults(productId: number, data: SaveProductDefaultComponentsRequest): Promise<void> {
    try {
      const response = await apiClient.post<ApiResponse<boolean>>(
        `${this.baseUrl}/${productId}/default-components`,
        data
      )
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to save default components')
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to save default components: ${error.message}`)
      }
      throw error
    }
  }
}

export const productDefaultComponentService = new ProductDefaultComponentService()
