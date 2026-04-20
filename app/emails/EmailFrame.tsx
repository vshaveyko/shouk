import * as React from "react";

/**
 * Developer-facing preview shell: shows the same email HTML rendered at
 * desktop width (600px inner content inside a windowed frame) and at mobile
 * width (375px frame). The email HTML itself uses inline-styled tables and
 * is string-injected via dangerouslySetInnerHTML so it stays portable.
 */
export function EmailPreview({
  title,
  subject,
  html,
}: {
  title: string;
  subject: string;
  html: string;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#eef2f7",
        fontFamily: "Inter Tight, system-ui, sans-serif",
        padding: "28px 20px",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <header style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#6b7685",
            }}
          >
            Email preview
          </div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "#17212e",
              margin: "4px 0 0",
            }}
          >
            {title}
          </h1>
          <div style={{ fontSize: 13, color: "#6b7685", marginTop: 4 }}>
            Subject: <span style={{ color: "#17212e" }}>{subject}</span>
          </div>
        </header>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2fr) minmax(320px, 1fr)",
            gap: 24,
          }}
        >
          <PreviewPane label="Desktop · 600px" width={600}>
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </PreviewPane>
          <PreviewPane label="Mobile · 375px" width={375}>
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </PreviewPane>
        </div>
      </div>
    </div>
  );
}

function PreviewPane({
  label,
  width,
  children,
}: {
  label: string;
  width: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "#6b7685",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #d8dde4",
          borderRadius: 12,
          boxShadow: "0 12px 40px -12px rgba(23, 33, 46, 0.18)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: 28,
            background: "#f4f6f9",
            borderBottom: "1px solid #e4e8ee",
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "0 10px",
          }}
        >
          <span style={dotStyle("#ff5f57")} />
          <span style={dotStyle("#febc2e")} />
          <span style={dotStyle("#28c840")} />
        </div>
        <div
          style={{
            width: "100%",
            overflowX: "auto",
            background: "#f4f6f9",
            padding: "20px 12px",
          }}
        >
          <div style={{ width, margin: "0 auto" }}>{children}</div>
        </div>
      </div>
    </div>
  );
}

function dotStyle(color: string): React.CSSProperties {
  return {
    display: "inline-block",
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: color,
  };
}
