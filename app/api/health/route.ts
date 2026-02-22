import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const count = await prisma.product.count()
    return NextResponse.json({ 
      ok: true, 
      productCount: count,
      env: process.env.DATABASE_URL ? "set" : "missing",
      node_env: process.env.NODE_ENV,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ 
      ok: false, 
      error: message,
      env: process.env.DATABASE_URL ? "set" : "missing",
    }, { status: 500 })
  }
}
