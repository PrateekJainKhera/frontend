import { apiClient, ApiResponse } from './axios-config'

// Material Requisition Types
export interface MaterialRequisitionResponse {
  id: number
  requisitionNo: string
  requisitionDate: string
  jobCardId?: number
  jobCardNo?: string
  orderId?: number
  orderNo?: string
  customerName?: string
  status: string // Pending, Approved, Rejected, Issued, Completed, Cancelled
  priority: string // Low, Medium, High, Urgent
  dueDate?: string
  requestedBy?: string
  approvedBy?: string
  approvalDate?: string
  remarks?: string
  createdAt: string
  createdBy?: string
}

export interface MaterialRequisitionItemResponse {
  id: number
  requisitionId: number
  lineNo: number
  materialId: number
  materialCode?: string
  materialName?: string
  materialGrade?: string
  quantityRequired: number
  uom?: string
  lengthRequiredMM?: number
  diameterMM?: number
  numberOfPieces?: number
  quantityAllocated?: number
  quantityIssued?: number
  quantityPending?: number
  status: string
  allocatedAt?: string
  issuedAt?: string
  jobCardId?: number
  jobCardNo?: string
  processId?: number
  processName?: string
  selectedPieceIds?: number[] // Pre-selected material piece IDs
  remarks?: string
  createdAt: string
}

export interface MaterialAllocationResponse {
  id: number
  requisitionId: number
  requisitionItemId: number
  materialPieceId: number
  pieceNo?: string
  allocatedQuantity: number
  allocatedLengthMM?: number
  allocatedWeightKG?: number
  status: string
  allocatedAt: string
  allocatedBy?: string
  isIssued: boolean
  issuedAt?: string
  actualConsumedQuantity?: number
  actualConsumedLengthMM?: number
  remainingQuantity?: number
  remainingLengthMM?: number
  remarks?: string
  createdAt: string
}

export interface CreateMaterialRequisitionItemRequest {
  lineNo: number
  materialId: number
  materialCode?: string
  materialName?: string
  materialGrade?: string
  quantityRequired: number
  uom?: string
  lengthRequiredMM?: number
  diameterMM?: number
  numberOfPieces?: number
  jobCardId?: number
  jobCardNo?: string
  processId?: number
  processName?: string
  selectedPieceIds?: number[] // Pre-selected material piece IDs for allocation
  remarks?: string
}

export interface CreateMaterialRequisitionRequest {
  requisitionNo: string
  requisitionDate: string
  jobCardId?: number
  jobCardNo?: string
  orderId?: number
  orderNo?: string
  customerName?: string
  priority?: string
  dueDate?: string
  requestedBy?: string
  remarks?: string
  createdBy?: string
  items?: CreateMaterialRequisitionItemRequest[]
}

export interface UpdateMaterialRequisitionRequest {
  id: number
  requisitionNo: string
  requisitionDate: string
  jobCardId?: number
  jobCardNo?: string
  orderId?: number
  orderNo?: string
  customerName?: string
  status: string
  priority: string
  dueDate?: string
  requestedBy?: string
  approvedBy?: string
  approvalDate?: string
  remarks?: string
}

export interface AllocateMaterialRequest {
  requisitionId: number
  materialId: number
  requiredQuantityMM: number
}

export interface IssueMaterialRequest {
  requisitionId: number
  jobCardId: number
  issuedBy: string
  receivedBy: string
}

class MaterialRequisitionService {
  private baseURL = '/stores/MaterialRequisitions'

