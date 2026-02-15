import axios from 'axios'
import { apiClient, ApiResponse } from './axios-config'
import { Product } from '@/types/product'

export interface CreateProductRequest {
  customerName?: string
  modelId: number
  rollerType: string
  diameter: number
  length: number
  materialGrade?: string
  drawingNo?: string
  revisionNo?: string
  revisionDate?: string
  numberOfTeeth?: number | null
  surfaceFinish?: string
  hardness?: string
  productTemplateId?: number
  processTemplateId: number
  assemblyDrawingId?: number
  customerProvidedDrawingId?: number
  createdBy?: string
  requestDrawing?: boolean
}

export interface UpdateProductRequest extends CreateProductRequest {
  id: number
  partCode: string
  updatedBy?: string
}

export interface UpdateDrawingReviewStatusRequest {
  drawingReviewStatus: string
  drawingReviewNotes?: string
  drawingReviewedBy: string
}

export interface LinkChildPartDrawingRequest {
  childPartTemplateId: number
  drawingId: number
  createdBy?: string
}

export interface ProductChildPartDrawingResponse {
  id: number
  productId: number
  childPartTemplateId: number
  childPartTemplateName?: string
  drawingId: number
  drawingNumber?: string
  drawingName?: string
  fileName?: string
  fileType?: string
  fileUrl?: string
  fileSize?: number
  status?: string
  createdAt: string
  createdBy?: string
}

class ProductService {
  private baseUrl = '/products'

  async getAll(): Promise<Product[]> {
    try {
      const response = await apiClient.get<ApiResponse<Product[]>>(this.baseUrl)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch products: ${error.message}`)
      }
      throw error
    }
  }

  async getById(id: number): Promise<Product> {
    try {
      const response = await apiClient.get<ApiResponse<Product>>(`${this.baseUrl}/${id}`)
      if (!response.data.data) {
        throw new Error('Product not found')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch product: ${error.message}`)
      }
      throw error
    }
  }

  async getByCode(code: string): Promise<Product> {
    try {
      const response = await apiClient.get<ApiResponse<Product>>(`${this.baseUrl}/by-code/${code}`)
      if (!response.data.data) {
        throw new Error('Product not found')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch product: ${error.message}`)
      }
      throw error
    }
  }

  async searchByCriteria(modelId: number, rollerType: string, numberOfTeeth: number): Promise<Product[]> {
    try {
      const response = await apiClient.get<ApiResponse<Product[]>>(
        `${this.baseUrl}/search-by-criteria`,
        {
          params: {
            modelId,
            rollerType,
            numberOfTeeth,
          },
        }
      )
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to search products: ${error.message}`)
      }
      throw error
    }
  }

  async create(data: CreateProductRequest): Promise<{ id: number; message: string }> {
    try {
      const response = await apiClient.post<ApiResponse<number>>(this.baseUrl, {
        ...data,
        createdBy: data.createdBy || 'Admin',
      })
      if (!response.data.data) {
        throw new Error('Failed to create product')
      }
      return { id: response.data.data, message: response.data.message || 'Product created successfully' }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to create product: ${error.message}`)
      }
      throw error
    }
  }

  async update(id: number, data: UpdateProductRequest): Promise<Product> {
    try {
      const response = await apiClient.put<ApiResponse<Product>>(`${this.baseUrl}/${id}`, {
        ...data,
        id: id,
        updatedBy: data.updatedBy || 'Admin',
      })
      if (!response.data.data) {
        throw new Error('Failed to update product')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to update product: ${error.message}`)
      }
      throw error
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/${id}`)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to delete product: ${error.message}`)
      }
      throw error
    }
  }

  async updateDrawingReviewStatus(id: number, data: UpdateDrawingReviewStatusRequest): Promise<void> {
    try {
      const response = await apiClient.put<ApiResponse<boolean>>(
        `${this.baseUrl}/${id}/drawing-review-status`,
        data
      )
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update drawing review status')
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to update drawing review status: ${error.message}`)
      }
      throw error
    }
  }

  async requestDrawing(id: number, requestedBy: string): Promise<void> {
    try {
      const response = await apiClient.post<ApiResponse<boolean>>(
        `${this.baseUrl}/${id}/request-drawing`,
        { requestedBy }
      )
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to request drawing')
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to request drawing: ${error.message}`)
      }
      throw error
    }
  }

  async linkChildPartDrawing(productId: number, request: LinkChildPartDrawingRequest): Promise<number> {
    try {
      const response = await apiClient.post<ApiResponse<number>>(
        `${this.baseUrl}/${productId}/child-part-drawings`,
        request
      )
      if (!response.data.success || response.data.data === undefined) {
        throw new Error(response.data.message || 'Failed to link child part drawing')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to link child part drawing: ${error.message}`)
      }
      throw error
    }
  }

  async getChildPartDrawings(productId: number): Promise<ProductChildPartDrawingResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<ProductChildPartDrawingResponse[]>>(
        `${this.baseUrl}/${productId}/child-part-drawings`
      )
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch child part drawings: ${error.message}`)
      }
      throw error
    }
  }
}

export const productService = new ProductService()
