import { NextRequest, NextResponse } from "next/server"
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

// GET /api/admin/products/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
    })
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }
    return NextResponse.json({ product })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 })
  }
}

// PUT /api/admin/products/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...body,
        price: body.price ? parseFloat(body.price) : undefined,
        originalPrice: body.originalPrice ? parseFloat(body.originalPrice) : null,
      },
    })
    return NextResponse.json({ success: true, product })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}

// DELETE /api/admin/products/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await prisma.product.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}
