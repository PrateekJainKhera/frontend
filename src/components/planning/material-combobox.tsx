"use client"

import { useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { MaterialResponse } from '@/lib/api/materials'

interface MaterialComboboxProps {
  materials: MaterialResponse[]
  selectedId?: number | null
  selectedName?: string
  onSelectMaterial: (materialId: number) => void
  onSelectCustom: () => void
}

/** Searchable material dropdown for the Material Requirements table. */
export function MaterialCombobox({
  materials,
  selectedId,
  selectedName,
  onSelectMaterial,
  onSelectCustom,
}: MaterialComboboxProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-8 w-full justify-between text-xs font-normal"
        >
          <span className="truncate">
            {selectedName || 'Select material'}
          </span>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command
          filter={(value, search) =>
            value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
          }
        >
          <CommandInput placeholder="Search material..." className="h-9 text-xs" />
          <CommandList>
            <CommandEmpty>No material found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="+ custom material"
                onSelect={() => {
                  onSelectCustom()
                  setOpen(false)
                }}
              >
                <span className="text-blue-600 font-medium">+ Custom Material</span>
              </CommandItem>
              {materials.map((mat) => {
                const searchValue = `${mat.materialName} ${mat.materialType ?? ''} ${mat.shape ?? ''} ${mat.grade ?? ''}`
                return (
                  <CommandItem
                    key={mat.id}
                    value={searchValue}
                    onSelect={() => {
                      onSelectMaterial(mat.id)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-3.5 w-3.5',
                        selectedId === mat.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{mat.materialName}</span>
                      <span className="text-xs text-gray-500">
                        {mat.materialType} • {mat.shape} • {mat.grade}
                      </span>
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
