"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid rendering theme-dependent state before hydration, when the
  // server doesn't yet know which theme localStorage holds.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isDark = !mounted || resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={!isDark}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "flex h-7 w-14 shrink-0 items-center rounded-full border p-1 transition-colors duration-300",
        isDark ? "border-zinc-800 bg-zinc-950" : "border-zinc-200 bg-white",
        className
      )}
    >
      <span
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full transition-transform duration-300",
          isDark
            ? "translate-x-0 bg-zinc-800"
            : "translate-x-7 bg-gray-200"
        )}
      >
        {isDark ? (
          <Moon className="h-3 w-3 text-white" strokeWidth={1.5} />
        ) : (
          <Sun className="h-3 w-3 text-gray-700" strokeWidth={1.5} />
        )}
      </span>
    </button>
  );
}
