"use client"

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
  Home
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
      { title: 'Job Cards', href: '/production/job-cards', icon: Factory }
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
      { title: 'Sales', href: '/mis/sales', icon: BarChart3 }
    ]
  }
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 z-50 flex w-72 flex-col bg-primary">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto px-6 pb-4">
        <div className="flex h-16 shrink-0 items-center border-b border-primary-foreground/10">
          <h1 className="text-2xl font-bold text-primary-foreground">MultiHitech ERP</h1>
        </div>
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <NavLink item={item} pathname={pathname} />
                    {item.children && (
                      <ul className="mt-1 ml-4 space-y-1">
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <NavLink item={child} pathname={pathname} isChild />
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    </aside>
  )
}

function NavLink({
  item,
  pathname,
  isChild = false
}: {
  item: NavItem
  pathname: string
  isChild?: boolean
}) {
  const Icon = item.icon
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

  return (
    <Link
      href={item.href}
      className={cn(
        isActive
          ? 'bg-primary-foreground/20 text-primary-foreground'
          : 'text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground',
        'group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 transition-colors',
        isChild && 'text-xs'
      )}
    >
      <Icon className={cn('h-5 w-5 shrink-0', isChild && 'h-4 w-4')} />
      {item.title}
    </Link>
  )
}
