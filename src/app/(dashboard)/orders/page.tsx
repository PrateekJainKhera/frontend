'use client'

import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AllOrdersTab } from '@/components/orders/all-orders-tab'

export default function OrdersPage() {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <AllOrdersTab />

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
