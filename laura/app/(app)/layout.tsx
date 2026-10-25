import { AppSidebar } from "@/components/AppSidebar";

export default function AppShellLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen flex-col sm:flex-row">
      <AppSidebar />
      <main className="min-w-0 flex-1 pt-20 pb-20 sm:pt-14">{children}</main>
    </div>
  );
}
