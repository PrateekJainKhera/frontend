import { subDays, subHours } from 'date-fns'
import { JobCard, JobCardStatus, JobCardCreationType, JobCardMaterial, MaterialStatus } from '@/types/job-card'
import { Priority } from '@/types/enums'

// Sample job cards for Order ORD-128: 10 Printing Rollers
// Demonstrates complete 4-step workflow with dependencies

export const mockJobCards: JobCard[] = [
  // Step 1: Cutting - COMPLETED
  {
    id: 'jc-001',
    jobCardNo: 'JC-ORD-128-1',
    creationType: JobCardCreationType.AUTO_GENERATED,

    orderId: 'ord-1',
    orderNo: 'ORD-128',

    // Drawing linkage
    drawingId: 'drw-001',
    drawingNumber: 'SHAFT-001',
    drawingRevision: 'C',
    drawingName: 'Main Shaft Assembly',
    drawingSelectionType: 'auto',

    // Child Part linkage
    childPartId: 'cp-001',
    childPartName: 'Magnetic Roller Shaft',
    childPartTemplateId: 'cpt-001',

    processId: 'proc-cut-001',
    processName: 'Cutting',
    processCode: 'CUT-SAW',
    stepNo: 1,
    processTemplateId: 'template-printing-001',

    dependsOnJobCardIds: [],
    blockedBy: [],

    quantity: 10,
    completedQty: 10,
    rejectedQty: 0,
    reworkQty: 0,
    inProgressQty: 0,

    status: JobCardStatus.COMPLETED,
    priority: Priority.URGENT,

    assignedMachineId: 'saw-01',
    assignedMachineName: 'SAW-01',
    assignedOperatorId: 'op-001',
    assignedOperatorName: 'Rajesh Kumar',

    estimatedSetupTimeMin: 10,
    estimatedCycleTimeMin: 12,
    estimatedTotalTimeMin: 130,
    actualSetupTimeMin: 12,
    actualCycleTimeMin: 11,
    actualTotalTimeMin: 122,

    scheduledStartTime: subDays(new Date(), 2),
    actualStartTime: subHours(subDays(new Date(), 2), -1),
    actualEndTime: subHours(subDays(new Date(), 2), -3),

    allocatedMaterials: [
      {
        id: 'mat-alloc-001',
        jobCardId: 'jc-001',
        materialType: 'RAW_MATERIAL',
        materialId: 'rm-en19-001',
        materialName: 'EN19 Steel Rod',
        materialCode: 'EN19-250-6000',
        requiredQuantity: 2,
        allocatedQuantity: 2,
        unit: 'pcs',
        isAllocated: true,
        allocationDate: subDays(new Date(), 3)
      }
    ],

    // Material status
    materialStatus: MaterialStatus.AVAILABLE,

    // Manufacturing dimensions (from drawing)
    manufacturingDimensions: {
      rodDiameter: 50,
      finishedLength: 800,
      finishedDiameter: 48,
      materialGrade: 'EN8',
      tolerance: '±0.01mm',
      surfaceFinish: 'N6'
    },

    customerName: 'ABC Industries',
    customerCode: 'CUST-001',
    productName: 'Magnetic Roller 250mm',
    productCode: 'PROD-M-250',

    workInstructions: 'Cut EN19 rods to 1200mm length using carbide blade. Ensure square cuts.',
    qualityCheckpoints: 'Check length ±1mm tolerance. Verify squareness of cut faces.',
    specialNotes: 'Handle with care - magnetic material. Deburr edges after cutting.',

    createdAt: subDays(new Date(), 3),
    createdBy: 'production-manager',
    updatedAt: subHours(subDays(new Date(), 2), -3),
    updatedBy: 'operator-rajesh'
  },

  // Step 2: CNC Turning - IN PROGRESS (70% complete)
  {
    id: 'jc-002',
    jobCardNo: 'JC-ORD-128-2',
    creationType: JobCardCreationType.AUTO_GENERATED,

    orderId: 'ord-1',
    orderNo: 'ORD-128',

    // Drawing linkage
    drawingId: 'drw-001',
    drawingNumber: 'SHAFT-001',
    drawingRevision: 'C',
    drawingName: 'Main Shaft Assembly',
    drawingSelectionType: 'auto',

    // Child Part linkage
    childPartId: 'cp-001',
    childPartName: 'Magnetic Roller Shaft',
    childPartTemplateId: 'cpt-001',

    processId: 'proc-cnc-001',
    processName: 'CNC Turning',
    processCode: 'CNC-TURN-1ST',
    stepNo: 2,
    processTemplateId: 'template-printing-001',

    dependsOnJobCardIds: ['jc-001'],
    blockedBy: [],  // Was blocked, now cleared after JC-001 completed

    quantity: 10,
    completedQty: 7,
    rejectedQty: 0,
    reworkQty: 0,
    inProgressQty: 3,

    status: JobCardStatus.IN_PROGRESS,
    priority: Priority.URGENT,

    assignedMachineId: 'cnc-01',
    assignedMachineName: 'CNC-01',
    assignedOperatorId: 'op-002',
    assignedOperatorName: 'Suresh Patel',

    estimatedSetupTimeMin: 20,
    estimatedCycleTimeMin: 45,
    estimatedTotalTimeMin: 470,  // 20 setup + 45*10 cycle
    actualSetupTimeMin: 22,
    actualCycleTimeMin: 43,
    actualTotalTimeMin: null,  // Still in progress

    scheduledStartTime: subDays(new Date(), 1),
    actualStartTime: subHours(new Date(), 6),
    actualEndTime: null,

    allocatedMaterials: [
      {
        id: 'mat-alloc-002',
        jobCardId: 'jc-002',
        materialType: 'RAW_MATERIAL',
        materialId: 'rm-en19-001-cut',
        materialName: 'EN19 Steel Rod (Cut pieces from JC-001)',
        materialCode: 'EN19-250-1200-CUT',
        requiredQuantity: 10,
        allocatedQuantity: 10,
        unit: 'pcs',
        isAllocated: true,
        allocationDate: subDays(new Date(), 1),
        notes: 'Received from previous cutting operation'
      }
    ],

    customerName: 'ABC Industries',
    customerCode: 'CUST-001',
    productName: 'Magnetic Roller 250mm',
    productCode: 'PROD-M-250',

    workInstructions: 'CNC program: ROLLER_250_ROUGH.nc. Use carbide inserts CNMG120408. Coolant: High pressure.',
    qualityCheckpoints: 'First piece inspection mandatory. Check OD diameter every 2 pieces. Verify concentricity ±0.02mm.',
    specialNotes: 'Run at 1200 RPM. Watch for chatter - reduce speed if needed.',

    createdAt: subDays(new Date(), 3),
    createdBy: 'production-manager',
    updatedAt: subMinutes(new Date(), 15),
    updatedBy: 'operator-suresh'
  },

  // Step 3: Grinding - READY (waiting to start, dependencies met)
  {
    id: 'jc-003',
    jobCardNo: 'JC-ORD-128-3',
    creationType: JobCardCreationType.AUTO_GENERATED,

    orderId: 'ord-1',
    orderNo: 'ORD-128',

    processId: 'proc-grn-001',
    processName: 'Grinding',
    processCode: 'GRN-OD',
    stepNo: 3,
    processTemplateId: 'template-printing-001',

    dependsOnJobCardIds: ['jc-002'],
    blockedBy: ['jc-002'],  // Still blocked - JC-002 not complete yet

    quantity: 10,
    completedQty: 0,
    rejectedQty: 0,
    reworkQty: 0,
    inProgressQty: 0,

    status: JobCardStatus.BLOCKED,
    priority: Priority.URGENT,

    assignedMachineId: 'grn-01',
    assignedMachineName: 'GRN-01',
    assignedOperatorId: null,
    assignedOperatorName: null,

    estimatedSetupTimeMin: 15,
    estimatedCycleTimeMin: 30,
    estimatedTotalTimeMin: 315,  // 15 setup + 30*10 cycle
    actualSetupTimeMin: null,
    actualCycleTimeMin: null,
    actualTotalTimeMin: null,

    scheduledStartTime: new Date(),
    actualStartTime: null,
    actualEndTime: null,

    allocatedMaterials: [],  // Will receive turned pieces from JC-002

    customerName: 'ABC Industries',
    customerCode: 'CUST-001',
    productName: 'Magnetic Roller 250mm',
    productCode: 'PROD-M-250',

    workInstructions: 'Grind to final OD 250.00±0.02mm. Use aluminum oxide wheel. Dress wheel before starting.',
    qualityCheckpoints: 'Micrometer check every piece. Surface finish Ra 0.8 max. Check straightness ±0.05mm.',
    specialNotes: 'Handle carefully - parts are finish-machined. Wear gloves to avoid fingerprints.',

    createdAt: subDays(new Date(), 3),
    createdBy: 'production-manager',
    updatedAt: subDays(new Date(), 3),
    updatedBy: 'production-manager'
  },

  // Step 4: Assembly - BLOCKED (waiting for grinding)
  {
    id: 'jc-004',
    jobCardNo: 'JC-ORD-128-4',
    creationType: JobCardCreationType.AUTO_GENERATED,

    orderId: 'ord-1',
    orderNo: 'ORD-128',

    processId: 'proc-asm-001',
    processName: 'Assembly',
    processCode: 'ASM-MANUAL',
    stepNo: 4,
    processTemplateId: 'template-printing-001',

    dependsOnJobCardIds: ['jc-003'],
    blockedBy: ['jc-003'],

    quantity: 10,
    completedQty: 0,
    rejectedQty: 0,
    reworkQty: 0,
    inProgressQty: 0,

    status: JobCardStatus.BLOCKED,
    priority: Priority.URGENT,

    assignedMachineId: null,  // Manual operation
    assignedMachineName: 'Manual Workbench',
    assignedOperatorId: null,
    assignedOperatorName: null,

    estimatedSetupTimeMin: 5,
    estimatedCycleTimeMin: 15,
    estimatedTotalTimeMin: 155,  // 5 setup + 15*10 cycle
    actualSetupTimeMin: null,
    actualCycleTimeMin: null,
    actualTotalTimeMin: null,

    scheduledStartTime: subDays(new Date(), -1),  // Tomorrow
    actualStartTime: null,
    actualEndTime: null,

    allocatedMaterials: [
      {
        id: 'mat-alloc-004-1',
        jobCardId: 'jc-004',
        materialType: 'COMPONENT',
        materialId: 'comp-bearing-001',
        materialName: 'Ball Bearing 6205',
        materialCode: 'BRG-6205',
        requiredQuantity: 20,  // 2 per roller
        allocatedQuantity: 20,
        unit: 'pcs',
        isAllocated: true,
        allocationDate: subDays(new Date(), 3)
      },
      {
        id: 'mat-alloc-004-2',
        jobCardId: 'jc-004',
        materialType: 'COMPONENT',
        materialId: 'comp-endcap-001',
        materialName: 'End Cap Assembly',
        materialCode: 'ENDCAP-250',
        requiredQuantity: 20,  // 2 per roller
        allocatedQuantity: 20,
        unit: 'pcs',
        isAllocated: true,
        allocationDate: subDays(new Date(), 3)
      },
      {
        id: 'mat-alloc-004-3',
        jobCardId: 'jc-004',
        materialType: 'COMPONENT',
        materialId: 'comp-bushing-001',
        materialName: 'Brass Bushing',
        materialCode: 'BUSH-BR-25',
        requiredQuantity: 20,
        allocatedQuantity: 20,
        unit: 'pcs',
        isAllocated: true,
        allocationDate: subDays(new Date(), 3)
      }
    ],

    customerName: 'ABC Industries',
    customerCode: 'CUST-001',
    productName: 'Magnetic Roller 250mm',
    productCode: 'PROD-M-250',

    workInstructions: 'Install bearings with press fit. Apply Loctite 242 to end caps. Torque to 25 Nm. Final balance check on balancing machine.',
    qualityCheckpoints: 'Rotate by hand - smooth operation required. No wobble. Balance within 5 grams. Check end cap tightness.',
    specialNotes: 'Final inspection mandatory. Package in bubble wrap. Mark "Fragile - Precision Component".',

    createdAt: subDays(new Date(), 3),
    createdBy: 'production-manager',
    updatedAt: subDays(new Date(), 3),
    updatedBy: 'production-manager'
  },

  // Example of a manual job card (Order ORD-125)
  {
    id: 'jc-manual-001',
    jobCardNo: 'JC-2024-0156',
    creationType: JobCardCreationType.MANUAL,

    orderId: 'ord-2',
    orderNo: 'ORD-125',

    processId: 'proc-grn-002',
    processName: 'Re-Grinding (Custom)',
    processCode: 'GRN-CUSTOM',
    stepNo: 5,
    processTemplateId: null,

    dependsOnJobCardIds: [],
    blockedBy: [],

    quantity: 5,
    completedQty: 0,
    rejectedQty: 0,
    reworkQty: 0,
    inProgressQty: 0,

    status: JobCardStatus.READY,
    priority: Priority.HIGH,

    assignedMachineId: 'grn-02',
    assignedMachineName: 'GRN-02',
    assignedOperatorId: null,
    assignedOperatorName: null,

    estimatedSetupTimeMin: 15,
    estimatedCycleTimeMin: 25,
    estimatedTotalTimeMin: 140,
    actualSetupTimeMin: null,
    actualCycleTimeMin: null,
    actualTotalTimeMin: null,

    scheduledStartTime: subDays(new Date(), -1),
    actualStartTime: null,
    actualEndTime: null,

    allocatedMaterials: [],

    customerName: 'XYZ Manufacturing',
    customerCode: 'CUST-002',
    productName: 'Rubber Roller 300mm',
    productCode: 'PROD-R-300',

    workInstructions: 'Check dimensions with micrometer. Re-grind to 0.05mm tolerance if needed. Use fine grit wheel.',
    qualityCheckpoints: 'Measure every 2 pieces. Final mirror finish inspection required.',
    specialNotes: 'Customer complaint - dimension out of spec. Special attention to surface finish required.',

    createdAt: subDays(new Date(), 1),
    createdBy: 'production-supervisor',
    updatedAt: subDays(new Date(), 1),
    updatedBy: 'production-supervisor'
  },

  // Example of a job card PENDING MATERIAL
  {
    id: 'jc-pending-001',
    jobCardNo: 'JC-ORD-130-1',
    creationType: JobCardCreationType.AUTO_GENERATED,

    orderId: 'ord-3',
    orderNo: 'ORD-130',

    // Drawing linkage
    drawingId: 'drw-003',
    drawingNumber: 'PIPE-002',
    drawingRevision: 'A',
    drawingName: 'Steel Pipe Assembly',
    drawingSelectionType: 'auto',

    // Child Part linkage
    childPartId: 'cp-003',
    childPartName: 'Steel Pipe Sleeve',
    childPartTemplateId: 'cpt-003',

    processId: 'proc-cut-002',
    processName: 'Pipe Cutting',
    processCode: 'CUT-PIPE',
    stepNo: 1,
    processTemplateId: 'template-industrial-001',

    dependsOnJobCardIds: [],
    blockedBy: [],

    quantity: 50,
    completedQty: 0,
    rejectedQty: 0,
    reworkQty: 0,
    inProgressQty: 0,

    status: JobCardStatus.PENDING_MATERIAL,
    priority: Priority.HIGH,

    assignedMachineId: null,
    assignedMachineName: null,
    assignedOperatorId: null,
    assignedOperatorName: null,

    estimatedSetupTimeMin: 10,
    estimatedCycleTimeMin: 8,
    estimatedTotalTimeMin: 410,
    actualSetupTimeMin: null,
    actualCycleTimeMin: null,
    actualTotalTimeMin: null,

    scheduledStartTime: null,
    actualStartTime: null,
    actualEndTime: null,

    allocatedMaterials: [],

    // Material status - PENDING with shortfall
    materialStatus: MaterialStatus.PENDING,
    materialShortfall: {
      materialId: 'rm-ms-pipe-001',
      materialName: 'MS Pipe',
      materialCode: 'MS-PIPE-40x35',
      required: 25,
      available: 10,
      shortfall: 15,
      unit: 'meters',
      notificationSentAt: subDays(new Date(), 5),
      lastReminderSentAt: subDays(new Date(), 2),
      reminderCount: 2
    },
    materialStatusUpdatedAt: subDays(new Date(), 5),
    daysWaitingForMaterial: 5,

    // Manufacturing dimensions (from drawing)
    manufacturingDimensions: {
      pipeOD: 40,
      pipeID: 35,
      pipeThickness: 2.5,
      cutLength: 500,
      materialGrade: 'MS',
      tolerance: '±0.1mm'
    },

    customerName: 'Industrial Corp',
    customerCode: 'CUST-003',
    productName: 'Industrial Roller 300mm',
    productCode: 'PROD-I-300',

    workInstructions: 'Cut MS pipe to 500mm length. Ensure clean cuts without burrs.',
    qualityCheckpoints: 'Check length tolerance ±0.5mm. Verify no cracks or defects.',
    specialNotes: 'BLOCKED: Waiting for MS Pipe material delivery from supplier.',

    createdAt: subDays(new Date(), 5),
    createdBy: 'production-planner',
    updatedAt: subDays(new Date(), 1),
    updatedBy: 'production-planner'
  }
]

// Helper function for mock data (simulating minutes ago)
function subMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() - minutes * 60 * 1000)
}
