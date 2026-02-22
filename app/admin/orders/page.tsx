"use client"

import { useEffect, useState } from "react"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState("")

  const fetchOrders = async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "10",
      status: statusFilter,
    })
    const res = await fetch(`/api/admin/orders?${params}`)
    const data = await res.json()
    setOrders(data.orders || [])
    setTotalPages(data.pages || 1)
    setLoading(false)
  }

  useEffect(() => {
    fetchOrders()
  }, [page, statusFilter])

  const updateStatus = async (orderId: string, status: string) => {
    await fetch("/api/admin/orders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status }),
    })
    fetchOrders()
  }

  const statuses = ["", "PENDING", "PROCESSING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"]

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-50 text-yellow-700",
    PROCESSING: "bg-blue-50 text-blue-700",
    PAID: "bg-green-50 text-green-700",
    SHIPPED: "bg-purple-50 text-purple-700",
    DELIVERED: "bg-emerald-50 text-emerald-700",
    CANCELLED: "bg-red-50 text-red-700",
    REFUNDED: "bg-gray-50 text-gray-700",
  }

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-foreground">Orders</h1>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatusFilter(s)
              setPage(1)
            }}
            className={`px-4 py-2 rounded-xl text-sm transition-colors ${
              statusFilter === s
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">
                  Order
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">
                  Customer
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">
                  Items
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">
                  Total
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">
                  Status
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-border/30">
                      <td className="px-6 py-4" colSpan={6}>
                        <div className="h-4 bg-muted rounded animate-pulse"></div>
                      </td>
                    </tr>
                  ))
                : orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-mono text-foreground">
                        #{order.id.slice(-6)}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-foreground">
                          {order.customerName || order.user?.name || "Guest"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.customerEmail || order.user?.email || "-"}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {order.items?.length || 0} items
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        ${order.total}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={order.status}
                          onChange={(e) => updateStatus(order.id, e.target.value)}
                          className={`text-xs px-3 py-1 rounded-full border-0 cursor-pointer ${
                            statusColors[order.status] || "bg-gray-50 text-gray-700"
                          }`}
                        >
                          {["PENDING", "PROCESSING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"].map(
                            (s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            )
                          )}
                        </select>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border/50">
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-border disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-border disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
