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
