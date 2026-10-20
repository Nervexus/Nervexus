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
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-neutral-800 px-6 py-14 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-900 text-neutral-500">
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
