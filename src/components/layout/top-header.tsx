"use client"

import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'

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

  return (
    <header className="sticky top-0 z-40 h-16 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex h-full items-center px-6">
        <h1 className="text-2xl font-bold text-primary">{getPageTitle()}</h1>
      </div>
    </header>
  )
}
