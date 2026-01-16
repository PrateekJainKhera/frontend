import { JobCard, JobCardStatus } from '@/types/job-card'
import { OrderProductionView, ChildPartProduction } from '@/types/production-order-view'

/**
 * Groups job cards by order ID to create a hierarchical production view
 * Shows complete workflow: Child Parts → Assembly → QC
 */
export function groupJobCardsByOrder(jobCards: JobCard[]): OrderProductionView[] {
  // Group job cards by orderId
  const orderMap = new Map<string, JobCard[]>()

  jobCards.forEach(jc => {
    if (!orderMap.has(jc.orderId)) {
      orderMap.set(jc.orderId, [])
    }
    orderMap.get(jc.orderId)!.push(jc)
  })

  // Convert to OrderProductionView array
  const orderViews: OrderProductionView[] = []

  orderMap.forEach((cards, orderId) => {
    // Take order-level details from first job card
    const firstCard = cards[0]

    // Group by child part
    const childPartMap = new Map<string, JobCard[]>()
    let assemblyCard: JobCard | undefined

    cards.forEach(jc => {
      // Check if it's an assembly step (usually last step or specific process name)
      if (jc.processName.toLowerCase().includes('assembly')) {
        assemblyCard = jc
      } else if (jc.childPartId) {
        // Regular child part process
        if (!childPartMap.has(jc.childPartId)) {
          childPartMap.set(jc.childPartId, [])
        }
        childPartMap.get(jc.childPartId)!.push(jc)
      }
    })

    // Create child part productions
    const childParts: ChildPartProduction[] = []

    childPartMap.forEach((processes, childPartId) => {
      // Sort processes by stepNo
      processes.sort((a, b) => a.stepNo - b.stepNo)

      const completed = processes.filter(p => p.status === JobCardStatus.COMPLETED).length
      const inProgress = processes.find(p => p.status === JobCardStatus.IN_PROGRESS)
      const nextReady = processes.find(p => p.status === JobCardStatus.READY)

      childParts.push({
        childPartId,
        childPartName: processes[0].childPartName || 'Unknown Part',
        processes,
        completedProcesses: completed,
        totalProcesses: processes.length,
        currentProcess: inProgress || nextReady,
      })
    })

    // Calculate overall progress
    const allProcesses = [...cards]
    const completed = allProcesses.filter(p => p.status === JobCardStatus.COMPLETED).length
    const inProgress = allProcesses.filter(p => p.status === JobCardStatus.IN_PROGRESS).length

    // Determine QC status (simplified - can be expanded to actual QC job card)
    let qcStatus: 'Pending' | 'In Progress' | 'Completed' = 'Pending'
    const allCompleted = allProcesses.every(p => p.status === JobCardStatus.COMPLETED)
    if (allCompleted) {
      qcStatus = 'Completed'  // Or could check for actual QC job card
    }

    orderViews.push({
      orderId,
      orderNo: firstCard.orderNo,
      customerName: firstCard.customerName,
      customerCode: firstCard.customerCode,
      productName: firstCard.productName,
      productCode: firstCard.productCode,
      childParts,
      assemblyJobCard: assemblyCard,
      qcStatus,
      totalSteps: allProcesses.length,
      completedSteps: completed,
      inProgressSteps: inProgress,
      pendingSteps: allProcesses.length - completed - inProgress,
    })
  })

  return orderViews
}

/**
 * Gets production view for a specific order
 */
export function getOrderProductionView(
  orderId: string,
  jobCards: JobCard[]
): OrderProductionView | null {
  const orderCards = jobCards.filter(jc => jc.orderId === orderId)

  if (orderCards.length === 0) {
    return null
  }

  const allViews = groupJobCardsByOrder(orderCards)
  return allViews[0] || null
}

/**
 * Calculate progress percentage for an order
 */
export function calculateOrderProgress(orderView: OrderProductionView): number {
  if (orderView.totalSteps === 0) return 0
  return Math.round((orderView.completedSteps / orderView.totalSteps) * 100)
}

/**
 * Get the current active step (in progress or next ready step)
 */
export function getCurrentStep(orderView: OrderProductionView): JobCard | null {
  // Check all child parts for in-progress or ready steps
  for (const childPart of orderView.childParts) {
    const inProgress = childPart.processes.find(p => p.status === JobCardStatus.IN_PROGRESS)
    if (inProgress) return inProgress

    const ready = childPart.processes.find(p => p.status === JobCardStatus.READY)
    if (ready) return ready
  }

  // Check assembly if exists
  if (orderView.assemblyJobCard) {
    if (
      orderView.assemblyJobCard.status === JobCardStatus.IN_PROGRESS ||
      orderView.assemblyJobCard.status === JobCardStatus.READY
    ) {
      return orderView.assemblyJobCard
    }
  }

  return null
}
