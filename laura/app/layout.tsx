import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { AmbientCanvas } from "@/components/background/AmbientCanvas";
import { Vignette } from "@/components/background/Vignette";
import { NoiseOverlay } from "@/components/background/NoiseOverlay";
import { TopNav } from "@/components/TopNav";
import { SiteFooter } from "@/components/SiteFooter";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body className="min-h-full overflow-x-hidden bg-[#080808] text-[#FFFFFF] selection:bg-neutral-800">
        <IconifyRegister />
        <AmbientCanvas />
        <Vignette />
        <TopNav />
        <main className="relative z-10 min-h-screen pt-24 pb-20 sm:pt-28">{children}</main>
        <SiteFooter />
        <NoiseOverlay />
      </body>
    </html>
  );
}
