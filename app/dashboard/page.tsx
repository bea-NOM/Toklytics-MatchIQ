// app/dashboard/page.tsx
import { prisma } from '@/src/lib/prisma';
// import { prisma } from '../../src/lib/prisma';
import { headers } from 'next/headers';

function rel(target: Date) {
  const diff = +target - Date.now();
  const mins = Math.round(Math.abs(diff) / 60000);
  if (mins < 1) return diff >= 0 ? 'now' : 'just now';
  if (mins < 60) return diff >= 0 ? `in ${mins} min` : `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  return diff >= 0 ? `in ${hrs} hr` : `${hrs} hr ago`;
}

export default async function Dashboard() {
  // base host for webcal:// (Apple iCal)
  const h = headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const webcalBase = `webcal://${host}`;

  // Upcoming battles
  const battles = await prisma.battles.findMany({
    take: 10,
    orderBy: { scheduled_at: 'asc' },
  });
  const creatorIds = [...new Set(battles.map(b => b.creator_id))];
  const creators = creatorIds.length
    ? await prisma.creators.findMany({ where: { id: { in: creatorIds } } })
    : [];
  const creatorById = new Map(creators.map(c => [c.id, c]));

  // Active boosters (soonest to expire)
  const boosters = await prisma.boosters.findMany({
    where: { active: true },
    orderBy: { expiry_at: 'asc' },
    take: 20,
  });
  const viewerIds = [...new Set(boosters.map(bt => bt.holder_viewer_id))];
  const boosterCreatorIds = [...new Set(boosters.map(bt => bt.creator_id))];
  const viewers = viewerIds.length
    ? await prisma.viewers.findMany({ where: { id: { in: viewerIds } } })
    : [];
  const creators2 = boosterCreatorIds.length
    ? await prisma.creators.findMany({ where: { id: { in: boosterCreatorIds } } })
    : [];
  const viewerById = new Map(viewers.map(v => [v.id, v]));
  const creatorById2 = new Map(creators2.map(c => [c.id, c]));

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <header>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>Toklytics – Battles</h1>
        <p style={{ color: '#666' }}>Power-up visibility & battle planning</p>
      </header>

      {/* Upcoming Battles */}
      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Upcoming Battles</h2>
        <div style={{ border: '1px solid #eee', borderRadius: 16, padding: 16 }}>
          {battles.length === 0 && <p style={{ color: '#666' }}>No upcoming battles yet.</p>}
          {battles.map(b => {
            const c = creatorById.get(b.creator_id);

            // Quick calendar links
            const start = new Date(b.scheduled_at);
            const end = new Date(start.getTime() + 30 * 60 * 1000);
            const toCal = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

            const gcal =
              `https://calendar.google.com/calendar/render?action=TEMPLATE` +
              `&text=${encodeURIComponent(b.title)}` +
              `&dates=${toCal(start)}/${toCal(end)}` +
              `&details=${encodeURIComponent('Toklytics – Battles')}`;

            const outlook =
              `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent` +
              `&subject=${encodeURIComponent(b.title)}` +
              `&body=${encodeURIComponent('Toklytics – Battles')}` +
              `&startdt=${encodeURIComponent(start.toISOString())}` +
              `&enddt=${encodeURIComponent(end.toISOString())}`;

            const icsHref = `/api/battles/${b.id}/ics`;              // plain .ics download
            const iCalHref = `${webcalBase}/api/battles/${b.id}/ics`; // Apple Calendar via webcal://

            return (
              <div key={b.id} style={{ border: '1px solid #f2f2f2', borderRadius: 12, padding: 12, marginBottom: 10 }}>
                <div style={{ fontWeight: 600 }}>{b.title}</div>
                <div style={{ color: '#666', fontSize: 14 }}>
                  Creator: {c?.display_name ?? b.creator_id}
                </div>
                <div style={{ fontSize: 14 }}>
                  Starts {rel(new Date(b.scheduled_at))}
                </div>
                {b.notes && <div style={{ color: '#666', fontSize: 13, marginTop: 6 }}>Notes: {b.notes}</div>}

                {/* Calendar options */}
                <div style={{ marginTop: 8, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <a href={icsHref} download={`battle-${b.id}.ics`} style={{ fontSize: 13 }}>
                    Download .ics
                  </a>
                  <a href={gcal} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>
                    Add to Google
                  </a>
                  <a href={outlook} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>
                    Add to Outlook
                  </a>
                  <a href={iCalHref} style={{ fontSize: 13 }}>
                    Add to iCal
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Active Boosters */}
      <section style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>Active Boosters</h2>
          <a
            href="/api/export/boosters"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 14,
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: 10,
              textDecoration: 'none'
            }}
          >
            Export CSV
          </a>
        </div>

        <div style={{ border: '1px solid #eee', borderRadius: 16, padding: 16 }}>
          {boosters.length === 0 && <p style={{ color: '#666' }}>No active boosters.</p>}
          {boosters.map(bt => {
            const v = viewerById.get(bt.holder_viewer_id);
            const c = creatorById2.get(bt.creator_id);
            return (
              <div key={bt.id} style={{ border: '1px solid #f2f2f2', borderRadius: 12, padding: 12, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 600 }}>{bt.type}</div>
                  <div style={{ fontSize: 12, border: '1px solid #ddd', padding: '2px 8px', borderRadius: 999 }}>
                    {bt.active ? 'Active' : 'Inactive'}
                  </div>
                </div>
                <div style={{ color: '#666', fontSize: 14 }}>
                  Creator: {c?.display_name ?? bt.creator_id}
                </div>
                <div style={{ color: '#666', fontSize: 14 }}>
                  Holder: {v?.display_name ?? bt.holder_viewer_id}
                </div>
                <div style={{ fontSize: 14 }}>
                  Expires {rel(new Date(bt.expiry_at))}
                </div>
                <div style={{ color: '#777', fontSize: 12, marginTop: 4 }}>Source: {bt.source}</div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
