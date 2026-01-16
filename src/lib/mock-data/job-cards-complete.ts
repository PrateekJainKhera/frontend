import { subDays, subHours } from 'date-fns'
import { JobCard, JobCardStatus, JobCardCreationType, MaterialStatus, ScheduleStatus } from '@/types/job-card'
import { Priority } from '@/types/enums'

/**
 * Complete Roller Production Workflow
 * Order ORD-128: 10 Printing Rollers
 *
 * Structure:
 * - TIKRI (PFD): Material Cutting → Turning (1st CNC) → Turning (2nd CNC) → PCD Holes (VMC) → READY FOR ASSEMBLY
 * - BEARERS (PFD): Material Cutting → Turning (1st CNC) → Turning (2nd CNC) → Blackning (OSP) → Marking → READY FOR ASSEMBLY
 * - SHAFT (PFD): Material Cutting → Turning (1st CNC) → Turning (2nd CNC) → Turning (3rd CNC) → Turning (4th Opr CNC) → Blackning (OSP) → O.D. Grinding (1st,2nd,3rd,4th) → READY FOR ASSEMBLY
 * - GEAR (PFD): Material Cutting → Turning (1st CNC) → Turning (2nd CNC) → PCD (VMC) → Hobbing/Teeth Cutting → H.T. (OSP) → Hard Turing (1st CNC) → Hard Turing (2nd CNC) → Gear Grinding → READY FOR ASSEMBLY
 *
 * Then: PRINT ROLLER ASSEMBLY
 */

