// app/api/health/route.ts
import { NextResponse } from 'next/server'
import { type PrismaClient } from '@prisma/client'
import { getPrismaClient, MissingDatabaseUrlError } from '../../../src/lib/prisma'

// (optional, but explicit if you ever switch runtimes)
export const runtime = 'nodejs'

export async function GET() {
  let prisma: PrismaClient
  try {
    prisma = getPrismaClient()
  } catch (error) {
    if (error instanceof MissingDatabaseUrlError) {
      return NextResponse.json({ ok: false, error: 'Database connection not configured' }, { status: 503 })
    }
    throw error
  }

  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ ok: false, error: 'DB not reachable' }, { status: 500 })
  }
}
