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

  const [frauncesItalic, interRegular] = await Promise.all([
    loadGoogleFont("Fraunces:ital,wght@1,500", headline),
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
          padding: "80px 88px",
          backgroundColor: "#111111",
          fontFamily: "Inter",
        }}
      >
        {/* Thin frame -- a quiet, editorial border rather than a graphic */}
        <div
          style={{
            position: "absolute",
            top: 36,
            left: 36,
            right: 36,
            bottom: 36,
            border: "1px solid rgba(201,164,92,0.35)",
            display: "flex",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              width: 48,
              height: 48,
              borderRadius: 999,
              border: "1px solid #c9a45c",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Fraunces",
              fontStyle: "italic",
              fontSize: 24,
              color: "#c9a45c",
            }}
          >
            C
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              color: "rgba(245,241,232,0.55)",
              letterSpacing: "0.2em",
            }}
          >
            {siteConfig.town.toUpperCase()} · {siteConfig.county.toUpperCase()}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              display: "flex",
              fontFamily: "Fraunces",
              fontStyle: "italic",
              fontSize: 92,
              fontWeight: 500,
              color: "#f5f1e8",
              lineHeight: 1.05,
              letterSpacing: "-0.01em",
            }}
          >
            {headline}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 30,
              fontWeight: 400,
              color: "rgba(245,241,232,0.5)",
              maxWidth: 820,
            }}
          >
            {siteConfig.tagline}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              border: "1px solid #c9a45c",
              color: "#c9a45c",
              fontSize: 26,
              letterSpacing: "0.04em",
              padding: "14px 30px",
            }}
          >
            {siteConfig.phone.display}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              fontWeight: 400,
              letterSpacing: "0.08em",
              color: "rgba(245,241,232,0.35)",
            }}
          >
            FREE QUOTES · FULLY INSURED · 10-YEAR GUARANTEE
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Fraunces", data: frauncesItalic, weight: 500, style: "italic" },
        { name: "Inter", data: interRegular, weight: 400, style: "normal" },
      ],
    }
  );
}
