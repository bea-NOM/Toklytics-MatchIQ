export default function CancelPage() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Payment cancelled</h1>
      <p style={{ color: '#666' }}>No worries — your subscription wasn't changed. You can try again anytime.</p>
      <a href="/billing/upgrade" style={{ display: 'inline-block', marginTop: 12, padding: '10px 14px', background: '#ffd78f', color: '#0B1220', borderRadius: 8, textDecoration: 'none' }}>Try again</a>
    </main>
  )
}
