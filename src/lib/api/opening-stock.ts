import { apiClient } from './axios-config'
import {
  OpeningStockSummary,
  OpeningStockDetail,
  CreateOpeningStockRequest,
  ConfirmOpeningStockRequest,
} from '@/types/opening-stock'

const BASE = '/opening-stock'

export const openingStockService = {
  getAll: async (): Promise<OpeningStockSummary[]> => {
    const res = await apiClient.get<{ data: OpeningStockSummary[] }>(BASE)
    return res.data.data ?? []
  },

  getById: async (id: number): Promise<OpeningStockDetail> => {
    const res = await apiClient.get<{ data: OpeningStockDetail }>(`${BASE}/${id}`)
    return res.data.data
  },

  create: async (request: CreateOpeningStockRequest): Promise<OpeningStockDetail> => {
    const res = await apiClient.post<{ data: OpeningStockDetail }>(BASE, request)
    return res.data.data
  },

  update: async (id: number, request: CreateOpeningStockRequest): Promise<OpeningStockDetail> => {
    const res = await apiClient.put<{ data: OpeningStockDetail }>(`${BASE}/${id}`, request)
    return res.data.data
  },

  confirm: async (id: number, request: ConfirmOpeningStockRequest): Promise<OpeningStockDetail> => {
    const res = await apiClient.post<{ data: OpeningStockDetail }>(`${BASE}/${id}/confirm`, request)
    return res.data.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`)
  },
}
