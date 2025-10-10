import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

export async function GET(req: Request) {
  const clientKey = process.env.TIKTOK_CLIENT_KEY
  const redirectUri = process.env.TIKTOK_REDIRECT_URI
  if (!clientKey || !redirectUri) {
    return NextResponse.json({ ok: false, error: 'TikTok OAuth not configured' }, { status: 500 })
  }

  const state = randomBytes(8).toString('hex')
  const params = new URLSearchParams({
    client_key: clientKey,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'open_id user.info.basic',
    state,
  })

  // Store state in cookie for CSRF protection
  const res = NextResponse.redirect(`https://open-api.tiktok.com/platform/oauth/connect/?${params.toString()}`)
  res.cookies.set('tiktok_oauth_state', state, { httpOnly: true })
  return res
}
