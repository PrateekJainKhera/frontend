import { ProductTemplate, RollerType } from '@/types'

export const mockProductTemplates: ProductTemplate[] = [
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
        sequenceNo: 1
      },
      {
        id: 'cp-002',
        productTemplateId: 'pt-001',
        childPartName: 'Magnet Core',
        childPartCode: 'CORE-MAG',
        quantity: 1,
        unit: 'pcs',
        notes: 'Magnetic core assembly',
        sequenceNo: 2
      },
      {
        id: 'cp-003',
        productTemplateId: 'pt-001',
        childPartName: 'Shell',
        childPartCode: 'SHELL-ALU',
        quantity: 1,
        unit: 'pcs',
        notes: 'Aluminum shell',
        sequenceNo: 3
      },
      {
        id: 'cp-004',
        productTemplateId: 'pt-001',
        childPartName: 'End Caps',
        childPartCode: 'CAP-END',
        quantity: 2,
        unit: 'pcs',
        notes: 'Both side end caps',
        sequenceNo: 4
      }
    ],
    processTemplateId: 'tpl-001',
    processTemplateName: 'Magnetic Roller Complete Process',
    isActive: true,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
    createdBy: 'admin'
  },
  {
    id: 'pt-002',
    templateCode: 'TPL-ANI-STD',
    templateName: 'Anilox Roller Standard',
    description: 'Standard anilox roller with engraving and chrome coating',
    rollerType: RollerType.ANILOX,
    childParts: [
      {
        id: 'cp-005',
        productTemplateId: 'pt-002',
        childPartName: 'Base Shaft',
        childPartCode: 'SHAFT-ANI',
        quantity: 1,
        unit: 'pcs',
        notes: 'Steel shaft for anilox',
        sequenceNo: 1
      },
      {
        id: 'cp-006',
        productTemplateId: 'pt-002',
        childPartName: 'Ceramic Coating Material',
        childPartCode: 'CER-ANI',
        quantity: 0.5,
        unit: 'kg',
        notes: 'Ceramic coating material',
        sequenceNo: 2
      },
      {
        id: 'cp-007',
        productTemplateId: 'pt-002',
        childPartName: 'End Journals',
        childPartCode: 'JRNL-ANI',
        quantity: 2,
        unit: 'pcs',
        notes: 'Precision end journals',
        sequenceNo: 3
      }
    ],
    processTemplateId: 'tpl-002',
    processTemplateName: 'Anilox Roller Process',
    isActive: true,
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-12'),
    createdBy: 'admin'
  },
  {
    id: 'pt-003',
    templateCode: 'TPL-RUB-STD',
    templateName: 'Rubber Roller Standard',
    description: 'Standard rubber roller with polyurethane coating',
    rollerType: RollerType.RUBBER,
    childParts: [
      {
        id: 'cp-008',
        productTemplateId: 'pt-003',
        childPartName: 'Core Shaft',
        childPartCode: 'SHAFT-RUB',
        quantity: 1,
        unit: 'pcs',
        notes: 'Steel core for rubber roller',
        sequenceNo: 1
      },
      {
        id: 'cp-009',
        productTemplateId: 'pt-003',
        childPartName: 'Polyurethane Material',
        childPartCode: 'PU-RUB',
        quantity: 2,
        unit: 'kg',
        notes: 'PU coating material',
        sequenceNo: 2
      },
      {
        id: 'cp-010',
        productTemplateId: 'pt-003',
        childPartName: 'Bearing Housing',
        childPartCode: 'BRG-RUB',
        quantity: 2,
        unit: 'pcs',
        notes: 'Bearing housing assembly',
        sequenceNo: 3
      }
    ],
    processTemplateId: 'tpl-003',
    processTemplateName: 'Rubber Roller Process',
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    createdBy: 'admin'
  },
  {
    id: 'pt-004',
    templateCode: 'TPL-MAG-PREM',
    templateName: 'Magnetic Roller Premium',
    description: 'Premium magnetic roller with enhanced magnetization and precision grinding',
    rollerType: RollerType.MAGNETIC,
    childParts: [
      {
        id: 'cp-011',
        productTemplateId: 'pt-004',
        childPartName: 'Premium Shaft',
        childPartCode: 'SHAFT-MAG-P',
        quantity: 1,
        unit: 'pcs',
        notes: 'High-grade steel shaft',
        sequenceNo: 1
      },
      {
        id: 'cp-012',
        productTemplateId: 'pt-004',
        childPartName: 'Premium Magnet Core',
        childPartCode: 'CORE-MAG-P',
        quantity: 1,
        unit: 'pcs',
        notes: 'High-strength magnet core',
        sequenceNo: 2
      },
      {
        id: 'cp-013',
        productTemplateId: 'pt-004',
        childPartName: 'Stainless Steel Shell',
        childPartCode: 'SHELL-SS',
        quantity: 1,
        unit: 'pcs',
        notes: 'Stainless steel shell',
        sequenceNo: 3
      },
      {
        id: 'cp-014',
        productTemplateId: 'pt-004',
        childPartName: 'Premium End Caps',
        childPartCode: 'CAP-END-P',
        quantity: 2,
        unit: 'pcs',
        notes: 'Precision end caps',
        sequenceNo: 4
      },
      {
        id: 'cp-015',
        productTemplateId: 'pt-004',
        childPartName: 'Protective Coating',
        childPartCode: 'COAT-PROT',
        quantity: 0.2,
        unit: 'L',
        notes: 'Anti-corrosion coating',
        sequenceNo: 5
      }
    ],
    processTemplateId: 'tpl-001',
    processTemplateName: 'Magnetic Roller Complete Process',
    isActive: true,
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-18'),
    createdBy: 'admin'
  },
  {
    id: 'pt-005',
    templateCode: 'TPL-PRT-STD',
    templateName: 'Printing Roller Standard',
    description: 'Standard printing roller for flexo and offset printing',
    rollerType: RollerType.PRINTING,
    childParts: [
      {
        id: 'cp-016',
        productTemplateId: 'pt-005',
        childPartName: 'Printing Shaft',
        childPartCode: 'SHAFT-PRT',
        quantity: 1,
        unit: 'pcs',
        notes: 'Precision ground shaft',
        sequenceNo: 1
      },
      {
        id: 'cp-017',
        productTemplateId: 'pt-005',
        childPartName: 'Copper Sleeve',
        childPartCode: 'SLV-CU',
        quantity: 1,
        unit: 'pcs',
        notes: 'Copper printing surface',
        sequenceNo: 2
      },
      {
        id: 'cp-018',
        productTemplateId: 'pt-005',
        childPartName: 'Chrome Plating Material',
        childPartCode: 'CHR-PLT',
        quantity: 0.3,
        unit: 'kg',
        notes: 'Hard chrome plating',
        sequenceNo: 3
      }
    ],
    processTemplateId: 'tpl-004',
    processTemplateName: 'Printing Roller Process',
    isActive: true,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
    createdBy: 'admin'
  }
]
