export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0B1220",
        color: "#fff",
        padding: "80px 24px",
      }}
    >
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <header style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: 40, fontWeight: 700, marginBottom: 16 }}>
            Toklytics – MatchIQ
          </h1>
          <p style={{ fontSize: 18, opacity: 0.8 }}>
            Intelligence-driven analytics for TikTok LIVE battles.
          </p>
        </header>

        <section
          style={{
            marginTop: 56,
            display: "grid",
            gap: 24,
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
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
            padding: 32,
            background: "rgba(10, 24, 48, 0.8)",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12 }}>
            Terms of Service
          </h2>
          <p style={{ opacity: 0.8, marginBottom: 16 }}>
            Review the latest Terms of Service for Toklytics – MatchIQ, last
            updated on January 1, 2025.
          </p>
          <a
            href="/terms"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "10px 18px",
              borderRadius: 8,
              background: "#4f8cff",
              color: "#0B1220",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            View Terms
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
        background: "rgba(14, 22, 38, 0.9)",
        borderRadius: 12,
        padding: 24,
        border: "1px solid rgba(255,255,255,0.05)",
        minHeight: 200,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h3 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>{title}</h3>
        {badge ? (
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              padding: "4px 10px",
              borderRadius: 999,
              background: "rgba(79, 140, 255, 0.2)",
              color: "#8fb7ff",
              textTransform: "uppercase",
              letterSpacing: 0.6,
            }}
          >
            {badge}
          </span>
        ) : null}
      </div>
      <p style={{ opacity: 0.85, margin: 0 }}>{description}</p>
    </div>
  );
}
