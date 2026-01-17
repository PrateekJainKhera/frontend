'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProcessesTab } from '@/components/masters/processes-tab'
import { ProcessTemplatesTab } from '@/components/masters/process-templates-tab'

export default function ProcessesPage() {
  const [activeTab, setActiveTab] = useState('processes')

  return (
    <div className="space-y-6 ">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="processes">Processes</TabsTrigger>
          <TabsTrigger value="templates">Process Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="processes" className="mt-6">
          <ProcessesTab />
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <ProcessTemplatesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
