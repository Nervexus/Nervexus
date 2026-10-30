import type { Metadata, Viewport } from "next";
import { Manrope, Geist_Mono } from "next/font/google";
import { Vignette } from "@/components/background/Vignette";
import { NoiseOverlay } from "@/components/background/NoiseOverlay";
import { IconifyRegister } from "@/components/IconifyRegister";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const viewport: Viewport = { themeColor: "#f5f5f7" };

export const metadata: Metadata = {
  title: "Laura",
  description: "Personal assistant — core brain",
  icons: { icon: "/icon.svg" },
};

// Nav chrome lives per route group: (marketing)'s slim header/footer for
// the public front door, (app)'s Sidebar for the real
// tool pages. The vignette and noise overlay are universal background
// layers.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${manrope.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full overflow-x-hidden bg-bg text-text">
        <IconifyRegister />
        <Vignette />
        <div className="relative z-10 min-h-screen">{children}</div>
        <NoiseOverlay />
      </body>
    </html>
  );
}
