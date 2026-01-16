import { ProductionExecution, ProductionJobCard, ProductionStatus } from '@/types/production-execution'

// ============================================
// Mock Production Executions
// ============================================

export const mockProductionExecutions: ProductionExecution[] = [
  {
    executionId: 'EXEC-001',
    jobCardId: 'JC-001',
    jobCardNo: 'JC/2024-25/001',

    operatorId: 'OPR-005',
    operatorName: 'Ramesh Kumar',

    startTime: new Date('2024-01-15T09:30:00'),
    endTime: new Date('2024-01-15T14:45:00'),

    actualQuantity: 10,
    actualLengthUsed: 5800,

    status: 'COMPLETED',

    notes: 'All pieces completed as per drawing',

    createdAt: new Date('2024-01-15T09:30:00'),
    updatedAt: new Date('2024-01-15T14:45:00'),
  },

  {
    executionId: 'EXEC-002',
    jobCardId: 'JC-002',
    jobCardNo: 'JC/2024-25/002',

    operatorId: 'OPR-008',
    operatorName: 'Suresh Patil',

    startTime: new Date('2024-01-15T10:00:00'),

    actualQuantity: 8,

    status: 'IN_PROGRESS',

    notes: 'Started CNC turning operation',

    createdAt: new Date('2024-01-15T10:00:00'),
    updatedAt: new Date('2024-01-15T10:00:00'),
  },
]

// ============================================
// Mock Production Job Cards
// ============================================

