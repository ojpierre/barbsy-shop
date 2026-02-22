import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get("category")

    const products = await prisma.product.findMany({
      where: category && category !== "all" 
        ? { category: { equals: category, mode: "insensitive" } }
        : undefined,
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ products })
  } catch (error) {
    console.error("Products fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}
