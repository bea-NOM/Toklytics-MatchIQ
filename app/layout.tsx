import Script from "next/script";

import "./globals.css";

export const metadata = { title: "Toklytics – MatchIQ" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script src="https://js.stripe.com/clover/stripe.js" strategy="afterInteractive" />
      </head>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
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
