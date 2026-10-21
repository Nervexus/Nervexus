import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-neutral-800 px-6 py-14 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 text-amber-500/70">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-neutral-300">{title}</p>
        <p className="mt-1 text-xs text-neutral-600">{description}</p>
      </div>
      {children}
    </div>
  );
}
