// app/dashboard/page.tsx
import { getPrismaClient, MissingDatabaseUrlError } from '@/src/lib/prisma';
import { getViewerContext } from '@/src/lib/viewer-context';
import { resolveSubscriptionPlan, getPlanLabel, hasProAccess } from '@/src/lib/billing';
import { deriveDashboardFilters } from '@/src/lib/dashboard-filters';
import { Role, Prisma, type PrismaClient, PowerUpType } from '@prisma/client';
import { headers } from 'next/headers';
import CountdownTimer from './countdown-timer';

function rel(target: Date) {
  const diff = +target - Date.now();
  const mins = Math.round(Math.abs(diff) / 60000);
  if (mins < 1) return diff >= 0 ? 'now' : 'just now';
  if (mins < 60) return diff >= 0 ? `in ${mins} min` : `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  return diff >= 0 ? `in ${hrs} hr` : `${hrs} hr ago`;
}

const TYPE_LABELS: Record<keyof typeof PowerUpType, string> = {
  MAGIC_MIST: 'Magic Mist',
  VAULT_GLOVE: 'Vault Glove',
  NO2_BOOSTER: 'No. 2 Booster',
  NO3_BOOSTER: 'No. 3 Booster',
  STUN_HAMMER: 'Stun Hammer',
  GLOVE: 'Boosting Glove',
  TIME_MAKER: 'Time Maker',
};

const formatPowerUpType = (type: PowerUpType) =>
  TYPE_LABELS[type as keyof typeof TYPE_LABELS] ?? type;

type CapabilityHighlight = {
  title: string;
  description: string;
  proOnly?: boolean;
};

const CAPABILITIES: CapabilityHighlight[] = [
  {
    title: 'Power-Up Tracking',
    description: 'See exactly which supporters hold power-ups for each creator and when they expire.',
  },
  {
    title: 'Expiration Alerts',
    description: 'Never miss a power-up expiration with real-time countdown timers and notifications.',
    proOnly: true,
  },
  {
    title: 'Data Export',
    description: 'Export filtered data to CSV/Excel for further analysis and record keeping.',
    proOnly: true,
  },
  {
    title: 'Advanced Filtering',
    description: 'Filter power-ups by creator, expiration date, type, and supporter for precise insights.',
    proOnly: true,
  },
];

const agencyWithMembershipArgs = Prisma.validator<Prisma.agenciesDefaultArgs>()({
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
});

type AgencyWithMemberships = Prisma.agenciesGetPayload<typeof agencyWithMembershipArgs>;

type DashboardProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function Dashboard({ searchParams = {} }: DashboardProps) {
  let prisma: PrismaClient;
  try {
    prisma = getPrismaClient();
  } catch (error) {
    if (error instanceof MissingDatabaseUrlError) {
      return (
        <main style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Toklytics – Battles</h1>
          <p style={{ marginTop: 16, color: '#666' }}>
            Database connection is not configured. Set the DATABASE_URL environment variable to view the dashboard.
          </p>
        </main>
      );
    }
    throw error;
  }

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

  const plan = await resolveSubscriptionPlan(prisma, context);
  const planLabel = getPlanLabel(plan);
  const proEnabled = hasProAccess(plan);

  // base host for webcal:// (Apple iCal)
  const h = headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const webcalBase = `webcal://${host}`;

  const accessibleCreatorIds =
    context.role === Role.ADMIN ? undefined : context.accessibleCreatorIds;

  const filterState = deriveDashboardFilters(searchParams, proEnabled);
  const rawFilters = filterState.rawFilters;
  const normalizedTypeFilter = filterState.normalizedTypeFilter;
  const {
    creatorFilter,
    supporterFilter,
    typeFilter,
    expiresAfter,
    expiresBefore,
  } = filterState.parsedFilters;

  const powerupTypeOptions = Object.keys(PowerUpType) as Array<keyof typeof PowerUpType>;

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
  const powerupConditions: Prisma.powerupsWhereInput[] = [{ active: true }];

  if (accessibleCreatorIds) {
    powerupConditions.push({ creator_id: { in: accessibleCreatorIds } });
  }

  if (proEnabled) {
    if (creatorFilter) {
      powerupConditions.push({
        OR: [
          { creator_id: creatorFilter },
          {
            creator: {
              display_name: { contains: creatorFilter, mode: 'insensitive' },
            },
          },
        ],
      });
    }

    if (supporterFilter) {
      powerupConditions.push({
        OR: [
          { holder_viewer_id: supporterFilter },
          {
            holder: {
              display_name: { contains: supporterFilter, mode: 'insensitive' },
            },
          },
        ],
      });
    }

    if (typeFilter && typeFilter in PowerUpType) {
      powerupConditions.push({ type: typeFilter as PowerUpType });
    }

    if (expiresAfter || expiresBefore) {
      powerupConditions.push({
        expiry_at: {
          ...(expiresAfter ? { gte: expiresAfter } : {}),
          ...(expiresBefore ? { lte: expiresBefore } : {}),
        },
      });
    }
  }

  const powerupWhere =
    powerupConditions.length === 1
      ? powerupConditions[0]
      : { AND: powerupConditions };

  const powerups = await prisma.powerups.findMany({
    where: powerupWhere,
    orderBy: { expiry_at: 'asc' },
    take: proEnabled ? 100 : 20,
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

  let agencies: AgencyWithMemberships[];
  if (context.role === Role.AGENCY && 'agencyId' in context) {
    agencies = await prisma.agencies.findMany({
      ...agencyWithMembershipArgs,
      where: { id: context.agencyId },
    });
  } else if (context.role === Role.ADMIN) {
    agencies = await prisma.agencies.findMany({
      ...agencyWithMembershipArgs,
      take: 10,
    });
  } else {
    agencies = [];
  }

  // Planner insights
  const now = Date.now();
  const twentyFourHours = now + 24 * 60 * 60 * 1000;
  const seventyTwoHours = now + 72 * 60 * 60 * 1000;
  const expiringSoon = proEnabled
    ? powerups.filter(pu => {
        const expiryMs =
          pu.expiry_at instanceof Date ? pu.expiry_at.getTime() : new Date(pu.expiry_at).getTime();
        return expiryMs >= now && expiryMs <= twentyFourHours;
      })
    : [];

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
      <header style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span
            style={{
              fontSize: 13,
              letterSpacing: 0.4,
              textTransform: 'uppercase',
              color: '#4a5a88',
            }}
          >
            Toklytics — Battles
          </span>
          <h1 style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.2 }}>
            Everything you need to win TikTok battles
          </h1>
          <p style={{ color: '#445065', fontSize: 15, maxWidth: 640 }}>
            Comprehensive tools designed specifically for TikTok battle preparation. Stay organized, track power-ups, and never miss a match.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: 12,
              letterSpacing: 0.6,
              textTransform: 'uppercase',
              padding: '4px 10px',
              borderRadius: 999,
              border: '1px solid #ddd',
              color: '#0B1220',
              background: '#f4f6fb',
            }}
          >
            Plan: {planLabel}
          </span>
          {!proEnabled && (
            <span style={{ fontSize: 13, color: '#0B5FFF' }}>
              Upgrade to Pro for countdown alerts, exports, and advanced filtering.
            </span>
          )}
        </div>
      </header>

      <section style={{ marginTop: 24 }}>
        <div
          style={{
            display: 'grid',
            gap: 16,
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          }}
        >
          {CAPABILITIES.map(capability => {
            const locked = capability.proOnly && !proEnabled;
            return (
              <div
                key={capability.title}
                style={{
                  border: '1px solid #e4e8f5',
                  borderRadius: 14,
                  padding: 16,
                  background: locked ? '#f9f9fc' : '#f4f7ff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 600, color: '#0B1220' }}>{capability.title}</span>
                  {capability.proOnly && (
                    <span
                      style={{
                        fontSize: 11,
                        textTransform: 'uppercase',
                        letterSpacing: 0.6,
                        padding: '2px 8px',
                        borderRadius: 999,
                        border: '1px solid',
                        borderColor: proEnabled ? '#bfd0ff' : '#d4d8e5',
                        background: proEnabled ? '#e9f0ff' : '#f2f3f8',
                        color: proEnabled ? '#0B5FFF' : '#6b7591',
                      }}
                    >
                      Pro only
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 13, color: locked ? '#7f889f' : '#4a5a88', lineHeight: 1.5 }}>
                  {capability.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

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
                return `${formatPowerUpType(item.type as PowerUpType)} • ${label}`;
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

      {/* Expiration Alerts */}
      <section style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>Expiration Alerts</h2>
          <span
            style={{
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: 0.6,
              color: proEnabled ? '#0B5FFF' : '#999',
            }}
          >
            {proEnabled ? 'Real-time countdowns' : 'Pro feature'}
          </span>
        </div>
        <div style={{ border: '1px solid #eee', borderRadius: 16, padding: 16 }}>
          {proEnabled ? (
            expiringSoon.length === 0 ? (
              <p style={{ color: '#666' }}>No power-ups expiring in the next 24 hours.</p>
            ) : (
              expiringSoon.map(pu => {
                const holder = viewerById.get(pu.holder_viewer_id);
                const creator = creatorById2.get(pu.creator_id);
                return (
                  <div key={pu.id} style={{ border: '1px solid #f2f2f2', borderRadius: 12, padding: 12, marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                      <div style={{ fontWeight: 600 }}>
                        {formatPowerUpType(pu.type)}
                      </div>
                      <CountdownTimer target={pu.expiry_at} />
                    </div>
                    <div style={{ fontSize: 13, color: '#666', marginTop: 6 }}>
                      Creator: {creator?.display_name ?? pu.creator_id}
                    </div>
                    <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                      Supporter: {holder?.display_name ?? pu.holder_viewer_id}
                    </div>
                    <div style={{ fontSize: 12, color: '#777', marginTop: 4 }}>
                      Awarded {rel(new Date(pu.awarded_at))}
                    </div>
                  </div>
                );
              })
            )
          ) : (
            <p style={{ color: '#666' }}>
              Upgrade to Pro to unlock real-time expiration countdowns and notifications for your roster.
            </p>
          )}
        </div>
      </section>

      {context.role !== Role.CREATOR && (
        <section style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600 }}>Agency Overview</h2>
            {proEnabled ? (
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
            ) : (
              <span style={{ fontSize: 13, color: '#999' }}>Upgrade to export agency rosters</span>
            )}
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
          {proEnabled ? (
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
          ) : (
            <span style={{ fontSize: 13, color: '#999' }}>Upgrade to export inventory</span>
          )}
        </div>

        {proEnabled ? (
          <form
            method="get"
            style={{
              display: 'grid',
              gap: 12,
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              border: '1px solid #eee',
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
              background: '#fafbff',
            }}
          >
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: '#555' }}>
              <span>Creator</span>
              <input
                type="text"
                name="creator"
                placeholder="Name or ID"
                defaultValue={rawFilters.creator}
                style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: '#555' }}>
              <span>Supporter</span>
              <input
                type="text"
                name="supporter"
                placeholder="Name or ID"
                defaultValue={rawFilters.supporter}
                style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: '#555' }}>
              <span>Type</span>
              <select
                name="type"
                defaultValue={normalizedTypeFilter}
                style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd' }}
              >
                <option value="">All types</option>
                {powerupTypeOptions.map(option => (
                  <option key={option} value={option}>
                    {TYPE_LABELS[option]}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: '#555' }}>
              <span>Expires After</span>
              <input
                type="datetime-local"
                name="expiresAfter"
                defaultValue={rawFilters.expiresAfter}
                style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: '#555' }}>
              <span>Expires Before</span>
              <input
                type="datetime-local"
                name="expiresBefore"
                defaultValue={rawFilters.expiresBefore}
                style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd' }}
              />
            </label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <button
                type="submit"
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#0B5FFF',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Apply filters
              </button>
              <a
                href="/dashboard"
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: '1px solid #ddd',
                  background: '#fff',
                  color: '#0B1220',
                  fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                Reset
              </a>
            </div>
          </form>
        ) : (
          <div
            style={{
              marginBottom: 16,
              border: '1px dashed #ccd4eb',
              borderRadius: 12,
              padding: 16,
              background: '#f7f9ff',
              color: '#4a5a88',
              fontSize: 13,
            }}
          >
            Advanced filtering is part of the Pro toolkit. Upgrade to sift by creator, supporter, type, or expiration.
          </div>
        )}

        <div style={{ border: '1px solid #eee', borderRadius: 16, padding: 16 }}>
          {powerups.length === 0 && <p style={{ color: '#666' }}>No active power-ups.</p>}
          {powerups.map(pu => {
            const v = viewerById.get(pu.holder_viewer_id);
            const c = creatorById2.get(pu.creator_id);
            return (
              <div key={pu.id} style={{ border: '1px solid #f2f2f2', borderRadius: 12, padding: 12, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 600 }}>{formatPowerUpType(pu.type)}</div>
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
                  {proEnabled ? (
                    <>
                      Expires in <CountdownTimer target={pu.expiry_at} />
                    </>
                  ) : (
                    <>Expires {rel(new Date(pu.expiry_at))}</>
                  )}
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
