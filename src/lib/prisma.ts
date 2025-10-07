// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'
import { withOptimize } from '@prisma/extension-optimize'

// Create a typed handle for globalThis without augmenting the global type
const globalForPrisma = globalThis as unknown as {
  __PRISMA__?: PrismaClient
}

const basePrisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL },
  },
})

const optimizeApiKey = process.env.OPTIMIZE_API_KEY

const client = optimizeApiKey
  ? basePrisma.$extends(withOptimize({ apiKey: optimizeApiKey }))
  : basePrisma

export const prisma = (globalForPrisma.__PRISMA__ ?? client) as PrismaClient

// Cache the client in dev/hot-reload
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__PRISMA__ = prisma
}
