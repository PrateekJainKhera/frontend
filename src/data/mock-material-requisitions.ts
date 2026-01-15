import {
  MaterialRequisition,
  MaterialAllocation,
  MaterialIssue,
  MaterialReturn,
  RequisitionStatus,
  AllocationStatus,
  IssueStatus,
} from '@/types/material-issue'
import { Priority } from '@/types/enums'

// ============================================
// Mock Material Requisitions
// ============================================

export const mockMaterialRequisitions: MaterialRequisition[] = [
  {
    requisitionId: 'REQ-001',
    requisitionNo: 'MR/2024-25/001',
    requisitionDate: new Date('2024-01-10'),

    jobCardId: 'JC-001',
    jobCardNo: 'JC/2024-25/001',
    orderId: 'ORD-001',
    orderNo: 'SO/2024-25/001',
    customerName: 'ABC Industries Ltd',

    materials: [
      {
        materialId: 'MAT-001',
        materialName: 'Mild Steel Rod',
        materialType: 'rod',
        materialGrade: 'EN8',
        dimensions: {
          diameter: 50,
          length: 6000,
        },
        quantityRequired: 10,
        unit: 'pcs',
        quantityAllocated: 10,
        quantityIssued: 10,
        quantityPending: 0,
      },
    ],

    status: 'Issued',
    priority: Priority.HIGH,
    dueDate: new Date('2024-01-15'),

    requestedBy: 'USR-003',
    requestedByName: 'Production Manager',
    createdAt: new Date('2024-01-10T09:00:00'),
    updatedAt: new Date('2024-01-10T14:30:00'),
    notes: 'Urgent order - customer deadline Jan 20',

    totalItems: 1,
    allocatedItems: 1,
    issuedItems: 1,
    pendingItems: 0,
  },

  {
    requisitionId: 'REQ-002',
    requisitionNo: 'MR/2024-25/002',
    requisitionDate: new Date('2024-01-12'),

    jobCardId: 'JC-002',
    jobCardNo: 'JC/2024-25/002',
    orderId: 'ORD-002',
    orderNo: 'SO/2024-25/002',
    customerName: 'XYZ Manufacturing',

    materials: [
      {
        materialId: 'MAT-002',
        materialName: 'Stainless Steel Pipe',
        materialType: 'pipe',
        materialGrade: 'SS304',
        dimensions: {
          diameter: 40,
          thickness: 3,
          length: 5000,
        },
        quantityRequired: 15,
        unit: 'pcs',
        quantityAllocated: 15,
        quantityIssued: 0,
        quantityPending: 0,
      },
    ],

    status: 'Allocated',
    priority: Priority.HIGH,
    dueDate: new Date('2024-01-18'),

    requestedBy: 'USR-003',
    requestedByName: 'Production Manager',
    createdAt: new Date('2024-01-12T10:15:00'),
    updatedAt: new Date('2024-01-12T15:45:00'),
    notes: 'Quality inspection required before issue',

    totalItems: 1,
    allocatedItems: 1,
    issuedItems: 0,
    pendingItems: 0,
  },

  {
    requisitionId: 'REQ-003',
    requisitionNo: 'MR/2024-25/003',
    requisitionDate: new Date('2024-01-13'),

    jobCardId: 'JC-003',
    jobCardNo: 'JC/2024-25/003',
    orderId: 'ORD-003',
    orderNo: 'SO/2024-25/003',
    customerName: 'PQR Enterprises',

    materials: [
      {
        materialId: 'MAT-003',
        materialName: 'Aluminum Rod',
        materialType: 'rod',
        materialGrade: '6061-T6',
        dimensions: {
          diameter: 60,
          length: 7000,
        },
        quantityRequired: 8,
        unit: 'pcs',
        quantityAllocated: 5,
        quantityIssued: 0,
        quantityPending: 3,
      },
    ],

    status: 'Partial',
    priority: Priority.MEDIUM,
    dueDate: new Date('2024-01-20'),

    requestedBy: 'USR-003',
    requestedByName: 'Production Manager',
    createdAt: new Date('2024-01-13T08:30:00'),
    updatedAt: new Date('2024-01-13T16:20:00'),
    notes: 'Partial stock available - awaiting next GRN',

    totalItems: 1,
    allocatedItems: 1,
    issuedItems: 0,
    pendingItems: 0,
  },

  {
    requisitionId: 'REQ-004',
    requisitionNo: 'MR/2024-25/004',
    requisitionDate: new Date('2024-01-14'),

    jobCardId: 'JC-004',
    jobCardNo: 'JC/2024-25/004',
    orderId: 'ORD-004',
    orderNo: 'SO/2024-25/004',
    customerName: 'LMN Steel Works',

    materials: [
      {
        materialId: 'MAT-004',
        materialName: 'Carbon Steel Sheet',
        materialType: 'sheet',
        materialGrade: 'C45',
        dimensions: {
          thickness: 10,
          width: 1200,
          length: 2400,
        },
        quantityRequired: 20,
        unit: 'pcs',
        quantityAllocated: 0,
        quantityIssued: 0,
        quantityPending: 20,
      },
    ],

    status: 'Pending',
    priority: Priority.HIGH,
    dueDate: new Date('2024-01-16'),

    requestedBy: 'USR-003',
    requestedByName: 'Production Manager',
    createdAt: new Date('2024-01-14T11:00:00'),
    updatedAt: new Date('2024-01-14T11:00:00'),
    notes: 'Customer order priority - allocate ASAP',

    totalItems: 1,
    allocatedItems: 0,
    issuedItems: 0,
    pendingItems: 1,
  },

  {
    requisitionId: 'REQ-005',
    requisitionNo: 'MR/2024-25/005',
    requisitionDate: new Date('2024-01-15'),

    jobCardId: 'JC-005',
    jobCardNo: 'JC/2024-25/005',
    orderId: 'ORD-005',
    orderNo: 'SO/2024-25/005',
    customerName: 'RST Industries',

    materials: [
      {
        materialId: 'MAT-001',
        materialName: 'Mild Steel Rod',
        materialType: 'rod',
        materialGrade: 'EN8',
        dimensions: {
          diameter: 50,
          length: 6000,
        },
        quantityRequired: 12,
        unit: 'pcs',
        quantityAllocated: 0,
        quantityIssued: 0,
        quantityPending: 12,
      },
    ],

    status: 'Pending',
    priority: Priority.LOW,
    dueDate: new Date('2024-01-25'),

    requestedBy: 'USR-003',
    requestedByName: 'Production Manager',
    createdAt: new Date('2024-01-15T09:45:00'),
    updatedAt: new Date('2024-01-15T09:45:00'),
    notes: 'Standard order - allocate as per availability',

    totalItems: 1,
    allocatedItems: 0,
    issuedItems: 0,
    pendingItems: 1,
  },
]

