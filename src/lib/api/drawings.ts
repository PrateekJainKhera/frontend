import axios from 'axios'
import { apiClient, ApiResponse } from './axios-config'

export interface DrawingResponse {
  id: number
  drawingNumber: string
  drawingName: string
  drawingType: string
  revision?: string
  revisionDate?: string
  status: string
  fileName?: string
  fileType?: string
  fileUrl?: string
  fileSize?: number
  manufacturingDimensionsJSON?: string
  linkedPartId?: number
  linkedProductId?: number
  linkedCustomerId?: number
  linkedOrderId?: number
  linkedOrderNo?: string
  description?: string
  notes?: string
  isActive: boolean
  createdAt: string
  createdBy?: string
  updatedAt?: string
  updatedBy?: string
  approvedBy?: string
  approvedAt?: string
}

export interface CreateDrawingRequest {
  drawingNumber?: string
  drawingName: string
  drawingType: string
  revision?: string
  revisionDate?: string
  status: string
  manufacturingDimensionsJSON?: string
  linkedPartId?: number
  linkedProductId?: number
  linkedCustomerId?: number
  linkedOrderId?: number
  description?: string
  notes?: string
}

export interface BulkUploadResult {
  fileName: string
  success: boolean
  drawingNumber?: string
  drawingId?: number
  message?: string
}

class DrawingService {
  private baseUrl = '/drawings'

  async getAll(): Promise<DrawingResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<DrawingResponse[]>>(this.baseUrl)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch drawings: ${error.message}`)
      }
      throw error
    }
  }

  async getById(id: number): Promise<DrawingResponse> {
    try {
      const response = await apiClient.get<ApiResponse<DrawingResponse>>(`${this.baseUrl}/${id}`)
      if (!response.data.data) throw new Error('Drawing not found')
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch drawing: ${error.message}`)
      }
      throw error
    }
  }

  async getByOrderId(orderId: number): Promise<DrawingResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<DrawingResponse[]>>(`/orders/${orderId}/drawings`)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch drawings for order: ${error.message}`)
      }
      throw error
    }
  }

  async create(data: CreateDrawingRequest): Promise<number> {
    try {
      const response = await apiClient.post<ApiResponse<number>>(this.baseUrl, data)
      if (!response.data.success) throw new Error(response.data.message)
      return response.data.data!
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to create drawing: ${error.message}`)
      }
      throw error
    }
  }

  async update(id: number, data: CreateDrawingRequest): Promise<boolean> {
    try {
      const response = await apiClient.put<ApiResponse<boolean>>(`${this.baseUrl}/${id}`, { ...data, id })
      if (!response.data.success) throw new Error(response.data.message)
      return response.data.data!
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to update drawing: ${error.message}`)
      }
      throw error
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/${id}`)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to delete drawing: ${error.message}`)
      }
      throw error
    }
  }

  // Upload single drawing with file
  async upload(file: File, metadata: CreateDrawingRequest): Promise<number> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      // Append each metadata field individually for [FromForm] binding
      if (metadata.drawingNumber) formData.append('drawingNumber', metadata.drawingNumber)
      formData.append('drawingName', metadata.drawingName)
      formData.append('drawingType', metadata.drawingType)
      if (metadata.revision) formData.append('revision', metadata.revision)
      if (metadata.revisionDate) formData.append('revisionDate', metadata.revisionDate)
      formData.append('status', metadata.status)
      if (metadata.manufacturingDimensionsJSON) formData.append('manufacturingDimensionsJSON', metadata.manufacturingDimensionsJSON)
      if (metadata.linkedPartId) formData.append('linkedPartId', metadata.linkedPartId.toString())
      if (metadata.linkedProductId) formData.append('linkedProductId', metadata.linkedProductId.toString())
      if (metadata.linkedCustomerId) formData.append('linkedCustomerId', metadata.linkedCustomerId.toString())
      if (metadata.description) formData.append('description', metadata.description)
      if (metadata.notes) formData.append('notes', metadata.notes)

      const response = await apiClient.post<ApiResponse<number>>(`${this.baseUrl}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      if (!response.data.success) throw new Error(response.data.message)
      return response.data.data!
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to upload drawing: ${error.message}`)
      }
      throw error
    }
  }

  // Bulk upload multiple files linked to a product/customer
  async bulkUpload(files: FileList | File[], linkedProductId?: number, linkedCustomerId?: number): Promise<BulkUploadResult[]> {
    try {
      const formData = new FormData()
      Array.from(files).forEach((file) => formData.append('files', file))
      if (linkedProductId) formData.append('linkedProductId', linkedProductId.toString())
      if (linkedCustomerId) formData.append('linkedCustomerId', linkedCustomerId.toString())

      const response = await apiClient.post<ApiResponse<BulkUploadResult[]>>(`${this.baseUrl}/bulk-upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to bulk upload: ${error.message}`)
      }
      throw error
    }
  }
}

export const drawingService = new DrawingService()
