import { RawMaterial, MaterialGrade, MaterialShape } from '@/types'

export const mockRawMaterials: RawMaterial[] = [
  {
    id: 'rm-1',
    materialName: 'EN8 Rod 50mm',
    grade: MaterialGrade.EN8,
    shape: MaterialShape.ROD,
    diameter: 50,
    lengthInMM: 3000,
    density: 7.85,
    weightKG: 46.2,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10')
  },
  {
    id: 'rm-2',
    materialName: 'EN8 Rod 80mm',
    grade: MaterialGrade.EN8,
    shape: MaterialShape.ROD,
    diameter: 80,
    lengthInMM: 3000,
    density: 7.85,
    weightKG: 118.4,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10')
  },
  {
    id: 'rm-3',
    materialName: 'EN19 Rod 100mm',
    grade: MaterialGrade.EN19,
    shape: MaterialShape.ROD,
    diameter: 100,
    lengthInMM: 3000,
    density: 7.85,
    weightKG: 185.0,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 'rm-4',
    materialName: 'SS304 Pipe 60mm',
    grade: MaterialGrade.SS304,
    shape: MaterialShape.PIPE,
    diameter: 60,
    lengthInMM: 3000,
    density: 7.93,
    weightKG: 67.0,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01')
  },
  {
    id: 'rm-5',
    materialName: 'SS316 Rod 75mm',
    grade: MaterialGrade.SS316,
    shape: MaterialShape.ROD,
    diameter: 75,
    lengthInMM: 3000,
    density: 7.93,
    weightKG: 104.9,
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-10')
  }
]
