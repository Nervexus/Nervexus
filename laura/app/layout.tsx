import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { AmbientCanvas } from "@/components/background/AmbientCanvas";
import { Vignette } from "@/components/background/Vignette";
import { NoiseOverlay } from "@/components/background/NoiseOverlay";
import { IconifyRegister } from "@/components/IconifyRegister";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "Laura",
  description: "Personal assistant — core brain",
};

// Nav chrome lives per route group: (marketing)'s TopNav/SiteFooter for
// the literal landing-page recreation, (app)'s Sidebar for the real
// tool pages. Only the global background layers are universal.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body className="min-h-full overflow-x-hidden bg-[#080808] text-[#FFFFFF] selection:bg-neutral-800">
        <IconifyRegister />
        <AmbientCanvas />
        <Vignette />
        <div className="relative z-10 min-h-screen">{children}</div>
        <NoiseOverlay />
      </body>
    </html>
  );
}
