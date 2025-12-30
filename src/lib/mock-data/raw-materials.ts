import { RawMaterial, MaterialGrade, MaterialShape } from '@/types'
import { calculateWeightFromLength } from '@/lib/utils/material-calculations'

export const mockRawMaterials: RawMaterial[] = [
  {
    id: 'rm-1',
    materialName: 'EN8 Rod 50mm',
    grade: MaterialGrade.EN8,
    shape: MaterialShape.ROD,
    diameter: 50,
    lengthInMM: 3000,
    density: 0.00000785,
    weightKG: calculateWeightFromLength(3000, 50, 0.00000785),
    stockQty: 150,
    minStockLevel: 50,
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
    density: 0.00000785,
    weightKG: calculateWeightFromLength(3000, 80, 0.00000785),
    stockQty: 85,
    minStockLevel: 40,
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
    density: 0.00000785,
    weightKG: calculateWeightFromLength(3000, 100, 0.00000785),
    stockQty: 25,
    minStockLevel: 30,
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
    density: 0.00000793,
    weightKG: calculateWeightFromLength(3000, 60, 0.00000793),
    stockQty: 45,
    minStockLevel: 20,
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
    density: 0.00000793,
    weightKG: calculateWeightFromLength(3000, 75, 0.00000793),
    stockQty: 32,
    minStockLevel: 25,
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-10')
  }
]
