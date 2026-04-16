export interface EstimationItemResponse {
  id: number
  estimationId: number
  productId: number
  productName?: string
  partCode?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  notes?: string
}

export interface EstimationResponse {
  id: number
  estimateNo: string
  baseEstimateNo: string
  revisionNumber: number
  customerId: number
  customerName?: string
  status: string // Draft | Submitted | Approved | Rejected | Cancelled | Converted
  subTotal: number
  discountType?: string // Percent | Fixed
  discountValue: number
  discountAmount: number
  totalAmount: number       // SubTotal - Discount (taxable amount)
  gstRate: number
  gstAmount: number
  grandTotal: number        // TotalAmount + GSTAmount
  validUntil: string
  approvedBy?: string
  approvedAt?: string
  rejectedBy?: string
  rejectedAt?: string
  rejectionReason?: string
  convertedOrderId?: number
  convertedAt?: string
  notes?: string
  termsAndConditions?: string
  createdAt: string
  createdBy?: string
  items: EstimationItemResponse[]
}

export interface CreateEstimationItemRequest {
  productId: number
  quantity: number
  unitPrice: number
  notes?: string
}

export interface CreateEstimationRequest {
  customerId: number
  discountType?: string
  discountValue: number
  notes?: string
  termsAndConditions?: string
  items: CreateEstimationItemRequest[]
}

export interface ApproveEstimationRequest {
  approvedBy: string
}

export interface RejectEstimationRequest {
  rejectedBy: string
  reason: string
}
