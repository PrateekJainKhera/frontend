"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Activity,
  Zap,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Wrench,
  BarChart3
} from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'
import { simulateApiCall } from '@/lib/utils/mock-api'

// Mock data
const machineUtilizationData = [
  { machine: 'CNC-01', utilization: 85, target: 90 },
  { machine: 'CNC-02', utilization: 92, target: 90 },
  { machine: 'VMC-01', utilization: 78, target: 85 },
  { machine: 'VMC-02', utilization: 88, target: 85 },
  { machine: 'Grinding-01', utilization: 95, target: 90 },
  { machine: 'Balancing-01', utilization: 72, target: 80 },
]

const productionTrendData = [
  { week: 'Week 1', completed: 18, target: 20, efficiency: 90 },
  { week: 'Week 2', completed: 22, target: 20, efficiency: 110 },
  { week: 'Week 3', completed: 19, target: 20, efficiency: 95 },
  { week: 'Week 4', completed: 24, target: 20, efficiency: 120 },
]

const processTimeData = [
  { process: 'CNC Turning', avgTime: 4.5, stdTime: 4.0 },
  { process: 'Grinding', avgTime: 3.2, stdTime: 3.0 },
  { process: 'Chrome Plating', avgTime: 6.8, stdTime: 6.0 },
  { process: 'Balancing', avgTime: 1.5, stdTime: 1.5 },
  { process: 'Assembly', avgTime: 2.3, stdTime: 2.0 },
]

const downtimeData = [
  { date: 'Mon', planned: 2, unplanned: 1 },
  { date: 'Tue', planned: 1, unplanned: 0 },
  { date: 'Wed', planned: 3, unplanned: 2 },
  { date: 'Thu', planned: 1, unplanned: 1 },
  { date: 'Fri', planned: 2, unplanned: 0 },
  { date: 'Sat', planned: 4, unplanned: 1 },
]

export default function ProductionDashboardPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    simulateApiCall(null, 1000).then(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="sr-only">Production Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Overall OEE
            </CardDescription>
            <CardTitle className="text-3xl text-green-600">87.5%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-green-600 font-semibold">+3.2%</span> from last week
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Avg Utilization
            </CardDescription>
            <CardTitle className="text-3xl text-blue-600">85%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">6 machines active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Active Jobs
            </CardDescription>
            <CardTitle className="text-3xl text-amber-600">24</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">8 in CNC, 6 in Grinding</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Downtime Today
            </CardDescription>
            <CardTitle className="text-3xl text-red-600">3.5 hrs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">2 planned, 1.5 unplanned</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="utilization" className="space-y-4">
        <TabsList>
          <TabsTrigger value="utilization">Machine Utilization</TabsTrigger>
          <TabsTrigger value="production">Production Trends</TabsTrigger>
          <TabsTrigger value="process">Process Time</TabsTrigger>
          <TabsTrigger value="downtime">Downtime Analysis</TabsTrigger>
        </TabsList>

        {/* Machine Utilization */}
        <TabsContent value="utilization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Machine Utilization vs Target</CardTitle>
              <CardDescription>Current utilization compared to target efficiency</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={machineUtilizationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="machine" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="utilization" fill="#3b82f6" name="Actual %" />
                  <Bar dataKey="target" fill="#94a3b8" name="Target %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Machine Status List */}
          <Card>
            <CardHeader>
              <CardTitle>Machine Status</CardTitle>
              <CardDescription>Real-time status of all machines</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {machineUtilizationData.map((machine) => (
                <div
                  key={machine.machine}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <Activity className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{machine.machine}</p>
                      <p className="text-xs text-muted-foreground">
                        Target: {machine.target}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={machine.utilization >= machine.target ? 'default' : 'secondary'}
                    >
                      {machine.utilization}%
                    </Badge>
                    {machine.utilization >= machine.target ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Production Trends */}
        <TabsContent value="production" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Production Performance</CardTitle>
              <CardDescription>Completed orders vs target with efficiency</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={productionTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 150]} />
                  <Tooltip />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="completed"
                    stackId="1"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.6}
                    name="Completed"
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="target"
                    stackId="2"
                    stroke="#94a3b8"
                    fill="#94a3b8"
                    fillOpacity={0.3}
                    name="Target"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="efficiency"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Efficiency %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Process Time */}
        <TabsContent value="process" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Average Process Time Analysis</CardTitle>
              <CardDescription>Actual vs standard time by process</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={processTimeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="process" type="category" width={120} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avgTime" fill="#3b82f6" name="Avg Time (hrs)" />
                  <Bar dataKey="stdTime" fill="#10b981" name="Std Time (hrs)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Downtime Analysis */}
        <TabsContent value="downtime" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Downtime Analysis</CardTitle>
              <CardDescription>Planned vs unplanned downtime hours</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={downtimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="planned" stackId="a" fill="#94a3b8" name="Planned (hrs)" />
                  <Bar dataKey="unplanned" stackId="a" fill="#ef4444" name="Unplanned (hrs)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
