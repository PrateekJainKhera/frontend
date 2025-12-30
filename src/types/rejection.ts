export interface Rejection {
  id: string
  rejectionNo: string
  orderId: string
  processName: string
  qtyRejected: number
  rejectionReason: string
  rejectionDate: Date
  inspectorId: string
  inspectorName: string
  orderQtyReduced: boolean
  reworkCreated: boolean
  createdAt: Date
}
