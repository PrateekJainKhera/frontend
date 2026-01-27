import { MaterialGrade, MaterialShape } from './enums'

export interface RawMaterial {
  id: string
  materialName: string
  grade: MaterialGrade
  shape: MaterialShape
  diameter: number
  lengthInMM: number
  density: number
  weightKG: number
  createdAt: Date
  updatedAt: Date
}
