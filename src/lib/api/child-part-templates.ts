import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5217/api'

export interface ChildPartTemplateMaterialRequirementRequest {
  rawMaterialId?: number | null
  rawMaterialName: string
  materialGrade: string
  quantityRequired: number
  unit: string
  wastagePercent?: number
}

export interface ChildPartTemplateProcessStepRequest {
  processId?: number | null
  processName: string
  stepNumber: number
  machineName?: string | null
  standardTimeHours: number
  restTimeHours?: number | null
  description?: string | null
}

export interface CreateChildPartTemplateRequest {
  templateName: string
  childPartType: string
  rollerType: string
  drawingNumber?: string | null
  drawingRevision?: string | null
  length?: number | null
  diameter?: number | null
  innerDiameter?: number | null
  outerDiameter?: number | null
  thickness?: number | null
  dimensionUnit?: string
  materialRequirements: ChildPartTemplateMaterialRequirementRequest[]
  processSteps: ChildPartTemplateProcessStepRequest[]
  description?: string | null
  technicalNotes?: string | null
  isActive?: boolean
  createdBy?: string | null
}

export interface UpdateChildPartTemplateRequest extends CreateChildPartTemplateRequest {
  id: number
  updatedBy?: string | null
}

export interface ChildPartTemplateMaterialRequirementResponse {
  id: number
  rawMaterialId?: number | null
  rawMaterialName: string
  materialGrade: string
  quantityRequired: number
  unit: string
  wastagePercent: number
}

export interface ChildPartTemplateProcessStepResponse {
  id: number
  processId?: number | null
  processName: string
  stepNumber: number
  machineName?: string | null
  standardTimeHours: number
  restTimeHours?: number | null
  description?: string | null
}

export interface ChildPartTemplateResponse {
  id: number
  templateCode: string
  templateName: string
  childPartType: string
  rollerType: string
  drawingNumber?: string | null
  drawingRevision?: string | null
  length?: number | null
  diameter?: number | null
  innerDiameter?: number | null
  outerDiameter?: number | null
  thickness?: number | null
  dimensionUnit: string
  materialRequirements: ChildPartTemplateMaterialRequirementResponse[]
  processSteps: ChildPartTemplateProcessStepResponse[]
  totalStandardTimeHours: number
  description?: string | null
  technicalNotes?: string | null
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

class ChildPartTemplateService {
  private baseUrl = `${API_BASE_URL}/child-part-templates`

  async getAll(): Promise<ChildPartTemplateResponse[]> {
    try {
      const response = await axios.get<ApiResponse<ChildPartTemplateResponse[]>>(this.baseUrl)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch child part templates: ${error.message}`)
      }
      throw error
    }
  }

  async getById(id: number): Promise<ChildPartTemplateResponse> {
    try {
      const response = await axios.get<ApiResponse<ChildPartTemplateResponse>>(`${this.baseUrl}/${id}`)
      if (!response.data.data) {
        throw new Error('Child part template not found')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch child part template: ${error.message}`)
      }
      throw error
    }
  }

  async getByCode(templateCode: string): Promise<ChildPartTemplateResponse> {
    try {
      const response = await axios.get<ApiResponse<ChildPartTemplateResponse>>(
        `${this.baseUrl}/by-code/${templateCode}`
      )
      if (!response.data.data) {
        throw new Error('Child part template not found')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch child part template: ${error.message}`)
      }
      throw error
    }
  }

  async getByName(templateName: string): Promise<ChildPartTemplateResponse> {
    try {
      const response = await axios.get<ApiResponse<ChildPartTemplateResponse>>(
        `${this.baseUrl}/by-name/${templateName}`
      )
      if (!response.data.data) {
        throw new Error('Child part template not found')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch child part template: ${error.message}`)
      }
      throw error
    }
  }

  async getActiveTemplates(): Promise<ChildPartTemplateResponse[]> {
    try {
      const response = await axios.get<ApiResponse<ChildPartTemplateResponse[]>>(`${this.baseUrl}/active`)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch active templates: ${error.message}`)
      }
      throw error
    }
  }

  async getByChildPartType(childPartType: string): Promise<ChildPartTemplateResponse[]> {
    try {
      const response = await axios.get<ApiResponse<ChildPartTemplateResponse[]>>(
        `${this.baseUrl}/by-child-part-type/${childPartType}`
      )
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || `Failed to fetch templates by child part type: ${error.message}`
        )
      }
      throw error
    }
  }

  async getByRollerType(rollerType: string): Promise<ChildPartTemplateResponse[]> {
    try {
      const response = await axios.get<ApiResponse<ChildPartTemplateResponse[]>>(
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

  async create(data: CreateChildPartTemplateRequest): Promise<ChildPartTemplateResponse> {
    try {
      const response = await axios.post<ApiResponse<ChildPartTemplateResponse>>(this.baseUrl, {
        ...data,
        dimensionUnit: data.dimensionUnit || 'mm',
        isActive: data.isActive ?? true,
        createdBy: data.createdBy || 'Admin',
      })
      if (!response.data.data) {
        throw new Error('Failed to create child part template')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to create child part template: ${error.message}`)
      }
      throw error
    }
  }

  async update(id: number, data: UpdateChildPartTemplateRequest): Promise<ChildPartTemplateResponse> {
    try {
      const response = await axios.put<ApiResponse<ChildPartTemplateResponse>>(`${this.baseUrl}/${id}`, {
        ...data,
        id: id,
        updatedBy: data.updatedBy || 'Admin',
      })
      if (!response.data.data) {
        throw new Error('Failed to update child part template')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to update child part template: ${error.message}`)
      }
      throw error
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await axios.delete(`${this.baseUrl}/${id}`)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to delete child part template: ${error.message}`)
      }
      throw error
    }
  }
}

export const childPartTemplateService = new ChildPartTemplateService()
