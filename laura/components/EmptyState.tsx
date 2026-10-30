import type { ReactNode } from "react";
import { IconTile } from "@/components/IconTile";

export function EmptyState({ icon, title, description, children }: { icon: ReactNode; title: string; description: string; children?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <IconTile>{icon}</IconTile>
      <div>
        <p className="text-[15px] font-medium text-text">{title}</p>
        <p className="mt-1 text-[13px] text-muted">{description}</p>
      </div>
      {children}
    </div>
  );
}
