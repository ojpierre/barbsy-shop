import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { items, customerName, customerEmail, customerPhone, shippingAddress, userId } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 })
    }

    const subtotal = items.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    )
    const shipping = subtotal > 50 ? 0 : 5
    const total = subtotal + shipping

    const order = await prisma.order.create({
      data: {
        userId: userId || null,
        subtotal,
        shipping,
        total,
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId || item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            size: item.size || null,
          })),
        },
      },
      include: { items: true },
    })

    return NextResponse.json({ success: true, order })
  } catch (error) {
    console.error("Order creation error:", error)
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 })
    }

    const orders = await prisma.order.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ orders })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}
