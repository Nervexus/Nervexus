import { TopNav } from "@/components/TopNav";
import { SiteFooter } from "@/components/SiteFooter";

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <TopNav />
      <main className="pt-24 pb-20 sm:pt-28">{children}</main>
      <SiteFooter />
    </>
  );
}
