"use client"
import { useState } from 'react'

type PlanKey = 'basic' | 'pro'

const PLANS: Record<PlanKey, { title: string; price: string; cents: number; priceNum: string; priceCents: string; features: string[] }> = {
  basic: {
    title: 'BASIC',
    price: '$5.99 / month',
    cents: 599,
    priceNum: '5',
    priceCents: '.99',
    features: ['1 Creator', 'Inventory Tracking', 'Expiration Alerts', 'Data Export'],
  },
  pro: {
    title: 'PRO',
    price: '$9.99 / month',
    cents: 999,
    priceNum: '9',
    priceCents: '.99',
    features: ['All Basic Features', 'Advanced Filtering', 'Expiration Alerts', 'Data Export', 'Calendar Integration', 'Priority Support'],
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
      window.location.href = data.url
    } catch (err: any) {
      setError(String(err?.message || err))
      setLoading(false)
    }
  }

  return (
    <main style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0e1a 0%, #1a1f35 50%, #0a0e1a 100%)',
      color: '#fff',
      padding: '80px 24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative elements */}
      <div style={{
        position: 'absolute',
        top: '20%',
        right: '10%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(138, 43, 226, 0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        left: '5%',
        width: '250px',
        height: '250px',
        background: 'radial-gradient(circle, rgba(75, 0, 130, 0.2) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(50px)',
        pointerEvents: 'none'
      }} />

      <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <header style={{ textAlign: 'center', marginBottom: 60 }}>
          <div style={{ 
            fontSize: 14, 
            letterSpacing: '0.15em', 
            color: '#9d7ce8',
            marginBottom: 16,
            fontWeight: 600
          }}>
            WE OFFER TWO
          </div>
          <h1 style={{ 
            fontSize: 48, 
            fontWeight: 800, 
            letterSpacing: '0.05em',
            marginBottom: 16 
          }}>
            MONTHLY PLANS
          </h1>
        </header>

        <div style={{ 
          display: 'grid', 
          gap: 32, 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          marginBottom: 48
        }}>
          {(Object.keys(PLANS) as PlanKey[]).map(key => {
            const p = PLANS[key]
            const selected = plan === key
            return (
              <div 
                key={key} 
                onClick={() => setPlan(key)}
                style={{ 
                  background: selected ? 'linear-gradient(135deg, rgba(138, 43, 226, 0.2) 0%, rgba(75, 0, 130, 0.15) 100%)' : 'rgba(26, 31, 53, 0.6)',
                  border: selected ? '2px solid #9d7ce8' : '1px solid rgba(157, 124, 232, 0.3)',
                  borderRadius: 20,
                  padding: 32,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Card shine effect */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '100%',
                  background: selected ? 'linear-gradient(180deg, rgba(157, 124, 232, 0.1) 0%, transparent 100%)' : 'transparent',
                  pointerEvents: 'none'
                }} />
                
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: 24
                  }}>
                    <div>
                      <div style={{ 
                        fontSize: 24, 
                        fontWeight: 800, 
                        letterSpacing: '0.1em',
                        color: '#fff',
                        marginBottom: 12
                      }}>
                        {p.title}
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'flex-start',
                        gap: 4
                      }}>
                        <span style={{ fontSize: 24, color: '#9d7ce8' }}>$</span>
                        <span style={{ fontSize: 56, fontWeight: 800, lineHeight: 1, color: '#fff' }}>
                          {p.priceNum}
                        </span>
                        <span style={{ fontSize: 32, fontWeight: 800, color: '#9d7ce8' }}>
                          {p.priceCents}
                        </span>
                      </div>
                    </div>
                    <div style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      border: selected ? '2px solid #9d7ce8' : '2px solid rgba(157, 124, 232, 0.4)',
                      background: selected ? '#9d7ce8' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 8
                    }}>
                      {selected && <div style={{ 
                        width: 10, 
                        height: 10, 
                        borderRadius: '50%', 
                        background: '#fff' 
                      }} />}
                    </div>
                  </div>
                  
                  <div style={{ 
                    borderTop: '1px solid rgba(157, 124, 232, 0.2)',
                    paddingTop: 20,
                    marginTop: 20
                  }}>
                    {p.features.map((f, i) => (
                      <div key={i} style={{ 
                        marginBottom: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        color: 'rgba(255, 255, 255, 0.85)',
                        fontSize: 14
                      }}>
                        <span style={{ 
                          color: '#9d7ce8',
                          fontSize: 18,
                          lineHeight: 1
                        }}>✓</span>
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <button 
            onClick={startCheckout} 
            disabled={loading} 
            style={{ 
              padding: '16px 48px',
              background: loading ? '#666' : 'linear-gradient(135deg, #9d7ce8 0%, #7b5fc4 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 18,
              cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: '0.05em',
              boxShadow: '0 8px 24px rgba(138, 43, 226, 0.4)',
              transition: 'all 0.3s ease'
            }}
          >
            {loading ? 'PROCESSING...' : `SUBSCRIBE TO ${PLANS[plan].title}`}
          </button>
        </div>

        {error && (
          <div style={{ 
            color: '#ff6b6b',
            textAlign: 'center',
            padding: 16,
            background: 'rgba(255, 107, 107, 0.1)',
            borderRadius: 8,
            border: '1px solid rgba(255, 107, 107, 0.3)',
            marginBottom: 24
          }}>
            {error}
          </div>
        )}

        <div style={{ 
          textAlign: 'center',
          fontSize: 12,
          color: 'rgba(255, 255, 255, 0.5)',
          letterSpacing: '0.1em',
          lineHeight: 1.8
        }}>
          <div>CHOOSE A SUBSCRIPTION.</div>
          <div>AUTO-RENEWS UNTIL CANCELED.</div>
          <div>NO REFUNDS.</div>
        </div>
      </div>
    </main>
  )
}
