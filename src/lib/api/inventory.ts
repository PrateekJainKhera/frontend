import axios from 'axios'
import { apiClient, ApiResponse } from './axios-config'

export interface InventoryResponse {
  id: number
  materialId: number
  materialCode: string
  materialName: string
  materialCategory: string
  totalQuantity: number
  availableQuantity: number
  allocatedQuantity: number
  issuedQuantity: number
  reservedQuantity: number
  uom: string
  minimumStock: number
  maximumStock: number
  reorderLevel: number
  reorderQuantity: number
  primaryStorageLocation?: string
  warehouseCode?: string
  averageCostPerUnit: number
  totalStockValue: number
  isLowStock: boolean
  isOutOfStock: boolean
  isActive: boolean
  lastStockInDate?: Date
  lastStockOutDate?: Date
  lastCountDate?: Date
  createdAt: Date
  updatedAt?: Date
  updatedBy?: string
}

export interface ReceiveComponentRequest {
  componentId: number
  componentName: string
  partNumber?: string
  quantity: number
  unit: string
  unitCost?: number
  supplierId?: number
  supplierName?: string
  invoiceNo?: string
  invoiceDate?: Date
  poNo?: string
  poDate?: Date
  receiptDate: Date
  storageLocation?: string
  remarks?: string
  receivedBy: string
}

export interface InventoryTransactionResponse {
  id: number
  transactionNo: string
  transactionType: string
  itemType: string
  itemId: number
  itemCode?: string
  itemName: string
  quantity: number
  uom: string
  unitCost?: number
  totalValue?: number
  sourceLocation?: string
  destinationLocation?: string
  referenceType?: string
  referenceId?: number
  referenceNumber?: string
  transactionDate: string
  remarks?: string
  createdBy: string
  createdAt: string
}

class InventoryService {
  private baseUrl = '/inventory'

  async getAll(): Promise<InventoryResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<InventoryResponse[]>>(this.baseUrl)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch inventory: ${error.message}`)
      }
      throw error
    }
  }

  async getById(id: number): Promise<InventoryResponse> {
    try {
      const response = await apiClient.get<ApiResponse<InventoryResponse>>(`${this.baseUrl}/${id}`)
      if (!response.data.data) throw new Error('Inventory record not found')
      return response.data.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch inventory: ${error.message}`)
      }
      throw error
    }
  }

  async getByMaterialId(materialId: number): Promise<InventoryResponse | null> {
    try {
      const response = await apiClient.get<ApiResponse<InventoryResponse>>(
        `${this.baseUrl}/by-material/${materialId}`
      )
      return response.data.data || null
    } catch (error) {
      // If material not found in inventory, return null instead of throwing
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null
      }
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch inventory by material: ${error.message}`)
      }
      throw error
    }
  }

  async getLowStock(): Promise<InventoryResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<InventoryResponse[]>>(`${this.baseUrl}/low-stock`)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch low stock items: ${error.message}`)
      }
      throw error
    }
  }

  async getOutOfStock(): Promise<InventoryResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<InventoryResponse[]>>(`${this.baseUrl}/out-of-stock`)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch out of stock items: ${error.message}`)
      }
      throw error
    }
  }

  async getActive(): Promise<InventoryResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<InventoryResponse[]>>(`${this.baseUrl}/active`)
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch active inventory: ${error.message}`)
      }
      throw error
    }
  }

  async receiveComponent(request: ReceiveComponentRequest): Promise<number> {
    try {
      const response = await apiClient.post<ApiResponse<number>>(
        `${this.baseUrl}/receive-component`,
        request
      )
      return response.data.data || 0
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to receive component: ${error.message}`)
      }
      throw error
    }
  }

  async getTransactionsByMaterialId(materialId: number): Promise<InventoryTransactionResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<InventoryTransactionResponse[]>>(
        `${this.baseUrl}/transactions/by-material/${materialId}`
      )
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch transactions: ${error.message}`)
      }
      throw error
    }
  }

  async getRecentTransactions(count: number = 100): Promise<InventoryTransactionResponse[]> {
    try {
      const response = await apiClient.get<ApiResponse<InventoryTransactionResponse[]>>(
        `${this.baseUrl}/transactions/recent?count=${count}`
      )
      return response.data.data || []
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || `Failed to fetch recent transactions: ${error.message}`)
      }
      throw error
    }
  }
}

export const inventoryService = new InventoryService()
