export default function NotFound() {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          margin: 0,
          padding: "1rem",
          textAlign: "center",
          backgroundColor: "#022c22",
          color: "#f0fdf4",
        }}
      >
        <div style={{ maxWidth: "420px", padding: "2rem", borderRadius: "1rem", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)" }}>
          <div style={{ fontSize: "3rem", fontWeight: "800", color: "#34d399", marginBottom: "0.5rem" }}>404</div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "0.5rem" }}>Page Not Found</h1>
          <p style={{ color: "#a7f3d0", fontSize: "0.875rem", marginBottom: "1.5rem", lineHeight: "1.5" }}>
            The page you requested could not be found or may have moved.
          </p>
          <a
            href="/en"
            style={{
              display: "inline-block",
              backgroundColor: "#059669",
              color: "#ffffff",
              padding: "0.625rem 1.25rem",
              borderRadius: "0.5rem",
              textDecoration: "none",
              fontWeight: "600",
              fontSize: "0.875rem",
            }}
          >
            Return to ScholarAI Home
          </a>GIT 
        </div>
      </body>
    </html>
  );
}
