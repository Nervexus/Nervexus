import { IconTile } from "@/components/IconTile";
import { LockIcon, CopyIcon } from "@/components/icons";

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
    <div className="group relative flex h-full flex-col rounded-2xl bg-[#1b1b1d] p-5 transition-colors hover:border-neutral-700">
      <div className="flex items-start gap-3">
        <IconTile>
          <LockIcon className="h-4 w-4" />
        </IconTile>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-light text-neutral-100">{title}</h3>
          <p className="mt-1.5 truncate rounded-xl bg-neutral-900/70 px-3 py-2 font-mono text-sm text-neutral-400">
            {revealedValue ?? "••••••••••••"}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-4 text-xs text-neutral-500">
        <button
          onClick={onCopy}
          disabled={revealing}
          className="flex items-center gap-1 hover:text-neutral-200 disabled:opacity-50"
        >
          <CopyIcon className="h-3.5 w-3.5" />
          {copied ? "Copied!" : "Copy"}
        </button>
        <button
          onClick={onReveal}
          disabled={revealing}
          className="hover:text-neutral-200 disabled:opacity-50"
        >
          {revealing ? "…" : revealedValue !== undefined ? "Hide" : "Reveal"}
        </button>
        <button onClick={onDelete} className="hover:text-red-400">
          Delete
        </button>
      </div>
    </div>
  );
}
