import Link from "next/link";
import { ChevronRightIcon } from "./icons";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  color,
  back,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  color?: string;
  back?: boolean;
}) {
  return (
    <header className="animate-fade-up mb-6 flex items-start justify-between gap-4">
      <div>
        {back && (
          <Link
            href="/"
            className="mb-3 inline-flex items-center gap-1 text-xs text-muted hover:text-foreground"
          >
            <ChevronRightIcon className="h-3.5 w-3.5 rotate-180" />
            Home
          </Link>
        )}
        {eyebrow && (
          <p
            className="mb-1.5 text-xs font-semibold uppercase tracking-[0.16em]"
            style={{ color: color ?? "var(--muted)" }}
          >
            {eyebrow}
          </p>
        )}
        <h1 className="text-balance text-[28px] font-semibold leading-tight tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-sm text-muted">{subtitle}</p>
        )}
      </div>
    </header>
  );
}
