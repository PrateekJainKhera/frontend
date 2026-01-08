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
  AlertTriangle,
  Calendar
} from 'lucide-react'
import {
  BarChart,
  Bar,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart
} from 'recharts'
import { simulateApiCall } from '@/lib/utils/mock-api'

// Mock data
const salesTrendData = [
  { month: 'Jan', revenue: 45000, orders: 12, avgValue: 3750 },
  { month: 'Feb', revenue: 52000, orders: 15, avgValue: 3467 },
  { month: 'Mar', revenue: 48000, orders: 13, avgValue: 3692 },
  { month: 'Apr', revenue: 61000, orders: 18, avgValue: 3389 },
  { month: 'May', revenue: 55000, orders: 16, avgValue: 3438 },
  { month: 'Jun', revenue: 67000, orders: 20, avgValue: 3350 },
]

const topCustomersData = [
  { customer: 'ABC Industries', orders: 15, revenue: 45000 },
  { customer: 'XYZ Manufacturing', orders: 12, revenue: 38000 },
  { customer: 'Global Prints Ltd', orders: 10, revenue: 32000 },
  { customer: 'Mega Corp', orders: 8, revenue: 28000 },
  { customer: 'Tech Solutions', orders: 7, revenue: 24000 },
]

const orderPipelineData = [
  { status: 'Quotation', count: 15, value: 48000, color: '#94a3b8' },
  { status: 'Confirmed', count: 12, value: 42000, color: '#3b82f6' },
  { status: 'In Production', count: 18, value: 65000, color: '#f59e0b' },
  { status: 'Ready to Ship', count: 8, value: 28000, color: '#10b981' },
]

const productTypeRevenue = [
  { type: 'Magnetic Rollers', revenue: 85000 },
  { type: 'Rubber Rollers', revenue: 72000 },
  { type: 'Anilox Rollers', revenue: 65000 },
  { type: 'Printing Rollers', revenue: 48000 },
  { type: 'Other', revenue: 35000 },
]

const delayAnalysisData = [
  { reason: 'Material Shortage', count: 8, impact: 'High' },
  { reason: 'Machine Breakdown', count: 5, impact: 'Medium' },
  { reason: 'Quality Issues', count: 3, impact: 'High' },
  { reason: 'OEM Delay', count: 4, impact: 'Low' },
  { reason: 'Power Outage', count: 2, impact: 'Medium' },
]

export default function SalesDashboardPage() {
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
      <h1 className="sr-only">Sales Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:border-green-400/50 hover:shadow-md transition-all duration-200">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Revenue (YTD)
            </CardDescription>
            <CardTitle className="text-3xl text-green-600">₹3.28L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-green-600 font-semibold">+18.5%</span> vs last year
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:border-blue-400/50 hover:shadow-md transition-all duration-200">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Active Customers
            </CardDescription>
            <CardTitle className="text-3xl text-blue-600">42</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Award className="h-4 w-4 text-blue-600" />
              <span>5 new this month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:border-amber-400/50 hover:shadow-md transition-all duration-200">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Avg Order Value
            </CardDescription>
            <CardTitle className="text-3xl text-amber-600">₹3,480</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Target className="h-4 w-4" />
              <span>Target: ₹3,500</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:border-red-400/50 hover:shadow-md transition-all duration-200">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Pending Quotations
            </CardDescription>
            <CardTitle className="text-3xl text-red-600">15</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>8 expiring soon</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Sales Trends</TabsTrigger>
          <TabsTrigger value="customers">Top Customers</TabsTrigger>
          <TabsTrigger value="pipeline">Order Pipeline</TabsTrigger>
          <TabsTrigger value="products">Product Revenue</TabsTrigger>
          <TabsTrigger value="delays">Delay Analysis</TabsTrigger>
        </TabsList>

        {/* Sales Trends */}
        <TabsContent value="trends" className="space-y-4">
          <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
            <CardHeader>
              <CardTitle>Sales Trends & Order Value</CardTitle>
              <CardDescription>Monthly revenue, order count, and average order value</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={salesTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="revenue" fill="#3b82f6" name="Revenue (₹)" />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="orders"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Orders"
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="avgValue"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    name="Avg Value (₹)"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Customers */}
        <TabsContent value="customers" className="space-y-4">
          <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
            <CardHeader>
              <CardTitle>Top Customers by Revenue</CardTitle>
              <CardDescription>Top 5 customers this year</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={topCustomersData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="customer" type="category" width={150} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#3b82f6" name="Revenue (₹)" />
                  <Bar dataKey="orders" fill="#10b981" name="Orders" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Customer Details List */}
          <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
            <CardHeader>
              <CardTitle>Customer Performance Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topCustomersData.map((customer, idx) => (
                <div
                  key={customer.customer}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-medium">{customer.customer}</p>
                      <p className="text-xs text-muted-foreground">
                        {customer.orders} orders
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary">₹{customer.revenue.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      Avg: ₹{Math.round(customer.revenue / customer.orders).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Order Pipeline */}
        <TabsContent value="pipeline" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
              <CardHeader>
                <CardTitle>Order Pipeline Status</CardTitle>
                <CardDescription>Distribution by stage</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={orderPipelineData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                      outerRadius={80}
                      dataKey="count"
                    >
                      {orderPipelineData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
              <CardHeader>
                <CardTitle>Pipeline Value</CardTitle>
                <CardDescription>Revenue by stage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {orderPipelineData.map((stage) => (
                  <div key={stage.status} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: stage.color }}
                        />
                        <span className="text-sm font-medium">{stage.status}</span>
                      </div>
                      <Badge variant="outline">{stage.count} orders</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">Value</div>
                      <div className="text-xl font-bold text-primary">
                        ₹{stage.value.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Product Revenue */}
        <TabsContent value="products" className="space-y-4">
          <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
            <CardHeader>
              <CardTitle>Revenue by Product Type</CardTitle>
              <CardDescription>Year-to-date revenue breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={productTypeRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#3b82f6" name="Revenue (₹)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delay Analysis */}
        <TabsContent value="delays" className="space-y-4">
          <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
            <CardHeader>
              <CardTitle>Delay Reasons Analysis</CardTitle>
              <CardDescription>Orders delayed by reason</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {delayAnalysisData.map((item) => (
                <div
                  key={item.reason}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle
                      className={`h-5 w-5 ${
                        item.impact === 'High'
                          ? 'text-red-600'
                          : item.impact === 'Medium'
                          ? 'text-amber-600'
                          : 'text-blue-600'
                      }`}
                    />
                    <div>
                      <p className="font-medium">{item.reason}</p>
                      <p className="text-xs text-muted-foreground">Impact: {item.impact}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{item.count}</p>
                    <p className="text-xs text-muted-foreground">orders</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
