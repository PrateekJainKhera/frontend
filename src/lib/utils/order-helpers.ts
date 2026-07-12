import { Order } from '@/types'

// Days past the (adjusted) due date; 0 when on time.
export const getDelayDays = (order: Order): number => {
  const dueDate = order.adjustedDueDate || order.dueDate
  const today = new Date()
  const diff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
}

// Completion percentage from quantities.
export const getOrderProgress = (order: Order): number => {
  return (order.qtyCompleted / order.quantity) * 100
}
