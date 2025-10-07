// app/dashboard/page.tsx
import { prisma } from '@/src/lib/prisma';
import { getViewerContext } from '@/src/lib/viewer-context';
import { Role } from '@prisma/client';
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
  const context = await getViewerContext();
  if (!context) {
    return (
      <main style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>Toklytics – Battles</h1>
        <p style={{ marginTop: 16, color: '#666' }}>
          Unable to resolve viewer context. Provide authentication headers or configure DEMO_USER_ID / DEMO_CREATOR_ID.
        </p>
      </main>
    );
  }

  // base host for webcal:// (Apple iCal)
  const h = headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const webcalBase = `webcal://${host}`;

  const accessibleCreatorIds =
    context.role === Role.ADMIN ? undefined : context.accessibleCreatorIds;

  // Upcoming battles
  const battles = await prisma.battles.findMany({
    take: 10,
    orderBy: { scheduled_at: 'asc' },
    ...(accessibleCreatorIds ? { where: { creator_id: { in: accessibleCreatorIds } } } : {}),
  });
  const creatorIds = [...new Set(battles.map(b => b.creator_id))];
  const creators = creatorIds.length
    ? await prisma.creators.findMany({ where: { id: { in: creatorIds } } })
    : [];
  const creatorById = new Map(creators.map(c => [c.id, c]));

  // Active power-ups (soonest to expire)
  const powerupWhere = accessibleCreatorIds
    ? { active: true, creator_id: { in: accessibleCreatorIds } }
    : { active: true };

  const powerups = await prisma.powerups.findMany({
    where: powerupWhere,
    orderBy: { expiry_at: 'asc' },
    take: 20,
  });
  const viewerIds = [...new Set(powerups.map(pu => pu.holder_viewer_id))];
  const puCreatorIds = [...new Set(powerups.map(pu => pu.creator_id))];

  const viewers = viewerIds.length
    ? await prisma.viewers.findMany({ where: { id: { in: viewerIds } } })
    : [];
  const creators2 = puCreatorIds.length
    ? await prisma.creators.findMany({ where: { id: { in: puCreatorIds } } })
    : [];

  const viewerById = new Map(viewers.map(v => [v.id, v]));
  const creatorById2 = new Map(creators2.map(c => [c.id, c]));

  const agencies =
    context.role === Role.AGENCY
      ? await prisma.agencies.findMany({
          where: { id: context.agencyId },
          include: {
            memberships: {
              where: { active: true },
              include: {
                creator: {
                  select: {
                    id: true,
                    display_name: true,
                    powerups: {
                      where: { active: true },
                      orderBy: { expiry_at: 'asc' },
                      select: { id: true, type: true, expiry_at: true },
                    },
                  },
                },
              },
            },
          },
        })
      : context.role === Role.ADMIN
        ? await prisma.agencies.findMany({
            take: 10,
            include: {
              memberships: {
                where: { active: true },
                include: {
                  creator: {
                    select: {
                      id: true,
                      display_name: true,
                      powerups: {
                        where: { active: true },
                        orderBy: { expiry_at: 'asc' },
                        select: { id: true, type: true, expiry_at: true },
                      },
                    },
                  },
                },
              },
            },
          })
        : [];

  // Planner insights
  const now = Date.now();
  const twentyFourHours = now + 24 * 60 * 60 * 1000;
  const seventyTwoHours = now + 72 * 60 * 60 * 1000;

  const plannerByCreator = new Map<
    string,
    {
      creatorName: string;
      total: number;
      expiring24: typeof powerups;
      expiring72: typeof powerups;
      latestExpiry?: Date;
    }
  >();

  for (const pu of powerups) {
    const bucket = plannerByCreator.get(pu.creator_id) ?? {
      creatorName: creatorById2.get(pu.creator_id)?.display_name ?? pu.creator_id,
      total: 0,
      expiring24: [] as typeof powerups,
      expiring72: [] as typeof powerups,
      latestExpiry: undefined as Date | undefined,
    };
    bucket.total += 1;
    const expiryMs = new Date(pu.expiry_at).getTime();
    if (expiryMs <= twentyFourHours) {
      bucket.expiring24.push(pu);
    } else if (expiryMs <= seventyTwoHours) {
      bucket.expiring72.push(pu);
    }
    if (!bucket.latestExpiry || expiryMs > bucket.latestExpiry.getTime()) {
      bucket.latestExpiry = new Date(pu.expiry_at);
    }
    plannerByCreator.set(pu.creator_id, bucket);
  }

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

            const icsHref = `/api/battles/${b.id}/ics`;               // plain .ics download
            const iCalHref = `${webcalBase}/api/battles/${b.id}/ics`;  // Apple Calendar via webcal://

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

      {/* Battle Planner */}
      <section style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Battle Planner</h2>
        <p style={{ color: '#666', fontSize: 14, marginBottom: 12 }}>
          Review which creators have the most inventory expiring soon to time your next match cadence.
        </p>
        <div style={{ border: '1px solid #eee', borderRadius: 16, padding: 16 }}>
          {plannerByCreator.size === 0 && <p style={{ color: '#666' }}>No active power-ups to plan around.</p>}
          {[...plannerByCreator.values()].map(bucket => {
            const makeList = (items: typeof powerups) =>
              items.slice(0, 3).map(item => {
                const viewer = viewerById.get(item.holder_viewer_id);
                const label = viewer?.display_name ?? item.holder_viewer_id.slice(0, 6);
                return `${item.type} • ${label}`;
              }).join(' · ');

            const recommendation = bucket.expiring24.length
              ? 'Run a match within 24h to capitalise on soon-to-expire boosts.'
              : bucket.expiring72.length
                ? 'Aim for a match in the next 2-3 days before inventory decays.'
                : 'Inventory is stable; schedule to keep momentum.';

            return (
              <div key={bucket.creatorName} style={{ border: '1px solid #f2f2f2', borderRadius: 12, padding: 12, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 600 }}>{bucket.creatorName}</div>
                  <div style={{ fontSize: 12, color: '#999' }}>
                    Total active: {bucket.total}
                  </div>
                </div>
                <div style={{ fontSize: 13, color: '#666', marginTop: 6 }}>
                  <strong>{bucket.expiring24.length}</strong> expiring in 24h{bucket.expiring24.length ? ` (${makeList(bucket.expiring24)})` : ''}
                </div>
                <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                  <strong>{bucket.expiring72.length}</strong> expiring in 72h{bucket.expiring72.length ? ` (${makeList(bucket.expiring72)})` : ''}
                </div>
                {bucket.latestExpiry && (
                  <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                    Latest inventory expires {rel(bucket.latestExpiry)}
                  </div>
                )}
                <div style={{ fontSize: 13, color: '#0B5FFF', marginTop: 6 }}>
                  {recommendation}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {context.role !== Role.CREATOR && (
        <section style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600 }}>Agency Overview</h2>
            <a
              href="/api/export/agencies"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 14,
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: 10,
                textDecoration: 'none',
              }}
            >
              Export CSV
            </a>
          </div>
          <div style={{ border: '1px solid #eee', borderRadius: 16, padding: 16 }}>
            {agencies.length === 0 && <p style={{ color: '#666' }}>No agencies connected yet.</p>}
            {agencies.map(agency => {
              const creators = agency.memberships.flatMap(m => (m.creator ? [m.creator] : []));

              if (creators.length === 0) {
                return (
                  <div key={agency.id} style={{ border: '1px solid #f2f2f2', borderRadius: 12, padding: 12, marginBottom: 10 }}>
                    <div style={{ fontWeight: 600 }}>{agency.name}</div>
                    <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>No active creators on roster.</div>
                  </div>
                );
              }

              const creatorSummaries = creators.map(c => {
                const total = c.powerups.length;
                const expiringSoon = c.powerups.filter(pu => new Date(pu.expiry_at).getTime() <= twentyFourHours).length;
                const expiring72 = c.powerups.filter(pu => new Date(pu.expiry_at).getTime() <= seventyTwoHours).length;
                return { id: c.id, name: c.display_name, total, expiringSoon, expiring72 };
              });

              const totalActive = creatorSummaries.reduce((sum, item) => sum + item.total, 0);

              return (
                <div key={agency.id} style={{ border: '1px solid #f2f2f2', borderRadius: 12, padding: 12, marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 600 }}>{agency.name}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>
                      Total roster inventory: {totalActive}
                    </div>
                  </div>
                  {creatorSummaries.map(summary => (
                    <div key={summary.id} style={{ fontSize: 13, color: '#666', marginTop: 6 }}>
                      <strong>{summary.name}</strong> — active {summary.total}, expiring 24h: {summary.expiringSoon}, expiring 72h: {summary.expiring72}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Active Power-Ups */}
      <section style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>Active Power-Ups</h2>
          <a
            href="/api/export/powerups"
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
          {powerups.length === 0 && <p style={{ color: '#666' }}>No active power-ups.</p>}
          {powerups.map(pu => {
            const v = viewerById.get(pu.holder_viewer_id);
            const c = creatorById2.get(pu.creator_id);
            return (
              <div key={pu.id} style={{ border: '1px solid #f2f2f2', borderRadius: 12, padding: 12, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 600 }}>{pu.type}</div>
                  <div style={{ fontSize: 12, border: '1px solid #ddd', padding: '2px 8px', borderRadius: 999 }}>
                    {pu.active ? 'Active' : 'Inactive'}
                  </div>
                </div>
                <div style={{ color: '#666', fontSize: 14 }}>
                  Creator: {c?.display_name ?? pu.creator_id}
                </div>
                <div style={{ color: '#666', fontSize: 14 }}>
                  Holder: {v?.display_name ?? pu.holder_viewer_id}
                </div>
                <div style={{ fontSize: 14 }}>
                  Expires {rel(new Date(pu.expiry_at))}
                </div>
                <div style={{ color: '#777', fontSize: 12, marginTop: 4 }}>Source: {pu.source}</div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
