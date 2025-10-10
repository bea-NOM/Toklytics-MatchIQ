import { NextResponse } from 'next/server'
import { getPrismaClient } from '../../../../../src/lib/prisma'

async function exchangeCodeForToken(clientKey: string, clientSecret: string, code: string, redirectUri: string) {
  const url = 'https://open-api.tiktok.com/platform/oauth/access_token/'
  const body = new URLSearchParams({
    client_key: clientKey,
    client_secret: clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  })

  const res = await fetch(url, { method: 'POST', body })
  if (!res.ok) throw new Error(`token exchange failed: ${res.status}`)
  return res.json()
}

async function fetchProfile(accessToken: string) {
  // Minimal profile fetch (adjust per TikTok docs)
  const url = `https://open-api.tiktok.com/user/info/?access_token=${encodeURIComponent(accessToken)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('failed to fetch profile')
  return res.json()
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')

  const cookieState = req.headers.get('cookie')?.split(';').map(s => s.trim()).find(s => s.startsWith('tiktok_oauth_state='))?.split('=')[1]
  if (!code || !state || state !== cookieState) {
    return NextResponse.json({ ok: false, error: 'invalid oauth callback' }, { status: 400 })
  }

  const clientKey = process.env.TIKTOK_CLIENT_KEY
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET
  const redirectUri = process.env.TIKTOK_REDIRECT_URI
  if (!clientKey || !clientSecret || !redirectUri) {
    return NextResponse.json({ ok: false, error: 'TikTok OAuth not configured' }, { status: 500 })
  }

  try {
    const tokenResp: any = await exchangeCodeForToken(clientKey, clientSecret, code, redirectUri)
    // tokenResp expected to contain access_token, refresh_token, open_id (tiktok id)
    const accessToken = tokenResp.data?.access_token || tokenResp.access_token || tokenResp.data?.access_token
    const refreshToken = tokenResp.data?.refresh_token || tokenResp.refresh_token
    const openId = tokenResp.data?.open_id || tokenResp.open_id || tokenResp.data?.open_id

    if (!accessToken || !openId) {
      throw new Error('missing token response fields')
    }

    // Optional: fetch profile if you need additional info
    // const profile = await fetchProfile(accessToken)

    const prisma = getPrismaClient()
    await prisma.tikTokToken.create({
      data: {
        tiktok_id: openId,
        access_token: accessToken,
        refresh_token: refreshToken,
      },
    })

    return NextResponse.redirect('/')
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 })
  }
}
