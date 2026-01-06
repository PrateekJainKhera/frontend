"use client"

import { usePathname } from 'next/navigation'
import { Bell, User, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface HeaderProps {
  onMenuClick: () => void
}

// Page name mapping
const getPageName = (pathname: string): string => {
  if (pathname === '/') return 'Dashboard'

  // Masters
  if (pathname.includes('/masters/customers')) return 'Customers'
  if (pathname.includes('/masters/products')) return 'Products'
  if (pathname.includes('/masters/raw-materials')) return 'Raw Materials'
  if (pathname.includes('/masters/components')) return 'Components'
  if (pathname.includes('/masters/processes')) return 'Processes'
  if (pathname.includes('/masters/process-templates')) return 'Process Templates'

  // Orders
  if (pathname === '/orders/create') return 'Create Order'
  if (pathname === '/orders/live-tracking') return 'Live Tracking'
  if (pathname.includes('/orders/')) return 'Order Details'
  if (pathname === '/orders') return 'Orders'

  // Production
  if (pathname === '/production/job-cards/create') return 'Create Job Card'
  if (pathname.includes('/production/job-cards/')) return 'Job Card Details'
  if (pathname === '/production/job-cards') return 'Job Cards'
  if (pathname.includes('/production/child-parts/')) return 'Child Part Details'
  if (pathname === '/production/child-parts') return 'Child Parts'
  if (pathname === '/production/machines') return 'Machines'
  if (pathname === '/production/osp') return 'OSP Tracking'
  if (pathname === '/production/rejection') return 'Rejection'
  if (pathname === '/production/rework/create') return 'Create Rework'
  if (pathname === '/production/entry') return 'Production Entry'

  // Inventory
  if (pathname === '/inventory/raw-materials') return 'Raw Materials Inventory'

  // Quality
  if (pathname === '/quality/rejections') return 'Quality Rejections'
  if (pathname === '/quality/rework') return 'Rework Orders'

  // MIS
  if (pathname === '/mis/executive') return 'Executive Dashboard'
  if (pathname === '/mis/production') return 'Production Analytics'
  if (pathname === '/mis/sales') return 'Sales Analytics'
  if (pathname === '/mis/agents') return 'Agent Performance'

  return 'Dashboard'
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname()
  const pageName = getPageName(pathname)

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-border bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        {/* Hamburger Menu Button - Now visible on all screens */}
        <button
          onClick={onMenuClick}
          className="text-primary hover:bg-primary/10 p-2 rounded-md -ml-2 transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div className="flex flex-1 items-center">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-primary truncate">{pageName}</h2>
        </div>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
              3
            </span>
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">Admin User</p>
                  <p className="text-xs text-muted-foreground">admin@multihitech.com</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
