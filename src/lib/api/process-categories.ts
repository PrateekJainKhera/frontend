import axios from 'axios'
import { apiClient, ApiResponse } from './axios-config'
import { ProcessCategory, CreateProcessCategoryRequest, UpdateProcessCategoryRequest } from '@/types/process-category'

class ProcessCategoryService {
  private baseUrl = '/process-categories'

  async getAll(): Promise<ProcessCategory[]> {
    try {
      const response = await apiClient.get<ApiResponse<ProcessCategory[]>>(this.baseUrl)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch process categories: ${error.message}`)
      }
      throw error
    }
  }

  async getById(id: number): Promise<ProcessCategory> {
    try {
      const response = await apiClient.get<ApiResponse<ProcessCategory>>(`${this.baseUrl}/${id}`)
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Process category not found')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch process category: ${error.message}`)
      }
      throw error
    }
  }

  async create(data: CreateProcessCategoryRequest): Promise<number> {
    try {
      const response = await apiClient.post<ApiResponse<number>>(this.baseUrl, data)
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create process category')
      }
      return response.data.data!
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to create process category: ${error.message}`)
      }
      throw error
    }
  }

  async update(id: number, data: UpdateProcessCategoryRequest): Promise<void> {
    try {
      const response = await apiClient.put<ApiResponse<boolean>>(`${this.baseUrl}/${id}`, { ...data, id })
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update process category')
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to update process category: ${error.message}`)
      }
      throw error
    }
  }

  async delete(id: number): Promise<void> {
    try {
      const response = await apiClient.delete<ApiResponse<boolean>>(`${this.baseUrl}/${id}`)
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete process category')
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to delete process category: ${error.message}`)
      }
      throw error
    }
  }
}

export const processCategoryService = new ProcessCategoryService()
