import Link from "next/link";
import { LogoMark } from "@/components/NavIcon";
import { LandingFooter } from "@/components/LandingFooter";

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="relative z-10 flex min-h-screen flex-col">
      <header className="flex items-center px-6 py-6 sm:px-10">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-line-2 bg-[#0b0b0b]">
            <LogoMark />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">LAURA</span>
        </Link>
      </header>
      <main className="flex-1">{children}</main>
      <LandingFooter />
    </div>
  );
}
