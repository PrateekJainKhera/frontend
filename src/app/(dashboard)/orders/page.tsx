'use client'

import { useRouter } from 'next/navigation'
import { Plus, FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AllOrdersTab } from '@/components/orders/all-orders-tab'

export default function OrdersPage() {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <AllOrdersTab />

      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-3">
        <Button
          onClick={() => router.push('/orders/import')}
          variant="outline"
          className="h-11 gap-2 rounded-full shadow-lg bg-background hover:shadow-xl transition-all"
        >
          <FileSpreadsheet className="h-4 w-4" /> Import Excel
        </Button>
        <Button
          onClick={() => router.push('/orders/create')}
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all"
          size="icon"
          title="New Order"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  )
}
