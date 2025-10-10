import { NextResponse } from 'next/server';
import { callModel } from '../../../src/lib/ai-client';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = body.prompt || 'Hello';
    const userId = body.userId;
    const res = await callModel(prompt, { userId });
    return NextResponse.json({ ok: true, res });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err.message || err) }, { status: 500 });
  }
}
