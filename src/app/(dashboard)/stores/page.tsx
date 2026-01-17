'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MaterialRequisitionsTab } from '@/components/stores/material-requisitions-tab'
import { MaterialIssuesTab } from '@/components/stores/material-issues-tab'

export default function StoresPage() {
  const [activeTab, setActiveTab] = useState('requisitions')

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="requisitions">Material Requisitions</TabsTrigger>
          <TabsTrigger value="issues">Material Issues</TabsTrigger>
        </TabsList>

        <TabsContent value="requisitions" className="mt-6">
          <MaterialRequisitionsTab />
        </TabsContent>

        <TabsContent value="issues" className="mt-6">
          <MaterialIssuesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
