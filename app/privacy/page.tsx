export default function Privacy() {
  return (
    <main style={{maxWidth:900,margin:'0 auto',padding:24,lineHeight:1.6}}>
      <h1 style={{fontSize:28,fontWeight:700}}>Privacy Policy</h1>
      <p><strong>Company:</strong> TPC Global LLC — Toklytics – Battles</p>
      <p><strong>Contact:</strong> support@toklytics.net</p>
      <h2>What we collect</h2>
      <ul>
        <li>Account info (email, handle)</li>
        <li>App usage (e.g., battles, power-up metadata)</li>
        <li>Billing data via Stripe (stored by Stripe)</li>
      </ul>
      <h2>How we use it</h2>
      <p>Provide the service, billing, security, support, and analytics.</p>
      <h2>Sharing</h2>
      <p>Service providers (e.g., Stripe). We don’t sell personal data.</p>
      <h2>Security</h2>
      <p>Industry-standard controls; no method is 100% secure.</p>
      <h2>Your choices</h2>
      <p>Cancel subscription anytime; contact us to request deletion.</p>
      <h2>Changes</h2>
      <p>We’ll update this page when policies change.</p>
    </main>
  )
}