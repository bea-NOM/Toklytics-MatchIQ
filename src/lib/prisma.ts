// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'
import { withOptimize } from '@prisma/extension-optimize'

export class MissingDatabaseUrlError extends Error {
  constructor() {
    super('DATABASE_URL environment variable is required to use Prisma.')
  }
}

type PrismaCache = {
  __PRISMA__?: PrismaClient
}

const globalForPrisma = globalThis as typeof globalThis & PrismaCache

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new MissingDatabaseUrlError()
  }

  const baseClient = new PrismaClient({
    datasources: {
      db: { url: databaseUrl },
    },
  })

  const optimizeApiKey = process.env.OPTIMIZE_API_KEY

  return optimizeApiKey
    ? baseClient.$extends(withOptimize({ apiKey: optimizeApiKey }))
    : baseClient
}

export function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.__PRISMA__) {
    globalForPrisma.__PRISMA__ = createPrismaClient()
  }
  return globalForPrisma.__PRISMA__
}

export type { PrismaClient }
