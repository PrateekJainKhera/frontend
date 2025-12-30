import { OrderStatus, Priority, DelayReason, ProcessStatus } from './enums'
import { Customer } from './customer'
import { Product } from './product'

export interface Order {
  id: string
  orderNo: string
  customerId: string
  customer?: Customer
  productId: string
  product?: Product
  quantity: number
  originalQuantity: number
  qtyCompleted: number
  qtyRejected: number
  qtyInProgress: number
  orderDate: Date
  dueDate: Date
  adjustedDueDate?: Date | null
  delayReason?: DelayReason | null
  status: OrderStatus
  priority: Priority
  currentProcess?: string | null
  currentMachine?: string | null
  currentOperator?: string | null
  processHistory?: ProcessHistory[]
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface ProcessHistory {
  id: string
  orderId: string
  processName: string
  stepNo: number
  machineUsed: string
  operatorId: string
  operatorName: string
  qtyProcessed: number
  qtyCompleted: number
  qtyRejected: number
  startTime: Date
  endTime?: Date | null
  status: ProcessStatus
  remarks?: string
}
