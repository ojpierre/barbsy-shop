import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Middleware to check admin role
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

// GET /api/admin/products - List all products
export async function GET(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search") || ""
    const category = searchParams.get("category") || ""

    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }
    if (category) {
      where.category = category
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.count({ where }),
    ])

    return NextResponse.json({
      products,
      total,
      pages: Math.ceil(total / limit),
      page,
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}

// POST /api/admin/products - Create a product
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const {
      name, slug, tagline, description, price, originalPrice,
      image, images, category, badge, sizes, details,
      howToUse, ingredients, delivery, inStock, featured,
    } = body

    if (!name || !slug || !description || !price || !image || !category) {
      return NextResponse.json(
        { error: "Missing required fields: name, slug, description, price, image, category" },
        { status: 400 }
      )
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        tagline: tagline || null,
        description,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        image,
        images: images || [],
        category,
        badge: badge || null,
        sizes: sizes || [],
        details: details || null,
        howToUse: howToUse || null,
        ingredients: ingredients || null,
        delivery: delivery || null,
        inStock: inStock !== false,
        featured: featured === true,
      },
    })

    return NextResponse.json({ success: true, product })
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Product slug already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}
