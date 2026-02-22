"use client"

import { useEffect, useState } from "react"
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Package,
  Users,
} from "lucide-react"

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then(setAnalytics)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="font-serif text-3xl text-foreground">Analytics</h1>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card rounded-2xl p-6 animate-pulse">
              <div className="h-4 bg-muted rounded w-24 mb-3"></div>
              <div className="h-8 bg-muted rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-3xl text-foreground">Analytics</h1>

      {/* KPIs */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <KPICard
          label="Total Revenue"
          value={`$${(analytics?.totalRevenue || 0).toLocaleString()}`}
          icon={DollarSign}
          color="text-green-600"
          bg="bg-green-50"
        />
        <KPICard
          label="Total Orders"
          value={analytics?.totalOrders || 0}
          icon={ShoppingCart}
          color="text-blue-600"
          bg="bg-blue-50"
        />
        <KPICard
          label="This Month"
          value={analytics?.monthOrders || 0}
          icon={TrendingUp}
          color="text-indigo-600"
          bg="bg-indigo-50"
          subtitle={`${analytics?.orderGrowth >= 0 ? "+" : ""}${analytics?.orderGrowth || 0}% vs last month`}
        />
        <KPICard
          label="Products"
          value={analytics?.totalProducts || 0}
          icon={Package}
          color="text-purple-600"
          bg="bg-purple-50"
        />
        <KPICard
          label="Customers"
          value={analytics?.totalCustomers || 0}
          icon={Users}
          color="text-orange-600"
          bg="bg-orange-50"
        />
        <KPICard
          label="Avg Order Value"
          value={
            analytics?.totalOrders > 0
              ? `$${Math.round((analytics?.totalRevenue || 0) / analytics.totalOrders)}`
              : "$0"
          }
          icon={DollarSign}
          color="text-teal-600"
          bg="bg-teal-50"
        />
      </div>

      {/* Order Status Breakdown */}
      <div className="bg-card rounded-2xl p-6 border border-border/50">
        <h2 className="font-serif text-xl text-foreground mb-6">Order Status Distribution</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          {analytics?.ordersByStatus &&
            Object.entries(analytics.ordersByStatus).map(([status, count]) => (
              <div key={status} className="text-center p-4 rounded-xl bg-background">
                <p className="text-2xl font-semibold text-foreground">{count as number}</p>
                <p className="text-xs text-muted-foreground mt-1 capitalize">
                  {status.toLowerCase()}
                </p>
              </div>
            ))}
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-card rounded-2xl p-6 border border-border/50">
        <h2 className="font-serif text-xl text-foreground mb-4">Top Selling Products</h2>
        {analytics?.topProducts?.length ? (
          <div className="space-y-4">
            {analytics.topProducts.map((item: any, idx: number) => {
              const maxQty = analytics.topProducts[0]?._sum?.quantity || 1
              const pct = ((item._sum?.quantity || 0) / maxQty) * 100
              return (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-foreground">{item.name}</span>
                    <span className="text-muted-foreground">{item._sum?.quantity} sold</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No sales data yet</p>
        )}
      </div>
    </div>
  )
}

function KPICard({
  label,
  value,
  icon: Icon,
  color,
  bg,
  subtitle,
}: {
  label: string
  value: string | number
  icon: any
  color: string
  bg: string
  subtitle?: string
}) {
  return (
    <div className="bg-card rounded-2xl p-6 border border-border/50">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
      <p className="text-3xl font-semibold text-foreground">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  )
}
