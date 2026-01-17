'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RawMaterialsTab } from '@/components/masters/raw-materials-tab'
import { ComponentsTab } from '@/components/masters/components-tab'
import { MaterialCategoriesTab } from '@/components/masters/material-categories-tab'

export default function MaterialsPage() {
  const [activeTab, setActiveTab] = useState('raw-materials')

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="raw-materials">Raw Materials</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="categories">Material Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="raw-materials" className="mt-6">
          <RawMaterialsTab />
        </TabsContent>

        <TabsContent value="components" className="mt-6">
          <ComponentsTab />
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <MaterialCategoriesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
