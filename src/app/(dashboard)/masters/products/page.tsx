'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProductsTab } from '@/components/masters/products-tab'
import { ProductTemplatesTab } from '@/components/masters/product-templates-tab'
import { ChildPartTemplatesTab } from '@/components/masters/child-part-templates-tab'

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState('products')

  return (
    <div className="space-y-6 ">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="templates">Product Templates</TabsTrigger>
          <TabsTrigger value="child-parts">Child Part Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-6">
          <ProductsTab />
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <ProductTemplatesTab />
        </TabsContent>

        <TabsContent value="child-parts" className="mt-6">
          <ChildPartTemplatesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
