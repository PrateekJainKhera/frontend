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

export interface SearchableSelectOption {
  value: string
  label: string
  /** Extra text to match against while searching (not shown). */
  keywords?: string
}

interface SearchableSelectProps {
  options: SearchableSelectOption[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
}

/** Generic searchable dropdown (type-to-filter) built on Command + Popover. */
export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  emptyText = 'No results found.',
  disabled = false,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const selected = options.find((o) => o.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal',
            !selected && 'text-muted-foreground',
            className
          )}
        >
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-[240px] max-w-[min(90vw,360px)] p-0"
        align="start"
        side="bottom"
        sideOffset={4}
        avoidCollisions={false}
      >
        <Command
          filter={(val, search) =>
            val.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
          }
        >
          {/* Search box stays pinned at the top, always visible */}
          <CommandInput placeholder={searchPlaceholder} className="h-9" />
          <CommandList
            className="max-h-[260px] overflow-y-auto"
            // When this dropdown is inside a Dialog, the dialog's scroll-lock blocks the
            // mouse wheel over the portalled list. Stop the wheel from reaching it so the
            // list scrolls natively via its own overflow.
            onWheel={(e) => e.stopPropagation()}
          >
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  // include value to keep the search key unique across duplicate labels
                  value={`${opt.label} ${opt.keywords ?? ''} ${opt.value}`}
                  onSelect={() => {
                    onChange(opt.value)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === opt.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span className="truncate">{opt.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
