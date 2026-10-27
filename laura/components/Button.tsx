import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** primary/accent: purple; hero: purple with a rotating border;
   * default: dark; ghost: text only; danger: red-tinted. */
  variant?: "primary" | "accent" | "hero" | "default" | "ghost" | "danger";
  withArrow?: boolean;
};

const CLASSES: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "btn btn-primary",
  accent: "btn btn-primary",
  hero: "btn btn-primary btn-hero",
  default: "btn",
  ghost: "btn-ghost",
  danger: "btn btn-danger !px-3 !py-1.5 !text-xs",
};

export function Button({ variant = "primary", withArrow = false, className = "", children, ...props }: ButtonProps) {
  return (
    <button {...props} className={`${CLASSES[variant]} ${className}`}>
      {children}
      {withArrow && (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      )}
    </button>
  );
}
