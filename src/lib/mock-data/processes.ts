import { Process, ProcessTemplate, ProcessTemplateStep, ProcessCategory, SkillLevel, RollerType } from '@/types'

export const mockProcesses: Process[] = [
  {
    id: 'proc-1',
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
    id: 'proc-2',
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
    id: 'proc-3',
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
    id: 'proc-4',
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
    id: 'proc-5',
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
    id: 'proc-6',
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
    id: 'proc-7',
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
    id: 'template-1',
    templateName: 'Magnetic Roller Standard',
    description: 'Standard process for magnetic rollers',
    applicableTypes: [RollerType.MAGNETIC],
    steps: [
      {
        id: 'step-1-1',
        templateId: 'template-1',
        processId: 'proc-1',
        processName: 'CNC Turning',
        stepNo: 1,
        isMandatory: true,
        canBeParallel: false
      },
      {
        id: 'step-1-2',
        templateId: 'template-1',
        processId: 'proc-2',
        processName: 'Heat Treatment',
        stepNo: 2,
        isMandatory: true,
        canBeParallel: false
      },
      {
        id: 'step-1-3',
        templateId: 'template-1',
        processId: 'proc-3',
        processName: 'Grinding',
        stepNo: 3,
        isMandatory: true,
        canBeParallel: false
      },
      {
        id: 'step-1-4',
        templateId: 'template-1',
        processId: 'proc-4',
        processName: 'Balancing',
        stepNo: 4,
        isMandatory: false,
        canBeParallel: false
      },
      {
        id: 'step-1-5',
        templateId: 'template-1',
        processId: 'proc-6',
        processName: 'Final Inspection',
        stepNo: 5,
        isMandatory: true,
        canBeParallel: false
      },
      {
        id: 'step-1-6',
        templateId: 'template-1',
        processId: 'proc-7',
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
    id: 'template-2',
    templateName: 'Rubber Roller Standard',
    description: 'Standard process for rubber rollers',
    applicableTypes: [RollerType.RUBBER],
    steps: [
      {
        id: 'step-2-1',
        templateId: 'template-2',
        processId: 'proc-1',
        processName: 'CNC Turning',
        stepNo: 1,
        isMandatory: true,
        canBeParallel: false
      },
      {
        id: 'step-2-2',
        templateId: 'template-2',
        processId: 'proc-5',
        processName: 'Assembly',
        stepNo: 2,
        isMandatory: true,
        canBeParallel: false
      },
      {
        id: 'step-2-3',
        templateId: 'template-2',
        processId: 'proc-6',
        processName: 'Final Inspection',
        stepNo: 3,
        isMandatory: true,
        canBeParallel: false
      },
      {
        id: 'step-2-4',
        templateId: 'template-2',
        processId: 'proc-7',
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
    id: 'template-3',
    templateName: 'Idler Roller Standard',
    description: 'Standard process for idler rollers',
    applicableTypes: [RollerType.IDLER],
    steps: [
      {
        id: 'step-3-1',
        templateId: 'template-3',
        processId: 'proc-1',
        processName: 'CNC Turning',
        stepNo: 1,
        isMandatory: true,
        canBeParallel: false
      },
      {
        id: 'step-3-2',
        templateId: 'template-3',
        processId: 'proc-3',
        processName: 'Grinding',
        stepNo: 2,
        isMandatory: true,
        canBeParallel: false
      },
      {
        id: 'step-3-3',
        templateId: 'template-3',
        processId: 'proc-6',
        processName: 'Final Inspection',
        stepNo: 3,
        isMandatory: true,
        canBeParallel: false
      },
      {
        id: 'step-3-4',
        templateId: 'template-3',
        processId: 'proc-7',
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