// ============================================
// Mock Material Allocations
// ============================================

export const mockMaterialAllocations: MaterialAllocation[] = [
  {
    allocationId: 'ALLOC-001',
    allocationNo: 'MA/2024-25/001',
    allocationDate: new Date('2024-01-10T11:30:00'),

    requisitionId: 'REQ-001',
    requisitionNo: 'MR/2024-25/001',
    requisitionItemId: 'REQ-001-ITEM-001',

    jobCardId: 'JC-001',
    jobCardNo: 'JC/2024-25/001',

    materialId: 'MAT-001',
    materialName: 'Mild Steel Rod',
    materialGrade: 'EN8',

    pieces: [
      {
        pieceId: 'PIECE-001',
        pieceNumber: 'EN8-50-P001',
        currentLength: 6000,
        allocatedLength: 6000,
        weight: 115.5,
        location: 'Rack A1-Bin 2',
        grn: {
          grnId: 'GRN-001',
          grnNo: 'GRN/2024-25/001',
          receivedDate: new Date('2024-01-05'),
          supplier: 'Steel Mart India',
        },
      },
      {
        pieceId: 'PIECE-002',
        pieceNumber: 'EN8-50-P002',
        currentLength: 6000,
        allocatedLength: 6000,
        weight: 115.5,
        location: 'Rack A1-Bin 2',
        grn: {
          grnId: 'GRN-001',
          grnNo: 'GRN/2024-25/001',
          receivedDate: new Date('2024-01-05'),
          supplier: 'Steel Mart India',
        },
      },
    ],

    totalAllocatedLength: 60000,
    totalAllocatedWeight: 1155.0,
    totalPieces: 10,

    status: 'Issued',

    expectedWastage: 500,
    expectedWastagePercent: 0.83,

    allocatedBy: 'USR-005',
    allocatedByName: 'Stores Manager',
    createdAt: new Date('2024-01-10T11:30:00'),
    updatedAt: new Date('2024-01-10T14:30:00'),
    notes: 'All pieces from same batch for consistency',
  },

  {
    allocationId: 'ALLOC-002',
    allocationNo: 'MA/2024-25/002',
    allocationDate: new Date('2024-01-12T14:00:00'),

    requisitionId: 'REQ-002',
    requisitionNo: 'MR/2024-25/002',
    requisitionItemId: 'REQ-002-ITEM-001',

    jobCardId: 'JC-002',
    jobCardNo: 'JC/2024-25/002',

    materialId: 'MAT-002',
    materialName: 'Stainless Steel Pipe',
    materialGrade: 'SS304',

    pieces: [
      {
        pieceId: 'PIECE-010',
        pieceNumber: 'SS304-40-P010',
        currentLength: 5000,
        allocatedLength: 5000,
        weight: 14.2,
        location: 'Rack B2-Bin 5',
        grn: {
          grnId: 'GRN-003',
          grnNo: 'GRN/2024-25/003',
          receivedDate: new Date('2024-01-08'),
          supplier: 'Premium Steel Co',
        },
      },
    ],

    totalAllocatedLength: 75000,
    totalAllocatedWeight: 213.0,
    totalPieces: 15,

    status: 'Reserved',

    expectedWastage: 750,
    expectedWastagePercent: 1.0,

    allocatedBy: 'USR-005',
    allocatedByName: 'Stores Manager',
    createdAt: new Date('2024-01-12T14:00:00'),
    updatedAt: new Date('2024-01-12T15:45:00'),
    notes: 'Awaiting QC approval before issue',
  },

  {
    allocationId: 'ALLOC-003',
    allocationNo: 'MA/2024-25/003',
    allocationDate: new Date('2024-01-13T15:30:00'),

    requisitionId: 'REQ-003',
    requisitionNo: 'MR/2024-25/003',
    requisitionItemId: 'REQ-003-ITEM-001',

    jobCardId: 'JC-003',
    jobCardNo: 'JC/2024-25/003',

    materialId: 'MAT-003',
    materialName: 'Aluminum Rod',
    materialGrade: '6061-T6',

    pieces: [
      {
        pieceId: 'PIECE-020',
        pieceNumber: 'AL6061-60-P020',
        currentLength: 7000,
        allocatedLength: 7000,
        weight: 62.1,
        location: 'Rack C3-Bin 1',
        grn: {
          grnId: 'GRN-005',
          grnNo: 'GRN/2024-25/005',
          receivedDate: new Date('2024-01-10'),
          supplier: 'Aluminum Traders',
        },
      },
    ],

    totalAllocatedLength: 35000,
    totalAllocatedWeight: 310.5,
    totalPieces: 5,

    status: 'Reserved',

    expectedWastage: 350,
    expectedWastagePercent: 1.0,

    allocatedBy: 'USR-005',
    allocatedByName: 'Stores Manager',
    createdAt: new Date('2024-01-13T15:30:00'),
    updatedAt: new Date('2024-01-13T16:20:00'),
    notes: 'Partial allocation - 3 pcs pending next GRN',
  },
]