export const mockProductionJobCards: ProductionJobCard[] = [
  {
    jobCardId: 'JC-001',
    jobCardNo: 'JC/2024-25/001',
    orderId: 'ORD-001',
    orderNo: 'SO/2024-25/001',

    childPartId: 'CP-001',
    childPartName: 'Magnetic Roller Shaft',
    childPartCode: 'MR-SHAFT-250',

    operationId: 'OP-001',
    operationName: 'CNC Turning',
    operationSequence: 1,

    drawingId: 'DWG-001',
    drawingNo: 'DWG-2024-001',
    drawingRevision: 'R2',
    drawingUrl: '/drawings/dwg-2024-001-r2.pdf',

    requiredQuantity: 10,
    requiredLength: 6000,

    materialStatus: 'ISSUED',
    productionStatus: 'COMPLETED',
    completedQuantity: 10,

    currentExecution: mockProductionExecutions[0],

    materialIssued: {
      materialName: 'Mild Steel Rod',
      materialGrade: 'EN8',
      issuedQuantity: 10,
      issuedWeight: 1155.0,
    },
  },

  {
    jobCardId: 'JC-002',
    jobCardNo: 'JC/2024-25/002',
    orderId: 'ORD-002',
    orderNo: 'SO/2024-25/002',

    childPartId: 'CP-002',
    childPartName: 'Rubber Roller Core',
    childPartCode: 'RR-CORE-300',

    operationId: 'OP-002',
    operationName: 'CNC Turning',
    operationSequence: 1,

    drawingId: 'DWG-002',
    drawingNo: 'DWG-2024-002',
    drawingRevision: 'R1',
    drawingUrl: '/drawings/dwg-2024-002-r1.pdf',

    requiredQuantity: 15,
    requiredLength: 5000,

    materialStatus: 'ISSUED',
    productionStatus: 'IN_PROGRESS',
    completedQuantity: 8,

    currentExecution: mockProductionExecutions[1],

    materialIssued: {
      materialName: 'Stainless Steel Pipe',
      materialGrade: 'SS304',
      issuedQuantity: 15,
      issuedWeight: 213.0,
    },
  },

  {
    jobCardId: 'JC-003',
    jobCardNo: 'JC/2024-25/003',
    orderId: 'ORD-003',
    orderNo: 'SO/2024-25/003',

    childPartId: 'CP-003',
    childPartName: 'Anilox Roller Body',
    childPartCode: 'AR-BODY-350',

    operationId: 'OP-003',
    operationName: 'Rough Turning',
    operationSequence: 1,

    drawingId: 'DWG-003',
    drawingNo: 'DWG-2024-003',
    drawingRevision: 'R3',
    drawingUrl: '/drawings/dwg-2024-003-r3.pdf',

    requiredQuantity: 8,
    requiredLength: 7000,

    materialStatus: 'ISSUED',
    productionStatus: 'NOT_STARTED',
    completedQuantity: 0,

    materialIssued: {
      materialName: 'Aluminum Rod',
      materialGrade: '6061-T6',
      issuedQuantity: 8,
      issuedWeight: 496.8,
    },
  },

  {
    jobCardId: 'JC-004',
    jobCardNo: 'JC/2024-25/004',
    orderId: 'ORD-004',
    orderNo: 'SO/2024-25/004',

    childPartId: 'CP-004',
    childPartName: 'Printing Roller Shell',
    childPartCode: 'PR-SHELL-400',

    operationId: 'OP-004',
    operationName: 'CNC Turning',
    operationSequence: 1,

    drawingId: 'DWG-004',
    drawingNo: 'DWG-2024-004',
    drawingRevision: 'R1',
    drawingUrl: '/drawings/dwg-2024-004-r1.pdf',

    requiredQuantity: 12,
    requiredLength: 4500,

    materialStatus: 'ISSUED',
    productionStatus: 'NOT_STARTED',
    completedQuantity: 0,

    materialIssued: {
      materialName: 'Carbon Steel Pipe',
      materialGrade: 'C45',
      issuedQuantity: 12,
      issuedWeight: 342.0,
    },
  },

  {
    jobCardId: 'JC-005',
    jobCardNo: 'JC/2024-25/005',
    orderId: 'ORD-005',
    orderNo: 'SO/2024-25/005',

    childPartId: 'CP-005',
    childPartName: 'Idler Roller Shaft',
    childPartCode: 'IR-SHAFT-200',

    operationId: 'OP-001',
    operationName: 'CNC Turning',
    operationSequence: 1,

    drawingId: 'DWG-005',
    drawingNo: 'DWG-2024-005',
    drawingRevision: 'R2',
    drawingUrl: '/drawings/dwg-2024-005-r2.pdf',

    requiredQuantity: 20,
    requiredLength: 3000,

    materialStatus: 'PENDING',
    productionStatus: 'NOT_STARTED',
    completedQuantity: 0,
  },

  {
    jobCardId: 'JC-006',
    jobCardNo: 'JC/2024-25/006',
    orderId: 'ORD-006',
    orderNo: 'SO/2024-25/006',

    childPartId: 'CP-006',
    childPartName: 'Embossing Roller Base',
    childPartCode: 'ER-BASE-450',

    operationId: 'OP-005',
    operationName: 'Rough Turning',
    operationSequence: 1,

    drawingId: 'DWG-006',
    drawingNo: 'DWG-2024-006',
    drawingRevision: 'R1',
    drawingUrl: '/drawings/dwg-2024-006-r1.pdf',

    requiredQuantity: 6,
    requiredLength: 8000,

    materialStatus: 'ISSUED',
    productionStatus: 'NOT_STARTED',
    completedQuantity: 0,

    materialIssued: {
      materialName: 'Alloy Steel Rod',
      materialGrade: 'EN19',
      issuedQuantity: 6,
      issuedWeight: 720.0,
    },
  },

  {
    jobCardId: 'JC-007',
    jobCardNo: 'JC/2024-25/007',
    orderId: 'ORD-002',
    orderNo: 'SO/2024-25/002',

    childPartId: 'CP-002',
    childPartName: 'Rubber Roller Core',
    childPartCode: 'RR-CORE-300',

    operationId: 'OP-006',
    operationName: 'Grinding',
    operationSequence: 2,

    drawingId: 'DWG-002',
    drawingNo: 'DWG-2024-002',
    drawingRevision: 'R1',
    drawingUrl: '/drawings/dwg-2024-002-r1.pdf',

    requiredQuantity: 15,

    materialStatus: 'ISSUED',
    productionStatus: 'NOT_STARTED',
    completedQuantity: 0,

    materialIssued: {
      materialName: 'From previous operation',
      materialGrade: 'SS304',
      issuedQuantity: 15,
    },
  },
]
