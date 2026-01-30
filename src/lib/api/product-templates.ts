import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5217/api'

export interface ProductTemplateChildPartRequest {
  childPartName: string
  childPartCode?: string | null
  quantity: number
  unit: string
  notes?: string | null
  sequenceNo: number
  childPartTemplateId?: number | null
}

export interface CreateProductTemplateRequest {
  templateName: string
  description?: string | null
  rollerType: string
  processTemplateId: number
  childParts: ProductTemplateChildPartRequest[]
  isActive?: boolean
  createdBy?: string | null
}

export interface UpdateProductTemplateRequest extends CreateProductTemplateRequest {
  id: number
  updatedBy?: string | null
}

export interface ProductTemplateChildPartResponse {
  id: number
  productTemplateId: number
  childPartName: string
  childPartCode?: string | null
  quantity: number
  unit: string
  notes?: string | null
  sequenceNo: number
  childPartTemplateId?: number | null
}

export interface ProductTemplateResponse {
  id: number
  templateCode: string
  templateName: string
  description?: string | null
  rollerType: string
  childParts: ProductTemplateChildPartResponse[]
  processTemplateId: number
  processTemplateName: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy?: string | null
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data?: T
}

class ProductTemplateService {
  private baseUrl = `${API_BASE_URL}/product-templates`

  async getAll(): Promise<ProductTemplateResponse[]> {
    try {
      const response = await axios.get<ApiResponse<ProductTemplateResponse[]>>(this.baseUrl)
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
      const response = await axios.get<ApiResponse<ProductTemplateResponse>>(`${this.baseUrl}/${id}`)
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
      const response = await axios.get<ApiResponse<ProductTemplateResponse>>(
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
      const response = await axios.get<ApiResponse<ProductTemplateResponse>>(
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
      const response = await axios.get<ApiResponse<ProductTemplateResponse[]>>(`${this.baseUrl}/active`)
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
      const response = await axios.get<ApiResponse<ProductTemplateResponse[]>>(
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
      const response = await axios.get<ApiResponse<ProductTemplateResponse[]>>(
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
      const response = await axios.post<ApiResponse<ProductTemplateResponse>>(this.baseUrl, {
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
      const response = await axios.put<ApiResponse<ProductTemplateResponse>>(`${this.baseUrl}/${id}`, {
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
      await axios.delete(`${this.baseUrl}/${id}`)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to delete product template: ${error.message}`)
      }
      throw error
    }
  }
}

export const productTemplateService = new ProductTemplateService()
