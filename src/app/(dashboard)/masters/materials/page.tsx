'use client'

import { useState } from 'react'
import { Search, Mic } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RawMaterialsTab } from '@/components/masters/raw-materials-tab'
import { ComponentsTab } from '@/components/masters/components-tab'
import { MaterialCategoriesTab } from '@/components/masters/material-categories-tab'

export default function MaterialsPage() {
  const [activeTab, setActiveTab] = useState('raw-materials')
  const [searchQuery, setSearchQuery] = useState('')

  const handleMicClick = () => {
    alert('Voice search feature coming soon!')
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Tabs and Search on same row */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList className="grid max-w-lg grid-cols-3">
            <TabsTrigger value="raw-materials">Raw Materials</TabsTrigger>
            <TabsTrigger value="components">Components</TabsTrigger>
            <TabsTrigger value="categories">Material Categories</TabsTrigger>
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

        <TabsContent value="raw-materials" className="mt-4">
          <RawMaterialsTab searchQuery={searchQuery} />
        </TabsContent>

        <TabsContent value="components" className="mt-4">
          <ComponentsTab />
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <MaterialCategoriesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
