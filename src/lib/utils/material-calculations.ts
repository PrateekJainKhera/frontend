// Material weight and length calculations for roller manufacturing

// Density values (kg/mm³)
export const MATERIAL_DENSITIES = {
  EN8: 0.00000785,
  EN19: 0.00000785,
  SS304: 0.00000793,
  SS316: 0.00000793,
  'Alloy Steel': 0.00000785,
} as const

// Calculate weight from length
// Formula: weight = length × π × r² × density
export const calculateWeightFromLength = (
  length: number,      // mm
  diameter: number,    // mm
  density: number      // kg/mm³
): number => {
  const radius = diameter / 2
  const volume = Math.PI * radius * radius * length
  const weight = volume * density
  return parseFloat(weight.toFixed(3))
}

// Calculate length from weight
// Formula: length = weight / (π × r² × density)
export const calculateLengthFromWeight = (
  weight: number,      // kg
  diameter: number,    // mm
  density: number      // kg/mm³
): number => {
  const radius = diameter / 2
  const area = Math.PI * radius * radius
  const length = weight / (area * density)
  return parseFloat(length.toFixed(2))
}

// Get density for material grade
export const getDensityForGrade = (grade: string): number => {
  return MATERIAL_DENSITIES[grade as keyof typeof MATERIAL_DENSITIES] || MATERIAL_DENSITIES.EN8
}
