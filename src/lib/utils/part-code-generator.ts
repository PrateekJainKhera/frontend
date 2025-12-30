import { RollerType } from '@/types'

// Generate unique part code
// Format: {TYPE}-{DIAMETER}-{MATERIAL}-{SEQUENCE}
// Example: MAG-250-EN8-001

export const generatePartCode = (
  rollerType: RollerType,
  diameter: number,
  materialGrade: string
): string => {
  // Get type prefix
  const typePrefix = rollerType.substring(0, 3).toUpperCase()

  // Get material prefix
  const materialPrefix = materialGrade.substring(0, 3).toUpperCase()

  // Generate random sequence (in real app, this would be from database)
  const sequence = Math.floor(Math.random() * 999) + 1
  const sequenceStr = sequence.toString().padStart(3, '0')

  return `${typePrefix}-${diameter}-${materialPrefix}-${sequenceStr}`
}