  // Get all requisitions
  async getAll(): Promise<MaterialRequisitionResponse[]> {
    const response = await apiClient.get<ApiResponse<MaterialRequisitionResponse[]>>(this.baseURL)
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch material requisitions')
    }
    return response.data.data || []
  }

  // Get requisition by ID
  async getById(id: number): Promise<MaterialRequisitionResponse> {
    const response = await apiClient.get<ApiResponse<MaterialRequisitionResponse>>(`${this.baseURL}/${id}`)
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch material requisition')
    }
    return response.data.data
  }

  // Get requisition items by requisition ID
  async getItems(requisitionId: number): Promise<MaterialRequisitionItemResponse[]> {
    const response = await apiClient.get<ApiResponse<MaterialRequisitionItemResponse[]>>(
      `${this.baseURL}/${requisitionId}/items`
    )
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch requisition items')
    }
    return response.data.data || []
  }

  // Get by requisition number
  async getByRequisitionNo(requisitionNo: string): Promise<MaterialRequisitionResponse> {
    const response = await apiClient.get<ApiResponse<MaterialRequisitionResponse>>(
      `${this.baseURL}/by-requisition-no/${requisitionNo}`
    )
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch material requisition')
    }
    return response.data.data
  }

  // Get by job card ID
  async getByJobCardId(jobCardId: number): Promise<MaterialRequisitionResponse[]> {
    const response = await apiClient.get<ApiResponse<MaterialRequisitionResponse[]>>(
      `${this.baseURL}/by-job-card/${jobCardId}`
    )
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch requisitions')
    }
    return response.data.data || []
  }

  // Get by order ID
  async getByOrderId(orderId: number): Promise<MaterialRequisitionResponse[]> {
    const response = await apiClient.get<ApiResponse<MaterialRequisitionResponse[]>>(
      `${this.baseURL}/by-order/${orderId}`
    )
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch requisitions')
    }
    return response.data.data || []
  }

  // Get by status
  async getByStatus(status: string): Promise<MaterialRequisitionResponse[]> {
    const response = await apiClient.get<ApiResponse<MaterialRequisitionResponse[]>>(
      `${this.baseURL}/by-status/${status}`
    )
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch requisitions')
    }
    return response.data.data || []
  }

  // Get pending requisitions
  async getPending(): Promise<MaterialRequisitionResponse[]> {
    const response = await apiClient.get<ApiResponse<MaterialRequisitionResponse[]>>(`${this.baseURL}/pending`)
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch pending requisitions')
    }
    return response.data.data || []
  }

  // Get approved requisitions
  async getApproved(): Promise<MaterialRequisitionResponse[]> {
    const response = await apiClient.get<ApiResponse<MaterialRequisitionResponse[]>>(`${this.baseURL}/approved`)
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch approved requisitions')
    }
    return response.data.data || []
  }

  // Get by priority
  async getByPriority(priority: string): Promise<MaterialRequisitionResponse[]> {
    const response = await apiClient.get<ApiResponse<MaterialRequisitionResponse[]>>(
      `${this.baseURL}/by-priority/${priority}`
    )
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch requisitions')
    }
    return response.data.data || []
  }

  // Get overdue requisitions
  async getOverdue(): Promise<MaterialRequisitionResponse[]> {
    const response = await apiClient.get<ApiResponse<MaterialRequisitionResponse[]>>(`${this.baseURL}/overdue`)
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch overdue requisitions')
    }
    return response.data.data || []
  }

  // Create new requisition
  async create(request: CreateMaterialRequisitionRequest): Promise<number> {
    const response = await apiClient.post<ApiResponse<number>>(this.baseURL, request)
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to create requisition')
    }
    return response.data.data || 0
  }

  // Update requisition
  async update(id: number, request: UpdateMaterialRequisitionRequest): Promise<boolean> {
    const response = await apiClient.put<ApiResponse<boolean>>(`${this.baseURL}/${id}`, request)
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update requisition')
    }
    return response.data.data || false
  }

  // Delete requisition
  async delete(id: number): Promise<boolean> {
    const response = await apiClient.delete<ApiResponse<boolean>>(`${this.baseURL}/${id}`)
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete requisition')
    }
    return response.data.data || false
  }

  // Approve requisition
  async approve(id: number, approvedBy: string): Promise<boolean> {
    const response = await apiClient.post<ApiResponse<boolean>>(`${this.baseURL}/${id}/approve`, {
      approvedBy
    })
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to approve requisition')
    }
    return response.data.data || false
  }

  // Reject requisition
  async reject(id: number, rejectedBy: string, reason?: string): Promise<boolean> {
    const response = await apiClient.post<ApiResponse<boolean>>(`${this.baseURL}/${id}/reject`, {
      rejectedBy,
      reason
    })
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to reject requisition')
    }
    return response.data.data || false
  }

  // Update status
  async updateStatus(id: number, status: string): Promise<boolean> {
    const response = await apiClient.patch<ApiResponse<boolean>>(`${this.baseURL}/${id}/status`, {
      status
    })
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update status')
    }
    return response.data.data || false
  }

  // Allocate materials using FIFO
  async allocateMaterials(request: AllocateMaterialRequest): Promise<boolean> {
    const response = await apiClient.post<ApiResponse<boolean>>(
      `${this.baseURL}/${request.requisitionId}/allocate`,
      request
    )
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to allocate materials')
    }
    return response.data.data || false
  }

  // Deallocate materials
  async deallocateMaterials(id: number): Promise<boolean> {
    const response = await apiClient.post<ApiResponse<boolean>>(`${this.baseURL}/${id}/deallocate`)
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to deallocate materials')
    }
    return response.data.data || false
  }

  // Issue materials to job card
  async issueMaterials(request: IssueMaterialRequest): Promise<number> {
    const response = await apiClient.post<ApiResponse<number>>(
      `${this.baseURL}/${request.requisitionId}/issue`,
      request
    )
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to issue materials')
    }
    return response.data.data || 0
  }

  // Get allocated pieces for requisition
  async getAllocatedPieces(id: number): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<any[]>>(`${this.baseURL}/${id}/allocated-pieces`)
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch allocated pieces')
    }
    return response.data.data || []
  }

  // Get issuance history
  async getIssuanceHistory(id: number): Promise<any[]> {
    const response = await apiClient.get<ApiResponse<any[]>>(`${this.baseURL}/${id}/issuance-history`)
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch issuance history')
    }
    return response.data.data || []
  }
}

export const materialRequisitionService = new MaterialRequisitionService()
