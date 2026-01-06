import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, ShoppingCart, Factory, TrendingUp } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Total Orders
            </CardDescription>
            <CardTitle className="text-3xl text-primary">128</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-green-600 font-semibold">↑ 12%</span> from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Factory className="h-4 w-4" />
              Active Orders
            </CardDescription>
            <CardTitle className="text-3xl text-blue-600">45</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">In production</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Completed Today
            </CardDescription>
            <CardTitle className="text-3xl text-green-600">8</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Target: 10</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Quality Rate
            </CardDescription>
            <CardTitle className="text-3xl text-primary">98.2%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Rejection: 1.8%</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <Card className="hover:shadow-lg hover:border-primary hover:scale-[1.02] transition-all duration-200 cursor-pointer group">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base text-primary">Orders</CardTitle>
                <CardDescription className="text-xs">Manage orders & tracking</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg hover:border-primary hover:scale-[1.02] transition-all duration-200 cursor-pointer group">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <Factory className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base text-primary">Production</CardTitle>
                <CardDescription className="text-xs">Job cards & entry</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg hover:border-primary hover:scale-[1.02] transition-all duration-200 cursor-pointer group">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base text-primary">Masters</CardTitle>
                <CardDescription className="text-xs">Manage master data</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
