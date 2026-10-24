import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger" | "accent";
  /** Shows the arrow-right-linear icon after the label, matching the
   * reference's primary-CTA asset. */
  withArrow?: boolean;
};

/** The app's one primary-action style (solid neutral-100, max contrast)
 * plus two text-only variants, so every page's main CTA stays identical. */
export function Button({
  variant = "primary",
  withArrow = false,
  className = "",
  children,
  ...props
}: ButtonProps) {
  if (variant === "primary") {
    return (
      <button
        {...props}
        className={`group inline-flex shrink-0 items-center gap-2 rounded-full bg-neutral-100 px-5 py-2.5 font-mono text-xs tracking-tight text-neutral-950 transition-opacity hover:opacity-85 disabled:opacity-40 ${className}`}
      >
        {children}
        {withArrow && (
          <iconify-icon
            icon="solar:arrow-right-linear"
            className="text-sm transition-transform group-hover:translate-x-0.5"
          />
        )}
      </button>
    );
  }
  if (variant === "accent") {
    return (
      <button
        {...props}
        className={`group inline-flex shrink-0 items-center gap-3 py-2 font-mono text-[10px] uppercase tracking-[0.35em] text-neutral-300 transition-colors hover:text-neutral-50 disabled:opacity-30 ${className}`}
      >
        {children}
        <span className="relative h-px w-10 bg-neutral-500 transition-all group-hover:w-14 group-hover:bg-[var(--calendar-accent)]" />
      </button>
    );
  }
  if (variant === "danger") {
    return (
      <button
        {...props}
        className={`font-mono text-xs text-neutral-500 transition-colors hover:text-red-400 ${className}`}
      >
        {children}
      </button>
    );
  }
  return (
    <button
      {...props}
      className={`font-mono text-xs text-neutral-500 transition-colors hover:text-neutral-200 ${className}`}
    >
      {children}
    </button>
  );
}
