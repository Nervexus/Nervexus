import type { ButtonHTMLAttributes } from "react";
import { notch } from "@/lib/clip";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
};

/** The app's one primary-action style (notched amber gradient) plus two
 * text-only variants, so every page's main CTA stays visually identical. */
export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  if (variant === "primary") {
    return (
      <button
        {...props}
        style={{ clipPath: notch(8) }}
        className={`inline-flex shrink-0 items-center gap-1.5 bg-gradient-to-br from-amber-300 to-amber-500 px-4 py-2.5 text-xs font-medium tracking-wide text-neutral-950 transition-opacity hover:opacity-90 disabled:opacity-40 ${className}`}
      />
    );
  }
  if (variant === "danger") {
    return (
      <button
        {...props}
        className={`text-xs text-neutral-500 transition-colors hover:text-red-400 ${className}`}
      />
    );
  }
  return (
    <button
      {...props}
      className={`text-xs text-neutral-400 transition-colors hover:text-neutral-200 ${className}`}
    />
  );
}
