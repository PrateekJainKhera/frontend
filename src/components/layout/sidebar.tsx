"use client"

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import {
  Package,
  ShoppingCart,
  Factory,
  Database,
  XCircle,
  RotateCcw,
  BarChart3,
  Home,
  Warehouse,
  ChevronLeft,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  children?: NavItem[]
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    icon: Home
  },
  {
    title: 'Masters',
    href: '/masters',
    icon: Database,
    children: [
      { title: 'Customers', href: '/masters/customers', icon: Package },
      { title: 'Products', href: '/masters/products', icon: Package },
      { title: 'Raw Materials', href: '/masters/raw-materials', icon: Package },
      { title: 'Components', href: '/masters/components', icon: Package },
      { title: 'Processes', href: '/masters/processes', icon: Package },
      { title: 'Process Templates', href: '/masters/process-templates', icon: Package }
    ]
  },
  {
    title: 'Orders',
    href: '/orders',
    icon: ShoppingCart,
    children: [
      { title: 'All Orders', href: '/orders', icon: ShoppingCart },
      { title: 'Create Order', href: '/orders/create', icon: ShoppingCart },
      { title: 'Live Tracking', href: '/orders/live-tracking', icon: ShoppingCart }
    ]
  },
  {
    title: 'Production',
    href: '/production',
    icon: Factory,
    children: [
      { title: 'Job Cards', href: '/production/job-cards', icon: Factory },
      { title: 'Child Parts', href: '/production/child-parts', icon: Factory },
      { title: 'Machines', href: '/production/machines', icon: Factory },
      { title: 'OSP Tracking', href: '/production/osp', icon: Factory }
    ]
  },
  {
    title: 'Inventory',
    href: '/inventory',
    icon: Warehouse,
    children: [
      { title: 'Raw Materials', href: '/inventory/raw-materials', icon: Package }
    ]
  },
  {
    title: 'Quality',
    href: '/quality',
    icon: XCircle,
    children: [
      { title: 'Rejections', href: '/quality/rejections', icon: XCircle },
      { title: 'Rework Orders', href: '/quality/rework', icon: RotateCcw }
    ]
  },
  {
    title: 'MIS',
    href: '/mis',
    icon: BarChart3,
    children: [
      { title: 'Executive', href: '/mis/executive', icon: BarChart3 },
      { title: 'Production', href: '/mis/production', icon: BarChart3 },
      { title: 'Sales', href: '/mis/sales', icon: BarChart3 },
      { title: 'Agent Performance', href: '/mis/agents', icon: BarChart3 }
    ]
  }
]

interface SidebarProps {
  isOpen: boolean
  isExpanded: boolean
  onClose: () => void
  onToggle: () => void
  isMobile?: boolean
}

export function Sidebar({ isOpen, isExpanded, onClose, onToggle, isMobile = false }: SidebarProps) {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>(() => {
    // Auto-expand the section that contains the current page
    const activeSection = navItems.find(item =>
      item.children?.some(child => pathname.startsWith(child.href))
    )
    return activeSection ? [activeSection.href] : []
  })

  const toggleItem = (href: string) => {
    if (!isExpanded) return // Don't allow dropdown toggling when collapsed
    setExpandedItems(prev =>
      prev.includes(href)
        ? prev.filter(item => item !== href)
        : [...prev, href]
    )
  }

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar shadow-xl transition-all duration-300 ease-in-out",
        isExpanded ? "w-72" : "w-16",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header with toggle button */}
        <div className={cn(
          "flex h-16 shrink-0 items-center border-b border-sidebar-border transition-all duration-300",
          isExpanded ? "justify-between px-6" : "justify-center px-2"
        )}>
          {isExpanded && (
            <h1 className="text-xl lg:text-2xl font-bold text-sidebar-foreground">MultiHitech ERP</h1>
          )}
          {/* Toggle button - expands/collapses sidebar */}
          <button
            onClick={onToggle}
            className="text-sidebar-foreground hover:bg-sidebar-accent p-2 rounded-md transition-colors"
            aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isExpanded ? (
              <ChevronLeft className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Navigation - Scrollable area */}
        <nav className={cn(
          "flex-1 overflow-y-auto scrollbar-hide py-4 transition-all duration-300",
          isExpanded ? "px-6" : "px-2"
        )}>
          <ul role="list" className="space-y-1">
              {navItems.map((item) => (
                <li key={item.href}>
                  {item.children ? (
                    <>
                      {isExpanded ? (
                        <>
                          <button
                            onClick={() => toggleItem(item.href)}
                            className={cn(
                              "w-full group flex items-center justify-between gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 transition-colors",
                              pathname.startsWith(item.href) && item.href !== '/'
                                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                            )}
                          >
                            <div className="flex items-center gap-x-3">
                              <item.icon className="h-5 w-5 shrink-0" />
                              {item.title}
                            </div>
                            {expandedItems.includes(item.href) ? (
                              <ChevronDown className="h-4 w-4 shrink-0" />
                            ) : (
                              <ChevronRight className="h-4 w-4 shrink-0" />
                            )}
                          </button>
                          {expandedItems.includes(item.href) && (
                            <ul className="mt-1 ml-4 space-y-1">
                              {item.children.map((child) => (
                                <li key={child.href}>
                                  <NavLink item={child} pathname={pathname} isChild onClick={isMobile ? onClose : undefined} isExpanded={isExpanded} />
                                </li>
                              ))}
                            </ul>
                          )}
                        </>
                      ) : (
                        <NavLink item={item} pathname={pathname} onClick={isMobile ? onClose : undefined} isExpanded={isExpanded} />
                      )}
                    </>
                  ) : (
                    <NavLink item={item} pathname={pathname} onClick={isMobile ? onClose : undefined} isExpanded={isExpanded} />
                  )}
                </li>
              ))}
            </ul>
        </nav>
      </div>
    </aside>
  )
}

function NavLink({
  item,
  pathname,
  isChild = false,
  onClick,
  isExpanded = true
}: {
  item: NavItem
  pathname: string
  isChild?: boolean
  onClick?: () => void
  isExpanded?: boolean
}) {
  const Icon = item.icon
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        isActive
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
        'group flex rounded-md p-2 text-sm font-semibold leading-6 transition-colors',
        isExpanded ? 'gap-x-3' : 'justify-center',
        isChild && 'text-xs'
      )}
      title={!isExpanded ? item.title : undefined}
    >
      <Icon className={cn('h-5 w-5 shrink-0', isChild && 'h-4 w-4')} />
      {isExpanded && item.title}
    </Link>
  )
}
