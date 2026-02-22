import { NextRequest, NextResponse } from "next/server"
import { initiateSTKPush } from "@/lib/payhero"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { orderId, phone, amount, customerName } = body

    if (!orderId || !phone || !amount) {
      return NextResponse.json(
        { error: "Missing required fields: orderId, phone, amount" },
        { status: 400 }
      )
    }

    // Initiate STK Push
    const result = await initiateSTKPush({
      amount,
      phone,
      orderId,
      customerName,
    })

    if (result.success) {
      // Update order with PayHero reference
      await prisma.order.update({
        where: { id: orderId },
        data: {
          payheroRef: result.reference,
          paymentMethod: "mpesa",
          status: "PROCESSING",
        },
      })

      return NextResponse.json({
        success: true,
        message: "STK Push sent. Check your phone.",
        reference: result.reference,
      })
    }

    return NextResponse.json(
      { success: false, error: result.message },
      { status: 400 }
    )
  } catch (error) {
    console.error("PayHero initiate error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
