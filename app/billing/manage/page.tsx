import { getPrismaClient } from '@/src/lib/prisma'
import { getViewerContext } from '@/src/lib/viewer-context'

export default async function ManageBilling() {
  const context = await getViewerContext()
  if (!context) {
    return <main style={{ padding: 24 }}><h1>Manage billing</h1><p>Unauthorized</p></main>
  }

  const prisma = getPrismaClient()
  const subs = await prisma.subscriptions.findMany({ where: { user_id: context.userId }, orderBy: { current_period_end: 'desc' }, take: 5 })

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Manage billing</h1>
      <p style={{ color: '#666' }}>Your active subscriptions</p>
      {subs.length === 0 && <p style={{ color: '#666' }}>No subscriptions found.</p>}
      {subs.map(s => (
        <div key={s.id} style={{ border: '1px solid #eee', padding: 12, borderRadius: 8, marginTop: 8 }}>
          <div style={{ fontWeight: 700 }}>Plan: {s.plan}</div>
          <div style={{ color: '#666' }}>Status: {s.status}</div>
          <div style={{ color: '#666' }}>Subscription id: {s.stripe_sub_id}</div>
          <form method="post" action="/api/billing/cancel-subscription" style={{ marginTop: 8 }}>
            <input type="hidden" name="subscriptionId" value={s.stripe_sub_id ?? ''} />
            <button type="submit" style={{ padding: '8px 12px', borderRadius: 8, background: '#ff6b6b', color: '#fff', border: 'none' }}>Cancel subscription</button>
          </form>
        </div>
      ))}
    </main>
  )
}