// ============================================
// Mock Material Issues
// ============================================

export const mockMaterialIssues: MaterialIssue[] = [
  {
    issueId: 'ISSUE-001',
    issueNo: 'MI/2024-25/001',
    issueDate: new Date('2024-01-10T14:30:00'),

    allocationId: 'ALLOC-001',
    allocationNo: 'MA/2024-25/001',

    requisitionId: 'REQ-001',
    requisitionNo: 'MR/2024-25/001',

    jobCardId: 'JC-001',
    jobCardNo: 'JC/2024-25/001',
    orderId: 'ORD-001',
    orderNo: 'SO/2024-25/001',

    materialId: 'MAT-001',
    materialName: 'Mild Steel Rod',
    materialGrade: 'EN8',
    materialType: 'rod',

    pieces: [
      {
        pieceId: 'PIECE-001',
        pieceNumber: 'EN8-50-P001',
        issuedLength: 6000,
        weight: 115.5,
        statusBeforeIssue: 'Available',
        statusAfterIssue: 'InUse',
      },
      {
        pieceId: 'PIECE-002',
        pieceNumber: 'EN8-50-P002',
        issuedLength: 6000,
        weight: 115.5,
        statusBeforeIssue: 'Available',
        statusAfterIssue: 'InUse',
      },
    ],

    totalIssuedLength: 60000,
    totalIssuedWeight: 1155.0,
    totalPieces: 10,

    status: 'Issued',

    issuedBy: 'USR-005',
    issuedByName: 'Stores Manager',
    receivedBy: 'USR-010',
    receivedByName: 'Production Supervisor',
    createdAt: new Date('2024-01-10T14:30:00'),
    updatedAt: new Date('2024-01-10T14:45:00'),
    confirmedAt: new Date('2024-01-10T14:45:00'),

    notes: 'Issued complete requisition - 10 pieces',
  },

  {
    issueId: 'ISSUE-002',
    issueNo: 'MI/2024-25/002',
    issueDate: new Date('2024-01-11T10:15:00'),

    allocationId: 'ALLOC-004',
    allocationNo: 'MA/2024-25/004',

    requisitionId: 'REQ-006',
    requisitionNo: 'MR/2024-25/006',

    jobCardId: 'JC-006',
    jobCardNo: 'JC/2024-25/006',
    orderId: 'ORD-006',
    orderNo: 'SO/2024-25/006',

    materialId: 'MAT-005',
    materialName: 'Brass Rod',
    materialGrade: 'C36000',
    materialType: 'rod',

    pieces: [
      {
        pieceId: 'PIECE-030',
        pieceNumber: 'BR-C36-30-P030',
        issuedLength: 4500,
        weight: 28.5,
        statusBeforeIssue: 'Available',
        statusAfterIssue: 'InUse',
      },
    ],

    totalIssuedLength: 27000,
    totalIssuedWeight: 171.0,
    totalPieces: 6,

    status: 'Issued',

    issuedBy: 'USR-005',
    issuedByName: 'Stores Manager',
    receivedBy: 'USR-010',
    receivedByName: 'Production Supervisor',
    createdAt: new Date('2024-01-11T10:15:00'),
    updatedAt: new Date('2024-01-11T10:30:00'),
    confirmedAt: new Date('2024-01-11T10:30:00'),

    notes: 'Special material - handle with care',
  },
]

