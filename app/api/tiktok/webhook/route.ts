import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { getPrismaClient } from '../../../../src/lib/prisma'
import { captureException, captureMessage } from '../../../../src/lib/monitoring'

function computeSignatures(secret: string, payload: string) {
  const hmac = crypto.createHmac('sha256', secret).update(payload).digest()
  return {
    hex: hmac.toString('hex'),
    base64: hmac.toString('base64'),
  }
}

export async function POST(req: Request) {
  const secret = process.env.TIKTOK_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ ok: false, error: 'TIKTOK_WEBHOOK_SECRET not configured' }, { status: 500 })
  }

  const signatureHeader = req.headers.get('x-tiktok-signature') || req.headers.get('x-tiktok-signature-256')
  const bodyText = await req.text()

  if (!signatureHeader) {
    return NextResponse.json({ ok: false, error: 'missing signature header' }, { status: 401 })
  }

  const { hex, base64 } = computeSignatures(secret, bodyText)
  const valid = signatureHeader === hex || signatureHeader === base64

  if (!valid) {
    return NextResponse.json({ ok: false, error: 'invalid signature' }, { status: 401 })
  }

  try {
    const prisma = getPrismaClient()
    await prisma.webhooks.create({
      data: {
        provider: 'tiktok',
        signature: signatureHeader,
        received_at: new Date(),
        payload: JSON.parse(bodyText || '{}'),
      },
    })

    // monitoring
    captureMessage('tiktok.webhook.received', { signatureHeader })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    captureException(err, { route: 'tiktok.webhook', signatureHeader })
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 })
  }
}
