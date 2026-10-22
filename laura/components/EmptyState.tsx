import type { ReactNode } from "react";
import { IconTile } from "@/components/IconTile";

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
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-neutral-800/60 px-6 py-14 text-center">
      <IconTile>{icon}</IconTile>
      <div>
        <p className="font-thin text-lg text-neutral-200">{title}</p>
        <p className="mt-1 text-xs text-neutral-600">{description}</p>
      </div>
      {children}
    </div>
  );
}