export const mockJobCardsComplete: JobCard[] = [
  // ============================================
  // TIKRI (PFD) - Child Part 1
  // ============================================

  // TIKRI - Step 1: Material Cutting
  {
    id: 'jc-tikri-001',
    jobCardNo: 'JC-ORD-128-TIKRI-1',
    creationType: JobCardCreationType.AUTO_GENERATED,

    orderId: 'ord-1',
    orderNo: 'ORD-128',

    drawingId: 'drw-tikri-001',
    drawingNumber: 'TIKRI-PFD-001',
    drawingRevision: 'R2',
    drawingName: 'Tikri Component',
    drawingSelectionType: 'auto',

    childPartId: 'cp-tikri',
    childPartName: 'Tikri (PFD)',
    childPartTemplateId: 'cpt-tikri-001',

    processId: 'proc-cut-001',
    processName: 'Material Cutting',
    processCode: 'CUT-SAW',
    stepNo: 1,
    processTemplateId: 'template-tikri-001',

    dependsOnJobCardIds: [],
    blockedBy: [],

    quantity: 10,
    completedQty: 10,
    rejectedQty: 0,
    reworkQty: 0,
    inProgressQty: 0,

    status: JobCardStatus.COMPLETED,
    priority: Priority.HIGH,
    scheduleStatus: ScheduleStatus.SCHEDULED,
    scheduledBy: 'admin',
    scheduledAt: subHours(new Date(), 48),

    assignedMachineId: 'saw-01',
    assignedMachineName: 'SAW-01',
    assignedOperatorId: 'op-001',
    assignedOperatorName: 'Rajesh Kumar',

    estimatedSetupTimeMin: 10,
    estimatedCycleTimeMin: 8,
    estimatedTotalTimeMin: 90,
    actualSetupTimeMin: 12,
    actualCycleTimeMin: 7,
    actualTotalTimeMin: 82,

    scheduledStartTime: subDays(new Date(), 3),
    actualStartTime: subDays(new Date(), 3),
    actualEndTime: subHours(subDays(new Date(), 3), -2),

    materialStatus: MaterialStatus.AVAILABLE,

    customerName: 'ABC Industries',
    customerCode: 'CUST-001',
    productName: 'Printing Roller 250mm',
    productCode: 'PROD-PR-250',

    workInstructions: 'Cut EN8 material to required length for Tikri. Ensure square cuts.',
    qualityCheckpoints: 'Check length ±1mm tolerance. Verify squareness.',

    createdAt: subDays(new Date(), 4),
    createdBy: 'system',
    updatedAt: subDays(new Date(), 3),
    updatedBy: 'op-001',
  },

  // TIKRI - Step 2: Turning (1st CNC)
  {
    id: 'jc-tikri-002',
    jobCardNo: 'JC-ORD-128-TIKRI-2',
    creationType: JobCardCreationType.AUTO_GENERATED,

    orderId: 'ord-1',
    orderNo: 'ORD-128',

    drawingId: 'drw-tikri-001',
    drawingNumber: 'TIKRI-PFD-001',
    drawingRevision: 'R2',
    drawingName: 'Tikri Component',
    drawingSelectionType: 'auto',

    childPartId: 'cp-tikri',
    childPartName: 'Tikri (PFD)',
    childPartTemplateId: 'cpt-tikri-001',

    processId: 'proc-turn-cnc1-001',
    processName: 'Turning (1st CNC)',
    processCode: 'TURN-CNC1',
    stepNo: 2,
    processTemplateId: 'template-tikri-001',

    dependsOnJobCardIds: ['jc-tikri-001'],
    blockedBy: [],

    quantity: 10,
    completedQty: 10,
    rejectedQty: 0,
    reworkQty: 0,
    inProgressQty: 0,

    status: JobCardStatus.COMPLETED,
    priority: Priority.HIGH,
    scheduleStatus: ScheduleStatus.SCHEDULED,
    scheduledBy: 'admin',
    scheduledAt: subHours(new Date(), 36),

    assignedMachineId: 'cnc-01',
    assignedMachineName: 'CNC-01',
    assignedOperatorId: 'op-002',
    assignedOperatorName: 'Suresh Patil',

    estimatedSetupTimeMin: 20,
    estimatedCycleTimeMin: 15,
    estimatedTotalTimeMin: 170,
    actualSetupTimeMin: 18,
    actualCycleTimeMin: 14,
    actualTotalTimeMin: 158,

    scheduledStartTime: subDays(new Date(), 2),
    actualStartTime: subDays(new Date(), 2),
    actualEndTime: subHours(subDays(new Date(), 2), -3),

    materialStatus: MaterialStatus.AVAILABLE,

    customerName: 'ABC Industries',
    customerCode: 'CUST-001',
    productName: 'Printing Roller 250mm',
    productCode: 'PROD-PR-250',

    workInstructions: 'Rough turning operations on Tikri as per drawing.',
    qualityCheckpoints: 'Check dimensions and surface finish.',

    createdAt: subDays(new Date(), 4),
    createdBy: 'system',
    updatedAt: subDays(new Date(), 2),
    updatedBy: 'op-002',
  },

  // TIKRI - Step 3: Turning (2nd CNC)
  {
    id: 'jc-tikri-003',
    jobCardNo: 'JC-ORD-128-TIKRI-3',
    creationType: JobCardCreationType.AUTO_GENERATED,

    orderId: 'ord-1',
    orderNo: 'ORD-128',

    drawingId: 'drw-tikri-001',
    drawingNumber: 'TIKRI-PFD-001',
    drawingRevision: 'R2',
    drawingName: 'Tikri Component',
    drawingSelectionType: 'auto',

    childPartId: 'cp-tikri',
    childPartName: 'Tikri (PFD)',
    childPartTemplateId: 'cpt-tikri-001',

    processId: 'proc-turn-cnc2-001',
    processName: 'Turning (2nd CNC)',
    processCode: 'TURN-CNC2',
    stepNo: 3,
    processTemplateId: 'template-tikri-001',

    dependsOnJobCardIds: ['jc-tikri-002'],
    blockedBy: [],

    quantity: 10,
    completedQty: 6,
    rejectedQty: 0,
    reworkQty: 0,
    inProgressQty: 4,

    status: JobCardStatus.IN_PROGRESS,
    priority: Priority.HIGH,
    scheduleStatus: ScheduleStatus.UNSCHEDULED,

    assignedMachineId: 'cnc-02',
    assignedMachineName: 'CNC-02',
    assignedOperatorId: 'op-003',
    assignedOperatorName: 'Amit Shah',

    estimatedSetupTimeMin: 15,
    estimatedCycleTimeMin: 12,
    estimatedTotalTimeMin: 135,

    scheduledStartTime: subDays(new Date(), 1),
    actualStartTime: subDays(new Date(), 1),

    materialStatus: MaterialStatus.AVAILABLE,

    customerName: 'ABC Industries',
    customerCode: 'CUST-001',
    productName: 'Printing Roller 250mm',
    productCode: 'PROD-PR-250',

    workInstructions: 'Finish turning operations on Tikri.',
    qualityCheckpoints: 'Check final dimensions as per drawing.',

    createdAt: subDays(new Date(), 4),
    createdBy: 'system',
    updatedAt: new Date(),
    updatedBy: 'op-003',
  },

  // TIKRI - Step 4: PCD Holes (VMC)
  {
    id: 'jc-tikri-004',
    jobCardNo: 'JC-ORD-128-TIKRI-4',
    creationType: JobCardCreationType.AUTO_GENERATED,

    orderId: 'ord-1',
    orderNo: 'ORD-128',

    drawingId: 'drw-tikri-001',
    drawingNumber: 'TIKRI-PFD-001',
    drawingRevision: 'R2',
    drawingName: 'Tikri Component',
    drawingSelectionType: 'auto',

    childPartId: 'cp-tikri',
    childPartName: 'Tikri (PFD)',
    childPartTemplateId: 'cpt-tikri-001',

    processId: 'proc-pcd-holes-001',
    processName: 'PCD Holes (VMC)',
    processCode: 'VMC-PCD',
    stepNo: 4,
    processTemplateId: 'template-tikri-001',

    dependsOnJobCardIds: ['jc-tikri-003'],
    blockedBy: ['jc-tikri-003'],

    quantity: 10,
    completedQty: 0,
    rejectedQty: 0,
    reworkQty: 0,
    inProgressQty: 0,

    status: JobCardStatus.BLOCKED,
    priority: Priority.HIGH,
    scheduleStatus: ScheduleStatus.UNSCHEDULED,

    assignedMachineId: 'vmc-01',
    assignedMachineName: 'VMC-01',

    estimatedSetupTimeMin: 25,
    estimatedCycleTimeMin: 18,
    estimatedTotalTimeMin: 205,

    materialStatus: MaterialStatus.AVAILABLE,

    customerName: 'ABC Industries',
    customerCode: 'CUST-001',
    productName: 'Printing Roller 250mm',
    productCode: 'PROD-PR-250',

    workInstructions: 'Drill PCD holes as per drawing specification.',
    qualityCheckpoints: 'Check hole positions and diameter.',

    createdAt: subDays(new Date(), 4),
    createdBy: 'system',
    updatedAt: new Date(),
    updatedBy: 'system',
  },

  // ============================================
  // SHAFT (PFD) - Child Part 2
  // ============================================

  // SHAFT - Step 1: Material Cutting
  {
    id: 'jc-shaft-001',
    jobCardNo: 'JC-ORD-128-SHAFT-1',
    creationType: JobCardCreationType.AUTO_GENERATED,

    orderId: 'ord-1',
    orderNo: 'ORD-128',

    drawingId: 'drw-shaft-001',
    drawingNumber: 'SHAFT-PFD-001',
    drawingRevision: 'R3',
    drawingName: 'Shaft Component',
    drawingSelectionType: 'auto',

    childPartId: 'cp-shaft',
    childPartName: 'Shaft (PFD)',
    childPartTemplateId: 'cpt-shaft-001',

    processId: 'proc-cut-002',
    processName: 'Material Cutting',
    processCode: 'CUT-SAW',
    stepNo: 1,
    processTemplateId: 'template-shaft-001',

    dependsOnJobCardIds: [],
    blockedBy: [],

    quantity: 10,
    completedQty: 10,
    rejectedQty: 0,
    reworkQty: 0,
    inProgressQty: 0,

    status: JobCardStatus.COMPLETED,
    priority: Priority.HIGH,
    scheduleStatus: ScheduleStatus.UNSCHEDULED,

    assignedMachineId: 'saw-01',
    assignedMachineName: 'SAW-01',
    assignedOperatorId: 'op-001',
    assignedOperatorName: 'Rajesh Kumar',

    estimatedSetupTimeMin: 10,
    estimatedCycleTimeMin: 10,
    estimatedTotalTimeMin: 110,
    actualSetupTimeMin: 10,
    actualCycleTimeMin: 9,
    actualTotalTimeMin: 100,

    scheduledStartTime: subDays(new Date(), 3),
    actualStartTime: subDays(new Date(), 3),
    actualEndTime: subHours(subDays(new Date(), 3), -2),

    materialStatus: MaterialStatus.AVAILABLE,

    customerName: 'ABC Industries',
    customerCode: 'CUST-001',
    productName: 'Printing Roller 250mm',
    productCode: 'PROD-PR-250',

    workInstructions: 'Cut EN19 material to required length for Shaft.',
    qualityCheckpoints: 'Check length ±1mm tolerance.',

    createdAt: subDays(new Date(), 4),
    createdBy: 'system',
    updatedAt: subDays(new Date(), 3),
    updatedBy: 'op-001',
  },

  // SHAFT - Step 2: Turning (1st CNC)
  {
    id: 'jc-shaft-002',
    jobCardNo: 'JC-ORD-128-SHAFT-2',
    creationType: JobCardCreationType.AUTO_GENERATED,

    orderId: 'ord-1',
    orderNo: 'ORD-128',

    drawingId: 'drw-shaft-001',
    drawingNumber: 'SHAFT-PFD-001',
    drawingRevision: 'R3',
    drawingName: 'Shaft Component',
    drawingSelectionType: 'auto',

    childPartId: 'cp-shaft',
    childPartName: 'Shaft (PFD)',
    childPartTemplateId: 'cpt-shaft-001',

    processId: 'proc-turn-cnc1-002',
    processName: 'Turning (1st CNC)',
    processCode: 'TURN-CNC1',
    stepNo: 2,
    processTemplateId: 'template-shaft-001',

    dependsOnJobCardIds: ['jc-shaft-001'],
    blockedBy: [],

    quantity: 10,
    completedQty: 10,
    rejectedQty: 0,
    reworkQty: 0,
    inProgressQty: 0,

    status: JobCardStatus.COMPLETED,
    priority: Priority.HIGH,
    scheduleStatus: ScheduleStatus.UNSCHEDULED,

    assignedMachineId: 'cnc-01',
    assignedMachineName: 'CNC-01',
    assignedOperatorId: 'op-002',
    assignedOperatorName: 'Suresh Patil',

    estimatedSetupTimeMin: 20,
    estimatedCycleTimeMin: 18,
    estimatedTotalTimeMin: 200,
    actualSetupTimeMin: 20,
    actualCycleTimeMin: 17,
    actualTotalTimeMin: 190,

    scheduledStartTime: subDays(new Date(), 2),
    actualStartTime: subDays(new Date(), 2),
    actualEndTime: subHours(subDays(new Date(), 2), -4),

    materialStatus: MaterialStatus.AVAILABLE,

    customerName: 'ABC Industries',
    customerCode: 'CUST-001',
    productName: 'Printing Roller 250mm',
    productCode: 'PROD-PR-250',

    workInstructions: '1st roughing operation on shaft.',
    qualityCheckpoints: 'Check dimensions.',

    createdAt: subDays(new Date(), 4),
    createdBy: 'system',
    updatedAt: subDays(new Date(), 2),
    updatedBy: 'op-002',
  },

  // SHAFT - Step 3: Turning (2nd CNC)
  {
    id: 'jc-shaft-003',
    jobCardNo: 'JC-ORD-128-SHAFT-3',
    creationType: JobCardCreationType.AUTO_GENERATED,

    orderId: 'ord-1',
    orderNo: 'ORD-128',

    drawingId: 'drw-shaft-001',
    drawingNumber: 'SHAFT-PFD-001',
    drawingRevision: 'R3',
    drawingName: 'Shaft Component',
    drawingSelectionType: 'auto',

    childPartId: 'cp-shaft',
    childPartName: 'Shaft (PFD)',
    childPartTemplateId: 'cpt-shaft-001',

    processId: 'proc-turn-cnc2-002',
    processName: 'Turning (2nd CNC)',
    processCode: 'TURN-CNC2',
    stepNo: 3,
    processTemplateId: 'template-shaft-001',

    dependsOnJobCardIds: ['jc-shaft-002'],
    blockedBy: [],

    quantity: 10,
    completedQty: 10,
    rejectedQty: 0,
    reworkQty: 0,
    inProgressQty: 0,

    status: JobCardStatus.COMPLETED,
    priority: Priority.HIGH,
    scheduleStatus: ScheduleStatus.UNSCHEDULED,

    assignedMachineId: 'cnc-02',
    assignedMachineName: 'CNC-02',
    assignedOperatorId: 'op-003',
    assignedOperatorName: 'Amit Shah',

    estimatedSetupTimeMin: 20,
    estimatedCycleTimeMin: 16,
    estimatedTotalTimeMin: 180,
    actualSetupTimeMin: 18,
    actualCycleTimeMin: 16,
    actualTotalTimeMin: 178,

    scheduledStartTime: subDays(new Date(), 1),
    actualStartTime: subDays(new Date(), 1),
    actualEndTime: subHours(subDays(new Date(), 1), -3),

    materialStatus: MaterialStatus.AVAILABLE,

    customerName: 'ABC Industries',
    customerCode: 'CUST-001',
    productName: 'Printing Roller 250mm',
    productCode: 'PROD-PR-250',

    workInstructions: '2nd turning operation on shaft.',
    qualityCheckpoints: 'Check dimensions and concentricity.',

    createdAt: subDays(new Date(), 4),
    createdBy: 'system',
    updatedAt: subDays(new Date(), 1),
    updatedBy: 'op-003',
  },

  // SHAFT - Step 4: Turning (3rd CNC)
  {
    id: 'jc-shaft-004',
    jobCardNo: 'JC-ORD-128-SHAFT-4',
    creationType: JobCardCreationType.AUTO_GENERATED,

    orderId: 'ord-1',
    orderNo: 'ORD-128',

    drawingId: 'drw-shaft-001',
    drawingNumber: 'SHAFT-PFD-001',
    drawingRevision: 'R3',
    drawingName: 'Shaft Component',
    drawingSelectionType: 'auto',

    childPartId: 'cp-shaft',
    childPartName: 'Shaft (PFD)',
    childPartTemplateId: 'cpt-shaft-001',

    processId: 'proc-turn-cnc3-002',
    processName: 'Turning (3rd CNC)',
    processCode: 'TURN-CNC3',
    stepNo: 4,
    processTemplateId: 'template-shaft-001',

    dependsOnJobCardIds: ['jc-shaft-003'],
    blockedBy: [],

    quantity: 10,
    completedQty: 10,
    rejectedQty: 0,
    reworkQty: 0,
    inProgressQty: 0,

    status: JobCardStatus.COMPLETED,
    priority: Priority.HIGH,
    scheduleStatus: ScheduleStatus.UNSCHEDULED,

    assignedMachineId: 'cnc-03',
    assignedMachineName: 'CNC-03',
    assignedOperatorId: 'op-004',
    assignedOperatorName: 'Prakash Jain',

    estimatedSetupTimeMin: 15,
    estimatedCycleTimeMin: 14,
    estimatedTotalTimeMin: 155,
    actualSetupTimeMin: 15,
    actualCycleTimeMin: 13,
    actualTotalTimeMin: 145,

    scheduledStartTime: subDays(new Date(), 1),
    actualStartTime: subDays(new Date(), 1),
    actualEndTime: subHours(new Date(), -5),

    materialStatus: MaterialStatus.AVAILABLE,

    customerName: 'ABC Industries',
    customerCode: 'CUST-001',
    productName: 'Printing Roller 250mm',
    productCode: 'PROD-PR-250',

    workInstructions: '3rd turning operation on shaft.',
    qualityCheckpoints: 'Check dimensions.',

    createdAt: subDays(new Date(), 4),
    createdBy: 'system',
    updatedAt: subHours(new Date(), -5),
    updatedBy: 'op-004',
  },

  // SHAFT - Step 5: Turning (4th Opr CNC)
  {
    id: 'jc-shaft-005',
    jobCardNo: 'JC-ORD-128-SHAFT-5',
    creationType: JobCardCreationType.AUTO_GENERATED,

    orderId: 'ord-1',
    orderNo: 'ORD-128',

    drawingId: 'drw-shaft-001',
    drawingNumber: 'SHAFT-PFD-001',
    drawingRevision: 'R3',
    drawingName: 'Shaft Component',
    drawingSelectionType: 'auto',

    childPartId: 'cp-shaft',
    childPartName: 'Shaft (PFD)',
    childPartTemplateId: 'cpt-shaft-001',

    processId: 'proc-turn-cnc4-002',
    processName: 'Turning (4th Opr CNC)',
    processCode: 'TURN-CNC4',
    stepNo: 5,
    processTemplateId: 'template-shaft-001',

    dependsOnJobCardIds: ['jc-shaft-004'],
    blockedBy: [],

    quantity: 10,
    completedQty: 10,
    rejectedQty: 0,
    reworkQty: 0,
    inProgressQty: 0,

    status: JobCardStatus.COMPLETED,
    priority: Priority.HIGH,
    scheduleStatus: ScheduleStatus.UNSCHEDULED,

    assignedMachineId: 'cnc-04',
    assignedMachineName: 'CNC-04',
    assignedOperatorId: 'op-005',
    assignedOperatorName: 'Dinesh Rao',

    estimatedSetupTimeMin: 18,
    estimatedCycleTimeMin: 15,
    estimatedTotalTimeMin: 168,
    actualSetupTimeMin: 18,
    actualCycleTimeMin: 14,
    actualTotalTimeMin: 158,

    scheduledStartTime: subHours(new Date(), -4),
    actualStartTime: subHours(new Date(), -4),
    actualEndTime: subHours(new Date(), -1),

    materialStatus: MaterialStatus.AVAILABLE,

    customerName: 'ABC Industries',
    customerCode: 'CUST-001',
    productName: 'Printing Roller 250mm',
    productCode: 'PROD-PR-250',

    workInstructions: 'Final turning operation on shaft before OSP.',
    qualityCheckpoints: 'Check all dimensions before sending to OSP.',

    createdAt: subDays(new Date(), 4),
    createdBy: 'system',
    updatedAt: subHours(new Date(), -1),
    updatedBy: 'op-005',
  },

  // SHAFT - Step 6: Blackning (OSP)
  {
    id: 'jc-shaft-006',
    jobCardNo: 'JC-ORD-128-SHAFT-6',
    creationType: JobCardCreationType.AUTO_GENERATED,

    orderId: 'ord-1',
    orderNo: 'ORD-128',

    drawingId: 'drw-shaft-001',
    drawingNumber: 'SHAFT-PFD-001',
    drawingRevision: 'R3',
    drawingName: 'Shaft Component',
    drawingSelectionType: 'auto',

    childPartId: 'cp-shaft',
    childPartName: 'Shaft (PFD)',
    childPartTemplateId: 'cpt-shaft-001',

    processId: 'proc-blackning-001',
    processName: 'Blackning (OSP)',
    processCode: 'OSP-BLACK',
    stepNo: 6,
    processTemplateId: 'template-shaft-001',

    dependsOnJobCardIds: ['jc-shaft-005'],
    blockedBy: [],

    quantity: 10,
    completedQty: 0,
    rejectedQty: 0,
    reworkQty: 0,
    inProgressQty: 10,

    status: JobCardStatus.IN_PROGRESS,
    priority: Priority.HIGH,
    scheduleStatus: ScheduleStatus.UNSCHEDULED,

    assignedMachineId: 'osp-vendor-001',
    assignedMachineName: 'External Vendor (OSP)',

    estimatedSetupTimeMin: 0,
    estimatedCycleTimeMin: 60,
    estimatedTotalTimeMin: 600,

    actualStartTime: subHours(new Date(), -1),

    materialStatus: MaterialStatus.AVAILABLE,

    customerName: 'ABC Industries',
    customerCode: 'CUST-001',
    productName: 'Printing Roller 250mm',
    productCode: 'PROD-PR-250',

    workInstructions: 'Send to external vendor for blackning treatment. Expected return: tomorrow.',
    qualityCheckpoints: 'Check surface finish and color uniformity upon return.',

    createdAt: subDays(new Date(), 4),
    createdBy: 'system',
    updatedAt: subHours(new Date(), -1),
    updatedBy: 'system',
  },

  // SHAFT - Step 7: O.D. Grinding (1st)
  {
    id: 'jc-shaft-007',
    jobCardNo: 'JC-ORD-128-SHAFT-7',
    creationType: JobCardCreationType.AUTO_GENERATED,

    orderId: 'ord-1',
    orderNo: 'ORD-128',

    drawingId: 'drw-shaft-001',
    drawingNumber: 'SHAFT-PFD-001',
    drawingRevision: 'R3',
    drawingName: 'Shaft Component',
    drawingSelectionType: 'auto',

    childPartId: 'cp-shaft',
    childPartName: 'Shaft (PFD)',
    childPartTemplateId: 'cpt-shaft-001',

    processId: 'proc-grinding-od1-001',
    processName: 'O.D. Grinding (1st)',
    processCode: 'GRIND-OD1',
    stepNo: 7,
    processTemplateId: 'template-shaft-001',

    dependsOnJobCardIds: ['jc-shaft-006'],
    blockedBy: ['jc-shaft-006'],

    quantity: 10,
    completedQty: 0,
    rejectedQty: 0,
    reworkQty: 0,
    inProgressQty: 0,

    status: JobCardStatus.BLOCKED,
    priority: Priority.HIGH,
    scheduleStatus: ScheduleStatus.UNSCHEDULED,

    assignedMachineId: 'grn-01',
    assignedMachineName: 'GRN-01',

    estimatedSetupTimeMin: 25,
    estimatedCycleTimeMin: 20,
    estimatedTotalTimeMin: 225,

    materialStatus: MaterialStatus.AVAILABLE,

    customerName: 'ABC Industries',
    customerCode: 'CUST-001',
    productName: 'Printing Roller 250mm',
    productCode: 'PROD-PR-250',

    workInstructions: '1st OD grinding operation on shaft.',
    qualityCheckpoints: 'Check OD tolerance and surface finish.',

    createdAt: subDays(new Date(), 4),
    createdBy: 'system',
    updatedAt: new Date(),
    updatedBy: 'system',
  },

  // SHAFT - Step 8: O.D. Grinding (2nd)
  {
    id: 'jc-shaft-008',
    jobCardNo: 'JC-ORD-128-SHAFT-8',
    creationType: JobCardCreationType.AUTO_GENERATED,

    orderId: 'ord-1',
    orderNo: 'ORD-128',

    drawingId: 'drw-shaft-001',
    drawingNumber: 'SHAFT-PFD-001',
    drawingRevision: 'R3',
    drawingName: 'Shaft Component',
    drawingSelectionType: 'auto',

    childPartId: 'cp-shaft',
    childPartName: 'Shaft (PFD)',
    childPartTemplateId: 'cpt-shaft-001',

    processId: 'proc-grinding-od2-001',
    processName: 'O.D. Grinding (2nd)',
    processCode: 'GRIND-OD2',
    stepNo: 8,
    processTemplateId: 'template-shaft-001',

    dependsOnJobCardIds: ['jc-shaft-007'],
    blockedBy: ['jc-shaft-007'],

    quantity: 10,
    completedQty: 0,
    rejectedQty: 0,
    reworkQty: 0,
    inProgressQty: 0,

    status: JobCardStatus.BLOCKED,
    priority: Priority.HIGH,
    scheduleStatus: ScheduleStatus.UNSCHEDULED,

    assignedMachineId: 'grn-01',
    assignedMachineName: 'GRN-01',

    estimatedSetupTimeMin: 20,
    estimatedCycleTimeMin: 18,
    estimatedTotalTimeMin: 200,

    materialStatus: MaterialStatus.AVAILABLE,

    customerName: 'ABC Industries',
    customerCode: 'CUST-001',
    productName: 'Printing Roller 250mm',
    productCode: 'PROD-PR-250',

    workInstructions: '2nd OD grinding operation on shaft.',
    qualityCheckpoints: 'Check OD tolerance.',

    createdAt: subDays(new Date(), 4),
    createdBy: 'system',
    updatedAt: new Date(),
    updatedBy: 'system',
  },

  // SHAFT - Step 9: O.D. Grinding (3rd)
  {
    id: 'jc-shaft-009',
    jobCardNo: 'JC-ORD-128-SHAFT-9',
    creationType: JobCardCreationType.AUTO_GENERATED,

    orderId: 'ord-1',
    orderNo: 'ORD-128',

    drawingId: 'drw-shaft-001',
    drawingNumber: 'SHAFT-PFD-001',
    drawingRevision: 'R3',
    drawingName: 'Shaft Component',
    drawingSelectionType: 'auto',

    childPartId: 'cp-shaft',
    childPartName: 'Shaft (PFD)',
    childPartTemplateId: 'cpt-shaft-001',

    processId: 'proc-grinding-od3-001',
    processName: 'O.D. Grinding (3rd)',
    processCode: 'GRIND-OD3',
    stepNo: 9,
    processTemplateId: 'template-shaft-001',

    dependsOnJobCardIds: ['jc-shaft-008'],
    blockedBy: ['jc-shaft-008'],

    quantity: 10,
    completedQty: 0,
    rejectedQty: 0,
    reworkQty: 0,
    inProgressQty: 0,

    status: JobCardStatus.BLOCKED,
    priority: Priority.HIGH,
    scheduleStatus: ScheduleStatus.UNSCHEDULED,

    assignedMachineId: 'grn-01',
    assignedMachineName: 'GRN-01',

    estimatedSetupTimeMin: 18,
    estimatedCycleTimeMin: 16,
    estimatedTotalTimeMin: 178,

    materialStatus: MaterialStatus.AVAILABLE,

    customerName: 'ABC Industries',
    customerCode: 'CUST-001',
    productName: 'Printing Roller 250mm',
    productCode: 'PROD-PR-250',

    workInstructions: '3rd OD grinding operation on shaft.',
    qualityCheckpoints: 'Check OD tolerance.',

    createdAt: subDays(new Date(), 4),
    createdBy: 'system',
    updatedAt: new Date(),
    updatedBy: 'system',
  },

  // SHAFT - Step 10: O.D. Grinding (4th - Final)
  {
    id: 'jc-shaft-010',
    jobCardNo: 'JC-ORD-128-SHAFT-10',
    creationType: JobCardCreationType.AUTO_GENERATED,

    orderId: 'ord-1',
    orderNo: 'ORD-128',

    drawingId: 'drw-shaft-001',
    drawingNumber: 'SHAFT-PFD-001',
    drawingRevision: 'R3',
    drawingName: 'Shaft Component',
    drawingSelectionType: 'auto',

    childPartId: 'cp-shaft',
    childPartName: 'Shaft (PFD)',
    childPartTemplateId: 'cpt-shaft-001',

    processId: 'proc-grinding-od4-001',
    processName: 'O.D. Grinding (4th - Final)',
    processCode: 'GRIND-OD4',
    stepNo: 10,
    processTemplateId: 'template-shaft-001',

    dependsOnJobCardIds: ['jc-shaft-009'],
    blockedBy: ['jc-shaft-009'],

    quantity: 10,
    completedQty: 0,
    rejectedQty: 0,
    reworkQty: 0,
    inProgressQty: 0,

    status: JobCardStatus.BLOCKED,
    priority: Priority.HIGH,
    scheduleStatus: ScheduleStatus.UNSCHEDULED,

    assignedMachineId: 'grn-01',
    assignedMachineName: 'GRN-01',

    estimatedSetupTimeMin: 20,
    estimatedCycleTimeMin: 18,
    estimatedTotalTimeMin: 200,

    materialStatus: MaterialStatus.AVAILABLE,

    customerName: 'ABC Industries',
    customerCode: 'CUST-001',
    productName: 'Printing Roller 250mm',
    productCode: 'PROD-PR-250',

    workInstructions: 'Final OD grinding operation on shaft. Ready for assembly after completion.',
    qualityCheckpoints: 'Final check of OD tolerance, surface finish, concentricity.',

    createdAt: subDays(new Date(), 4),
    createdBy: 'system',
    updatedAt: new Date(),
    updatedBy: 'system',
  },

  // ============================================
  // BEARERS (PFD) - Child Part 3
  // ============================================

  // BEARERS - Step 1: Material Cutting
  {
    id: 'jc-bearers-001',
    jobCardNo: 'JC-ORD-128-BEARERS-1',
    creationType: JobCardCreationType.AUTO_GENERATED,

    orderId: 'ord-1',
    orderNo: 'ORD-128',

    drawingId: 'drw-bearers-001',
    drawingNumber: 'BEARERS-PFD-001',
    drawingRevision: 'R1',
    drawingName: 'Bearers Component',
    drawingSelectionType: 'auto',

    childPartId: 'cp-bearers',
    childPartName: 'Bearers (PFD)',
    childPartTemplateId: 'cpt-bearers-001',

    processId: 'proc-cut-003',
    processName: 'Material Cutting',
    processCode: 'CUT-SAW',
    stepNo: 1,
    processTemplateId: 'template-bearers-001',

    dependsOnJobCardIds: [],
    blockedBy: [],

    quantity: 10,
    completedQty: 10,
    rejectedQty: 0,
    reworkQty: 0,
    inProgressQty: 0,

    status: JobCardStatus.COMPLETED,
    priority: Priority.MEDIUM,
    scheduleStatus: ScheduleStatus.UNSCHEDULED,

    assignedMachineId: 'saw-01',
    assignedMachineName: 'SAW-01',
    assignedOperatorId: 'op-001',
    assignedOperatorName: 'Rajesh Kumar',

    estimatedSetupTimeMin: 10,
    estimatedCycleTimeMin: 6,
    estimatedTotalTimeMin: 70,
    actualSetupTimeMin: 10,
    actualCycleTimeMin: 6,
    actualTotalTimeMin: 70,

    scheduledStartTime: subDays(new Date(), 2),
    actualStartTime: subDays(new Date(), 2),
    actualEndTime: subHours(subDays(new Date(), 2), -1),

    materialStatus: MaterialStatus.AVAILABLE,

    customerName: 'ABC Industries',
    customerCode: 'CUST-001',
    productName: 'Printing Roller 250mm',
    productCode: 'PROD-PR-250',

    workInstructions: 'Cut material for Bearers.',

    createdAt: subDays(new Date(), 4),
    createdBy: 'system',
    updatedAt: subDays(new Date(), 2),
    updatedBy: 'op-001',
  },

  // BEARERS - Step 2: Turning (1st CNC)
  {
    id: 'jc-bearers-002',
    jobCardNo: 'JC-ORD-128-BEARERS-2',
    creationType: JobCardCreationType.AUTO_GENERATED,

    orderId: 'ord-1',
    orderNo: 'ORD-128',

    drawingId: 'drw-bearers-001',
    drawingNumber: 'BEARERS-PFD-001',
    drawingRevision: 'R1',
    drawingName: 'Bearers Component',
    drawingSelectionType: 'auto',

    childPartId: 'cp-bearers',
    childPartName: 'Bearers (PFD)',
    childPartTemplateId: 'cpt-bearers-001',

    processId: 'proc-turn-cnc1-003',
    processName: 'Turning (1st CNC)',
    processCode: 'TURN-CNC1',
    stepNo: 2,
    processTemplateId: 'template-bearers-001',

    dependsOnJobCardIds: ['jc-bearers-001'],
    blockedBy: [],

    quantity: 10,
    completedQty: 10,
    rejectedQty: 0,
    reworkQty: 0,
    inProgressQty: 0,

    status: JobCardStatus.COMPLETED,
    priority: Priority.MEDIUM,
    scheduleStatus: ScheduleStatus.UNSCHEDULED,

    assignedMachineId: 'cnc-01',
    assignedMachineName: 'CNC-01',
    assignedOperatorId: 'op-002',
    assignedOperatorName: 'Suresh Patil',

    estimatedSetupTimeMin: 15,
    estimatedCycleTimeMin: 12,
    estimatedTotalTimeMin: 135,
    actualSetupTimeMin: 15,
    actualCycleTimeMin: 11,
    actualTotalTimeMin: 125,

    scheduledStartTime: subDays(new Date(), 1),
    actualStartTime: subDays(new Date(), 1),
    actualEndTime: subHours(subDays(new Date(), 1), -2),

    materialStatus: MaterialStatus.AVAILABLE,

    customerName: 'ABC Industries',
    customerCode: 'CUST-001',
    productName: 'Printing Roller 250mm',
    productCode: 'PROD-PR-250',

    workInstructions: '1st turning operation on Bearers.',
    qualityCheckpoints: 'Check dimensions.',

    createdAt: subDays(new Date(), 4),
    createdBy: 'system',
    updatedAt: subDays(new Date(), 1),
    updatedBy: 'op-002',
  },

  // BEARERS - Step 3: Turning (2nd CNC)
  {
    id: 'jc-bearers-003',
    jobCardNo: 'JC-ORD-128-BEARERS-3',
    creationType: JobCardCreationType.AUTO_GENERATED,

    orderId: 'ord-1',
    orderNo: 'ORD-128',

    drawingId: 'drw-bearers-001',
    drawingNumber: 'BEARERS-PFD-001',
    drawingRevision: 'R1',
    drawingName: 'Bearers Component',
    drawingSelectionType: 'auto',

    childPartId: 'cp-bearers',
    childPartName: 'Bearers (PFD)',
    childPartTemplateId: 'cpt-bearers-001',

    processId: 'proc-turn-cnc2-003',
    processName: 'Turning (2nd CNC)',
    processCode: 'TURN-CNC2',
    stepNo: 3,
    processTemplateId: 'template-bearers-001',

    dependsOnJobCardIds: ['jc-bearers-002'],
    blockedBy: [],

    quantity: 10,
    completedQty: 10,
    rejectedQty: 0,
    reworkQty: 0,
    inProgressQty: 0,

    status: JobCardStatus.COMPLETED,
    priority: Priority.MEDIUM,
    scheduleStatus: ScheduleStatus.UNSCHEDULED,

    assignedMachineId: 'cnc-02',
    assignedMachineName: 'CNC-02',
    assignedOperatorId: 'op-003',
    assignedOperatorName: 'Amit Shah',

    estimatedSetupTimeMin: 12,
    estimatedCycleTimeMin: 10,
    estimatedTotalTimeMin: 112,
    actualSetupTimeMin: 12,
    actualCycleTimeMin: 9,
    actualTotalTimeMin: 102,

    scheduledStartTime: subHours(new Date(), -6),
    actualStartTime: subHours(new Date(), -6),
    actualEndTime: subHours(new Date(), -4),

    materialStatus: MaterialStatus.AVAILABLE,

    customerName: 'ABC Industries',
    customerCode: 'CUST-001',
    productName: 'Printing Roller 250mm',
    productCode: 'PROD-PR-250',

    workInstructions: '2nd turning operation on Bearers.',
    qualityCheckpoints: 'Check final dimensions.',

    createdAt: subDays(new Date(), 4),
    createdBy: 'system',
    updatedAt: subHours(new Date(), -4),
    updatedBy: 'op-003',
  },

  // BEARERS - Step 4: Blackning (OSP)
  {
    id: 'jc-bearers-004',
    jobCardNo: 'JC-ORD-128-BEARERS-4',
    creationType: JobCardCreationType.AUTO_GENERATED,

    orderId: 'ord-1',
    orderNo: 'ORD-128',

    drawingId: 'drw-bearers-001',
    drawingNumber: 'BEARERS-PFD-001',
    drawingRevision: 'R1',
    drawingName: 'Bearers Component',
    drawingSelectionType: 'auto',

    childPartId: 'cp-bearers',
    childPartName: 'Bearers (PFD)',
    childPartTemplateId: 'cpt-bearers-001',

    processId: 'proc-blackning-002',
    processName: 'Blackning (OSP)',
    processCode: 'OSP-BLACK',
    stepNo: 4,
    processTemplateId: 'template-bearers-001',

    dependsOnJobCardIds: ['jc-bearers-003'],
    blockedBy: [],

    quantity: 10,
    completedQty: 10,
    rejectedQty: 0,
    reworkQty: 0,
    inProgressQty: 0,

    status: JobCardStatus.COMPLETED,
    priority: Priority.MEDIUM,
    scheduleStatus: ScheduleStatus.UNSCHEDULED,

    assignedMachineId: 'osp-vendor-001',
    assignedMachineName: 'External Vendor (OSP)',

    estimatedSetupTimeMin: 0,
    estimatedCycleTimeMin: 60,
    estimatedTotalTimeMin: 600,
    actualSetupTimeMin: 0,
    actualCycleTimeMin: 60,
    actualTotalTimeMin: 600,

    scheduledStartTime: subHours(new Date(), -3),
    actualStartTime: subHours(new Date(), -3),
    actualEndTime: subHours(new Date(), -2),

    materialStatus: MaterialStatus.AVAILABLE,

    customerName: 'ABC Industries',
    customerCode: 'CUST-001',
    productName: 'Printing Roller 250mm',
    productCode: 'PROD-PR-250',

    workInstructions: 'Send to external vendor for blackning treatment.',
    qualityCheckpoints: 'Check surface finish and color uniformity upon return.',

    createdAt: subDays(new Date(), 4),
    createdBy: 'system',
    updatedAt: subHours(new Date(), -2),
    updatedBy: 'system',
  },

  // BEARERS - Step 5: Marking
  {
    id: 'jc-bearers-005',
    jobCardNo: 'JC-ORD-128-BEARERS-5',
    creationType: JobCardCreationType.AUTO_GENERATED,

    orderId: 'ord-1',
    orderNo: 'ORD-128',

    drawingId: 'drw-bearers-001',
    drawingNumber: 'BEARERS-PFD-001',
    drawingRevision: 'R1',
    drawingName: 'Bearers Component',
    drawingSelectionType: 'auto',

    childPartId: 'cp-bearers',
    childPartName: 'Bearers (PFD)',
    childPartTemplateId: 'cpt-bearers-001',

    processId: 'proc-marking-001',
    processName: 'Marking',
    processCode: 'MARK-LASER',
    stepNo: 5,
    processTemplateId: 'template-bearers-001',

    dependsOnJobCardIds: ['jc-bearers-004'],
    blockedBy: [],

    quantity: 10,
    completedQty: 0,
    rejectedQty: 0,
    reworkQty: 0,
    inProgressQty: 0,

    status: JobCardStatus.READY,
    priority: Priority.MEDIUM,
    scheduleStatus: ScheduleStatus.UNSCHEDULED,

    assignedMachineId: 'mark-01',
    assignedMachineName: 'LASER-MARK-01',

    estimatedSetupTimeMin: 5,
    estimatedCycleTimeMin: 3,
    estimatedTotalTimeMin: 35,

    materialStatus: MaterialStatus.AVAILABLE,

    customerName: 'ABC Industries',
    customerCode: 'CUST-001',
    productName: 'Printing Roller 250mm',
    productCode: 'PROD-PR-250',

    workInstructions: 'Laser mark part number and specifications on Bearers.',
    qualityCheckpoints: 'Check marking legibility and position.',

    createdAt: subDays(new Date(), 4),
    createdBy: 'system',
    updatedAt: new Date(),
    updatedBy: 'system',
  },

  // ============================================
  // GEAR (PFD) - Child Part 4
  // ============================================

  // GEAR - Step 1: Material Cutting
  {
    id: 'jc-gear-001',
    jobCardNo: 'JC-ORD-128-GEAR-1',
    creationType: JobCardCreationType.AUTO_GENERATED,

    orderId: 'ord-1',
    orderNo: 'ORD-128',

    drawingId: 'drw-gear-001',
    drawingNumber: 'GEAR-PFD-001',
    drawingRevision: 'R2',
    drawingName: 'Gear Component',
    drawingSelectionType: 'auto',

    childPartId: 'cp-gear',
    childPartName: 'Gear (PFD)',
    childPartTemplateId: 'cpt-gear-001',

    processId: 'proc-cut-004',
    processName: 'Material Cutting',
    processCode: 'CUT-SAW',
    stepNo: 1,
    processTemplateId: 'template-gear-001',

    dependsOnJobCardIds: [],
    blockedBy: [],

    quantity: 10,
    completedQty: 0,
    rejectedQty: 0,
    reworkQty: 0,
    inProgressQty: 0,

    status: JobCardStatus.READY,
    priority: Priority.MEDIUM,
    scheduleStatus: ScheduleStatus.UNSCHEDULED,

    assignedMachineId: 'saw-01',
    assignedMachineName: 'SAW-01',

    estimatedSetupTimeMin: 10,
    estimatedCycleTimeMin: 8,
    estimatedTotalTimeMin: 90,

    materialStatus: MaterialStatus.AVAILABLE,

    customerName: 'ABC Industries',
    customerCode: 'CUST-001',
    productName: 'Printing Roller 250mm',
    productCode: 'PROD-PR-250',

    workInstructions: 'Cut material for Gear component.',

    createdAt: subDays(new Date(), 4),
    createdBy: 'system',
    updatedAt: new Date(),
    updatedBy: 'system',
  },

  // GEAR - Step 2: Turning (1st CNC)
  {
    id: 'jc-gear-002',
    jobCardNo: 'JC-ORD-128-GEAR-2',
    creationType: JobCardCreationType.AUTO_GENERATED,

    orderId: 'ord-1',
    orderNo: 'ORD-128',

    drawingId: 'drw-gear-001',
    drawingNumber: 'GEAR-PFD-001',
    drawingRevision: 'R2',
    drawingName: 'Gear Component',
    drawingSelectionType: 'auto',

    childPartId: 'cp-gear',
    childPartName: 'Gear (PFD)',
    childPartTemplateId: 'cpt-gear-001',

    processId: 'proc-turn-cnc1-004',
    processName: 'Turning (1st CNC)',
    processCode: 'TURN-CNC1',
    stepNo: 2,
    processTemplateId: 'template-gear-001',

    dependsOnJobCardIds: ['jc-gear-001'],
    blockedBy: ['jc-gear-001'],

    quantity: 10,
    completedQty: 0,
    rejectedQty: 0,
    reworkQty: 0,
    inProgressQty: 0,

    status: JobCardStatus.BLOCKED,
    priority: Priority.MEDIUM,
    scheduleStatus: ScheduleStatus.UNSCHEDULED,

    assignedMachineId: 'cnc-01',
    assignedMachineName: 'CNC-01',

    estimatedSetupTimeMin: 20,
    estimatedCycleTimeMin: 16,
    estimatedTotalTimeMin: 180,

    materialStatus: MaterialStatus.AVAILABLE,

    customerName: 'ABC Industries',
    customerCode: 'CUST-001',
    productName: 'Printing Roller 250mm',
    productCode: 'PROD-PR-250',

    workInstructions: '1st turning operation on Gear blank.',
    qualityCheckpoints: 'Check dimensions and concentricity.',

    createdAt: subDays(new Date(), 4),
    createdBy: 'system',
    updatedAt: new Date(),
    updatedBy: 'system',
  },

  // GEAR - Step 3: Turning (2nd CNC)
  {
    id: 'jc-gear-003',
    jobCardNo: 'JC-ORD-128-GEAR-3',
    creationType: JobCardCreationType.AUTO_GENERATED,

    orderId: 'ord-1',
    orderNo: 'ORD-128',

    drawingId: 'drw-gear-001',
    drawingNumber: 'GEAR-PFD-001',
    drawingRevision: 'R2',
    drawingName: 'Gear Component',
    drawingSelectionType: 'auto',

    childPartId: 'cp-gear',
    childPartName: 'Gear (PFD)',
    childPartTemplateId: 'cpt-gear-001',

    processId: 'proc-turn-cnc2-004',
    processName: 'Turning (2nd CNC)',
    processCode: 'TURN-CNC2',
    stepNo: 3,
    processTemplateId: 'template-gear-001',

    dependsOnJobCardIds: ['jc-gear-002'],
    blockedBy: ['jc-gear-002'],

    quantity: 10,
    completedQty: 0,
    rejectedQty: 0,
    reworkQty: 0,
    inProgressQty: 0,

    status: JobCardStatus.BLOCKED,
    priority: Priority.MEDIUM,
    scheduleStatus: ScheduleStatus.UNSCHEDULED,

    assignedMachineId: 'cnc-02',
    assignedMachineName: 'CNC-02',

    estimatedSetupTimeMin: 18,
    estimatedCycleTimeMin: 14,
    estimatedTotalTimeMin: 158,

    materialStatus: MaterialStatus.AVAILABLE,

    customerName: 'ABC Industries',
    customerCode: 'CUST-001',
    productName: 'Printing Roller 250mm',
    productCode: 'PROD-PR-250',

    workInstructions: '2nd turning operation on Gear blank.',
    qualityCheckpoints: 'Check dimensions.',

    createdAt: subDays(new Date(), 4),
    createdBy: 'system',
    updatedAt: new Date(),
    updatedBy: 'system',
  },

  // GEAR - Step 4: PCD (VMC)
  {
    id: 'jc-gear-004',
    jobCardNo: 'JC-ORD-128-GEAR-4',
    creationType: JobCardCreationType.AUTO_GENERATED,

    orderId: 'ord-1',
    orderNo: 'ORD-128',

    drawingId: 'drw-gear-001',
    drawingNumber: 'GEAR-PFD-001',
    drawingRevision: 'R2',
    drawingName: 'Gear Component',
    drawingSelectionType: 'auto',

    childPartId: 'cp-gear',
    childPartName: 'Gear (PFD)',
    childPartTemplateId: 'cpt-gear-001',

    processId: 'proc-pcd-001',
    processName: 'PCD (VMC)',
    processCode: 'VMC-PCD',
    stepNo: 4,
    processTemplateId: 'template-gear-001',

    dependsOnJobCardIds: ['jc-gear-003'],
    blockedBy: ['jc-gear-003'],

    quantity: 10,
    completedQty: 0,
    rejectedQty: 0,
    reworkQty: 0,
    inProgressQty: 0,

    status: JobCardStatus.BLOCKED,
    priority: Priority.MEDIUM,
    scheduleStatus: ScheduleStatus.UNSCHEDULED,

    assignedMachineId: 'vmc-01',
    assignedMachineName: 'VMC-01',

    estimatedSetupTimeMin: 30,
    estimatedCycleTimeMin: 20,
    estimatedTotalTimeMin: 230,

    materialStatus: MaterialStatus.AVAILABLE,

    customerName: 'ABC Industries',
    customerCode: 'CUST-001',
    productName: 'Printing Roller 250mm',
    productCode: 'PROD-PR-250',

    workInstructions: 'Machine PCD holes on gear blank using VMC.',
    qualityCheckpoints: 'Check hole positions and dimensions.',

    createdAt: subDays(new Date(), 4),
    createdBy: 'system',
    updatedAt: new Date(),
    updatedBy: 'system',
  },

  // GEAR - Step 5: Hobbing/Teeth Cutting
  {
    id: 'jc-gear-005',
    jobCardNo: 'JC-ORD-128-GEAR-5',
    creationType: JobCardCreationType.AUTO_GENERATED,

    orderId: 'ord-1',
    orderNo: 'ORD-128',

    drawingId: 'drw-gear-001',
    drawingNumber: 'GEAR-PFD-001',
    drawingRevision: 'R2',
    drawingName: 'Gear Component',
    drawingSelectionType: 'auto',

    childPartId: 'cp-gear',
    childPartName: 'Gear (PFD)',
    childPartTemplateId: 'cpt-gear-001',

    processId: 'proc-hobbing-001',
    processName: 'Hobbing/Teeth Cutting',
    processCode: 'HOBBING',
    stepNo: 5,
    processTemplateId: 'template-gear-001',

    dependsOnJobCardIds: ['jc-gear-004'],
    blockedBy: ['jc-gear-004'],

    quantity: 10,
    completedQty: 0,
    rejectedQty: 0,
    reworkQty: 0,
    inProgressQty: 0,

    status: JobCardStatus.BLOCKED,
    priority: Priority.MEDIUM,
    scheduleStatus: ScheduleStatus.UNSCHEDULED,

    assignedMachineId: 'hob-01',
    assignedMachineName: 'HOBBING-MACHINE-01',

    estimatedSetupTimeMin: 45,
    estimatedCycleTimeMin: 30,
    estimatedTotalTimeMin: 345,

    materialStatus: MaterialStatus.AVAILABLE,

    customerName: 'ABC Industries',
    customerCode: 'CUST-001',
    productName: 'Printing Roller 250mm',
    productCode: 'PROD-PR-250',

    workInstructions: 'Cut gear teeth using hobbing machine as per drawing specification.',
    qualityCheckpoints: 'Check gear profile, pitch, and tooth dimensions.',

    createdAt: subDays(new Date(), 4),
    createdBy: 'system',
    updatedAt: new Date(),
    updatedBy: 'system',
  },

  // GEAR - Step 6: Heat Treatment (OSP)
  {
    id: 'jc-gear-006',
    jobCardNo: 'JC-ORD-128-GEAR-6',
    creationType: JobCardCreationType.AUTO_GENERATED,

    orderId: 'ord-1',
    orderNo: 'ORD-128',

    drawingId: 'drw-gear-001',
    drawingNumber: 'GEAR-PFD-001',
    drawingRevision: 'R2',
    drawingName: 'Gear Component',
    drawingSelectionType: 'auto',

    childPartId: 'cp-gear',
    childPartName: 'Gear (PFD)',
    childPartTemplateId: 'cpt-gear-001',

    processId: 'proc-ht-001',
    processName: 'Heat Treatment (OSP)',
    processCode: 'OSP-HT',
    stepNo: 6,
    processTemplateId: 'template-gear-001',

    dependsOnJobCardIds: ['jc-gear-005'],
    blockedBy: ['jc-gear-005'],

    quantity: 10,
    completedQty: 0,
    rejectedQty: 0,
    reworkQty: 0,
    inProgressQty: 0,

    status: JobCardStatus.BLOCKED,
    priority: Priority.MEDIUM,
    scheduleStatus: ScheduleStatus.UNSCHEDULED,

    assignedMachineId: 'osp-vendor-002',
    assignedMachineName: 'External Vendor (Heat Treatment)',

    estimatedSetupTimeMin: 0,
    estimatedCycleTimeMin: 120,
    estimatedTotalTimeMin: 1200,

    materialStatus: MaterialStatus.AVAILABLE,

    customerName: 'ABC Industries',
    customerCode: 'CUST-001',
    productName: 'Printing Roller 250mm',
    productCode: 'PROD-PR-250',

    workInstructions: 'Send to external vendor for heat treatment. Case hardening required.',
    qualityCheckpoints: 'Check hardness values upon return (HRC 58-62).',

    createdAt: subDays(new Date(), 4),
    createdBy: 'system',
    updatedAt: new Date(),
    updatedBy: 'system',
  },

  // GEAR - Step 7: Hard Turning (1st CNC)
  {
    id: 'jc-gear-007',
    jobCardNo: 'JC-ORD-128-GEAR-7',
    creationType: JobCardCreationType.AUTO_GENERATED,

    orderId: 'ord-1',
    orderNo: 'ORD-128',

    drawingId: 'drw-gear-001',
    drawingNumber: 'GEAR-PFD-001',
    drawingRevision: 'R2',
    drawingName: 'Gear Component',
    drawingSelectionType: 'auto',

    childPartId: 'cp-gear',
    childPartName: 'Gear (PFD)',
    childPartTemplateId: 'cpt-gear-001',

    processId: 'proc-hard-turn1-001',
    processName: 'Hard Turning (1st CNC)',
    processCode: 'HARD-TURN1',
    stepNo: 7,
    processTemplateId: 'template-gear-001',

    dependsOnJobCardIds: ['jc-gear-006'],
    blockedBy: ['jc-gear-006'],

    quantity: 10,
    completedQty: 0,
    rejectedQty: 0,
    reworkQty: 0,
    inProgressQty: 0,

    status: JobCardStatus.BLOCKED,
    priority: Priority.MEDIUM,
    scheduleStatus: ScheduleStatus.UNSCHEDULED,

    assignedMachineId: 'cnc-ht-01',
    assignedMachineName: 'CNC-HARD-TURN-01',

    estimatedSetupTimeMin: 25,
    estimatedCycleTimeMin: 22,
    estimatedTotalTimeMin: 245,

    materialStatus: MaterialStatus.AVAILABLE,

    customerName: 'ABC Industries',
    customerCode: 'CUST-001',
    productName: 'Printing Roller 250mm',
    productCode: 'PROD-PR-250',

    workInstructions: '1st hard turning operation after heat treatment. Use CBN tools.',
    qualityCheckpoints: 'Check dimensions and surface finish.',

    createdAt: subDays(new Date(), 4),
    createdBy: 'system',
    updatedAt: new Date(),
    updatedBy: 'system',
  },

  // GEAR - Step 8: Hard Turning (2nd CNC)
  {
    id: 'jc-gear-008',
    jobCardNo: 'JC-ORD-128-GEAR-8',
    creationType: JobCardCreationType.AUTO_GENERATED,

    orderId: 'ord-1',
    orderNo: 'ORD-128',

    drawingId: 'drw-gear-001',
    drawingNumber: 'GEAR-PFD-001',
    drawingRevision: 'R2',
    drawingName: 'Gear Component',
    drawingSelectionType: 'auto',

    childPartId: 'cp-gear',
    childPartName: 'Gear (PFD)',
    childPartTemplateId: 'cpt-gear-001',

    processId: 'proc-hard-turn2-001',
    processName: 'Hard Turning (2nd CNC)',
    processCode: 'HARD-TURN2',
    stepNo: 8,
    processTemplateId: 'template-gear-001',

    dependsOnJobCardIds: ['jc-gear-007'],
    blockedBy: ['jc-gear-007'],

    quantity: 10,
    completedQty: 0,
    rejectedQty: 0,
    reworkQty: 0,
    inProgressQty: 0,

    status: JobCardStatus.BLOCKED,
    priority: Priority.MEDIUM,
    scheduleStatus: ScheduleStatus.UNSCHEDULED,

    assignedMachineId: 'cnc-ht-02',
    assignedMachineName: 'CNC-HARD-TURN-02',

    estimatedSetupTimeMin: 20,
    estimatedCycleTimeMin: 20,
    estimatedTotalTimeMin: 220,

    materialStatus: MaterialStatus.AVAILABLE,

    customerName: 'ABC Industries',
    customerCode: 'CUST-001',
    productName: 'Printing Roller 250mm',
    productCode: 'PROD-PR-250',

    workInstructions: '2nd hard turning operation. Final dimensions before grinding.',
    qualityCheckpoints: 'Check critical dimensions.',

    createdAt: subDays(new Date(), 4),
    createdBy: 'system',
    updatedAt: new Date(),
    updatedBy: 'system',
  },

  // GEAR - Step 9: Gear Grinding
  {
    id: 'jc-gear-009',
    jobCardNo: 'JC-ORD-128-GEAR-9',
    creationType: JobCardCreationType.AUTO_GENERATED,

    orderId: 'ord-1',
    orderNo: 'ORD-128',

    drawingId: 'drw-gear-001',
    drawingNumber: 'GEAR-PFD-001',
    drawingRevision: 'R2',
    drawingName: 'Gear Component',
    drawingSelectionType: 'auto',

    childPartId: 'cp-gear',
    childPartName: 'Gear (PFD)',
    childPartTemplateId: 'cpt-gear-001',

    processId: 'proc-gear-grind-001',
    processName: 'Gear Grinding',
    processCode: 'GEAR-GRIND',
    stepNo: 9,
    processTemplateId: 'template-gear-001',

    dependsOnJobCardIds: ['jc-gear-008'],
    blockedBy: ['jc-gear-008'],

    quantity: 10,
    completedQty: 0,
    rejectedQty: 0,
    reworkQty: 0,
    inProgressQty: 0,

    status: JobCardStatus.BLOCKED,
    priority: Priority.MEDIUM,
    scheduleStatus: ScheduleStatus.UNSCHEDULED,

    assignedMachineId: 'gear-grind-01',
    assignedMachineName: 'GEAR-GRINDING-01',

    estimatedSetupTimeMin: 40,
    estimatedCycleTimeMin: 35,
    estimatedTotalTimeMin: 390,

    materialStatus: MaterialStatus.AVAILABLE,

    customerName: 'ABC Industries',
    customerCode: 'CUST-001',
    productName: 'Printing Roller 250mm',
    productCode: 'PROD-PR-250',

    workInstructions: 'Final gear grinding to achieve required tooth profile and surface finish.',
    qualityCheckpoints: 'Check gear profile, pitch accuracy, surface finish. Gear ready for assembly.',

    createdAt: subDays(new Date(), 4),
    createdBy: 'system',
    updatedAt: new Date(),
    updatedBy: 'system',
  },

  // ============================================
  // FINAL ASSEMBLY
  // ============================================

  // ASSEMBLY - Print Roller Assembly
  {
    id: 'jc-assembly-001',
    jobCardNo: 'JC-ORD-128-ASSY-1',
    creationType: JobCardCreationType.AUTO_GENERATED,

    orderId: 'ord-1',
    orderNo: 'ORD-128',

    drawingId: 'drw-assembly-001',
    drawingNumber: 'PRINT-ROLLER-ASSY-001',
    drawingRevision: 'R1',
    drawingName: 'Print Roller Assembly',
    drawingSelectionType: 'auto',

    childPartId: 'cp-assembly',
    childPartName: 'Print Roller Assembly',
    childPartTemplateId: 'cpt-assembly-001',

    processId: 'proc-assembly-001',
    processName: 'Print Roller Assembly',
    processCode: 'ASSY-PRINT',
    stepNo: 99, // Last step
    processTemplateId: 'template-assembly-001',

    dependsOnJobCardIds: ['jc-tikri-004', 'jc-shaft-010', 'jc-bearers-005', 'jc-gear-009'], // Depends on all child parts (final steps)
    blockedBy: ['jc-tikri-004', 'jc-shaft-010', 'jc-bearers-005', 'jc-gear-009'], // Blocked until all parts ready

    quantity: 10,
    completedQty: 0,
    rejectedQty: 0,
    reworkQty: 0,
    inProgressQty: 0,

    status: JobCardStatus.BLOCKED,
    priority: Priority.URGENT,
    scheduleStatus: ScheduleStatus.UNSCHEDULED,

    assignedMachineId: 'assy-01',
    assignedMachineName: 'ASSY-BENCH-01',

    estimatedSetupTimeMin: 30,
    estimatedCycleTimeMin: 45,
    estimatedTotalTimeMin: 480,

    materialStatus: MaterialStatus.PARTIAL,

    customerName: 'ABC Industries',
    customerCode: 'CUST-001',
    productName: 'Printing Roller 250mm',
    productCode: 'PROD-PR-250',

    workInstructions: 'Assemble all child parts (Tikri, Bearers, Shaft, Gear) into complete Print Roller.',
    qualityCheckpoints: 'Check assembly tolerance, rotation, balance.',

    createdAt: subDays(new Date(), 4),
    createdBy: 'system',
    updatedAt: new Date(),
    updatedBy: 'system',
  },

  // ============================================
  // QUALITY CONTROL
  // ============================================

  // QC - Final Inspection
  {
    id: 'jc-qc-001',
    jobCardNo: 'JC-ORD-128-QC-1',
    creationType: JobCardCreationType.AUTO_GENERATED,

    orderId: 'ord-1',
    orderNo: 'ORD-128',

    drawingId: 'drw-assembly-001',
    drawingNumber: 'PRINT-ROLLER-ASSY-001',
    drawingRevision: 'R1',
    drawingName: 'Print Roller Assembly',
    drawingSelectionType: 'auto',

    childPartId: 'cp-qc',
    childPartName: 'Quality Control',
    childPartTemplateId: 'cpt-qc-001',

    processId: 'proc-qc-001',
    processName: 'Final Inspection & QC',
    processCode: 'QC-FINAL',
    stepNo: 100, // Final step after assembly
    processTemplateId: 'template-qc-001',

    dependsOnJobCardIds: ['jc-assembly-001'], // Depends on assembly completion
    blockedBy: ['jc-assembly-001'], // Blocked until assembly is done

    quantity: 10,
    completedQty: 0,
    rejectedQty: 0,
    reworkQty: 0,
    inProgressQty: 0,

    status: JobCardStatus.BLOCKED,
    priority: Priority.URGENT,
    scheduleStatus: ScheduleStatus.UNSCHEDULED,

    assignedMachineId: 'qc-bench-01',
    assignedMachineName: 'QC Inspection Bench',

    estimatedSetupTimeMin: 10,
    estimatedCycleTimeMin: 30,
    estimatedTotalTimeMin: 310,

    materialStatus: MaterialStatus.AVAILABLE,

    customerName: 'ABC Industries',
    customerCode: 'CUST-001',
    productName: 'Printing Roller 250mm',
    productCode: 'PROD-PR-250',

    workInstructions: 'Perform complete quality inspection as per drawing specifications and customer requirements. Check all dimensions, surface finish, balance, rotation, and functionality.',
    qualityCheckpoints: 'Dimensional accuracy, Surface finish quality, Balance and concentricity, Rotation smoothness, Visual inspection for defects, Functional testing, Final approval stamp',

    createdAt: subDays(new Date(), 4),
    createdBy: 'system',
    updatedAt: new Date(),
    updatedBy: 'system',
  },
]

// Export as mockJobCards for compatibility
export const mockJobCards = mockJobCardsComplete
