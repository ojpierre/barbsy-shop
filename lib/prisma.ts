import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaNeon } from "@prisma/adapter-neon"
import pg from "pg"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const url = process.env.DATABASE_URL!

  // Use Neon serverless adapter in production (Vercel), pg adapter locally
  if (process.env.NODE_ENV === "production" || url.includes("neon.tech")) {
    const adapter = new PrismaNeon({ connectionString: url })
    return new PrismaClient({ adapter })
  }

  const pool = new pg.Pool({ connectionString: url })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
