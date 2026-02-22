"use client"

import { useEffect, useState } from "react"
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"

interface Analytics {
  totalProducts: number
  totalOrders: number
  totalCustomers: number
  totalRevenue: number
  monthOrders: number
  orderGrowth: number
  recentOrders: any[]
  topProducts: any[]
  ordersByStatus: Record<string, number>
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then((data) => {
        setAnalytics(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="font-serif text-3xl text-foreground">Dashboard</h1>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card rounded-2xl p-6 animate-pulse">
              <div className="h-4 bg-muted rounded w-20 mb-3"></div>
              <div className="h-8 bg-muted rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const stats = [
    {
      label: "Total Revenue",
      value: `$${(analytics?.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Orders",
      value: analytics?.totalOrders || 0,
      icon: ShoppingCart,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Products",
      value: analytics?.totalProducts || 0,
      icon: Package,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Customers",
      value: analytics?.totalCustomers || 0,
      icon: Users,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl text-foreground">Dashboard</h1>
        <div className="flex items-center gap-2 text-sm">
          {analytics?.orderGrowth !== undefined && (
            <span
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                analytics.orderGrowth >= 0
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {analytics.orderGrowth >= 0 ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              {Math.abs(analytics.orderGrowth)}% this month
            </span>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-card rounded-2xl p-6 border border-border/50"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <div
                className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}
              >
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <p className="text-3xl font-semibold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-card rounded-2xl p-6 border border-border/50">
          <h2 className="font-serif text-xl text-foreground mb-4">
            Recent Orders
          </h2>
          {analytics?.recentOrders?.length ? (
            <div className="space-y-3">
              {analytics.recentOrders.map((order: any) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-3 border-b border-border/30 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {order.customerName || order.user?.name || "Guest"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {order.items?.length || 0} items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">${order.total}</p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        order.status === "PAID"
                          ? "bg-green-50 text-green-700"
                          : order.status === "PENDING"
                          ? "bg-yellow-50 text-yellow-700"
                          : "bg-gray-50 text-gray-700"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No orders yet</p>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-card rounded-2xl p-6 border border-border/50">
          <h2 className="font-serif text-xl text-foreground mb-4">
            Top Products
          </h2>
          {analytics?.topProducts?.length ? (
            <div className="space-y-3">
              {analytics.topProducts.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-3 border-b border-border/30 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-5">
                      #{idx + 1}
                    </span>
                    <p className="text-sm font-medium text-foreground">
                      {item.name}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {item._sum?.quantity || 0} sold
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No sales data yet</p>
          )}
        </div>
      </div>

      {/* Order Status Breakdown */}
      {analytics?.ordersByStatus &&
        Object.keys(analytics.ordersByStatus).length > 0 && (
          <div className="bg-card rounded-2xl p-6 border border-border/50">
            <h2 className="font-serif text-xl text-foreground mb-4">
              Orders by Status
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(analytics.ordersByStatus).map(([status, count]) => (
                <div
                  key={status}
                  className="text-center p-4 rounded-xl bg-background"
                >
                  <p className="text-2xl font-semibold text-foreground">
                    {count}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{status}</p>
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  )
}
