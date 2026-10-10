import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function loadGoogleFont(font: string, text: string) {
  "use cache";

  const url = `https://fonts.googleapis.com/css2?family=${font}&text=${encodeURIComponent(
    text
  )}`;
  const css = await (await fetch(url)).text();
  const match = css.match(
    /src: url\(([^)]+)\) format\('(opentype|truetype)'\)/
  );

  if (match) {
    const response = await fetch(match[1]);
    if (response.status === 200) {
      return response.arrayBuffer();
    }
  }

  throw new Error(`Failed to load font data for ${font}`);
}

export default async function Image() {
  const headline = siteConfig.name;
  const bodyText = `${siteConfig.tagline} ${siteConfig.phone.display} ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 •,`;

  const [soraBold, interRegular] = await Promise.all([
    loadGoogleFont("Sora:wght@700", headline),
    loadGoogleFont("Inter:wght@400", bodyText),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          backgroundColor: "#0c1f3d",
          backgroundImage:
            "radial-gradient(circle at 85% 18%, rgba(240,114,28,0.35), rgba(240,114,28,0) 45%)",
          fontFamily: "Inter",
        }}
      >
        {/* Decorative rooflines */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
          }}
        >
          <svg
            width="1200"
            height="630"
            viewBox="0 0 1200 630"
            style={{ position: "absolute", top: 0, left: 0 }}
          >
            <polyline
              points="0,420 180,300 360,420 540,280 720,420 900,320 1080,420 1260,300"
              fill="none"
              stroke="#f0721c"
              strokeOpacity="0.25"
              strokeWidth="6"
            />
            <polyline
              points="-60,500 140,380 340,500 540,360 740,500 940,390 1140,500"
              fill="none"
              stroke="#ffffff"
              strokeOpacity="0.08"
              strokeWidth="6"
            />
          </svg>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              display: "flex",
              width: 56,
              height: 56,
              borderRadius: 14,
              backgroundColor: "#f0721c",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="30" height="30" viewBox="0 0 64 64">
              <path
                d="M32 14 L52 32 H44 V48 H20 V32 H12 Z"
                fill="#0c1f3d"
              />
            </svg>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 30,
              color: "#f7f5f1",
              letterSpacing: "0.02em",
            }}
          >
            {siteConfig.town.toUpperCase()} · {siteConfig.county.toUpperCase()}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              display: "flex",
              fontFamily: "Sora",
              fontSize: 96,
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.02,
              letterSpacing: "-0.02em",
            }}
          >
            {headline}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 34,
              fontWeight: 400,
              color: "#cbd5e1",
              maxWidth: 900,
            }}
          >
            {siteConfig.tagline}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              backgroundColor: "#f0721c",
              color: "#0c1f3d",
              fontSize: 30,
              padding: "16px 32px",
              borderRadius: 999,
            }}
          >
            {siteConfig.phone.display}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              fontWeight: 400,
              color: "#9fb0c9",
            }}
          >
            Free Quotes · Fully Insured · 10-Year Guarantee
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Sora", data: soraBold, weight: 700, style: "normal" },
        { name: "Inter", data: interRegular, weight: 400, style: "normal" },
      ],
    }
  );
}
