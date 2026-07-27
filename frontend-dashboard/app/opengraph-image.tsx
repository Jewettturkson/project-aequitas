import { ImageResponse } from "next/og";

// Rendered at build/request time by Next.js and served as the
// Open Graph preview image for link shares (LinkedIn, X, Slack, iMessage).
export const runtime = "edge";
export const alt = "TurkNode — Volunteer Matching for Local Impact";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #06121f 0%, #0b1a37 55%, #123a7a 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            fontSize: 34,
            letterSpacing: 6,
            color: "#67e8f9",
            textTransform: "uppercase",
          }}
        >
          TurkNode
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 76,
            fontWeight: 800,
            lineHeight: 1.08,
            maxWidth: 980,
          }}
        >
          Build local impact through volunteers, projects, and shared action.
        </div>
        <div style={{ marginTop: 32, fontSize: 32, color: "#94a3b8" }}>
          AI-powered volunteer matching · nodeenturk.org
        </div>
      </div>
    ),
    size
  );
}
