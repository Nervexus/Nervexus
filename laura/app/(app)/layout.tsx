import { AppSidebar } from "@/components/AppSidebar";
import { ApiIssuePopup } from "@/components/api-keys/ApiIssuePopup";
import { Toaster } from "@/components/api-keys/shared";

export default function AppShellLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="min-w-0 flex-1 pb-28 pt-6 sm:pb-12 sm:pt-[26px]">{children}</main>
      <ApiIssuePopup />
      <Toaster />
    </div>
  );
}
