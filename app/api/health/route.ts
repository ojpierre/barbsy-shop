import { NextResponse } from "next/server"

export async function GET() {
  const url = process.env.DATABASE_URL
  const debugInfo = {
    env: url ? "set" : "missing",
    node_env: process.env.NODE_ENV,
    urlPrefix: url ? url.substring(0, 30) + "..." : "N/A",
    hasNeon: url ? url.includes("neon.tech") : false,
  }

  try {
    // Dynamic import to see if module loading is the issue
    const { prisma } = await import("@/lib/prisma")
    const count = await prisma.product.count()
    return NextResponse.json({ ok: true, productCount: count, ...debugInfo })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    const stack = error instanceof Error ? error.stack?.substring(0, 500) : undefined
    return NextResponse.json({ ok: false, error: message, stack, ...debugInfo }, { status: 500 })
  }
}
