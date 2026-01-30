import axios from 'axios'
import { apiClient, ApiResponse } from './axios-config'

export interface ProcessTemplateStepRequest {
  templateId: number
  stepNo: number
  processId: number
  isMandatory: boolean
  canBeParallel: boolean
}

export interface CreateProcessTemplateRequest {
  templateName: string
  description?: string
  applicableTypes: string[]
  steps: Omit<ProcessTemplateStepRequest, 'templateId'>[]
  isActive?: boolean
  createdBy?: string
}

export interface UpdateProcessTemplateRequest extends CreateProcessTemplateRequest {
  id: number
  updatedBy?: string
}

export interface ProcessTemplateStepResponse {
  id: number
  templateId: number
  stepNo: number
  processId: number
  processName?: string
  isMandatory: boolean
  canBeParallel: boolean
}

export interface ProcessTemplateResponse {
  id: number
  templateName: string
  description?: string
  applicableTypes: string[]
  isActive: boolean
  createdAt: string
  createdBy?: string
  updatedAt: string
}

export interface ProcessTemplateWithStepsResponse {
  template: ProcessTemplateResponse
  steps: ProcessTemplateStepResponse[]
}

class ProcessTemplateService {
  private baseUrl = '/process-templates'

  // Template CRUD Operations
  async getAll(): Promise<ProcessTemplateResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<ProcessTemplateResponse[]>>(this.baseUrl)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch process templates: ${error.message}`)
      }
      throw error
    }
  }

  async getById(id: number): Promise<ProcessTemplateResponse> {
    try {
      const response = await apiClient.get<ApiResponse<ProcessTemplateResponse>>(`${this.baseUrl}/${id}`)
      if (!response.data.data) {
        throw new Error('Process template not found')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch process template: ${error.message}`)
      }
      throw error
    }
  }

  async getByName(templateName: string): Promise<ProcessTemplateResponse> {
    try {
      const response = await apiClient.get<ApiResponse<ProcessTemplateResponse>>(`${this.baseUrl}/by-name/${templateName}`)
      if (!response.data.data) {
        throw new Error('Process template not found')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch process template: ${error.message}`)
      }
      throw error
    }
  }

  async getActiveTemplates(): Promise<ProcessTemplateResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<ProcessTemplateResponse[]>>(`${this.baseUrl}/active`)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch active templates: ${error.message}`)
      }
      throw error
    }
  }

  async getByApplicableType(applicableType: string): Promise<ProcessTemplateResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<ProcessTemplateResponse[]>>(
        `${this.baseUrl}/by-applicable-type/${applicableType}`
      )
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch templates by type: ${error.message}`)
      }
      throw error
    }
  }

  async create(data: CreateProcessTemplateRequest): Promise<ProcessTemplateResponse> {
    try {
      const response = await apiClient.post<ApiResponse<ProcessTemplateResponse>>(this.baseUrl, {
        ...data,
        createdBy: data.createdBy || 'Admin',
      })
      if (!response.data.data) {
        throw new Error('Failed to create process template')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to create process template: ${error.message}`)
      }
      throw error
    }
  }

  async update(id: number, data: UpdateProcessTemplateRequest): Promise<ProcessTemplateResponse> {
    try {
      const response = await apiClient.put<ApiResponse<ProcessTemplateResponse>>(`${this.baseUrl}/${id}`, {
        ...data,
        id: id,
        updatedBy: data.updatedBy || 'Admin',
      })
      if (!response.data.data) {
        throw new Error('Failed to update process template')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to update process template: ${error.message}`)
      }
      throw error
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/${id}`)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to delete process template: ${error.message}`)
      }
      throw error
    }
  }

  // Template with Steps Operations
  async getTemplateWithSteps(id: number): Promise<ProcessTemplateWithStepsResponse> {
    try {
      const response = await apiClient.get<ApiResponse<ProcessTemplateWithStepsResponse>>(
        `${this.baseUrl}/${id}/with-steps`
      )
      if (!response.data.data) {
        throw new Error('Process template not found')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch template with steps: ${error.message}`)
      }
      throw error
    }
  }

  async createWithSteps(data: CreateProcessTemplateRequest): Promise<ProcessTemplateWithStepsResponse> {
    try {
      const response = await apiClient.post<ApiResponse<ProcessTemplateWithStepsResponse>>(
        `${this.baseUrl}/with-steps`,
        {
          ...data,
          createdBy: data.createdBy || 'Admin',
        }
      )
      if (!response.data.data) {
        throw new Error('Failed to create process template with steps')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || `Failed to create process template with steps: ${error.message}`
        )
      }
      throw error
    }
  }

  // Template Steps Operations
  async getStepsByTemplateId(templateId: number): Promise<ProcessTemplateStepResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<ProcessTemplateStepResponse[]>>(
        `${this.baseUrl}/${templateId}/steps`
      )
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch template steps: ${error.message}`)
      }
      throw error
    }
  }

  async addStep(data: ProcessTemplateStepRequest): Promise<number> {
    try {
      const response = await apiClient.post<ApiResponse<number>>(`${this.baseUrl}/steps`, data)
      if (!response.data.data) {
        throw new Error('Failed to add step')
      }
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to add step: ${error.message}`)
      }
      throw error
    }
  }

  async updateStep(
    stepId: number,
    data: ProcessTemplateStepRequest & { id: number }
  ): Promise<boolean> {
    try {
      const response = await apiClient.put<ApiResponse<boolean>>(`${this.baseUrl}/steps/${stepId}`, data)
      return response.data.data || false
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to update step: ${error.message}`)
      }
      throw error
    }
  }

  async deleteStep(stepId: number): Promise<boolean> {
    try {
      const response = await apiClient.delete<ApiResponse<boolean>>(`${this.baseUrl}/steps/${stepId}`)
      return response.data.data || false
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to delete step: ${error.message}`)
      }
      throw error
    }
  }
}

export const processTemplateService = new ProcessTemplateService()
