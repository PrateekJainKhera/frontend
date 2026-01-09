import { ProductTemplate, RollerType } from '@/types'

// Product Templates - Only Magnetic and Printing Rollers
export const mockProductTemplates: ProductTemplate[] = [
  // ===== MAGNETIC ROLLERS =====
  {
    id: 'pt-001',
    templateCode: 'TPL-MAG-STD',
    templateName: 'Magnetic Roller Standard',
    description: 'Standard magnetic roller with full magnetization process',
    rollerType: RollerType.MAGNETIC,
    childParts: [
      {
        id: 'cp-001',
        productTemplateId: 'pt-001',
        childPartName: 'Shaft',
        childPartCode: 'SHAFT-MAG',
        quantity: 1,
        unit: 'pcs',
        notes: 'Main shaft for magnetic roller',
        sequenceNo: 1,
        childPartTemplateId: 'cpt-001' // Links to Magnetic Roller Shaft - Standard
      },
      {
        id: 'cp-002',
        productTemplateId: 'pt-001',
        childPartName: 'Magnet Core',
        childPartCode: 'CORE-MAG',
        quantity: 1,
        unit: 'pcs',
        notes: 'Magnetic core assembly',
        sequenceNo: 2,
        childPartTemplateId: 'cpt-002' // Links to Magnetic Core - Standard
      },
      {
        id: 'cp-003',
        productTemplateId: 'pt-001',
        childPartName: 'Shell',
        childPartCode: 'SHELL-ALU',
        quantity: 1,
        unit: 'pcs',
        notes: 'Aluminum shell',
        sequenceNo: 3,
        childPartTemplateId: 'cpt-004' // Links to Aluminum Shell
      },
      {
        id: 'cp-004',
        productTemplateId: 'pt-001',
        childPartName: 'End Disks',
        childPartCode: 'DISK-END',
        quantity: 2,
        unit: 'pcs',
        notes: 'Both side end disks',
        sequenceNo: 4,
        childPartTemplateId: 'cpt-005' // Links to End Disk Template
      }
    ],
    processTemplateId: 'tpl-001',
    processTemplateName: 'Magnetic Roller Complete Process',
    isActive: true,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-11-15'),
    createdBy: 'admin'
  },
  {
    id: 'pt-002',
    templateCode: 'TPL-MAG-PREM',
    templateName: 'Magnetic Roller Premium',
    description: 'Premium magnetic roller with enhanced magnetization and precision grinding',
    rollerType: RollerType.MAGNETIC,
    childParts: [
      {
        id: 'cp-005',
        productTemplateId: 'pt-002',
        childPartName: 'Premium Shaft',
        childPartCode: 'SHAFT-MAG-P',
        quantity: 1,
        unit: 'pcs',
        notes: 'High-grade steel shaft',
        sequenceNo: 1,
        childPartTemplateId: 'cpt-001'
      },
      {
        id: 'cp-006',
        productTemplateId: 'pt-002',
        childPartName: 'Premium Magnet Core',
        childPartCode: 'CORE-MAG-P',
        quantity: 1,
        unit: 'pcs',
        notes: 'High-strength magnet core',
        sequenceNo: 2,
        childPartTemplateId: 'cpt-003'
      },
      {
        id: 'cp-007',
        productTemplateId: 'pt-002',
        childPartName: 'Stainless Steel Shell',
        childPartCode: 'SHELL-SS',
        quantity: 1,
        unit: 'pcs',
        notes: 'Stainless steel shell',
        sequenceNo: 3,
        childPartTemplateId: 'cpt-004'
      },
      {
        id: 'cp-008',
        productTemplateId: 'pt-002',
        childPartName: 'Premium End Disks',
        childPartCode: 'DISK-END-P',
        quantity: 2,
        unit: 'pcs',
        notes: 'Precision end disks',
        sequenceNo: 4,
        childPartTemplateId: 'cpt-005'
      }
    ],
    processTemplateId: 'tpl-001',
    processTemplateName: 'Magnetic Roller Complete Process',
    isActive: true,
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-10-20'),
    createdBy: 'admin'
  },

  // ===== PRINTING ROLLERS =====
  {
    id: 'pt-003',
    templateCode: 'TPL-PRT-STD',
    templateName: 'Printing Roller Standard',
    description: 'Standard printing roller for flexo and offset printing',
    rollerType: RollerType.PRINTING,
    childParts: [
      {
        id: 'cp-009',
        productTemplateId: 'pt-003',
        childPartName: 'Printing Shaft',
        childPartCode: 'SHAFT-PRT',
        quantity: 1,
        unit: 'pcs',
        notes: 'Precision ground shaft',
        sequenceNo: 1,
        childPartTemplateId: 'cpt-006'
      },
      {
        id: 'cp-010',
        productTemplateId: 'pt-003',
        childPartName: 'Aluminum Core',
        childPartCode: 'CORE-ALU',
        quantity: 1,
        unit: 'pcs',
        notes: 'Lightweight aluminum core',
        sequenceNo: 2,
        childPartTemplateId: 'cpt-007'
      },
      {
        id: 'cp-011',
        productTemplateId: 'pt-003',
        childPartName: 'Rubber Sleeve',
        childPartCode: 'SLV-RUB',
        quantity: 1,
        unit: 'pcs',
        notes: 'Rubber printing surface',
        sequenceNo: 3,
        childPartTemplateId: 'cpt-008'
      },
      {
        id: 'cp-012',
        productTemplateId: 'pt-003',
        childPartName: 'End Disks',
        childPartCode: 'DISK-PRT',
        quantity: 2,
        unit: 'pcs',
        notes: 'Heavy duty end disks',
        sequenceNo: 4,
        childPartTemplateId: 'cpt-009'
      }
    ],
    processTemplateId: 'tpl-002',
    processTemplateName: 'Printing Roller Process',
    isActive: true,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-12-05'),
    createdBy: 'admin'
  },
  {
    id: 'pt-004',
    templateCode: 'TPL-PRT-HD',
    templateName: 'Printing Roller Heavy Duty',
    description: 'Heavy duty printing roller for industrial applications',
    rollerType: RollerType.PRINTING,
    childParts: [
      {
        id: 'cp-013',
        productTemplateId: 'pt-004',
        childPartName: 'Heavy Duty Shaft',
        childPartCode: 'SHAFT-PRT-HD',
        quantity: 1,
        unit: 'pcs',
        notes: 'Chrome plated shaft',
        sequenceNo: 1,
        childPartTemplateId: 'cpt-006'
      },
      {
        id: 'cp-014',
        productTemplateId: 'pt-004',
        childPartName: 'Reinforced Core',
        childPartCode: 'CORE-ALU-HD',
        quantity: 1,
        unit: 'pcs',
        notes: 'Reinforced aluminum core',
        sequenceNo: 2,
        childPartTemplateId: 'cpt-007'
      },
      {
        id: 'cp-015',
        productTemplateId: 'pt-004',
        childPartName: 'Industrial Rubber Sleeve',
        childPartCode: 'SLV-RUB-HD',
        quantity: 1,
        unit: 'pcs',
        notes: 'High durability rubber sleeve',
        sequenceNo: 3,
        childPartTemplateId: 'cpt-008'
      },
      {
        id: 'cp-016',
        productTemplateId: 'pt-004',
        childPartName: 'Heavy Duty End Disks',
        childPartCode: 'DISK-PRT-HD',
        quantity: 2,
        unit: 'pcs',
        notes: 'Extra strength end disks',
        sequenceNo: 4,
        childPartTemplateId: 'cpt-009'
      }
    ],
    processTemplateId: 'tpl-002',
    processTemplateName: 'Printing Roller Process',
    isActive: true,
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-11-25'),
    createdBy: 'admin'
  }
]
