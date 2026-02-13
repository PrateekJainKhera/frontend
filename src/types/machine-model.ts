export interface MachineModel {
  id: number
  modelName: string
  createdAt: string
  createdBy: string
  updatedAt: string
  isActive: boolean
  productCount?: number
}

export interface CreateMachineModelRequest {
  modelName: string
  createdBy?: string
}

export interface UpdateMachineModelRequest {
  id: number
  modelName: string
  isActive: boolean
}
