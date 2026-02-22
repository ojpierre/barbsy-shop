import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { orderId, paymentToken, paymentData } = body

    if (!orderId || !paymentToken) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // In production, you would send the token to your payment processor
    // (e.g., Stripe, Adyen, or Braintree) to charge the card.
    // For now, we store the token and mark as paid.

    // Update order with Google Pay reference
    await prisma.order.update({
      where: { id: orderId },
      data: {
        googlePayToken: JSON.stringify(paymentData),
        paymentMethod: "google_pay",
        paymentRef: `gpay_${Date.now()}`,
        status: "PAID",
      },
    })

    return NextResponse.json({
      success: true,
      message: "Payment processed successfully",
    })
  } catch (error) {
    console.error("Google Pay processing error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
