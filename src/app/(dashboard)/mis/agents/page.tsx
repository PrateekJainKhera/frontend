"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  DollarSign,
  TrendingUp,
  Users,
  ShoppingCart,
  Target,
  Award,
  Package
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
  ComposedChart
} from 'recharts'
import { simulateApiCall } from '@/lib/utils/mock-api'
import { mockOrders, mockCustomers } from '@/lib/mock-data'
import { OrderSource } from '@/types'

export default function AgentPerformancePage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    simulateApiCall(null, 1000).then(() => setLoading(false))
  }, [])

  // Calculate agent metrics from orders
  const agentOrders = mockOrders.filter(order => order.orderSource === OrderSource.AGENT)
  const agentCustomers = mockCustomers.filter(c => c.isAgent)

  // Agent performance data
  const agentPerformanceData = agentCustomers.map(agent => {
    const agentOrderList = agentOrders.filter(order => order.agentCustomerId === agent.id)
    const totalCommission = agentOrderList.reduce((sum, order) => sum + (order.agentCommission || 0), 0)
    const totalOrders = agentOrderList.length
    const avgCommission = totalOrders > 0 ? totalCommission / totalOrders : 0

    return {
      id: agent.id,
      name: agent.name,
      contactPerson: agent.contactPerson,
      commissionPercent: agent.commissionPercent || 0,
      totalOrders,
      totalCommission,
      avgCommission,
      creditLimit: agent.creditLimit || 0
    }
  })

  // Sort by total commission
  const sortedAgents = [...agentPerformanceData].sort((a, b) => b.totalCommission - a.totalCommission)

  // Monthly trend data (mock)
  const monthlyTrendData = [
    { month: 'Jan', commission: 8500, orders: 3 },
    { month: 'Feb', commission: 12000, orders: 5 },
    { month: 'Mar', commission: 9250, orders: 4 },
    { month: 'Apr', commission: 15000, orders: 6 },
    { month: 'May', commission: 11500, orders: 5 },
    { month: 'Jun', commission: 18350, orders: 8 },
  ]

  // Calculate totals
  const totalAgentOrders = agentOrders.length
  const totalCommissions = agentOrders.reduce((sum, order) => sum + (order.agentCommission || 0), 0)
  const avgCommissionPerOrder = totalAgentOrders > 0 ? totalCommissions / totalAgentOrders : 0
  const activeAgents = agentCustomers.length

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
      <h1 className="sr-only">Agent Performance Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Commissions
            </CardDescription>
            <CardTitle className="text-3xl text-green-600">
              ₹{totalCommissions.toLocaleString('en-IN')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-green-600 font-semibold">+24.5%</span> vs last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Active Agents
            </CardDescription>
            <CardTitle className="text-3xl text-blue-600">{activeAgents}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Award className="h-4 w-4 text-blue-600" />
              <span>All performing well</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Agent Orders
            </CardDescription>
            <CardTitle className="text-3xl text-amber-600">{totalAgentOrders}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Package className="h-4 w-4" />
              <span>{((totalAgentOrders / mockOrders.length) * 100).toFixed(1)}% of total orders</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Avg Commission/Order
            </CardDescription>
            <CardTitle className="text-3xl text-purple-600">
              ₹{Math.round(avgCommissionPerOrder).toLocaleString('en-IN')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span>Based on {totalAgentOrders} orders</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Agent Performance</TabsTrigger>
          <TabsTrigger value="trends">Commission Trends</TabsTrigger>
          <TabsTrigger value="comparison">Agent Comparison</TabsTrigger>
        </TabsList>

        {/* Agent Performance */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Individual Agent Performance</CardTitle>
              <CardDescription>Detailed breakdown of each agent's contribution</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sortedAgents.map((agent, idx) => (
                <div
                  key={agent.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{agent.name}</p>
                      <p className="text-sm text-muted-foreground">{agent.contactPerson}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {agent.commissionPercent}% commission
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {agent.totalOrders} orders
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      ₹{agent.totalCommission.toLocaleString('en-IN')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Avg: ₹{Math.round(agent.avgCommission).toLocaleString('en-IN')}/order
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Credit Limit: ₹{agent.creditLimit.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              ))}

              {sortedAgents.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No agent data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commission Trends */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Commission & Order Trends</CardTitle>
              <CardDescription>Monthly commission earnings and order volume</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="commission" fill="#10b981" name="Commission (₹)" />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="orders"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Orders"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Peak Month</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary">June</p>
                <p className="text-sm text-muted-foreground">
                  ₹18,350 in commissions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Growth Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">+24.5%</p>
                <p className="text-sm text-muted-foreground">
                  Month-over-month average
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Total YTD</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary">₹74,600</p>
                <p className="text-sm text-muted-foreground">
                  Commissions paid out
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Agent Comparison */}
        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Commission Comparison</CardTitle>
              <CardDescription>Side-by-side performance comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={sortedAgents}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalCommission" fill="#10b981" name="Total Commission (₹)" />
                  <Bar dataKey="totalOrders" fill="#3b82f6" name="Total Orders" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedAgents.map((agent) => (
              <Card key={agent.id}>
                <CardHeader>
                  <CardTitle className="text-base">{agent.name}</CardTitle>
                  <CardDescription>{agent.contactPerson}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Commission Rate:</span>
                    <Badge variant="outline">{agent.commissionPercent}%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Orders:</span>
                    <span className="font-semibold">{agent.totalOrders}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Commission:</span>
                    <span className="font-bold text-green-600">
                      ₹{agent.totalCommission.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Avg per Order:</span>
                    <span className="font-semibold">
                      ₹{Math.round(agent.avgCommission).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Credit Limit:</span>
                      <span className="font-semibold">
                        ₹{agent.creditLimit.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
