import { NextRequest, NextResponse } from "next/server"
import { checkPaymentStatus } from "@/lib/payhero"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const reference = searchParams.get("reference")
    const orderId = searchParams.get("orderId")

    if (!reference && !orderId) {
      return NextResponse.json(
        { error: "reference or orderId required" },
        { status: 400 }
      )
    }

    // If we have a PayHero reference, check with PayHero
    if (reference) {
      const result = await checkPaymentStatus(reference)

      if (result.success && result.data) {
        const status = result.data.status?.toLowerCase()

        // PayHero statuses: SUCCESS, FAILED, QUEUED, etc.
        if (status === "success" || status === "completed") {
          // Update order status
          if (orderId) {
            await prisma.order.update({
              where: { id: orderId },
              data: { status: "PAID" },
            })
          }
          return NextResponse.json({ status: "paid", data: result.data })
        }

        if (status === "failed" || status === "cancelled") {
          return NextResponse.json({ status: "failed", data: result.data })
        }

        // Still pending
        return NextResponse.json({ status: "pending", data: result.data })
      }

      return NextResponse.json({ status: "pending" })
    }

    // If only orderId, check our DB
    if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { status: true, payheroRef: true },
      })

      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 })
      }

      const isPaid = order.status === "PAID"
      return NextResponse.json({
        status: isPaid ? "paid" : "pending",
        orderStatus: order.status,
      })
    }

    return NextResponse.json({ status: "pending" })
  } catch (error) {
    console.error("Payment status check error:", error)
    return NextResponse.json(
      { error: "Failed to check payment status" },
      { status: 500 }
    )
  }
}
