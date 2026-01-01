export enum ReworkDecision {
  CREATE_REWORK = "Create Rework Order",
  SCRAP = "Scrap - Cannot Rework",
  USE_AS_IS = "Use As-Is (Approved)",
  RETURN_TO_VENDOR = "Return to Vendor (OSP)"
}

export enum Disposition {
  PENDING = "Pending",
  REWORK_IN_PROGRESS = "Rework in Progress",
  REWORK_COMPLETED = "Rework Completed",
  SCRAPPED = "Scrapped",
  APPROVED_AS_IS = "Approved As-Is"
}

export interface Rejection {
  id: string
  rejectionNo: string
  orderId: string
  orderNo?: string
  productName?: string
  processName: string
  qtyRejected: number
  rejectionReason: string
  rejectionDate: Date
  inspectorId: string
  inspectorName: string
  orderQtyReduced: boolean
  reworkCreated: boolean
  createdAt: Date

  // Enhanced linkage
  processStepNumber?: number
  processStepName?: string
  failedMachineId?: string | null
  failedMachineName?: string | null
  failedOperatorId?: string | null
  failedOperatorName?: string | null

  // Rework decision
  reworkDecision?: ReworkDecision
  reworkOrderId?: string | null
  reworkOrderNo?: string | null
  reworkCreatedDate?: Date | null
  reworkCompletedDate?: Date | null

  // Disposition
  disposition?: Disposition
  dispositionNotes?: string | null
  dispositionBy?: string | null
  dispositionDate?: Date | null

  // Additional details
  defectDescription?: string | null
  rootCause?: string | null
  correctiveAction?: string | null
  photoEvidence?: boolean
}
