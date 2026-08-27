"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import {
  Package,
  ShoppingCart,
  Factory,
  Database,
  Home,
  SlidersHorizontal,
  Warehouse,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Calendar,
  PackageCheck,
  FileText,
  Truck,
  PackageMinus,
  PackagePlus,
  Store,
  ClipboardList,
  Scissors,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Users,
  Settings,
  XCircle,
  RotateCcw,
  BarChart3,
  History
} from 'lucide-react'
import { warehouseService } from '@/lib/api/warehouses'
import { canView, canViewMenu } from '@/lib/auth'
import { BrandLogo } from '@/components/layout/brand-logo'

// Visibility: a submenu is shown when the role can view its own route (falling
// back to the parent module for roles that predate submenu permissions).
const childVisible = (item: NavItem, child: NavItem) => canViewMenu(child.href, item.module)
const itemVisible = (item: NavItem): boolean => {
  if (!item.module) return true // ungated items (e.g. Dashboard landing)
  if (item.children && item.children.length > 0) {
    return canView(item.module) || item.children.some((c) => childVisible(item, c))
  }
  return canViewMenu(item.href, item.module)
}

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  children?: NavItem[]
  module?: string  // if set, item is hidden when user lacks View permission for this module
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
    module: 'Masters',
    children: [
      { title: 'Customers', href: '/masters/customers', icon: Package },
      { title: 'Products', href: '/masters/products', icon: Package },
      { title: 'Materials', href: '/masters/materials', icon: Package },
      { title: 'Processes', href: '/masters/processes', icon: Package },
      { title: 'Drawings', href: '/masters/drawings', icon: Package },
      { title: 'Machines', href: '/masters/machines', icon: Factory },
      { title: 'Operators', href: '/masters/operators', icon: Users },
      { title: 'Vendors', href: '/masters/vendors', icon: Store },
      { title: 'Shifts', href: '/masters/shifts', icon: Clock },
      { title: 'Configurations', href: '/masters/configurations', icon: SlidersHorizontal },
    ]
  },
  {
    title: 'Sales',
    href: '/sales',
    icon: FileText,
    module: 'Sales',
    children: [
      { title: 'Estimations', href: '/sales/estimations', icon: FileText }
    ]
  },
  {
    title: 'Orders',
    href: '/orders',
    icon: ShoppingCart,
    module: 'Sales',
  },
  {
    title: 'Procurement',
    href: '/procurement',
    icon: ClipboardList,
    module: 'Procurement',
    children: [
      { title: 'Purchase Requests', href: '/procurement/purchase-requests', icon: FileText },
      { title: 'Purchase Orders', href: '/procurement/purchase-orders', icon: Truck }
    ]
  },
  {
    title: 'Drawing Review',
    href: '/drawing-review',
    icon: FileText,
    module: 'Planning',
  },
  {
    title: 'Planning',
    href: '/planning',
    icon: Calendar,
    module: 'Planning',
  },
  {
    title: 'Scheduling',
    href: '/scheduling',
    icon: Calendar,
    module: 'Planning',
    children: [
      { title: 'Board', href: '/scheduling', icon: Calendar },
      { title: 'Machine Utilization', href: '/scheduling/machine-utilization', icon: Calendar },
    ]
  },
  {
    title: 'Production',
    href: '/production',
    icon: Factory,
    module: 'Production',
    children: [
      { title: 'Dashboard', href: '/production', icon: Factory },
      { title: 'Execution', href: '/production/execution', icon: Factory },
      { title: 'OSP Tracking', href: '/production/osp', icon: Factory },
      { title: 'Rework Approval', href: '/production/rework', icon: Factory }
    ]
  },
  {
    title: 'Inventory',
    href: '/inventory',
    icon: Warehouse,
    module: 'Inventory',
    children: [
      { title: 'Raw Materials', href: '/inventory/raw-materials', icon: Package },
      { title: 'Material Pieces', href: '/inventory/material-pieces', icon: PackageCheck },
      { title: 'Requisitions', href: '/inventory/material-requisitions', icon: FileText },
      { title: 'Receive Components', href: '/inventory/receive-components', icon: PackageCheck },
      { title: 'Issue to Shop Floor', href: '/inventory/component-issue', icon: PackageMinus },
      { title: 'Consume Components', href: '/inventory/component-consume', icon: PackageMinus },
      { title: 'Stock Reconcile', href: '/inventory/reconcile', icon: PackageCheck },
      { title: 'Wastage & Scrap Sales', href: '/inventory/wastage', icon: PackageMinus },
      { title: 'Warehouses', href: '/inventory/warehouses', icon: Warehouse },
      { title: 'GRN Approvals', href: '/inventory/grn-approvals', icon: ShieldAlert }
    ]
  },
  {
    title: 'Stores',
    href: '/stores',
    icon: PackageCheck,
    module: 'Stores',
    children: [
      { title: 'Cutting Planning', href: '/stores/cutting-planning', icon: Scissors },
      { title: 'Issue List', href: '/stores/issue-list', icon: PackageCheck },
      { title: 'Opening Stock', href: '/stores/opening-stock', icon: PackagePlus }
    ]
  },
  {
    title: 'Dispatch',
    href: '/dispatch',
    icon: Truck,
    module: 'Dispatch',
  },
  {
    title: 'Quality',
    href: '/quality',
    icon: XCircle,
    module: 'Quality',
    children: [
      { title: 'Quality Check (QC)', href: '/quality/qc', icon: ShieldCheck },
      { title: 'Rejections', href: '/quality/rejections', icon: XCircle },
      // Rework approval lives in Production — link to the real page
      { title: 'Rework Approval', href: '/production/rework', icon: RotateCcw }
    ]
  },
  {
    title: 'MIS',
    href: '/mis',
    icon: BarChart3,
    module: 'Reports',
    children: [
      { title: 'Executive', href: '/mis/executive', icon: BarChart3 },
      { title: 'Machine Models', href: '/mis/machine-models', icon: BarChart3 },
      { title: 'Production', href: '/mis/production', icon: BarChart3 },
      { title: 'Sales', href: '/mis/sales', icon: BarChart3 },
      { title: 'Agent Performance', href: '/mis/agents', icon: BarChart3 }
    ]
  },
  {
    title: 'Admin',
    href: '/admin',
    icon: ShieldCheck,
    module: 'Admin',
    children: [
      { title: 'Users', href: '/admin/users', icon: Users },
      { title: 'Roles & Permissions', href: '/admin/roles', icon: ShieldCheck },
      { title: 'Audit Log', href: '/admin/audit', icon: History },
      { title: 'System Settings', href: '/admin/settings', icon: Settings }
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
  const [lowStockCount, setLowStockCount] = useState(0)

  useEffect(() => {
    warehouseService.getLowStockStatus()
      .then(alerts => setLowStockCount(alerts.filter(a => a.isAlert).length))
      .catch(() => { /* non-critical — silently ignore */ })
  }, [])

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
        isExpanded ? "w-60" : "w-14",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header with toggle button */}
        <div className={cn(
          "flex h-12 shrink-0 items-center border-b border-sidebar-border transition-all duration-300",
          isExpanded ? "justify-between px-4" : "justify-center px-2"
        )}>
          {isExpanded && (
            <BrandLogo
              className="h-8 w-auto max-w-[178px] object-contain"
              fallback={<h1 className="text-base font-bold text-sidebar-foreground tracking-tight">MULTI HITECH</h1>}
            />
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
          isExpanded ? "px-3" : "px-2"
        )}>
          <ul role="list" className="space-y-1">
              {navItems.filter(itemVisible).map((item) => (
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
                              {item.href === '/inventory' && lowStockCount > 0 && (
                                <span className="ml-1 inline-flex items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-bold leading-none h-4 min-w-[1rem] px-1">
                                  {lowStockCount}
                                </span>
                              )}
                            </div>
                            {expandedItems.includes(item.href) ? (
                              <ChevronDown className="h-4 w-4 shrink-0" />
                            ) : (
                              <ChevronRight className="h-4 w-4 shrink-0" />
                            )}
                          </button>
                          {expandedItems.includes(item.href) && (
                            <ul className="mt-1 ml-4 space-y-1">
                              {item.children.filter((child) => childVisible(item, child)).map((child) => (
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
