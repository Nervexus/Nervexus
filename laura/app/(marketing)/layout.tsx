import Link from "next/link";
import { LandingFooter } from "@/components/LandingFooter";

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="relative z-10 flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-6 sm:px-10">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.9)]" />
          <span className="text-sm font-medium tracking-[0.3em] text-neutral-100">LAURA</span>
        </Link>
        <Link
          href="/laura"
          className="font-mono text-[10px] uppercase tracking-[0.35em] text-neutral-400 transition-colors hover:text-neutral-100"
        >
          Sign in
        </Link>
      </header>
      <main className="flex-1">{children}</main>
      <LandingFooter />
    </div>
  );
}
