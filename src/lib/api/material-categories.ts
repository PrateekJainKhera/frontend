import axios from 'axios'
import { apiClient, ApiResponse } from './axios-config'

export interface CreateMaterialCategoryRequest {
  categoryName: string
  quality: string
  description: string
  defaultUOM: string
  materialType: 'raw_material' | 'component'
  isActive?: boolean
  createdBy?: string | null
}

export interface UpdateMaterialCategoryRequest extends CreateMaterialCategoryRequest {
  id: number
  categoryCode: string
  updatedBy?: string | null
}

export interface MaterialCategoryResponse {
  id: number
  categoryCode: string
  categoryName: string
  quality: string
  description: string
  defaultUOM: string
  materialType: 'raw_material' | 'component'
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy?: string | null
  updatedBy?: string | null
}

class MaterialCategoryService {
  private baseUrl = '/materialcategories'

  async getAll(): Promise<MaterialCategoryResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<MaterialCategoryResponse[]>>(this.baseUrl)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch material categories: ${error.message}`)
      }
      throw error
    }
  }

  async getById(id: number): Promise<MaterialCategoryResponse> {
    try {
      const response = await apiClient.get<ApiResponse<MaterialCategoryResponse>>(`${this.baseUrl}/${id}`)
      if (!response.data.data) {
        throw new Error('Material category not found')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch material category: ${error.message}`)
      }
      throw error
    }
  }

  async getByCategoryCode(categoryCode: string): Promise<MaterialCategoryResponse> {
    try {
      const response = await apiClient.get<ApiResponse<MaterialCategoryResponse>>(
        `${this.baseUrl}/by-code/${categoryCode}`
      )
      if (!response.data.data) {
        throw new Error('Material category not found')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch material category: ${error.message}`)
      }
      throw error
    }
  }

  async getByMaterialType(materialType: 'raw_material' | 'component'): Promise<MaterialCategoryResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<MaterialCategoryResponse[]>>(
        `${this.baseUrl}/by-material-type/${materialType}`
      )
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch categories by type: ${error.message}`)
      }
      throw error
    }
  }

  async getActive(): Promise<MaterialCategoryResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<MaterialCategoryResponse[]>>(`${this.baseUrl}/active`)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch active categories: ${error.message}`)
      }
      throw error
    }
  }

  async search(searchTerm: string): Promise<MaterialCategoryResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<MaterialCategoryResponse[]>>(
        `${this.baseUrl}/search?searchTerm=${encodeURIComponent(searchTerm)}`
      )
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to search categories: ${error.message}`)
      }
      throw error
    }
  }

  async create(data: CreateMaterialCategoryRequest): Promise<MaterialCategoryResponse> {
    try {
      const response = await apiClient.post<ApiResponse<MaterialCategoryResponse>>(this.baseUrl, {
        ...data,
        createdBy: data.createdBy || 'Admin',
      })
      if (!response.data.data) {
        throw new Error('Failed to create material category')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to create material category: ${error.message}`)
      }
      throw error
    }
  }

  async update(id: number, data: UpdateMaterialCategoryRequest): Promise<MaterialCategoryResponse> {
    try {
      const response = await apiClient.put<ApiResponse<MaterialCategoryResponse>>(`${this.baseUrl}/${id}`, {
        ...data,
        id: id,
        updatedBy: data.updatedBy || 'Admin',
      })
      if (!response.data.data) {
        throw new Error('Failed to update material category')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to update material category: ${error.message}`)
      }
      throw error
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/${id}`)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to delete material category: ${error.message}`)
      }
      throw error
    }
  }
}

export const materialCategoryService = new MaterialCategoryService()
