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
