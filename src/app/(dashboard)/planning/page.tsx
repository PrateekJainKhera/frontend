'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PlanningDashboardTab } from '@/components/planning/planning-dashboard-tab'
import { JobCardsTab } from '@/components/planning/job-cards-tab'

export default function PlanningPage() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="job-cards">Job Cards</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <PlanningDashboardTab />
        </TabsContent>

        <TabsContent value="job-cards" className="mt-6">
          <JobCardsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
