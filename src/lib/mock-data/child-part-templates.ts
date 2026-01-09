import { ChildPartTemplate, ChildPartType, RollerType } from '@/types'

export const mockChildPartTemplates: ChildPartTemplate[] = [
  // ===== MAGNETIC ROLLER CHILD PARTS =====
  {
    id: 'cpt-001',
    templateCode: 'CPT-MAG-SHAFT-001',
    templateName: 'Magnetic Roller Shaft - Standard',
    childPartType: ChildPartType.SHAFT,
    rollerType: RollerType.MAGNETIC,
    drawingNumber: 'DWG-MAG-SH-001',
    drawingRevision: 'Rev-02',

    length: 1200,
    diameter: 50,
    dimensionUnit: 'mm',

    materialRequirements: [
      {
        id: 'mr-001',
        rawMaterialId: 'rm-001',
        rawMaterialName: 'EN8 Steel Rod',
        materialGrade: 'EN8',
        quantityRequired: 1.3,
        unit: 'meter',
        wastagePercent: 5
      }
    ],

    processSteps: [
      {
        id: 'ps-001',
        processId: 'proc-001',
        processName: 'CNC Turning',
        stepNumber: 1,
        machineName: 'CNC-01',
        standardTimeHours: 4.5,
        restTimeHours: 2.0,
        description: 'Rough turning to near-net shape'
      },
      {
        id: 'ps-002',
        processId: 'proc-002',
        processName: 'CNC Precision Turning',
        stepNumber: 2,
        machineName: 'CNC-02',
        standardTimeHours: 3.0,
        restTimeHours: 1.5,
        description: 'Precision turning to final dimensions'
      },
      {
        id: 'ps-003',
        processId: 'proc-003',
        processName: 'Grinding',
        stepNumber: 3,
        machineName: 'Grinding-01',
        standardTimeHours: 3.2,
        restTimeHours: 4.0,
        description: 'Surface grinding to achieve finish'
      },
      {
        id: 'ps-004',
        processId: 'proc-007',
        processName: 'Balancing',
        stepNumber: 4,
        machineName: 'Balancing-01',
        standardTimeHours: 1.5,
        restTimeHours: 0.5,
        description: 'Dynamic balancing'
      }
    ],

    totalStandardTimeHours: 12.2,
    description: 'Standard shaft for magnetic rollers with precision tolerance',
    technicalNotes: 'Material hardness: 45-50 HRC after heat treatment. Surface finish: Ra 0.8 μm',
    qualityCheckpoints: [
      'Dimensional accuracy ±0.01mm',
      'Surface finish check',
      'Roundness tolerance',
      'Dynamic balance check',
      'Material hardness verification'
    ],

    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-11-20'),
    createdBy: 'admin',
    updatedBy: 'production-manager'
  },

  {
    id: 'cpt-002',
    templateCode: 'CPT-MAG-CORE-001',
    templateName: 'Magnetic Roller Core - Standard',
    childPartType: ChildPartType.CORE,
    rollerType: RollerType.MAGNETIC,
    drawingNumber: 'DWG-MAG-CORE-001',
    drawingRevision: 'Rev-01',

    length: 1000,
    outerDiameter: 150,
    innerDiameter: 52,
    dimensionUnit: 'mm',

    materialRequirements: [
      {
        id: 'mr-002',
        rawMaterialId: 'rm-002',
        rawMaterialName: 'Mild Steel Pipe',
        materialGrade: 'MS',
        quantityRequired: 1.1,
        unit: 'meter',
        wastagePercent: 3
      }
    ],

    processSteps: [
      {
        id: 'ps-005',
        processId: 'proc-001',
        processName: 'CNC Turning',
        stepNumber: 1,
        machineName: 'CNC-01',
        standardTimeHours: 3.5,
        restTimeHours: 1.5,
        description: 'Turn OD and ID to size'
      },
      {
        id: 'ps-006',
        processId: 'proc-003',
        processName: 'Grinding',
        stepNumber: 2,
        machineName: 'Grinding-01',
        standardTimeHours: 2.5,
        restTimeHours: 3.0,
        description: 'Grind outer diameter'
      },
      {
        id: 'ps-007',
        processId: 'proc-008',
        processName: 'Magnetic Assembly',
        stepNumber: 3,
        standardTimeHours: 4.0,
        restTimeHours: 12.0,
        description: 'Install magnetic inserts'
      }
    ],

    totalStandardTimeHours: 10.0,
    description: 'Core tube for magnetic roller with magnetic insert housing',
    technicalNotes: 'Wall thickness: 10mm. Inner bore tolerance: H7',
    qualityCheckpoints: [
      'OD/ID dimensional check',
      'Wall thickness uniformity',
      'Magnetic insert alignment',
      'Surface finish verification'
    ],

    isActive: true,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-10-15'),
    createdBy: 'admin',
    updatedBy: 'engineering'
  },

  {
    id: 'cpt-003',
    templateCode: 'CPT-MAG-DISK-001',
    templateName: 'Magnetic Roller End Disk',
    childPartType: ChildPartType.END_DISK,
    rollerType: RollerType.MAGNETIC,
    drawingNumber: 'DWG-MAG-DISK-001',
    drawingRevision: 'Rev-01',

    diameter: 160,
    thickness: 12,
    innerDiameter: 50.5,
    dimensionUnit: 'mm',

    materialRequirements: [
      {
        id: 'mr-003',
        rawMaterialId: 'rm-003',
        rawMaterialName: 'MS Plate',
        materialGrade: 'MS',
        quantityRequired: 0.5,
        unit: 'kg',
        wastagePercent: 8
      }
    ],

    processSteps: [
      {
        id: 'ps-008',
        processId: 'proc-004',
        processName: 'Laser Cutting',
        stepNumber: 1,
        machineName: 'Laser-01',
        standardTimeHours: 0.5,
        description: 'Cut disk blank from plate'
      },
      {
        id: 'ps-009',
        processId: 'proc-001',
        processName: 'CNC Turning',
        stepNumber: 2,
        machineName: 'CNC-01',
        standardTimeHours: 1.5,
        description: 'Machine center bore and face'
      },
      {
        id: 'ps-010',
        processId: 'proc-005',
        processName: 'Drilling',
        stepNumber: 3,
        standardTimeHours: 1.0,
        description: 'Drill mounting holes'
      }
    ],

    totalStandardTimeHours: 3.0,
    description: 'End disk for magnetic roller assembly',
    technicalNotes: 'Bore tolerance: H7. 6 mounting holes M8 on 120mm PCD',
    qualityCheckpoints: [
      'Bore diameter check',
      'Flatness verification',
      'Hole position accuracy',
      'Surface finish'
    ],

    isActive: true,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-09-10'),
    createdBy: 'admin',
    updatedBy: 'production-manager'
  },

  // ===== PRINTING ROLLER CHILD PARTS =====
  {
    id: 'cpt-004',
    templateCode: 'CPT-PRT-SHAFT-001',
    templateName: 'Printing Roller Shaft - Standard',
    childPartType: ChildPartType.SHAFT,
    rollerType: RollerType.PRINTING,
    drawingNumber: 'DWG-PRT-SH-001',
    drawingRevision: 'Rev-03',

    length: 1400,
    diameter: 60,
    dimensionUnit: 'mm',

    materialRequirements: [
      {
        id: 'mr-004',
        rawMaterialId: 'rm-001',
        rawMaterialName: 'EN8 Steel Rod',
        materialGrade: 'EN8',
        quantityRequired: 1.5,
        unit: 'meter',
        wastagePercent: 5
      }
    ],

    processSteps: [
      {
        id: 'ps-011',
        processId: 'proc-001',
        processName: 'CNC Turning',
        stepNumber: 1,
        machineName: 'CNC-02',
        standardTimeHours: 5.0,
        description: 'Rough and finish turning'
      },
      {
        id: 'ps-012',
        processId: 'proc-003',
        processName: 'Grinding',
        stepNumber: 2,
        machineName: 'Grinding-01',
        standardTimeHours: 3.5,
        description: 'Precision grinding'
      },
      {
        id: 'ps-013',
        processId: 'proc-006',
        processName: 'Chrome Plating',
        stepNumber: 3,
        standardTimeHours: 6.8,
        description: 'Hard chrome plating OSP'
      },
      {
        id: 'ps-014',
        processId: 'proc-007',
        processName: 'Balancing',
        stepNumber: 4,
        machineName: 'Balancing-01',
        standardTimeHours: 1.5,
        description: 'Dynamic balancing after plating'
      }
    ],

    totalStandardTimeHours: 16.8,
    description: 'Precision shaft for printing rollers with chrome plating',
    technicalNotes: 'Chrome plating thickness: 50-80 microns. Surface finish: Ra 0.4 μm',
    qualityCheckpoints: [
      'Dimensional accuracy ±0.005mm',
      'Chrome plating thickness check',
      'Surface finish measurement',
      'Roundness and concentricity',
      'Dynamic balance verification'
    ],

    isActive: true,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-12-01'),
    createdBy: 'admin',
    updatedBy: 'quality-head'
  },

  {
    id: 'cpt-005',
    templateCode: 'CPT-PRT-CORE-001',
    templateName: 'Printing Roller Core - Aluminum',
    childPartType: ChildPartType.CORE,
    rollerType: RollerType.PRINTING,
    drawingNumber: 'DWG-PRT-CORE-001',
    drawingRevision: 'Rev-02',

    length: 1200,
    outerDiameter: 180,
    innerDiameter: 62,
    dimensionUnit: 'mm',

    materialRequirements: [
      {
        id: 'mr-005',
        rawMaterialId: 'rm-004',
        rawMaterialName: 'Aluminum Tube',
        materialGrade: '6061-T6',
        quantityRequired: 1.3,
        unit: 'meter',
        wastagePercent: 4
      }
    ],

    processSteps: [
      {
        id: 'ps-015',
        processId: 'proc-001',
        processName: 'CNC Turning',
        stepNumber: 1,
        machineName: 'CNC-02',
        standardTimeHours: 4.0,
        description: 'Machine OD and ID to final size'
      },
      {
        id: 'ps-016',
        processId: 'proc-003',
        processName: 'Grinding',
        stepNumber: 2,
        machineName: 'Grinding-01',
        standardTimeHours: 3.0,
        description: 'Precision grind outer surface'
      },
      {
        id: 'ps-017',
        processId: 'proc-009',
        processName: 'Anodizing',
        stepNumber: 3,
        standardTimeHours: 4.5,
        description: 'Hard anodizing OSP'
      }
    ],

    totalStandardTimeHours: 11.5,
    description: 'Lightweight aluminum core for printing rollers',
    technicalNotes: 'Anodizing thickness: 25-50 microns. Material: Aircraft grade aluminum',
    qualityCheckpoints: [
      'Dimensional verification',
      'Anodizing thickness check',
      'Surface hardness test',
      'Concentricity measurement'
    ],

    isActive: true,
    createdAt: new Date('2024-02-05'),
    updatedAt: new Date('2024-11-15'),
    createdBy: 'admin',
    updatedBy: 'engineering'
  },

  {
    id: 'cpt-006',
    templateCode: 'CPT-PRT-SLEEVE-001',
    templateName: 'Printing Roller Rubber Sleeve',
    childPartType: ChildPartType.SLEEVE,
    rollerType: RollerType.PRINTING,
    drawingNumber: 'DWG-PRT-SLV-001',
    drawingRevision: 'Rev-01',

    length: 1150,
    outerDiameter: 200,
    innerDiameter: 182,
    thickness: 9,
    dimensionUnit: 'mm',

    materialRequirements: [
      {
        id: 'mr-006',
        rawMaterialId: 'rm-005',
        rawMaterialName: 'NBR Rubber Sheet',
        materialGrade: 'NBR 70 Shore A',
        quantityRequired: 3.5,
        unit: 'kg',
        wastagePercent: 10
      }
    ],

    processSteps: [
      {
        id: 'ps-018',
        processId: 'proc-010',
        processName: 'Rubber Molding',
        stepNumber: 1,
        standardTimeHours: 6.0,
        description: 'Vulcanize rubber on core'
      },
      {
        id: 'ps-019',
        processId: 'proc-003',
        processName: 'Grinding',
        stepNumber: 2,
        machineName: 'Grinding-01',
        standardTimeHours: 4.5,
        description: 'Grind rubber to final diameter'
      },
      {
        id: 'ps-020',
        processId: 'proc-011',
        processName: 'Surface Finishing',
        stepNumber: 3,
        standardTimeHours: 2.0,
        description: 'Polish and finish surface'
      }
    ],

    totalStandardTimeHours: 12.5,
    description: 'Rubber sleeve for printing roller with precise surface finish',
    technicalNotes: 'Hardness: 70±5 Shore A. Surface finish: Mirror polish',
    qualityCheckpoints: [
      'Rubber hardness test',
      'Diameter uniformity check',
      'Surface finish inspection',
      'Bond strength test',
      'Concentricity verification'
    ],

    isActive: true,
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-10-30'),
    createdBy: 'admin',
    updatedBy: 'production-manager'
  },

  {
    id: 'cpt-007',
    templateCode: 'CPT-PRT-DISK-001',
    templateName: 'Printing Roller End Disk - Heavy Duty',
    childPartType: ChildPartType.END_DISK,
    rollerType: RollerType.PRINTING,
    drawingNumber: 'DWG-PRT-DISK-001',
    drawingRevision: 'Rev-01',

    diameter: 190,
    thickness: 15,
    innerDiameter: 60.5,
    dimensionUnit: 'mm',

    materialRequirements: [
      {
        id: 'mr-007',
        rawMaterialId: 'rm-003',
        rawMaterialName: 'MS Plate',
        materialGrade: 'MS',
        quantityRequired: 0.8,
        unit: 'kg',
        wastagePercent: 8
      }
    ],

    processSteps: [
      {
        id: 'ps-021',
        processId: 'proc-004',
        processName: 'Laser Cutting',
        stepNumber: 1,
        machineName: 'Laser-01',
        standardTimeHours: 0.8,
        description: 'Cut disk from plate'
      },
      {
        id: 'ps-022',
        processId: 'proc-001',
        processName: 'CNC Turning',
        stepNumber: 2,
        machineName: 'CNC-01',
        standardTimeHours: 2.0,
        description: 'Machine bore and faces'
      },
      {
        id: 'ps-023',
        processId: 'proc-005',
        processName: 'Drilling',
        stepNumber: 3,
        standardTimeHours: 1.2,
        description: 'Drill mounting and fixing holes'
      }
    ],

    totalStandardTimeHours: 4.0,
    description: 'Heavy duty end disk for printing rollers',
    technicalNotes: 'Bore tolerance: H7. 8 mounting holes M10 on 140mm PCD',
    qualityCheckpoints: [
      'Bore accuracy check',
      'Face parallelism',
      'Hole position verification',
      'Surface finish inspection'
    ],

    isActive: true,
    createdAt: new Date('2024-02-25'),
    updatedAt: new Date('2024-09-20'),
    createdBy: 'admin',
    updatedBy: 'engineering'
  }
]
