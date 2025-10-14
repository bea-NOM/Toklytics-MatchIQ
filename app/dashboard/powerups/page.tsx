import { getPrismaClient, MissingDatabaseUrlError } from '@/src/lib/prisma'
import { getViewerContext } from '@/src/lib/viewer-context'
import { Role } from '@prisma/client'

export default async function PowerupEventsDashboard({ searchParams = {} }: { searchParams?: Record<string, string> }) {
  let prisma
  try {
    prisma = getPrismaClient()
  } catch (err) {
    if (err instanceof MissingDatabaseUrlError) {
      return <main style={{ padding: 24 }}><h1>Powerups</h1><p>Database not configured.</p></main>
    }
    throw err
  }

  const context = await getViewerContext()
  if (!context) {
    return <main style={{ padding: 24 }}><h1>Powerups</h1><p>Unauthorized</p></main>
  }

  const where: any = {}
  if (context.role !== Role.ADMIN && context.accessibleCreatorIds) {
    where.creatorId = { in: context.accessibleCreatorIds }
  }

  // basic filters from query
  if (searchParams.creatorId) where.creatorId = String(searchParams.creatorId)
  if (searchParams.contributorId) where.contributorId = String(searchParams.contributorId)
  if (searchParams.type) where.type = String(searchParams.type)

  const page = Math.max(1, Number(searchParams.page || 1))
  const pageSize = Math.min(500, Math.max(10, Number(searchParams.pageSize || 50)))

  const [total, events] = await Promise.all([
    prisma.powerupEvent.count({ where }),
    prisma.powerupEvent.findMany({ where, orderBy: { ts: 'desc' }, take: pageSize, skip: (page - 1) * pageSize }),
  ])

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Powerup Events</h1>
      <p style={{ color: '#666' }}>{total} events (showing {events.length})</p>
      <div style={{ marginTop: 8 }}>
        <a href={`/api/export/powerup-events?${new URLSearchParams({ ...(searchParams as Record<string,string>) })}`} style={{ fontSize: 13 }}>Export CSV</a>
      </div>
      <div style={{ marginTop: 16 }}>
  {events.length === 0 && <p style={{ color: '#666' }}>No events recorded.</p>}
        {events.map(e => (
          <div key={e.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12, marginBottom: 8 }}>
            <div style={{ fontWeight: 600 }}>{e.action} — {e.type}</div>
            <div style={{ color: '#666' }}>match: {e.matchId} • creator: {e.creatorId} • contributor: {e.contributorId}</div>
            <div style={{ color: '#777', fontSize: 12 }}>{new Date(e.ts).toLocaleString()}</div>
            {e.expiresAt && <div style={{ color: '#777', fontSize: 12 }}>expires: {new Date(e.expiresAt).toLocaleString()}</div>}
          </div>
        ))}

        {/* Pagination controls */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {page > 1 ? (
            <a href={`?${new URLSearchParams({ ...(searchParams as Record<string,string>), page: String(page-1), pageSize: String(pageSize) })}`}>← Prev</a>
          ) : (<span style={{ color: '#999' }}>← Prev</span>)}
          { (page * pageSize) < total ? (
            <a href={`?${new URLSearchParams({ ...(searchParams as Record<string,string>), page: String(page+1), pageSize: String(pageSize) })}`}>Next →</a>
          ) : (<span style={{ color: '#999' }}>Next →</span>)}
          <span style={{ marginLeft: 8, color: '#666' }}>Page {page} · {pageSize} per page</span>
        </div>
      </div>
    </main>
  )
}
