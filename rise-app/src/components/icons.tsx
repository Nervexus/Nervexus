import type { CSSProperties } from "react";

type IconProps = {
  className?: string;
  strokeWidth?: number;
  style?: CSSProperties;
};

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

export function HomeIcon({ className, strokeWidth = 1.8, style }: IconProps) {
  return (
    <svg className={className} style={style} strokeWidth={strokeWidth} {...base}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </svg>
  );
}

export function CheckSquareIcon({ className, strokeWidth = 1.8, style }: IconProps) {
  return (
    <svg className={className} style={style} strokeWidth={strokeWidth} {...base}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <path d="m8 12 2.5 2.5L16 9" />
    </svg>
  );
}

export function TargetIcon({ className, strokeWidth = 1.8, style }: IconProps) {
  return (
    <svg className={className} style={style} strokeWidth={strokeWidth} {...base}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function GridIcon({ className, strokeWidth = 1.8, style }: IconProps) {
  return (
    <svg className={className} style={style} strokeWidth={strokeWidth} {...base}>
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="2.2" />
      <rect x="13" y="3.5" width="7.5" height="7.5" rx="2.2" />
      <rect x="3.5" y="13" width="7.5" height="7.5" rx="2.2" />
      <rect x="13" y="13" width="7.5" height="7.5" rx="2.2" />
    </svg>
  );
}

export function GearIcon({ className, strokeWidth = 1.8, style }: IconProps) {
  return (
    <svg className={className} style={style} strokeWidth={strokeWidth} {...base}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.5v2.4M12 19.1v2.4M21.5 12h-2.4M4.9 12H2.5M18.4 5.6l-1.7 1.7M7.3 16.7l-1.7 1.7M18.4 18.4l-1.7-1.7M7.3 7.3 5.6 5.6" />
    </svg>
  );
}

export function PlusIcon({ className, strokeWidth = 2, style }: IconProps) {
  return (
    <svg className={className} style={style} strokeWidth={strokeWidth} {...base}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function TrashIcon({ className, strokeWidth = 1.8, style }: IconProps) {
  return (
    <svg className={className} style={style} strokeWidth={strokeWidth} {...base}>
      <path d="M4 7h16" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
    </svg>
  );
}

export function ChevronRightIcon({ className, strokeWidth = 1.8, style }: IconProps) {
  return (
    <svg className={className} style={style} strokeWidth={strokeWidth} {...base}>
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

export function FlameIcon({ className, strokeWidth = 1.8, style }: IconProps) {
  return (
    <svg className={className} style={style} strokeWidth={strokeWidth} {...base}>
      <path d="M12 2.5c.5 3-3 4.5-3 8a5 5 0 0 0 10 0c0-1.6-.8-2.6-1.5-3.5.2 1.5-.6 2-1 2 .3-2.7-1-3.8-1.5-6.5-.8 1-2.3 2-3 4" />
    </svg>
  );
}

export function SparkleIcon({ className, strokeWidth = 1.8, style }: IconProps) {
  return (
    <svg className={className} style={style} strokeWidth={strokeWidth} {...base}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
    </svg>
  );
}

export function HeartPulseIcon({ className, strokeWidth = 1.8, style }: IconProps) {
  return (
    <svg className={className} style={style} strokeWidth={strokeWidth} {...base}>
      <path d="M12 20.5s-7.5-4.6-9.8-9.3C.7 7.6 2.6 4 6.2 4c2 0 3.3 1 4.8 2.8C12.5 5 13.8 4 15.8 4c3.6 0 5.5 3.6 4 7.2-2.3 4.7-9.8 9.3-9.8 9.3Z" />
      <path d="M4 12h2.5l1.5-3 2 5 1.5-2.5h3.5" />
    </svg>
  );
}

export function TrendUpIcon({ className, strokeWidth = 1.8, style }: IconProps) {
  return (
    <svg className={className} style={style} strokeWidth={strokeWidth} {...base}>
      <path d="m3 16 6-6 4 4 8-9" />
      <path d="M15 5h6v6" />
    </svg>
  );
}

export function UsersIcon({ className, strokeWidth = 1.8, style }: IconProps) {
  return (
    <svg className={className} style={style} strokeWidth={strokeWidth} {...base}>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M2.8 20c.8-3.4 3.2-5.4 6.2-5.4s5.4 2 6.2 5.4" />
      <circle cx="17.5" cy="9.5" r="2.4" />
      <path d="M15.8 14.9c2.4.2 4.3 2 4.9 4.6" />
    </svg>
  );
}

export function FaceIcon({ className, strokeWidth = 1.8, style }: IconProps) {
  return (
    <svg className={className} style={style} strokeWidth={strokeWidth} {...base}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9 10.2h.01M15 10.2h.01" />
      <path d="M8.7 14.5c.9 1 2 1.5 3.3 1.5s2.4-.5 3.3-1.5" />
    </svg>
  );
}

export function XIcon({ className, strokeWidth = 1.8, style }: IconProps) {
  return (
    <svg className={className} style={style} strokeWidth={strokeWidth} {...base}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export function CalendarIcon({ className, strokeWidth = 1.8, style }: IconProps) {
  return (
    <svg className={className} style={style} strokeWidth={strokeWidth} {...base}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    </svg>
  );
}

export function PersonIcon({ className, strokeWidth = 1.8, style }: IconProps) {
  return (
    <svg className={className} style={style} strokeWidth={strokeWidth} {...base}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20c1.1-3.9 4-5.8 7.5-5.8s6.4 1.9 7.5 5.8" />
    </svg>
  );
}

export function CameraIcon({ className, strokeWidth = 1.8, style }: IconProps) {
  return (
    <svg className={className} style={style} strokeWidth={strokeWidth} {...base}>
      <path d="M4 8.5a1.5 1.5 0 0 1 1.5-1.5h2l1-2h7l1 2h2A1.5 1.5 0 0 1 20 8.5V18a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18Z" />
      <circle cx="12" cy="13" r="3.3" />
    </svg>
  );
}
