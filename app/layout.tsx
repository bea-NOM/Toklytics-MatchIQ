import "./globals.css";

import { getViewerContext } from "@/src/lib/viewer-context";
import { getPrismaClient } from '@/src/lib/prisma'
import { resolveSubscriptionPlan, hasProAccess } from '@/src/lib/billing'

export const metadata = { title: "Toklytics – MatchIQ" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Server-side: resolve viewer and plan to conditionally render header controls
  const context = await getViewerContext()
  let pro = false
  try {
    const prisma = getPrismaClient()
    const plan = await resolveSubscriptionPlan(prisma, context)
    pro = hasProAccess(plan)
  } catch (err) {
    // If DB not configured, default to non-pro; header will be minimal
    pro = false
  }

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        <header style={{ padding: 16, borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <a href="/" style={{ fontWeight: 700, fontSize: 18, color: 'inherit', textDecoration: 'none' }}>Toklytics — Battles</a>
          </div>
          <nav style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {pro ? (
              <a href="/dashboard" style={{ padding: '8px 12px', borderRadius: 8, background: '#0B5FFF', color: '#fff', textDecoration: 'none', fontWeight: 600 }}>Dashboard</a>
            ) : (
              <a href="/billing/upgrade" style={{ padding: '8px 12px', borderRadius: 8, background: '#ffd78f', color: '#0B1220', textDecoration: 'none', fontWeight: 700 }}>Upgrade $5.99</a>
            )}
            <a href="/privacy" style={{ color: '#444', textDecoration: 'none' }}>Privacy</a>
            <a href="/terms" style={{ color: '#444', textDecoration: 'none' }}>Terms</a>
          </nav>
        </header>

        <div style={{ flex: 1 }}>{children}</div>
        <footer
          style={{
            padding: "16px",
            fontSize: 14,
            textAlign: "center",
            borderTop: "1px solid rgba(0,0,0,0.08)",
            background: "#f9fafb",
          }}
        >
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "inherit", textDecoration: "underline" }}
          >
            Terms &amp; Conditions
          </a>
        </footer>
      </body>
    </html>
  );
}
