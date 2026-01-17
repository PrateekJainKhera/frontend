'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { AllOrdersTab } from '@/components/orders/all-orders-tab'
import { LiveTrackingTab } from '@/components/orders/live-tracking-tab'

export default function OrdersPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('all-orders')

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="all-orders">All Orders</TabsTrigger>
          <TabsTrigger value="live-tracking">Live Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="all-orders" className="mt-6">
          <AllOrdersTab />
        </TabsContent>

        <TabsContent value="live-tracking" className="mt-6">
          <LiveTrackingTab />
        </TabsContent>
      </Tabs>

      {/* Floating Action Button - Create Order */}
      <Button
        onClick={() => router.push('/orders/create')}
        className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  )
}
