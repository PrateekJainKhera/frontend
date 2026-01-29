import { MaterialCategory } from '@/types'

export const mockMaterialCategories: MaterialCategory[] = [
  {
    id: 1,
    categoryCode: 'MAT-STEEL',
    categoryName: 'Steel Rods',
    quality: 'EN8',
    description: 'Steel rods and bars for manufacturing',
    defaultUOM: 'kg',
    materialType: 'raw_material',
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 2,
    categoryCode: 'MAT-RUBBER',
    categoryName: 'Rubber Sheets',
    quality: 'Natural Rubber',
    description: 'Rubber sheets and rolls for roller covering',
    defaultUOM: 'kg',
    materialType: 'raw_material',
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 3,
    categoryCode: 'COMP-BEAR',
    categoryName: 'Bearings',
    quality: 'SKF',
    description: 'Ball bearings and roller bearings',
    defaultUOM: 'nos',
    materialType: 'component',
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 4,
    categoryCode: 'COMP-BOLT',
    categoryName: 'Bolts & Fasteners',
    quality: '8.8 Grade',
    description: 'Bolts, nuts, screws and fasteners',
    defaultUOM: 'nos',
    materialType: 'component',
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 5,
    categoryCode: 'MAT-ALUM',
    categoryName: 'Aluminum Sheets',
    quality: '6061-T6',
    description: 'Aluminum sheets and plates',
    defaultUOM: 'kg',
    materialType: 'raw_material',
    isActive: true,
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16')
  },
  {
    id: 6,
    categoryCode: 'COMP-SEAL',
    categoryName: 'Seals & Gaskets',
    quality: 'NBR',
    description: 'Rubber seals and gaskets',
    defaultUOM: 'nos',
    materialType: 'component',
    isActive: false,
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-20')
  }
]
