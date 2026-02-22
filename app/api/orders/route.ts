import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { items, customerName, customerEmail, customerPhone, shippingAddress, userId } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 })
    }

    // Resolve product IDs — cart may store slugs instead of CUIDs
    const resolvedItems = await Promise.all(
      items.map(async (item: Record<string, unknown>) => {
        const rawId = (item.productId || item.id) as string
        // Check if it looks like a CUID (starts with c and alphanumeric)
        const isCuid = /^c[a-z0-9]{20,}$/i.test(rawId)

        if (isCuid) {
          return { ...item, productId: rawId }
        }

        // Treat as slug — look up real product ID
        const product = await prisma.product.findFirst({
          where: { slug: rawId },
          select: { id: true },
        })

        if (!product) {
          throw new Error(`Product not found: ${rawId}`)
        }

        return { ...item, productId: product.id }
      })
    )

    const subtotal = resolvedItems.reduce(
      (sum: number, item: Record<string, unknown>) =>
        sum + (item.price as number) * (item.quantity as number),
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
          create: resolvedItems.map((item: Record<string, unknown>) => ({
            productId: item.productId as string,
            name: item.name as string,
            price: item.price as number,
            quantity: item.quantity as number,
            size: (item.size as string) || null,
          })),
        },
      },
      include: { items: true },
    })

    return NextResponse.json({ success: true, order })
  } catch (error) {
    console.error("Order creation error:", error)
    const message = error instanceof Error ? error.message : "Failed to create order"
    return NextResponse.json(
      { error: message },
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
