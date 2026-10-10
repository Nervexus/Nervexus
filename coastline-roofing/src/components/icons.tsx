import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

export function PhoneIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L14 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 4 6a2 2 0 0 1 0-2Z" />
    </svg>
  );
}

export function WhatsAppIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.3-1.39a9.9 9.9 0 0 0 4.74 1.2h.004c5.46 0 9.9-4.44 9.9-9.9S17.5 2 12.04 2Zm0 18.08h-.003a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.14.82.84-3.06-.2-.32a8.2 8.2 0 0 1-1.26-4.4c0-4.54 3.7-8.24 8.26-8.24 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.42 5.83c0 4.55-3.7 8.27-8.26 8.27Zm4.52-6.2c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.13-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.23-1.46-1.37-1.7-.14-.25-.015-.38.11-.5.11-.11.25-.3.37-.44.12-.15.16-.25.24-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.42-.14-.01-.31-.01-.48-.01a.92.92 0 0 0-.67.31c-.23.25-.87.85-.87 2.07s.9 2.4 1.02 2.57c.12.17 1.78 2.72 4.3 3.81.6.26 1.07.41 1.44.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.14-1.18-.06-.1-.23-.16-.48-.28Z" />
    </svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" />
      <path d="m9.25 12 2 2 3.5-3.75" />
    </svg>
  );
}

export function YearsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function QuoteIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8.5 9.5c-2 0-3.5 1.6-3.5 3.6 0 1.9 1.4 3.4 3.2 3.4.2 1.7-1 3-2.7 3.2v1.3c3-.2 5-2.2 5-5.2v-1.8c0-2.5-1-4.5-2-4.5Z" />
      <path d="M16.5 9.5c-2 0-3.5 1.6-3.5 3.6 0 1.9 1.4 3.4 3.2 3.4.2 1.7-1 3-2.7 3.2v1.3c3-.2 5-2.2 5-5.2v-1.8c0-2.5-1-4.5-2-4.5Z" />
    </svg>
  );
}

export function GuaranteeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12.3 2.2 2.2 4.8-5" />
    </svg>
  );
}

export function RepairIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M14.7 6.3a3.5 3.5 0 0 1-4.9 4.3L4.5 16l1.5 1.5 5.4-5.3a3.5 3.5 0 0 1 4.3-4.9Z" />
      <path d="m14 10 5.5 5.5a1.5 1.5 0 0 1-2 2L12 12" />
    </svg>
  );
}

export function NewRoofIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3.5 11 12 4l8.5 7" />
      <path d="M6 10v9h12v-9" />
      <path d="M10 19v-5h4v5" />
    </svg>
  );
}

export function FlatRoofIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 8h16v2H4z" />
      <path d="M5 10v9h14v-9" />
      <path d="M9 19v-4h6v4" />
    </svg>
  );
}

export function GutteringIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3.5 7h17" />
      <path d="M5 7v2a2.5 2.5 0 0 0 5 0V7" />
      <path d="M14 7v2a2.5 2.5 0 0 0 5 0V7" />
      <path d="M16.5 11v8" />
      <path d="m15 17.5 1.5 1.5 1.5-1.5" />
    </svg>
  );
}

export function ChimneyIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3.5 13 12 6l8.5 7" />
      <path d="M15 9V4h3v7.5" />
      <path d="M6.5 12.5V19h11v-6.5" />
    </svg>
  );
}

export function EmergencyIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3 3 19h18L12 3Z" />
      <path d="M12 9.5v4" />
      <path d="M12 16.5h.01" />
    </svg>
  );
}

export function MapPinIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.25" />
    </svg>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="m12 2.5 2.9 6 6.6.8-4.8 4.6 1.2 6.6L12 17.4l-5.9 3.1 1.2-6.6-4.8-4.6 6.6-.8Z" />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4.5 7 7.5 6 7.5-6" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  );
}

export const serviceIcons = {
  repair: RepairIcon,
  newRoof: NewRoofIcon,
  flatRoof: FlatRoofIcon,
  guttering: GutteringIcon,
  chimney: ChimneyIcon,
  emergency: EmergencyIcon,
};

export const trustIcons = {
  years: YearsIcon,
  shield: ShieldIcon,
  quote: QuoteIcon,
  guarantee: GuaranteeIcon,
};
