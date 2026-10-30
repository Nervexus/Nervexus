import { AppSidebar } from "@/components/AppSidebar";

export default function AppShellLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="min-w-0 flex-1 pb-28 pt-6 sm:pb-12 sm:pt-[26px]">{children}</main>
    </div>
  );
}
