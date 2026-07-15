import { Priority } from './enums'

export enum DispatchStatus {
  PENDING = 'Pending',
  READY = 'Ready to Dispatch',
  DISPATCHED = 'Dispatched',
  IN_TRANSIT = 'In Transit',
  DELIVERED = 'Delivered',
  CANCELLED = 'Cancelled'
}

export enum TransportMode {
  ROAD = 'Road',
  RAIL = 'Rail',
  AIR = 'Air',
  COURIER = 'Courier'
}

export interface DeliveryChallan {
  id: string
  challanNo: string
  challanDate: Date

  // Order details
  orderId: string
  orderNo: string
  customerId: string
  customerName: string
  customerAddress: string
  customerGST?: string

  // Product details
  productName: string
  quantity: number
  unit: string

  // Dispatch details
  status: DispatchStatus
  priority: Priority

  // Transport details
  transportMode: TransportMode
  transporterName?: string
  vehicleNumber?: string
  driverName?: string
  driverPhone?: string

  // Statutory details
  ewayBillNo?: string
  ewayBillDate?: Date
  lrNo?: string // Lorry Receipt Number
  freightCharges?: number

  // Dates
  dispatchDate?: Date
  expectedDeliveryDate?: Date
  actualDeliveryDate?: Date

  // Delivery confirmation
  receivedBy?: string
  receivedDesignation?: string
  deliveryRemarks?: string
  podImageUrl?: string // Proof of Delivery

  // Additional
  remarks?: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface DispatchItem {
  id: string
  challanId: string
  serialNo?: string
  productCode?: string
  productName: string
  quantity: number
  unit: string
  remarks?: string
}

// Ready to Dispatch (from API)
export interface ReadyToDispatchItem {
  orderItemId: number
  itemSequence: string
  productId: number
  productName: string | null
  partCode: string | null
  machineModel?: string | null
  rollerType?: string | null
  numberOfTeeth?: number | null
  quantity: number
  qtyCompleted: number
  qtyDispatched: number
  qtyPendingDispatch: number
  dueDate: string | null
  orderId: number
  orderNo: string
  customerId: number
  customerName: string | null
}

// Dispatch challan from backend (real API)
export interface DeliveryChallanApi {
  id: number
  challanNo: string
  challanDate: string
  orderId: number
  orderNo: string
  customerId: number
  customerName: string | null
  productId: number
  productName: string | null
  quantityDispatched: number
  deliveryDate: string | null
  deliveryAddress: string | null
  transportMode: string | null
  vehicleNumber: string | null
  driverName: string | null
  driverContact: string | null
  status: string
  dispatchedAt: string | null
  deliveredAt: string | null
  invoiceNo: string | null
  invoiceDate: string | null
  invoiceDocument: string | null   // full S3 URL of the uploaded invoice PDF
  remarks: string | null
  createdAt: string
  createdBy: string | null
  isConsolidated?: boolean
}

export interface ConsolidatedChallanItem {
  id: number
  challanId: number
  orderId: number | null
  orderItemId: number | null
  orderNo: string | null
  itemSequence: string | null
  productId: number | null
  productCode: string | null
  productName: string | null
  quantity: number
  uom: string | null
  machineModel: string | null
  rollerType: string | null
  numberOfTeeth: number | null
  remarks: string | null
}

