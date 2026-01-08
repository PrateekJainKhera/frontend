"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  ShoppingCart, Factory, TrendingUp, AlertTriangle,
  CheckCircle, XCircle, TruckIcon, Warehouse, Users,
  Activity, RefreshCw, Target, Zap
} from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  // Mock data - in real app, this would come from API
  const criticalAlerts = [
    { id: 1, type: 'inventory', message: 'EN8 Rod stock below minimum', severity: 'high', time: '5 min ago' },
    { id: 2, type: 'quality', message: '3 units rejected in ORD-128', severity: 'medium', time: '15 min ago' },
    { id: 3, type: 'osp', message: 'OSP delivery overdue by 2 days', severity: 'high', time: '1 hour ago' },
  ]

  const recentActivities = [
    { id: 1, action: 'Order Created', detail: 'ORD-145 - Magnetic Roller 250mm', time: '2 min ago', user: 'Rajesh Kumar' },
    { id: 2, action: 'Job Card Completed', detail: 'JC-089 - Grinding Process', time: '8 min ago', user: 'Machine Operator' },
    { id: 3, action: 'Material Issued', detail: 'EN19 Rod - 25kg for ORD-142', time: '12 min ago', user: 'Store Manager' },
    { id: 4, action: 'Quality Approved', detail: 'Final inspection passed - ORD-138', time: '18 min ago', user: 'QC Inspector' },
    { id: 5, action: 'OSP Sent', detail: 'Chrome plating - 5 parts to vendor', time: '25 min ago', user: 'Production Manager' },
  ]

  const machineStatus = [
    { id: 1, name: 'CNC-01', status: 'running', utilization: 85, currentJob: 'JC-089' },
    { id: 2, name: 'GRN-01', status: 'running', utilization: 92, currentJob: 'JC-091' },
    { id: 3, name: 'LAT-02', status: 'idle', utilization: 0, currentJob: '-' },
    { id: 4, name: 'MIL-01', status: 'running', utilization: 78, currentJob: 'JC-088' },
  ]

  const pendingActions = [
    { id: 1, action: 'Approve Quotation', count: 5, urgency: 'high' },
    { id: 2, action: 'Process Rejections', count: 3, urgency: 'high' },
    { id: 3, action: 'Material Purchase', count: 8, urgency: 'medium' },
    { id: 4, action: 'Invoice Pending', count: 12, urgency: 'low' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="sr-only">Dashboard</h1>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.98]">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="text-sm font-medium text-muted-foreground">Total Orders</div>
              <div className="flex items-center gap-1 text-xs font-semibold text-green-600">
                <TrendingUp className="h-3 w-3" />
                +12.5%
              </div>
            </div>
            <div className="text-4xl font-bold mb-3">128</div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-sm">
                <TrendingUp className="h-3.5 w-3.5" />
                <span className="font-medium">Growing steadily</span>
              </div>
              <div className="text-xs text-muted-foreground">Up from last month</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:border-blue-400/50 hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.98]">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="text-sm font-medium text-muted-foreground">Active Orders</div>
              <div className="flex items-center gap-1 text-xs font-semibold text-blue-600">
                <Activity className="h-3 w-3" />
                Live
              </div>
            </div>
            <div className="text-4xl font-bold mb-3">45</div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-sm">
                <Factory className="h-3.5 w-3.5" />
                <span className="font-medium">In production now</span>
              </div>
              <div className="text-xs text-muted-foreground">Across all machines</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:border-green-400/50 hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.98]">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="text-sm font-medium text-muted-foreground">Completed Today</div>
              <div className="flex items-center gap-1 text-xs font-semibold text-amber-600">
                <Target className="h-3 w-3" />
                80%
              </div>
            </div>
            <div className="text-4xl font-bold mb-3">8</div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-sm">
                <CheckCircle className="h-3.5 w-3.5" />
                <span className="font-medium">Target: 10 orders</span>
              </div>
              <div className="text-xs text-muted-foreground">2 more to reach goal</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:border-green-400/50 hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.98]">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="text-sm font-medium text-muted-foreground">Quality Rate</div>
              <div className="flex items-center gap-1 text-xs font-semibold text-green-600">
                <TrendingUp className="h-3 w-3" />
                +0.3%
              </div>
            </div>
            <div className="text-4xl font-bold mb-3">98.2%</div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-sm">
                <CheckCircle className="h-3.5 w-3.5" />
                <span className="font-medium">Excellent performance</span>
              </div>
              <div className="text-xs text-muted-foreground">Only 1.8% rejection rate</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.98]">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="text-sm font-medium text-muted-foreground">On Time Delivery</div>
              <div className="flex items-center gap-1 text-xs font-semibold text-green-600">
                <TrendingUp className="h-3 w-3" />
                +2%
              </div>
            </div>
            <div className="text-3xl font-bold mb-2">94%</div>
            <div className="text-xs text-muted-foreground">Meeting deadlines</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:border-amber-400/50 hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.98]">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="text-sm font-medium text-muted-foreground">OSP Active</div>
              <div className="flex items-center gap-1 text-xs font-semibold text-amber-600">
                <TruckIcon className="h-3 w-3" />
                Live
              </div>
            </div>
            <div className="text-3xl font-bold mb-2">12</div>
            <div className="text-xs text-muted-foreground">Parts with vendors</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:border-red-400/50 hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.98]">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="text-sm font-medium text-muted-foreground">Low Stock Items</div>
              <div className="flex items-center gap-1 text-xs font-semibold text-red-600">
                <AlertTriangle className="h-3 w-3" />
                Alert
              </div>
            </div>
            <div className="text-3xl font-bold mb-2">6</div>
            <div className="text-xs text-muted-foreground">Needs attention</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:border-orange-400/50 hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.98]">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="text-sm font-medium text-muted-foreground">Rework Orders</div>
              <div className="flex items-center gap-1 text-xs font-semibold text-orange-600">
                <RefreshCw className="h-3 w-3" />
                Active
              </div>
            </div>
            <div className="text-3xl font-bold mb-2">5</div>
            <div className="text-xs text-muted-foreground">In process</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:border-green-400/50 hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.98]">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="text-sm font-medium text-muted-foreground">Revenue (MTD)</div>
              <div className="flex items-center gap-1 text-xs font-semibold text-green-600">
                <TrendingUp className="h-3 w-3" />
                +8%
              </div>
            </div>
            <div className="text-3xl font-bold mb-2">₹3.2L</div>
            <div className="text-xs text-muted-foreground">This month</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Production Status */}
        <div className="lg:col-span-2 space-y-6">
          {/* Machine Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Machine Status</CardTitle>
                  <CardDescription>Real-time machine utilization</CardDescription>
                </div>
                <Link href="/production/machines" className="text-sm text-primary hover:underline">
                  View All
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {machineStatus.map((machine) => (
                  <div key={machine.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${machine.status === 'running' ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <div>
                          <p className="font-medium">{machine.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {machine.currentJob !== '-' ? `Job: ${machine.currentJob}` : 'Idle'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{machine.utilization}%</p>
                        <Badge variant={machine.status === 'running' ? 'default' : 'secondary'} className="text-xs">
                          {machine.status}
                        </Badge>
                      </div>
                    </div>
                    <Progress value={machine.utilization} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Activities</CardTitle>
                  <CardDescription>Latest system activities</CardDescription>
                </div>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm">{activity.action}</p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{activity.detail}</p>
                      <p className="text-xs text-muted-foreground mt-1">by {activity.user}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Pending Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Actions</CardTitle>
              <CardDescription>Items requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingActions.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    <div>
                      <p className="font-medium text-sm">{item.action}</p>
                      <p className="text-xs text-muted-foreground">{item.count} items</p>
                    </div>
                    <Badge variant={
                      item.urgency === 'high' ? 'destructive' :
                      item.urgency === 'medium' ? 'default' :
                      'secondary'
                    }>
                      {item.urgency}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Today's Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Summary</CardTitle>
              <CardDescription>{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Completed Jobs</span>
                  </div>
                  <span className="font-semibold">8</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Factory className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Jobs In Progress</span>
                  </div>
                  <span className="font-semibold">15</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm">Rejections</span>
                  </div>
                  <span className="font-semibold">2</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-600" />
                    <span className="text-sm">Active Operators</span>
                  </div>
                  <span className="font-semibold">12</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance</CardTitle>
              <CardDescription>This week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Overall OEE</span>
                    <span className="font-semibold text-green-600">87%</span>
                  </div>
                  <Progress value={87} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">On-Time Delivery</span>
                    <span className="font-semibold text-blue-600">94%</span>
                  </div>
                  <Progress value={94} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">First Pass Yield</span>
                    <span className="font-semibold text-purple-600">96%</span>
                  </div>
                  <Progress value={96} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Access - Keep at bottom */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Access</CardTitle>
          <CardDescription>Navigate to key modules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Link href="/orders" className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-muted/50 hover:border-primary transition-all group">
              <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <ShoppingCart className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-medium text-center">Orders</span>
            </Link>

            <Link href="/production/job-cards" className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-muted/50 hover:border-primary transition-all group">
              <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <Factory className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-medium text-center">Production</span>
            </Link>

            <Link href="/inventory/raw-materials" className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-muted/50 hover:border-primary transition-all group">
              <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <Warehouse className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-medium text-center">Inventory</span>
            </Link>

            <Link href="/quality/rejections" className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-muted/50 hover:border-primary transition-all group">
              <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-medium text-center">Quality</span>
            </Link>

            <Link href="/production/osp" className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-muted/50 hover:border-primary transition-all group">
              <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <TruckIcon className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-medium text-center">OSP</span>
            </Link>

            <Link href="/mis/executive" className="flex flex-col items-center gap-2 p-4 border rounded-lg hover:bg-muted/50 hover:border-primary transition-all group">
              <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-medium text-center">MIS</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
