import { Order, OrderStatus, Priority, DelayReason } from '@/types'
import { mockCustomers } from './customers'
import { mockProducts } from './products'

export const mockOrders: Order[] = [
  {
    id: 'ord-1',
    orderNo: 'ORD-2024-001',
    customerId: 'cust-1',
    customer: mockCustomers[0],
    productId: 'prod-1',
    product: mockProducts[0],
    quantity: 50,
    originalQuantity: 50,
    qtyCompleted: 35,
    qtyRejected: 0,
    qtyInProgress: 15,
    orderDate: new Date('2024-03-01'),
    dueDate: new Date('2024-03-15'),
    adjustedDueDate: null,
    delayReason: null,
    status: OrderStatus.IN_PROGRESS,
    priority: Priority.MEDIUM,
    currentProcess: 'Grinding',
    currentMachine: 'GRD-02',
    currentOperator: 'Ramesh Patel',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-10'),
    createdBy: 'sales-user'
  },
  {
    id: 'ord-2',
    orderNo: 'ORD-2024-002',
    customerId: 'cust-2',
    customer: mockCustomers[1],
    productId: 'prod-2',
    product: mockProducts[1],
    quantity: 30,
    originalQuantity: 45,
    qtyCompleted: 20,
    qtyRejected: 15,
    qtyInProgress: 10,
    orderDate: new Date('2024-02-25'),
    dueDate: new Date('2024-03-10'),
    adjustedDueDate: new Date('2024-03-18'),
    delayReason: DelayReason.QUALITY_ISSUE,
    status: OrderStatus.IN_PROGRESS,
    priority: Priority.HIGH,
    currentProcess: 'CNC Turning',
    currentMachine: 'CNC-01',
    currentOperator: 'Suresh Kumar',
    createdAt: new Date('2024-02-25'),
    updatedAt: new Date('2024-03-08'),
    createdBy: 'sales-user'
  },
  {
    id: 'ord-3',
    orderNo: 'ORD-2024-003',
    customerId: 'cust-3',
    customer: mockCustomers[2],
    productId: 'prod-3',
    product: mockProducts[2],
    quantity: 25,
    originalQuantity: 25,
    qtyCompleted: 25,
    qtyRejected: 0,
    qtyInProgress: 0,
    orderDate: new Date('2024-02-20'),
    dueDate: new Date('2024-03-05'),
    adjustedDueDate: null,
    delayReason: null,
    status: OrderStatus.COMPLETED,
    priority: Priority.MEDIUM,
    currentProcess: null,
    currentMachine: null,
    currentOperator: null,
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-03-04'),
    createdBy: 'sales-user'
  },
  {
    id: 'ord-4',
    orderNo: 'ORD-2024-004',
    customerId: 'cust-4',
    customer: mockCustomers[3],
    productId: 'prod-4',
    product: mockProducts[3],
    quantity: 40,
    originalQuantity: 40,
    qtyCompleted: 15,
    qtyRejected: 0,
    qtyInProgress: 25,
    orderDate: new Date('2024-02-15'),
    dueDate: new Date('2024-02-29'),
    adjustedDueDate: new Date('2024-03-20'),
    delayReason: DelayReason.MACHINE_BREAKDOWN,
    status: OrderStatus.IN_PROGRESS,
    priority: Priority.URGENT,
    currentProcess: 'Heat Treatment',
    currentMachine: 'Outsourced',
    currentOperator: 'Vendor-A',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-03-10'),
    createdBy: 'sales-user'
  },
  {
    id: 'ord-5',
    orderNo: 'ORD-2024-005',
    customerId: 'cust-5',
    customer: mockCustomers[4],
    productId: 'prod-5',
    product: mockProducts[4],
    quantity: 60,
    originalQuantity: 60,
    qtyCompleted: 0,
    qtyRejected: 0,
    qtyInProgress: 0,
    orderDate: new Date('2024-03-12'),
    dueDate: new Date('2024-03-26'),
    adjustedDueDate: null,
    delayReason: null,
    status: OrderStatus.PENDING,
    priority: Priority.LOW,
    currentProcess: null,
    currentMachine: null,
    currentOperator: null,
    createdAt: new Date('2024-03-12'),
    updatedAt: new Date('2024-03-12'),
    createdBy: 'sales-user'
  }
]

// Helper to calculate delay days
export const getDelayDays = (order: Order): number => {
  const dueDate = order.adjustedDueDate || order.dueDate
  const today = new Date()
  const diff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
}

// Helper to get order progress
export const getOrderProgress = (order: Order): number => {
  return (order.qtyCompleted / order.quantity) * 100
}
