import axios from 'axios'
import { apiClient, ApiResponse } from './axios-config'

export interface ProductTemplateBOMItemRequest {
  childPartTemplateId: number
  quantity: number
  notes?: string | null
  sequenceNumber?: number | null
}

export interface CreateProductTemplateRequest {
  templateName: string
  templateCode?: string | null
  description?: string | null
  rollerType: string
  processTemplateId: number
  drawingNumber?: string | null
  drawingRevision?: string | null
  length?: number | null
  diameter?: number | null
  coreDiameter?: number | null
  shaftDiameter?: number | null
  weight?: number | null
  dimensionUnit?: string
  technicalNotes?: string | null
  qualityCheckpoints?: string | null
  bomItems: ProductTemplateBOMItemRequest[]
  isActive?: boolean
  createdBy?: string | null
}

export interface UpdateProductTemplateRequest {
  templateName: string
  description?: string | null
  drawingNumber?: string | null
  drawingRevision?: string | null
  processTemplateId: number
  length?: number | null
  diameter?: number | null
  coreDiameter?: number | null
  shaftDiameter?: number | null
  weight?: number | null
  dimensionUnit?: string
  technicalNotes?: string | null
  qualityCheckpoints?: string | null
  bomItems: ProductTemplateBOMItemRequest[]
  isActive: boolean
  updatedBy?: string | null
}

export interface ProductTemplateBOMItemResponse {
  id: number
  childPartTemplateId: number
  childPartTemplateName: string
  childPartTemplateCode: string
  childPartType: string
  quantity: number
  notes?: string | null
  sequenceNumber?: number | null
}

export interface ProductTemplateResponse {
  id: number
  templateCode: string
  templateName: string
  description?: string | null
  rollerType: string
  processTemplateId: number
  processTemplateName: string
  drawingNumber?: string | null
  drawingRevision?: string | null
  length?: number | null
  diameter?: number | null
  coreDiameter?: number | null
  shaftDiameter?: number | null
  weight?: number | null
  dimensionUnit?: string
  technicalNotes?: string | null
  qualityCheckpoints?: string | null
  bomItems: ProductTemplateBOMItemResponse[]
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy?: string | null
}

class ProductTemplateService {
  private baseUrl = '/product-templates'

  async getAll(): Promise<ProductTemplateResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<ProductTemplateResponse[]>>(this.baseUrl)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch product templates: ${error.message}`)
      }
      throw error
    }
  }

  async getById(id: number): Promise<ProductTemplateResponse> {
    try {
      const response = await apiClient.get<ApiResponse<ProductTemplateResponse>>(`${this.baseUrl}/${id}`)
      if (!response.data.data) {
        throw new Error('Product template not found')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch product template: ${error.message}`)
      }
      throw error
    }
  }

  async getByCode(templateCode: string): Promise<ProductTemplateResponse> {
    try {
      const response = await apiClient.get<ApiResponse<ProductTemplateResponse>>(
        `${this.baseUrl}/by-code/${templateCode}`
      )
      if (!response.data.data) {
        throw new Error('Product template not found')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch product template: ${error.message}`)
      }
      throw error
    }
  }

  async getByName(templateName: string): Promise<ProductTemplateResponse> {
    try {
      const response = await apiClient.get<ApiResponse<ProductTemplateResponse>>(
        `${this.baseUrl}/by-name/${templateName}`
      )
      if (!response.data.data) {
        throw new Error('Product template not found')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch product template: ${error.message}`)
      }
      throw error
    }
  }

  async getActiveTemplates(): Promise<ProductTemplateResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<ProductTemplateResponse[]>>(`${this.baseUrl}/active`)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch active templates: ${error.message}`)
      }
      throw error
    }
  }

  async getByRollerType(rollerType: string): Promise<ProductTemplateResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<ProductTemplateResponse[]>>(
        `${this.baseUrl}/by-roller-type/${rollerType}`
      )
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch templates by roller type: ${error.message}`)
      }
      throw error
    }
  }

  async getByProcessTemplateId(processTemplateId: number): Promise<ProductTemplateResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<ProductTemplateResponse[]>>(
        `${this.baseUrl}/by-process-template/${processTemplateId}`
      )
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || `Failed to fetch templates by process template: ${error.message}`
        )
      }
      throw error
    }
  }

  async create(data: CreateProductTemplateRequest): Promise<ProductTemplateResponse> {
    try {
      const response = await apiClient.post<ApiResponse<ProductTemplateResponse>>(this.baseUrl, {
        ...data,
        isActive: data.isActive ?? true,
        createdBy: data.createdBy || 'Admin',
      })
      if (!response.data.data) {
        throw new Error('Failed to create product template')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to create product template: ${error.message}`)
      }
      throw error
    }
  }

  async update(id: number, data: UpdateProductTemplateRequest): Promise<ProductTemplateResponse> {
    try {
      const response = await apiClient.put<ApiResponse<ProductTemplateResponse>>(`${this.baseUrl}/${id}`, {
        ...data,
        id: id,
        updatedBy: data.updatedBy || 'Admin',
      })
      if (!response.data.data) {
        throw new Error('Failed to update product template')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to update product template: ${error.message}`)
      }
      throw error
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/${id}`)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to delete product template: ${error.message}`)
      }
      throw error
    }
  }
}

export const productTemplateService = new ProductTemplateService()
