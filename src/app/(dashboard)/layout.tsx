"use client"

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { TopHeader } from '@/components/layout/top-header'
import { Menu } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  // Set initial expanded state based on screen size
  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth >= 1024
      setSidebarExpanded(isDesktop)
      setIsMobile(!isDesktop)
    }

    // Set initial state
    handleResize()

    // Listen for window resize
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleSidebarOpen = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const toggleSidebarExpanded = () => {
    setSidebarExpanded(!sidebarExpanded)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar
        isOpen={sidebarOpen}
        isExpanded={sidebarExpanded}
        onClose={toggleSidebarOpen}
        onToggle={toggleSidebarExpanded}
        isMobile={isMobile}
      />

      {/* Main content */}
      <div
        className={`flex flex-1 flex-col overflow-hidden transition-all duration-300 ease-in-out ${
          sidebarOpen ? (sidebarExpanded ? 'ml-72' : 'ml-16') : 'ml-0'
        }`}
      >
        {/* Top Header */}
        <TopHeader sidebarOpen={sidebarOpen} sidebarExpanded={sidebarExpanded} />

        {/* Mobile menu button - only visible when sidebar is closed */}
        {!sidebarOpen && (
          <button
            onClick={toggleSidebarOpen}
            className="fixed top-4 left-4 z-30 text-primary hover:bg-primary/10 bg-white p-3 rounded-lg shadow-lg transition-all hover:shadow-xl"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        )}

        <main className="flex-1 overflow-x-auto overflow-y-auto scrollbar-hide">
          <div className="p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
