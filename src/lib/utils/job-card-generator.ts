import { JobCard, JobCardStatus, JobCardCreationType, JobCardGenerationConfig, ScheduleStatus } from '@/types/job-card'
import { Order, ProcessTemplate, Priority } from '@/types'

export interface GenerateJobCardsParams {
  order: Order
  processTemplate: ProcessTemplate
  config: {
    autoAssignMachines: boolean
    selectedSteps: number[]
    schedulingStrategy: 'ASAP' | 'JIT' | 'MANUAL'
  }
}

export function generateJobCardsFromOrder(params: GenerateJobCardsParams): JobCard[] {
  const { order, processTemplate, config } = params
  const jobCards: JobCard[] = []

  // Filter steps based on selection
  const selectedSteps = processTemplate.steps.filter(step =>
    config.selectedSteps.includes(step.stepNo)
  )

  selectedSteps.forEach((step, index) => {
    // Determine dependencies (current step depends on previous step)
    const dependsOnJobCardIds: string[] = []
    if (index > 0) {
      const previousStep = selectedSteps[index - 1]
      dependsOnJobCardIds.push(`JC-${order.orderNo}-${previousStep.stepNo}`)
    }

    // Determine initial status
    let status: JobCardStatus
    let blockedBy: string[] = []

    if (index === 0) {
      // First step is always ready
      status = JobCardStatus.READY
    } else {
      // Subsequent steps are blocked by previous step
      status = JobCardStatus.BLOCKED
      blockedBy = [...dependsOnJobCardIds]
    }

    // Create job card
    const jobCard: JobCard = {
      id: `jc-${order.id}-${step.stepNo}`,
      jobCardNo: `JC-${order.orderNo}-${step.stepNo}`,
      creationType: JobCardCreationType.AUTO_GENERATED,

      orderId: order.id,
      orderNo: order.orderNo,

      processId: step.processId,
      processName: step.processName,
      processCode: `PROC-${step.stepNo}`,
      stepNo: step.stepNo,
      processTemplateId: processTemplate.id,

      dependsOnJobCardIds,
      blockedBy,

      quantity: order.quantity,
      completedQty: 0,
      rejectedQty: 0,
      reworkQty: 0,
      inProgressQty: 0,

      status,
      priority: order.priority as Priority,
      scheduleStatus: ScheduleStatus.UNSCHEDULED,

      // Machine assignment (if auto-assign enabled)
      assignedMachineId: null,
      assignedMachineName: null,
      assignedOperatorId: null,
      assignedOperatorName: null,

      // Time estimates (would come from process definition in real system)
      estimatedSetupTimeMin: 15,
      estimatedCycleTimeMin: 30,
      estimatedTotalTimeMin: 15 + (30 * order.quantity),

      actualSetupTimeMin: null,
      actualCycleTimeMin: null,
      actualTotalTimeMin: null,

      scheduledStartTime: null,
      actualStartTime: null,
      actualEndTime: null,

      allocatedMaterials: [],

      customerName: order.customer?.name || 'Unknown Customer',
      customerCode: order.customer?.code || 'CUST-000',
      productName: order.product?.modelName || 'Unknown Product',
      productCode: order.product?.partCode || 'PROD-000',

      workInstructions: `Standard ${step.processName} operation as per process template.`,
      qualityCheckpoints: `Check dimensions and quality as per product specifications.`,
      specialNotes: undefined,

      createdAt: new Date(),
      createdBy: 'system',
      updatedAt: new Date(),
      updatedBy: 'system'
    }

    jobCards.push(jobCard)
  })

  return jobCards
}

export function calculateTotalEstimatedTime(jobCards: JobCard[]): number {
  return jobCards.reduce((total, jc) => total + jc.estimatedTotalTimeMin, 0)
}

export function calculateExpectedCompletionDate(jobCards: JobCard[]): Date {
  const totalMinutes = calculateTotalEstimatedTime(jobCards)
  const now = new Date()
  return new Date(now.getTime() + totalMinutes * 60 * 1000)
}

export function getJobCardSummary(jobCards: JobCard[]) {
  return {
    totalJobCards: jobCards.length,
    readyToStart: jobCards.filter(jc => jc.status === JobCardStatus.READY).length,
    blocked: jobCards.filter(jc => jc.status === JobCardStatus.BLOCKED).length,
    totalEstimatedTime: calculateTotalEstimatedTime(jobCards),
    expectedCompletion: calculateExpectedCompletionDate(jobCards)
  }
}
