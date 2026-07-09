import { cn } from '@/lib/utils'

interface ProductSpecProps {
  machineModel?: string | null
  rollerType?: string | null
  numberOfTeeth?: number | null
  className?: string
}

/**
 * Compact one-line product spec shown next to an Order No / product:
 *   "UFO 370 · Printing Roller · 73T"
 * Any missing part is skipped. Renders nothing if all three are empty.
 */
export function ProductSpec({ machineModel, rollerType, numberOfTeeth, className }: ProductSpecProps) {
  const parts: string[] = []
  if (machineModel) parts.push(machineModel)
  if (rollerType) parts.push(rollerType)
  if (numberOfTeeth != null && numberOfTeeth > 0) parts.push(`${numberOfTeeth}T`)

  if (parts.length === 0) return null

  return (
    <span className={cn('text-xs text-muted-foreground', className)}>
      {parts.join(' · ')}
    </span>
  )
}
