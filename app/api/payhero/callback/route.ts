import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    // Verify the webhook signature
    const authHeader = req.headers.get("authorization")
    if (authHeader !== process.env.PAYHERO_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { external_reference, status, reference, amount } = body

    if (!external_reference) {
      return NextResponse.json({ error: "Missing reference" }, { status: 400 })
    }

    // Map PayHero status to our OrderStatus
    let orderStatus: "PAID" | "CANCELLED" | "PROCESSING" = "PROCESSING"
    if (status === "SUCCESS" || status === "COMPLETED") {
      orderStatus = "PAID"
    } else if (status === "FAILED" || status === "CANCELLED") {
      orderStatus = "CANCELLED"
    }

    // Update the order
    await prisma.order.update({
      where: { id: external_reference },
      data: {
        status: orderStatus,
        payheroRef: reference,
        paymentRef: reference,
      },
    })

    // TODO: Send WhatsApp confirmation via Twilio if PAID

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("PayHero callback error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