// ============================================
// Mock Material Returns
// ============================================

export const mockMaterialReturns: MaterialReturn[] = [
  {
    returnId: 'RET-001',
    returnNo: 'MR/2024-25/001',
    returnDate: new Date('2024-01-12T16:00:00'),

    issueId: 'ISSUE-001',
    issueNo: 'MI/2024-25/001',

    jobCardId: 'JC-001',
    jobCardNo: 'JC/2024-25/001',

    materialId: 'MAT-001',
    materialName: 'Mild Steel Rod',
    materialGrade: 'EN8',

    returnedPieces: [
      {
        pieceId: 'PIECE-001',
        pieceNumber: 'EN8-50-P001',
        returnedLength: 500,
        weight: 9.6,
        condition: 'Good',
        newStatus: 'Available',
      },
      {
        pieceId: 'PIECE-003',
        pieceNumber: 'EN8-50-P003',
        returnedLength: 300,
        weight: 5.8,
        condition: 'Scrap',
        newStatus: 'Scrap',
      },
    ],

    totalReturnedLength: 800,
    totalReturnedWeight: 15.4,

    returnReason: 'Job_Completed',

    returnedBy: 'USR-010',
    returnedByName: 'Production Supervisor',
    acceptedBy: 'USR-005',
    acceptedByName: 'Stores Manager',
    createdAt: new Date('2024-01-12T16:00:00'),
    notes: 'Job completed - excess material returned',
  },
]
