import axios from 'axios'
import { Product } from '@/types/product'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5217/api'

export interface CreateProductRequest {
  customerName?: string
  modelName: string
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
  processTemplateId: number
  createdBy?: string
}

export interface UpdateProductRequest extends CreateProductRequest {
  id: number
  partCode: string
  updatedBy?: string
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data?: T
}

class ProductService {
  private baseUrl = `${API_BASE_URL}/products`

  async getAll(): Promise<Product[]> {
    try {
      const response = await axios.get<ApiResponse<Product[]>>(this.baseUrl)
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
      const response = await axios.get<ApiResponse<Product>>(`${this.baseUrl}/${id}`)
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
      const response = await axios.get<ApiResponse<Product>>(`${this.baseUrl}/by-code/${code}`)
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

  async create(data: CreateProductRequest): Promise<Product> {
    try {
      const response = await axios.post<ApiResponse<Product>>(this.baseUrl, {
        ...data,
        createdBy: data.createdBy || 'Admin',
      })
      if (!response.data.data) {
        throw new Error('Failed to create product')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to create product: ${error.message}`)
      }
      throw error
    }
  }

  async update(id: number, data: UpdateProductRequest): Promise<Product> {
    try {
      const response = await axios.put<ApiResponse<Product>>(`${this.baseUrl}/${id}`, {
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
      await axios.delete(`${this.baseUrl}/${id}`)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to delete product: ${error.message}`)
      }
      throw error
    }
  }
}

export const productService = new ProductService()
