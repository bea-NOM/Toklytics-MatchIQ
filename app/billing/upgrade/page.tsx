"use client"
import { useState } from 'react'

type PlanKey = 'basic' | 'pro'

const PLANS: Record<PlanKey, { title: string; price: string; cents: number; features: string[] }> = {
  basic: {
    title: 'Basic',
    price: '$5.99 / month',
    cents: 599,
    features: ['1 creator', 'Power-up inventory tracking', 'Auto drop-off on expiry'],
  },
  pro: {
    title: 'Pro',
    price: '$9.99 / month',
    cents: 999,
    features: ['1 creator', 'Power-up inventory tracking', 'Expiration alerts', 'Advanced filters', 'CSV/Excel export', 'Calendar reminders'],
  },
}

export default function UpgradePage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [plan, setPlan] = useState<PlanKey>('basic')

  async function startCheckout() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/billing/create-checkout-session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan }) })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || 'Failed to create checkout session')
      }
      const data = await res.json()
      // redirect to Stripe checkout
      window.location.href = data.url
    } catch (err: any) {
      setError(String(err?.message || err))
      setLoading(false)
    }
  }

  return (
    <main style={{ maxWidth: 920, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Upgrade plans</h1>
      <p style={{ color: '#666' }}>Choose a subscription. Auto-renews until canceled. No refunds.</p>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', marginTop: 16 }}>
        {(Object.keys(PLANS) as PlanKey[]).map(key => {
          const p = PLANS[key]
          const selected = plan === key
          return (
            <div key={key} style={{ border: selected ? '2px solid #0B5FFF' : '1px solid #eee', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{p.title}</div>
                  <div style={{ color: '#666' }}>{p.price}</div>
                </div>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <input type="radio" name="plan" checked={selected} onChange={() => setPlan(key)} />
                </label>
              </div>
              <ul style={{ marginTop: 12, color: '#444' }}>
                {p.features.map(f => (
                  <li key={f} style={{ marginBottom: 6 }}>{f}</li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 20 }}>
        <button onClick={startCheckout} disabled={loading} style={{ padding: '12px 18px', background: '#0B5FFF', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700 }}>
          {loading ? 'Starting...' : `Subscribe — ${PLANS[plan].price}`}
        </button>
      </div>
      {error && <div style={{ color: 'red', marginTop: 12 }}>{error}</div>}
    </main>
  )
}
