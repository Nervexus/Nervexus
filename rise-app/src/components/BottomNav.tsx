"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CheckSquareIcon,
  GridIcon,
  HomeIcon,
  PersonIcon,
  TargetIcon,
} from "./icons";
import { useLocalStorage } from "@/lib/useLocalStorage";

const ITEMS = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/checklists", label: "Checklists", icon: CheckSquareIcon },
  { href: "/goals", label: "Goals", icon: TargetIcon },
  { href: "/categories", label: "Categories", icon: GridIcon },
  { href: "/profile", label: "Profile", icon: PersonIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  const [avatar] = useLocalStorage<string | null>("profile:avatar", null);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[max(1rem,env(safe-area-inset-bottom))] px-4">
      <div className="glass-strong flex items-center gap-1 rounded-full px-2 py-2 shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          const showAvatar = href === "/profile" && avatar;
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={`flex h-12 items-center justify-center gap-1.5 rounded-full transition-colors duration-200 ${
                active
                  ? "bg-accent px-4 text-accent-ink"
                  : "w-12 text-foreground/55 hover:text-foreground"
              }`}
            >
              {showAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatar}
                  alt=""
                  className="h-6 w-6 shrink-0 rounded-full object-cover"
                />
              ) : (
                <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2 : 1.7} />
              )}
              {active && <span className="text-xs font-semibold">{label}</span>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
