"use client"

import { usePathname } from 'next/navigation'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// Map of routes to page titles
const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/masters/customers': 'Customer Master',
  '/masters/products': 'Product / Part Master',
  '/masters/product-templates': 'Product Templates',
  '/masters/product-templates/create': 'Create Product Template',
  '/masters/raw-materials': 'Raw Material Master',
  '/masters/components': 'Components & Parts',
  '/masters/processes': 'Process Master',
  '/masters/process-templates': 'Process Templates',
  '/masters/process-templates/create': 'Create Process Template',
  '/masters/machines': 'Machines Master',
  '/drawing-review': 'Drawing Review',
  '/scheduling': 'Scheduling Dashboard',
  '/stores': 'Stores',
  '/orders': 'Orders',
  '/orders/create': 'Create New Order',
  '/orders/live-tracking': 'Live Order Tracking',
  '/production/job-cards': 'Job Cards',
  '/production/job-cards/create': 'Create Job Card',
  '/production/child-parts': 'Child Part Production Dashboard',
  '/production/machines': 'Machine Load Overview',
  '/production/osp': 'Outsource (OSP) Tracking',
  '/production/entry': 'Production Entry',
  '/production/rejection': 'Rejection Entry',
  '/inventory/raw-materials': 'Raw Material Inventory',
  '/quality/rejections': 'Rejection Records',
  '/quality/rework': 'Rework Orders',
  '/mis/executive': 'Executive Dashboard',
  '/mis/production': 'Production Dashboard',
  '/mis/sales': 'Sales Dashboard',
  '/mis/agents': 'Agent Performance Dashboard',
}

// Map of routes to page descriptions (for info tooltip)
const pageDescriptions: Record<string, string> = {
  '/orders': 'Manage customer orders and track production progress. View all orders, monitor live tracking, and create new orders.',
  '/masters/products': 'Manage products, templates, and child part configurations. Create and organize your product catalog.',
  '/masters/materials': 'Manage raw materials, components, and material categories. Track inventory, GRN entries, and material specifications.',
  '/masters/processes': 'Manage manufacturing processes and process templates. Define process flows and standard operating procedures.',
  '/masters/machines': 'Manage factory machines, maintenance schedules, and specifications. Track machine status, utilization, and upcoming maintenance.',
  '/drawing-review': 'Review customer drawings and link product templates before releasing orders to planning. Approve or request revisions for drawings.',
  '/planning': 'Generate job cards for approved orders and monitor material availability. Track planning progress and manage job card generation workflow.',
  '/scheduling': 'Review planned job cards and release them to production. Monitor material availability, dependencies, and send ready job cards to the shop floor.',
  '/stores': 'Manage material requisitions and issues from stores to production. Allocate materials, track issued quantities, and monitor inventory movements.',
}

interface TopHeaderProps {
  sidebarOpen: boolean
  sidebarExpanded: boolean
}

export function TopHeader({ sidebarOpen, sidebarExpanded }: TopHeaderProps) {
  const pathname = usePathname()

  // Get the page title from the mapping, or extract from path
  const getPageTitle = () => {
    // Check for exact match first
    if (pageTitles[pathname]) {
      return pageTitles[pathname]
    }

    // Check for dynamic routes (e.g., /orders/123, /masters/products/456)
    if (pathname.match(/\/orders\/\d+/)) return 'Order Details'
    if (pathname.match(/\/production\/job-cards\/\d+/)) return 'Job Card Details'
    if (pathname.match(/\/production\/child-parts\/\d+/)) return 'Child Part Details'
    if (pathname.match(/\/masters\/products\/\d+/)) return 'Product Details'
    if (pathname.match(/\/masters\/process-templates\/[^/]+$/)) return 'Process Template Details'

    // Default: capitalize path segments
    const segments = pathname.split('/').filter(Boolean)
    return segments[segments.length - 1]
      ?.split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') || 'Dashboard'
  }

  const pageDescription = pageDescriptions[pathname]

  return (
    <header className="sticky top-0 z-40 h-16 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex h-full items-center px-6 gap-2">
        <h1 className="text-2xl font-bold text-primary">{getPageTitle()}</h1>
        {pageDescription && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Info className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p>{pageDescription}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </header>
  )
}
