'use client'

import { useState } from 'react'
import { Search, Mic } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProductsTab } from '@/components/masters/products-tab'
import { ProductTemplatesTab } from '@/components/masters/product-templates-tab'
import { ChildPartTemplatesTab } from '@/components/masters/child-part-templates-tab'

export default function ProductsPage() {
  const [activeTab, setActiveTab] = useState('products')
  const [searchQuery, setSearchQuery] = useState('')

  const handleMicClick = () => {
    alert('Voice search feature coming soon!')
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Tabs and Search on same row */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList className="grid max-w-md grid-cols-3">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="templates">Product Templates</TabsTrigger>
            <TabsTrigger value="child-parts">Child Part Templates</TabsTrigger>
          </TabsList>

          {/* Search Bar next to Tabs */}
          <div className="flex items-center gap-2 bg-background border-2 border-border rounded-lg px-4 py-1 shadow-sm flex-1 max-w-md">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 shadow-none focus-visible:ring-0 h-8 px-0 text-sm flex-1 placeholder:text-muted-foreground/40 focus:placeholder:text-transparent caret-foreground"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={handleMicClick}
              title="Voice search"
            >
              <Mic className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>

        <TabsContent value="products" className="mt-4">
          <ProductsTab searchQuery={searchQuery} />
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <ProductTemplatesTab />
        </TabsContent>

        <TabsContent value="child-parts" className="mt-4">
          <ChildPartTemplatesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
