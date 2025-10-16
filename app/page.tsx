export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0e1a 0%, #1a1f35 50%, #0a0e1a 100%)",
        color: "#fff",
        padding: "80px 24px",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Decorative background elements */}
      <div style={{
        position: 'absolute',
        top: '15%',
        right: '10%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(138, 43, 226, 0.12) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(70px)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '20%',
        left: '5%',
        width: '350px',
        height: '350px',
        background: 'radial-gradient(circle, rgba(75, 0, 130, 0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        pointerEvents: 'none'
      }} />

      <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <header style={{ textAlign: "center", marginBottom: 80 }}>
          <h1 style={{ 
            fontSize: 56, 
            fontWeight: 800, 
            marginBottom: 20,
            letterSpacing: '0.02em',
            background: 'linear-gradient(135deg, #fff 0%, #9d7ce8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Toklytics – MatchIQ
          </h1>
          <p style={{ 
            fontSize: 20, 
            opacity: 0.85,
            maxWidth: 600,
            margin: '0 auto',
            lineHeight: 1.6
          }}>
            The ultimate power-up tracker for LIVE battles.
          </p>
        </header>

        <section
          style={{
            marginTop: 56,
            display: "grid",
            gap: 28,
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            marginBottom: 80
          }}
        >
          <FeatureCard
            title="Power-Up Tracking"
            description="See exactly which supporters hold power-ups for each creator and when they expire."
          />
          <FeatureCard
            title="Expiration Alerts"
            badge="Pro only"
            description="Never miss a power-up expiration with real-time countdown timers and notifications."
          />
          <FeatureCard
            title="Data Export"
            badge="Pro only"
            description="Export filtered data to CSV or Excel for deeper analysis and record keeping."
          />
          <FeatureCard
            title="Advanced Filtering"
            badge="Pro only"
            description="Filter power-ups by creator, expiration date, type, and supporter for precise insights."
          />
        </section>

        {/* Dashboard Preview Section */}
        <section style={{ marginTop: 80, marginBottom: 80 }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ 
              fontSize: 42, 
              fontWeight: 800, 
              marginBottom: 16,
              letterSpacing: '0.02em',
              background: 'linear-gradient(135deg, #fff 0%, #9d7ce8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Your Pro Dashboard
            </h2>
            <p style={{ fontSize: 18, opacity: 0.85, maxWidth: 700, margin: '0 auto' }}>
              Get a complete view of all power-ups, expiration times, and battle analytics in one powerful interface.
            </p>
          </div>

          <div style={{
            background: "rgba(26, 31, 53, 0.6)",
            borderRadius: 20,
            border: "1px solid rgba(157, 124, 232, 0.3)",
            backdropFilter: "blur(10px)",
            padding: 32,
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Mock Dashboard Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 32,
              paddingBottom: 24,
              borderBottom: '1px solid rgba(157, 124, 232, 0.2)'
            }}>
              <div>
                <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Power-Up Inventory</h3>
                <p style={{ fontSize: 14, opacity: 0.7, margin: 0 }}>Track all active power-ups in real-time</p>
              </div>
              <div style={{ 
                display: 'flex', 
                gap: 12,
                flexWrap: 'wrap'
              }}>
                <button style={{
                  padding: '8px 16px',
                  background: 'rgba(157, 124, 232, 0.15)',
                  border: '1px solid rgba(157, 124, 232, 0.3)',
                  borderRadius: 8,
                  color: '#c4a9ff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}>
                  Filter
                </button>
                <button style={{
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #9d7ce8 0%, #7b5fc4 100%)',
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}>
                  Export CSV
                </button>
              </div>
            </div>

            {/* Mock Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ 
                    borderBottom: '1px solid rgba(157, 124, 232, 0.2)',
                    textAlign: 'left'
                  }}>
                    <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#9d7ce8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Supporter</th>
                    <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#9d7ce8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Power-Up</th>
                    <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#9d7ce8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Expires In</th>
                    <th style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#9d7ce8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { supporter: '@sarah_battles', powerup: 'Magic Mist', time: '2h 34m', status: 'Active', statusColor: '#4ade80' },
                    { supporter: '@mike_gaming', powerup: 'Vault Glove', time: '5h 12m', status: 'Active', statusColor: '#4ade80' },
                    { supporter: '@fan_supporter', powerup: 'Time Maker', time: '23m', status: 'Expiring', statusColor: '#fb923c' },
                    { supporter: '@top_donor', powerup: 'Stun Hammer', time: '1d 4h', status: 'Active', statusColor: '#4ade80' },
                    { supporter: '@battle_king', powerup: 'No.2 Booster', time: '45m', status: 'Expiring', statusColor: '#fb923c' },
                    { supporter: '@loyal_fan', powerup: 'Glove', time: '3h 18m', status: 'Active', statusColor: '#4ade80' },
                  ].map((row, i) => (
                    <tr key={i} style={{ 
                      borderBottom: i < 5 ? '1px solid rgba(157, 124, 232, 0.1)' : 'none',
                      transition: 'background 0.2s'
                    }}>
                      <td style={{ padding: '16px', fontSize: 14, fontWeight: 600 }}>{row.supporter}</td>
                      <td style={{ padding: '16px', fontSize: 14 }}>{row.powerup}</td>
                      <td style={{ padding: '16px', fontSize: 14, fontWeight: 600, color: row.statusColor }}>{row.time}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 600,
                          background: `${row.statusColor}20`,
                          color: row.statusColor
                        }}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pro Badge */}
            <div style={{
              position: 'absolute',
              top: 20,
              right: 20,
              padding: '6px 14px',
              background: 'linear-gradient(135deg, #9d7ce8 0%, #7b5fc4 100%)',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              boxShadow: '0 4px 12px rgba(138, 43, 226, 0.4)'
            }}>
              Pro Feature
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <a
              href="/billing/upgrade"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "16px 48px",
                borderRadius: 12,
                background: "linear-gradient(135deg, #9d7ce8 0%, #7b5fc4 100%)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 18,
                textDecoration: "none",
                letterSpacing: '0.05em',
                boxShadow: '0 8px 24px rgba(138, 43, 226, 0.4)',
                transition: 'all 0.3s ease'
              }}
            >
              UPGRADE TO PRO
            </a>
          </div>
        </section>

        <section
          style={{
            marginTop: 64,
            padding: 40,
            background: "rgba(26, 31, 53, 0.6)",
            borderRadius: 20,
            border: "1px solid rgba(157, 124, 232, 0.3)",
            backdropFilter: "blur(10px)",
            textAlign: "center"
          }}
        >
          <h2 style={{ 
            fontSize: 28, 
            fontWeight: 700, 
            marginBottom: 16,
            letterSpacing: '0.05em'
          }}>
            Terms of Service
          </h2>
          <p style={{ 
            opacity: 0.85, 
            marginBottom: 24,
            maxWidth: 600,
            margin: '0 auto 24px'
          }}>
            Review the latest Terms of Service for Toklytics – MatchIQ, last
            updated on January 1, 2025.
          </p>
          <a
            href="/terms"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "14px 32px",
              borderRadius: 12,
              background: "linear-gradient(135deg, #9d7ce8 0%, #7b5fc4 100%)",
              color: "#fff",
              fontWeight: 600,
              textDecoration: "none",
              letterSpacing: '0.05em',
              boxShadow: '0 8px 24px rgba(138, 43, 226, 0.4)',
              transition: 'all 0.3s ease'
            }}
          >
            VIEW TERMS
          </a>
        </section>
      </div>
    </main>
  );
}

type FeatureCardProps = {
  title: string;
  description: string;
  badge?: string;
};

function FeatureCard({ title, description, badge }: FeatureCardProps) {
  return (
    <div
      style={{
        background: "rgba(26, 31, 53, 0.6)",
        borderRadius: 16,
        padding: 28,
        border: "1px solid rgba(157, 124, 232, 0.3)",
        backdropFilter: "blur(10px)",
        minHeight: 200,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Card shine effect on hover */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '100%',
        background: 'linear-gradient(180deg, rgba(157, 124, 232, 0.05) 0%, transparent 100%)',
        pointerEvents: 'none'
      }} />
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <h3 style={{ 
            fontSize: 20, 
            fontWeight: 700, 
            margin: 0,
            letterSpacing: '0.02em'
          }}>
            {title}
          </h3>
          {badge ? (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: 999,
                background: "rgba(157, 124, 232, 0.25)",
                color: "#c4a9ff",
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              {badge}
            </span>
          ) : null}
        </div>
        <p style={{ 
          opacity: 0.85, 
          margin: 0,
          lineHeight: 1.6,
          fontSize: 15
        }}>
          {description}
        </p>
      </div>
    </div>
  );
}
