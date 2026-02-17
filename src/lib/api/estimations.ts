import axios from 'axios'
import { apiClient, ApiResponse } from './axios-config'
import {
  EstimationResponse,
  CreateEstimationRequest,
  ApproveEstimationRequest,
  RejectEstimationRequest,
} from '@/types/estimation'

class EstimationService {
  private baseUrl = '/estimations'

  async getAll(): Promise<EstimationResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<EstimationResponse[]>>(this.baseUrl)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch estimations: ${error.message}`)
      }
      throw error
    }
  }

  async getById(id: number): Promise<EstimationResponse> {
    try {
      const response = await apiClient.get<ApiResponse<EstimationResponse>>(`${this.baseUrl}/${id}`)
      if (!response.data.data) throw new Error('Estimation not found')
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch estimation: ${error.message}`)
      }
      throw error
    }
  }

  async getByStatus(status: string): Promise<EstimationResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<EstimationResponse[]>>(`${this.baseUrl}/by-status/${status}`)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch estimations: ${error.message}`)
      }
      throw error
    }
  }

  async create(request: CreateEstimationRequest): Promise<EstimationResponse> {
    try {
      const response = await apiClient.post<ApiResponse<EstimationResponse>>(this.baseUrl, request)
      if (!response.data.data) throw new Error(response.data.message || 'Failed to create estimation')
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to create estimation: ${error.message}`)
      }
      throw error
    }
  }

  async revise(id: number, request: CreateEstimationRequest): Promise<EstimationResponse> {
    try {
      const response = await apiClient.post<ApiResponse<EstimationResponse>>(`${this.baseUrl}/${id}/revise`, request)
      if (!response.data.data) throw new Error(response.data.message || 'Failed to revise estimation')
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to revise estimation: ${error.message}`)
      }
      throw error
    }
  }

  async submit(id: number): Promise<EstimationResponse> {
    try {
      const response = await apiClient.put<ApiResponse<EstimationResponse>>(`${this.baseUrl}/${id}/submit`)
      if (!response.data.data) throw new Error(response.data.message || 'Failed to submit')
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to submit estimation: ${error.message}`)
      }
      throw error
    }
  }

  async approve(id: number, request: ApproveEstimationRequest): Promise<EstimationResponse> {
    try {
      const response = await apiClient.put<ApiResponse<EstimationResponse>>(`${this.baseUrl}/${id}/approve`, request)
      if (!response.data.data) throw new Error(response.data.message || 'Failed to approve')
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to approve estimation: ${error.message}`)
      }
      throw error
    }
  }

  async reject(id: number, request: RejectEstimationRequest): Promise<EstimationResponse> {
    try {
      const response = await apiClient.put<ApiResponse<EstimationResponse>>(`${this.baseUrl}/${id}/reject`, request)
      if (!response.data.data) throw new Error(response.data.message || 'Failed to reject')
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to reject estimation: ${error.message}`)
      }
      throw error
    }
  }

  async convertToOrder(id: number): Promise<EstimationResponse> {
    try {
      const response = await apiClient.post<ApiResponse<EstimationResponse>>(`${this.baseUrl}/${id}/convert-to-order`)
      if (!response.data.data) throw new Error(response.data.message || 'Failed to convert')
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to convert to order: ${error.message}`)
      }
      throw error
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/${id}`)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to delete estimation: ${error.message}`)
      }
      throw error
    }
  }
}

export const estimationService = new EstimationService()
