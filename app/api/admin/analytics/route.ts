import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function isAdmin() {
  const session = await auth()
  if (!session?.user?.email) return false
  const adminEmails = process.env.ADMIN_EMAILS?.split(",") || []
  const adminEmail = process.env.ADMIN_EMAIL || ""
  return (
    session.user.role === "ADMIN" ||
    adminEmails.includes(session.user.email) ||
    adminEmail === session.user.email
  )
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    const [
      totalProducts,
      totalOrders,
      totalCustomers,
      paidOrders,
      monthOrders,
      lastMonthOrders,
      recentOrders,
      topProducts,
      ordersByStatus,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.order.findMany({
        where: { status: "PAID" },
        select: { total: true },
      }),
      prisma.order.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      prisma.order.count({
        where: {
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
          items: true,
        },
      }),
      prisma.orderItem.groupBy({
        by: ["productId", "name"],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
      prisma.order.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ])

    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0)
    const orderGrowth =
      lastMonthOrders > 0
        ? ((monthOrders - lastMonthOrders) / lastMonthOrders) * 100
        : monthOrders > 0
        ? 100
        : 0

    return NextResponse.json({
      totalProducts,
      totalOrders,
      totalCustomers,
      totalRevenue,
      monthOrders,
      orderGrowth: Math.round(orderGrowth),
      recentOrders,
      topProducts,
      ordersByStatus: ordersByStatus.reduce(
        (acc: Record<string, number>, item) => {
          acc[item.status] = item._count._all
          return acc
        },
        {}
      ),
    })
  } catch (error) {
    console.error("Analytics error:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
