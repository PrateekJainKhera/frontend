import axios from 'axios'
import { apiClient, ApiResponse } from './axios-config'

export interface PieceInfo {
  id: number
  pieceNo?: string | null
  lengthMM: number
  weightKG: number
}
export interface LengthGroup {
  lengthMM: number
  count: number
  totalWeightKG: number
  pieces: PieceInfo[]
}
export interface MaterialPiecesByLength {
  materialId: number
  materialCode?: string | null
  materialName?: string | null
  minUsableLengthMM: number
  totalPieces: number
  totalLengthMM: number
  totalWeightKG: number
  groups: LengthGroup[]
}

export interface ReconcilePiecesRequest {
  materialId: number
  performedBy?: string
  remarks?: string
  removals: { lengthMM: number; count: number }[]
  lengthChanges: { pieceId: number; newLengthMM: number }[]
}
export interface ReconcileLog {
  id: number
  materialId: number
  materialCode?: string | null
  materialName?: string | null
  pieceNo?: string | null
  actionType?: string | null      // RemoveBar | ReduceLength
  lengthBeforeMM?: number | null
  lengthAfterMM?: number | null
  lengthRemovedMM?: number | null
  weightRemovedKG?: number | null
  reason?: string | null          // Correction | Reconcile | Reconcile-Scrap
  remarks?: string | null
  performedBy?: string | null
  createdAt?: string | null
}

export interface ReconcileResult {
  barsRemoved: number
  lengthsAdjusted: number
  movedToScrap: number
  totalLengthRemovedMM: number
  newTotalLengthMM: number
  newTotalWeightKG: number
}

class MaterialReconcileService {
  private baseUrl = '/material-reconcile'

  async getPieces(materialId: number): Promise<MaterialPiecesByLength> {
    try {
      const res = await apiClient.get<ApiResponse<MaterialPiecesByLength>>(`${this.baseUrl}/pieces/${materialId}`)
      if (!res.data.data) throw new Error(res.data.message || 'Failed to load pieces')
      return res.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) throw new Error(error.response?.data?.message || `Failed to load pieces: ${error.message}`)
      throw error
    }
  }

  async getHistory(materialId?: number): Promise<ReconcileLog[]> {
    try {
      const url = materialId ? `${this.baseUrl}/history?materialId=${materialId}` : `${this.baseUrl}/history`
      const res = await apiClient.get<ApiResponse<ReconcileLog[]>>(url)
      return res.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) throw new Error(error.response?.data?.message || `Failed to load history: ${error.message}`)
      throw error
    }
  }

  async reconcile(data: ReconcilePiecesRequest): Promise<ReconcileResult> {
    try {
      const res = await apiClient.post<ApiResponse<ReconcileResult>>(this.baseUrl, data)
      if (!res.data.success) throw new Error(res.data.message || 'Reconcile failed')
      return res.data.data as ReconcileResult
    } catch (error) {
      if (axios.isAxiosError(error)) throw new Error(error.response?.data?.message || `Failed to reconcile: ${error.message}`)
      throw error
    }
  }
}

export const materialReconcileService = new MaterialReconcileService()
