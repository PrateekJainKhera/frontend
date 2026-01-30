import axios from 'axios'
import { apiClient, ApiResponse } from './axios-config'

export interface CreateMaterialRequest {
  materialName: string
  grade: string
  shape: string
  diameter: number
  lengthInMM: number
  density: number
  weightKG: number
  isActive?: boolean
  createdBy?: string | null
}

export interface UpdateMaterialRequest extends CreateMaterialRequest {
  id: number
  updatedBy?: string | null
}

export interface MaterialResponse {
  id: number
  materialCode: string
  materialName: string
  grade: string
  shape: string
  diameter: number
  lengthInMM: number
  density: number
  weightKG: number
  isActive: boolean
  createdAt: string
  createdBy?: string | null
  updatedAt?: string | null
  updatedBy?: string | null
}

class MaterialService {
  private baseUrl = '/materials'

  async getAll(): Promise<MaterialResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<MaterialResponse[]>>(this.baseUrl)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch materials: ${error.message}`)
      }
      throw error
    }
  }

  async getById(id: number): Promise<MaterialResponse> {
    try {
      const response = await apiClient.get<ApiResponse<MaterialResponse>>(`${this.baseUrl}/${id}`)
      if (!response.data.data) {
        throw new Error('Material not found')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch material: ${error.message}`)
      }
      throw error
    }
  }

  async searchByName(searchTerm: string): Promise<MaterialResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<MaterialResponse[]>>(`${this.baseUrl}/search`, {
        params: { searchTerm },
      })
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to search materials: ${error.message}`)
      }
      throw error
    }
  }

  async getByGrade(grade: string): Promise<MaterialResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<MaterialResponse[]>>(`${this.baseUrl}/by-grade/${grade}`)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch materials by grade: ${error.message}`)
      }
      throw error
    }
  }

  async getByShape(shape: string): Promise<MaterialResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<MaterialResponse[]>>(`${this.baseUrl}/by-shape/${shape}`)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch materials by shape: ${error.message}`)
      }
      throw error
    }
  }

  async create(data: CreateMaterialRequest): Promise<MaterialResponse> {
    try {
      const response = await apiClient.post<ApiResponse<MaterialResponse>>(this.baseUrl, {
        ...data,
        isActive: data.isActive ?? true,
        createdBy: data.createdBy || 'Admin',
      })
      if (!response.data.data) {
        throw new Error('Failed to create material')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to create material: ${error.message}`)
      }
      throw error
    }
  }

  async update(id: number, data: UpdateMaterialRequest): Promise<MaterialResponse> {
    try {
      const response = await apiClient.put<ApiResponse<MaterialResponse>>(`${this.baseUrl}/${id}`, {
        ...data,
        id: id,
        updatedBy: data.updatedBy || 'Admin',
      })
      if (!response.data.data) {
        throw new Error('Failed to update material')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to update material: ${error.message}`)
      }
      throw error
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/${id}`)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to delete material: ${error.message}`)
      }
      throw error
    }
  }
}

export const materialService = new MaterialService()
