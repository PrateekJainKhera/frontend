export interface MaterialCategory {
  id: number
  categoryCode: string
  categoryName: string
  quality: string
  description: string
  defaultUOM: string
  materialType: 'raw_material' | 'component'
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
