// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '../../../src/lib/prisma';

// (optional, but explicit if you ever switch runtimes)
export const runtime = 'nodejs';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: 'DB not reachable' }, { status: 500 });
  }
}

