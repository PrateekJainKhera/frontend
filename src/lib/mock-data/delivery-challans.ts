import { DeliveryChallan, DispatchStatus, TransportMode } from '@/types/dispatch'
import { Priority } from '@/types/enums'

export const mockDeliveryChallans: DeliveryChallan[] = [
  {
    id: 'dc-001',
    challanNo: 'DC/2024/001',
    challanDate: new Date('2024-03-15'),

    // Order details
    orderId: '1',
    orderNo: 'ORD-128',
    customerId: 'cust-1',
    customerName: 'ABC Industries',
    customerAddress: '123 Industrial Area, Mumbai, Maharashtra - 400001',
    customerGST: '27AABCU9603R1ZV',

    // Product details
    productName: 'Magnetic Roller 250mm',
    quantity: 20,
    unit: 'pcs',

    // Dispatch details
    status: DispatchStatus.DELIVERED,
    priority: Priority.MEDIUM,

    // Transport details
    transportMode: TransportMode.ROAD,
    transporterName: 'Fast Transport Ltd',
    vehicleNumber: 'MH-12-AB-1234',
    driverName: 'Rajesh Kumar',
    driverPhone: '+91-9876543210',

    // Statutory details
    ewayBillNo: 'EWB-123456789012',
    ewayBillDate: new Date('2024-03-15'),
    lrNo: 'LR-2024-5678',
    freightCharges: 5000,

    // Dates
    dispatchDate: new Date('2024-03-15'),
    expectedDeliveryDate: new Date('2024-03-16'),
    actualDeliveryDate: new Date('2024-03-16'),

    // Delivery confirmation
    receivedBy: 'Amit Shah',
    receivedDesignation: 'Store Manager',
    deliveryRemarks: 'Goods received in good condition',

    remarks: 'Priority delivery completed successfully',
    createdBy: 'dispatch-clerk',
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-03-16')
  },
  {
    id: 'dc-002',
    challanNo: 'DC/2024/002',
    challanDate: new Date('2024-03-16'),

    // Order details
    orderId: '2',
    orderNo: 'ORD-129',
    customerId: 'cust-2',
    customerName: 'XYZ Manufacturing',
    customerAddress: '456 MIDC Area, Pune, Maharashtra - 411019',
    customerGST: '27BBBCU9603R1ZV',

    // Product details
    productName: 'Printing Roller 300mm',
    quantity: 15,
    unit: 'pcs',

    // Dispatch details
    status: DispatchStatus.IN_TRANSIT,
    priority: Priority.HIGH,

    // Transport details
    transportMode: TransportMode.ROAD,
    transporterName: 'Reliable Logistics',
    vehicleNumber: 'MH-14-CD-5678',
    driverName: 'Suresh Patil',
    driverPhone: '+91-9123456789',

    // Statutory details
    ewayBillNo: 'EWB-987654321098',
    ewayBillDate: new Date('2024-03-16'),
    lrNo: 'LR-2024-9012',
    freightCharges: 7500,

    // Dates
    dispatchDate: new Date('2024-03-16'),
    expectedDeliveryDate: new Date('2024-03-17'),

    remarks: 'High priority order - handle with care',
    createdBy: 'dispatch-clerk',
    createdAt: new Date('2024-03-16'),
    updatedAt: new Date('2024-03-16')
  },
  {
    id: 'dc-003',
    challanNo: 'DC/2024/003',
    challanDate: new Date('2024-03-17'),

    // Order details
    orderId: '3',
    orderNo: 'ORD-130',
    customerId: 'cust-3',
    customerName: 'PQR Packaging',
    customerAddress: '789 Phase 2, Bangalore, Karnataka - 560058',
    customerGST: '29CCCCU9603R1ZV',

    // Product details
    productName: 'Conveyor Roller 200mm',
    quantity: 30,
    unit: 'pcs',

    // Dispatch details
    status: DispatchStatus.READY,
    priority: Priority.MEDIUM,

    // Transport details
    transportMode: TransportMode.ROAD,
    transporterName: 'Express Cargo',

    // Dates
    expectedDeliveryDate: new Date('2024-03-19'),

    remarks: 'Ready for pickup by transporter',
    createdBy: 'dispatch-clerk',
    createdAt: new Date('2024-03-17'),
    updatedAt: new Date('2024-03-17')
  },
  {
    id: 'dc-004',
    challanNo: 'DC/2024/004',
    challanDate: new Date('2024-03-18'),

    // Order details
    orderId: '4',
    orderNo: 'ORD-131',
    customerId: 'cust-4',
    customerName: 'LMN Engineering',
    customerAddress: '321 Sector 15, Noida, UP - 201301',
    customerGST: '09DDDCU9603R1ZV',

    // Product details
    productName: 'Industrial Roller 400mm',
    quantity: 10,
    unit: 'pcs',

    // Dispatch details
    status: DispatchStatus.PENDING,
    priority: Priority.URGENT,

    // Transport details
    transportMode: TransportMode.ROAD,

    remarks: 'QC completed - pending dispatch approval',
    createdBy: 'dispatch-clerk',
    createdAt: new Date('2024-03-18'),
    updatedAt: new Date('2024-03-18')
  }
]
