import type { ReactNode } from "react";

type IconProps = { className?: string };

function base(path: ReactNode, props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      {path}
    </svg>
  );
}

export function NoteIcon(props: IconProps) {
  return base(
    <>
      <path d="M6 3h9l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M14 3v4h4" />
      <path d="M8 12h7M8 16h5" />
    </>,
    props
  );
}

export function LockIcon(props: IconProps) {
  return base(
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>,
    props
  );
}

export function ClockIcon(props: IconProps) {
  return base(
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>,
    props
  );
}

export function CheckIcon(props: IconProps) {
  return base(<path d="M4 12.5 9.5 18 20 6" />, props);
}

export function PinIcon(props: IconProps) {
  return base(
    <>
      <path d="M12 2v6" />
      <path d="M7 9h10l-1.5 5H8.5L7 9Z" />
      <path d="M12 14v8" />
    </>,
    props
  );
}

export function SearchIcon(props: IconProps) {
  return base(
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-4.3-4.3" />
    </>,
    props
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={props.className}>
      <path d="M8 5.5v13l11-6.5-11-6.5Z" />
    </svg>
  );
}

export function CopyIcon(props: IconProps) {
  return base(
    <>
      <rect x="9" y="9" width="11" height="11" rx="1.5" />
      <path d="M5 15V5a1 1 0 0 1 1-1h10" />
    </>,
    props
  );
}
