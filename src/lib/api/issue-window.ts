import { apiClient } from './axios-config'
import {
  IssueWindowRequisition,
  MaterialGroup,
  AvailablePiece,
  DraftSummary,
  DraftDetail,
  SaveDraftRequest,
  IssueDraftRequest,
  IssueResult,
  SuggestCuttingPlanRequest,
  CuttingPlanOption,
  FinalizeMultipleDraftsRequest,
} from '@/types/issue-window'

const BASE = '/stores/issue-window'

export const issueWindowService = {
  getApprovedRequisitions: async (): Promise<IssueWindowRequisition[]> => {
    const res = await apiClient.get<{ data: IssueWindowRequisition[] }>(`${BASE}/approved-requisitions`)
    return res.data.data ?? []
  },

  getMaterialGroups: async (requisitionIds: number[]): Promise<MaterialGroup[]> => {
    const res = await apiClient.post<{ data: MaterialGroup[] }>(`${BASE}/material-groups`, { requisitionIds })
    return res.data.data ?? []
  },

  getAvailablePieces: async (materialId: number, grade?: string, diameterMM?: number): Promise<AvailablePiece[]> => {
    const params = new URLSearchParams({ materialId: String(materialId) })
    if (grade) params.append('grade', grade)
    if (diameterMM != null) params.append('diameterMM', String(diameterMM))
    const res = await apiClient.get<{ data: AvailablePiece[] }>(`${BASE}/available-pieces?${params}`)
    return res.data.data ?? []
  },

  suggestCuttingPlan: async (request: SuggestCuttingPlanRequest): Promise<CuttingPlanOption[]> => {
    const res = await apiClient.post<{ data: CuttingPlanOption[] }>(`${BASE}/suggest-cutting-plan`, request)
    return res.data.data ?? []
  },

  saveDraft: async (request: SaveDraftRequest): Promise<DraftDetail> => {
    const res = await apiClient.post<{ data: DraftDetail }>(`${BASE}/drafts`, request)
    return res.data.data
  },

  getDrafts: async (): Promise<DraftSummary[]> => {
    const res = await apiClient.get<{ data: DraftSummary[] }>(`${BASE}/drafts`)
    return res.data.data ?? []
  },

  getDraftById: async (id: number): Promise<DraftDetail> => {
    const res = await apiClient.get<{ data: DraftDetail }>(`${BASE}/drafts/${id}`)
    return res.data.data
  },

  issueDraft: async (id: number, request: IssueDraftRequest): Promise<IssueResult[]> => {
    const res = await apiClient.post<{ data: IssueResult[] }>(`${BASE}/drafts/${id}/issue`, request)
    return res.data.data ?? []
  },

  finalizeMultiple: async (request: FinalizeMultipleDraftsRequest): Promise<IssueResult[]> => {
    const res = await apiClient.post<{ data: IssueResult[] }>(`${BASE}/finalize-multiple`, request)
    return res.data.data ?? []
  },

  deleteDraft: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE}/drafts/${id}`)
  },
}
