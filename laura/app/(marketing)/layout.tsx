export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="relative z-10 flex min-h-screen flex-col">
      <main className="flex flex-1 items-center">{children}</main>
    </div>
  );
}
