"use client"

import { usePathname } from 'next/navigation'
import { Info } from 'lucide-react'
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
  // Masters
  '/masters/customers': 'Customers',
  '/masters/customers/create': 'New Customer',
  '/masters/products': 'Products & Parts',
  '/masters/products/create': 'New Product',
  '/masters/product-templates': 'Product Templates',
  '/masters/product-templates/create': 'New Product Template',
  '/masters/raw-materials': 'Raw Materials',
  '/masters/materials': 'Materials',
  '/masters/components': 'Components & Parts',
  '/masters/processes': 'Processes',
  '/masters/processes/create': 'New Process',
  '/masters/process-templates': 'Process Templates',
  '/masters/process-templates/create': 'New Process Template',
  '/masters/machines': 'Machines',
  '/masters/machines/create': 'New Machine',
  '/masters/drawings': 'Drawings',
  '/masters/suppliers': 'Suppliers',
  '/masters/operators': 'Operators',
  // Orders
  '/orders': 'Orders',
  '/orders/create': 'New Order',
  '/orders/live-tracking': 'Live Order Tracking',
  // Drawing Review
  '/drawing-review': 'Drawing Review',
  // Planning
  '/planning': 'Planning',
  '/planning/generate': 'Generate Job Cards',
  // Scheduling
  '/scheduling': 'Scheduling',
  // Production
  '/production': 'Production',
  '/production/job-cards': 'Job Cards',
  '/production/job-cards/create': 'New Job Card',
  '/production/child-parts': 'Child Parts',
  '/production/machines': 'Machine Load',
  '/production/osp': 'OSP Tracking',
  '/production/entry': 'Production Entry',
  '/production/rejection': 'Rejection Entry',
  // Inventory
  '/inventory': 'Inventory',
  '/inventory/raw-materials': 'Raw Material Inventory',
  '/inventory/material-pieces': 'Material Pieces',
  '/inventory/material-requisitions': 'Material Requisitions',
  '/inventory/receive-components': 'Receive Components',
  // Stores
  '/stores': 'Stores',
  // Dispatch
  '/dispatch': 'Dispatch',
  // Quality
  '/quality': 'Quality',
  '/quality/rejections': 'Rejections',
  '/quality/rework': 'Rework Orders',
  // MIS
  '/mis': 'MIS Reports',
  '/mis/executive': 'Executive Dashboard',
  '/mis/production': 'Production Dashboard',
  '/mis/sales': 'Sales Dashboard',
  '/mis/agents': 'Agent Performance',
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

export function TopHeader(_props: TopHeaderProps) {
  const pathname = usePathname()

  // Get the page title from the mapping, or extract from path
  const getPageTitle = () => {
    // Check for exact match first
    if (pageTitles[pathname]) {
      return pageTitles[pathname]
    }

    // For dynamic routes with IDs — strip the ID and look up parent module
    // e.g. /orders/123 → look up /orders → "Orders"
    const withoutTrailingId = pathname.replace(/\/\d+$/, '')
    if (withoutTrailingId !== pathname && pageTitles[withoutTrailingId]) {
      return pageTitles[withoutTrailingId]
    }

    // Check for slug/string dynamic segments (e.g., /masters/process-templates/some-slug)
    const withoutLastSegment = pathname.replace(/\/[^/]+$/, '')
    if (withoutLastSegment !== pathname && pageTitles[withoutLastSegment]) {
      return pageTitles[withoutLastSegment]
    }

    // Default: capitalize path segments (never show raw numbers)
    const segments = pathname.split('/').filter(Boolean)
    const lastSegment = segments[segments.length - 1]
    // If last segment is a number, use the second-to-last segment
    const displaySegment = /^\d+$/.test(lastSegment) && segments.length > 1
      ? segments[segments.length - 2]
      : lastSegment
    return displaySegment
      ?.split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') || 'Dashboard'
  }

  const pageDescription = pageDescriptions[pathname]

  return (
    <header className="sticky top-0 z-40 h-12 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex h-full items-center px-4 gap-2">
        <h1 className="text-lg font-bold text-primary">{getPageTitle()}</h1>
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
