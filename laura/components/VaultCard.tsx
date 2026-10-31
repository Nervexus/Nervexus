import { LockIcon, CopyIcon } from "@/components/icons";

/** One vault item as a flat row: title and masked value, copy / reveal / delete on the right. */
export function VaultCard({
  title,
  revealedValue,
  revealing,
  copied,
  onReveal,
  onCopy,
  onDelete,
}: {
  title: string;
  revealedValue: string | undefined;
  revealing: boolean;
  copied: boolean;
  onReveal: () => void;
  onCopy: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="row flex-wrap">
      <span className="row-icon">
        <LockIcon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] text-text">{title}</span>
        <span className={`mt-0.5 block truncate font-mono text-[12px] ${revealedValue !== undefined ? "text-text" : "text-dim"}`}>
          {revealedValue ?? "••••••••••••"}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-0.5">
        <button onClick={onCopy} disabled={revealing} className="btn-ghost !px-2 !py-1 !text-[12px] disabled:opacity-50">
          <CopyIcon className="h-3.5 w-3.5" />
          {copied ? "Copied" : "Copy"}
        </button>
        <button onClick={onReveal} disabled={revealing} className="btn-ghost !px-2 !py-1 !text-[12px] disabled:opacity-50">
          {revealing ? "…" : revealedValue !== undefined ? "Hide" : "Reveal"}
        </button>
        <button onClick={onDelete} className="btn-ghost !px-2 !py-1 !text-[12px] hover:!text-red-400">
          Delete
        </button>
      </span>
    </div>
  );
}
