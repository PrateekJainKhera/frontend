import { OrderStatus } from './enums'

export interface ReworkOrder {
  id: string
  reworkOrderNo: string
  parentOrderId: string
  rejectionId: string
  reworkQty: number
  startFromProcess: string
  isRework: boolean
  reworkReason: string
  approvedBy: string
  status: OrderStatus
  createdAt: Date
  updatedAt: Date
}
