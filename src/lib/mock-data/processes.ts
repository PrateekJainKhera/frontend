import { Process, ProcessTemplate, ProcessTemplateStep, ProcessCategory, SkillLevel, RollerType } from '@/types'

export const mockProcesses: Process[] = [
  {
    id: 1,
    processCode: 'CNC-001',
    processName: 'CNC Turning',
    category: ProcessCategory.MACHINING,
    defaultMachine: 'CNC-01',
    standardTimeMin: 45,
    skillRequired: SkillLevel.INTERMEDIATE,
    isOutsourced: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 2,
    processCode: 'HT-001',
    processName: 'Heat Treatment',
    category: ProcessCategory.HEAT_TREATMENT,
    defaultMachine: 'Outsourced',
    standardTimeMin: 240,
    skillRequired: SkillLevel.EXPERT,
    isOutsourced: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 3,
    processCode: 'GRD-001',
    processName: 'Grinding',
    category: ProcessCategory.FINISHING,
    defaultMachine: 'GRD-02',
    standardTimeMin: 60,
    skillRequired: SkillLevel.EXPERT,
    isOutsourced: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 4,
    processCode: 'BAL-001',
    processName: 'Balancing',
    category: ProcessCategory.FINISHING,
    defaultMachine: 'BAL-01',
    standardTimeMin: 20,
    skillRequired: SkillLevel.INTERMEDIATE,
    isOutsourced: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 5,
    processCode: 'ASM-001',
    processName: 'Assembly',
    category: ProcessCategory.ASSEMBLY,
    defaultMachine: 'Assembly Station',
    standardTimeMin: 30,
    skillRequired: SkillLevel.BASIC,
    isOutsourced: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 6,
    processCode: 'INS-001',
    processName: 'Final Inspection',
    category: ProcessCategory.INSPECTION,
    defaultMachine: 'Inspection Table',
    standardTimeMin: 15,
    skillRequired: SkillLevel.INTERMEDIATE,
    isOutsourced: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 7,
    processCode: 'DSP-001',
    processName: 'Dispatch',
    category: ProcessCategory.DISPATCH,
    standardTimeMin: 10,
    skillRequired: SkillLevel.BASIC,
    isOutsourced: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
]

export const mockProcessTemplates: ProcessTemplate[] = [
  {
    id: 1,
    templateName: 'Magnetic Roller Complete Process',
    description: 'Standard process for magnetic rollers',
    applicableTypes: [RollerType.MAGNETIC],
    steps: [
      {
        id: 1,
        templateId: 1,
        processId: 1,
        processName: 'CNC Turning',
        stepNo: 1,
        isMandatory: true,
        canBeParallel: false
      },
      {
        id: 2,
        templateId: 1,
        processId: 2,
        processName: 'Heat Treatment',
        stepNo: 2,
        isMandatory: true,
        canBeParallel: false
      },
      {
        id: 3,
        templateId: 1,
        processId: 3,
        processName: 'Grinding',
        stepNo: 3,
        isMandatory: true,
        canBeParallel: false
      },
      {
        id: 4,
        templateId: 1,
        processId: 4,
        processName: 'Balancing',
        stepNo: 4,
        isMandatory: false,
        canBeParallel: false
      },
      {
        id: 5,
        templateId: 1,
        processId: 6,
        processName: 'Final Inspection',
        stepNo: 5,
        isMandatory: true,
        canBeParallel: false
      },
      {
        id: 6,
        templateId: 1,
        processId: 7,
        processName: 'Dispatch',
        stepNo: 6,
        isMandatory: true,
        canBeParallel: false
      }
    ],
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05')
  },
  {
    id: 2,
    templateName: 'Printing Roller Process',
    description: 'Standard process for printing rollers',
    applicableTypes: [RollerType.PRINTING],
    steps: [
      {
        id: 7,
        templateId: 2,
        processId: 1,
        processName: 'CNC Turning',
        stepNo: 1,
        isMandatory: true,
        canBeParallel: false
      },
      {
        id: 8,
        templateId: 2,
        processId: 5,
        processName: 'Assembly',
        stepNo: 2,
        isMandatory: true,
        canBeParallel: false
      },
      {
        id: 9,
        templateId: 2,
        processId: 6,
        processName: 'Final Inspection',
        stepNo: 3,
        isMandatory: true,
        canBeParallel: false
      },
      {
        id: 10,
        templateId: 2,
        processId: 7,
        processName: 'Dispatch',
        stepNo: 4,
        isMandatory: true,
        canBeParallel: false
      }
    ],
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05')
  },
  {
    id: 3,
    templateName: 'Idler Roller Standard',
    description: 'Standard process for idler rollers',
    applicableTypes: [RollerType.IDLER],
    steps: [
      {
        id: 11,
        templateId: 3,
        processId: 1,
        processName: 'CNC Turning',
        stepNo: 1,
        isMandatory: true,
        canBeParallel: false
      },
      {
        id: 12,
        templateId: 3,
        processId: 3,
        processName: 'Grinding',
        stepNo: 2,
        isMandatory: true,
        canBeParallel: false
      },
      {
        id: 13,
        templateId: 3,
        processId: 6,
        processName: 'Final Inspection',
        stepNo: 3,
        isMandatory: true,
        canBeParallel: false
      },
      {
        id: 14,
        templateId: 3,
        processId: 7,
        processName: 'Dispatch',
        stepNo: 4,
        isMandatory: true,
        canBeParallel: false
      }
    ],
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05')
  }
]
