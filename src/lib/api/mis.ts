import { apiClient, ApiResponse } from './axios-config'

export interface MonthCount {
  month: string // yyyy-MM
  count: number
  qty: number
}
export interface StatusCount {
  label: string
  count: number
}
export interface TopCustomerRow {
  customerName: string
  orders: number
  qty: number
}

export interface MISOverview {
  ordersPerMonth: MonthCount[]
  orderStatusCounts: StatusCount[]
  orderSourceCounts: StatusCount[]
  topCustomers: TopCustomerRow[]
  challansPerMonth: MonthCount[]
  rollerTypeCounts: StatusCount[]

  totalOrders: number
  totalChallans: number
  totalDispatchedQty: number
  jobCardsTotal: number
  jobCardsCompletedSteps: number
  totalRejectedQty: number
  rejectionJobCards: number
  reworkJobCards: number
}

// ── Machine Model report ──────────────────────────────────────────────────
export interface MachineModelRow {
  modelName: string
  rollerType: string | null
  numberOfTeeth: number | null
  orders: number
  totalQty: number
  lastOrderDate: string | null
}
export interface MachineModelName {
  modelName: string
  orders: number
  totalQty: number
}
export interface MachineModelsResponse {
  top10: MachineModelRow[]
  models: MachineModelName[]
}
export interface ModelPeriodCount {
  period: string
  orders: number
  qty: number
}
export interface MachineModelDetail {
  modelName: string
  variants: MachineModelRow[]
  monthly: ModelPeriodCount[]
  yearly: ModelPeriodCount[]
  totalOrders: number
  totalQty: number
}
export interface MachineModelCustomerRow {
  customerName: string
  orders: number
  totalQty: number
  lastOrderDate: string | null
}

class MISService {
  async getOverview(): Promise<MISOverview> {
    const res = await apiClient.get<ApiResponse<MISOverview>>('/mis/overview')
    if (!res.data.success || !res.data.data) throw new Error(res.data.message || 'Failed to load MIS overview')
    return res.data.data
  }

  async getMachineModels(): Promise<MachineModelsResponse> {
    const res = await apiClient.get<ApiResponse<MachineModelsResponse>>('/mis/machine-models')
    if (!res.data.success || !res.data.data) throw new Error(res.data.message || 'Failed to load machine models')
    return res.data.data
  }

  async getMachineModelDetail(model: string): Promise<MachineModelDetail> {
    const res = await apiClient.get<ApiResponse<MachineModelDetail>>(`/mis/machine-models/detail?model=${encodeURIComponent(model)}`)
    if (!res.data.success || !res.data.data) throw new Error(res.data.message || 'Failed to load model detail')
    return res.data.data
  }

  async getMachineModelCustomers(model: string, roller?: string | null, teeth?: number | null): Promise<MachineModelCustomerRow[]> {
    const params = new URLSearchParams({ model })
    if (roller) params.append('roller', roller)
    if (teeth != null) params.append('teeth', String(teeth))
    const res = await apiClient.get<ApiResponse<MachineModelCustomerRow[]>>(`/mis/machine-models/customers?${params.toString()}`)
    return res.data.data ?? []
  }
}

export const misService = new MISService()
