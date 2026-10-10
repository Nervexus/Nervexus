import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import { siteConfig } from "@/config/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
  weight: ["600", "700", "800"],
});

const title = `${siteConfig.name} | Roofers in ${siteConfig.town}, ${siteConfig.county}`;
const description = `${siteConfig.tagline}. Roof repairs, new roofs, flat roofs, guttering and emergency call-outs across ${siteConfig.areasCovered.join(", ")}. Free, no-obligation quotes.`;

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: {
    default: title,
    template: `%s | ${siteConfig.name}`,
  },
  description,
  // This is a sales/demo site, not a real business — keep it out of search
  // results entirely. Belt-and-braces with app/robots.ts.
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: siteConfig.siteUrl,
    siteName: siteConfig.name,
    title,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export const viewport: Viewport = {
  themeColor: siteConfig.colors.navy,
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB" className={`${inter.variable} ${sora.variable}`}>
      <body className="min-h-dvh bg-cream font-sans text-navy-950 antialiased">
        {children}
      </body>
    </html>
  );
}
