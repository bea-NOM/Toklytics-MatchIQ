export default function SuccessPage() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Payment successful</h1>
      <p style={{ color: '#666' }}>Thanks — your subscription is active. You should now have access to Power-Up Tracking.</p>
      <a href="/dashboard" style={{ display: 'inline-block', marginTop: 12, padding: '10px 14px', background: '#0B5FFF', color: '#fff', borderRadius: 8, textDecoration: 'none' }}>Go to Dashboard</a>
    </main>
  )
}
