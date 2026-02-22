"use client"

import { useEffect, useState } from "react"

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/customers")
      .then((r) => r.json())
      .then((data) => {
        setCustomers(data.customers || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-foreground">Customers</h1>

      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Customer</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Email</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Role</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Orders</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-4">Joined</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-border/30">
                    <td className="px-6 py-4" colSpan={5}>
                      <div className="h-4 bg-muted rounded animate-pulse"></div>
                    </td>
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No customers yet
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="border-b border-border/30 hover:bg-muted/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {customer.image ? (
                          <img src={customer.image} alt="" className="w-8 h-8 rounded-full" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm">
                            {customer.name?.[0] || "?"}
                          </div>
                        )}
                        <span className="text-sm font-medium text-foreground">{customer.name || "No name"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{customer.email}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        customer.role === "ADMIN" ? "bg-purple-50 text-purple-700" : "bg-gray-50 text-gray-700"
                      }`}>
                        {customer.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{customer._count?.orders || 0}</td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
