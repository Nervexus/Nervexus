import { PinIcon } from "@/components/icons";

function PortDot({ color }: { color: "emerald" | "neutral" }) {
  return (
    <span
      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
        color === "emerald" ? "bg-amber-400" : "bg-neutral-600"
      }`}
    />
  );
}

/** A note rendered as a workflow-editor-style node: port dot, title, nested content panel. */
export function NoteCard({
  title,
  body,
  updatedAt,
  pinned,
  onEdit,
  onDelete,
  onTogglePin,
}: {
  title: string;
  body: string;
  updatedAt: string;
  pinned: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
}) {
  return (
    <div
      className={`group relative flex h-full flex-col rounded-xl border bg-neutral-900/40 p-5 transition-colors hover:border-neutral-700 ${
        pinned ? "border-amber-500/30" : "border-neutral-800"
      }`}
    >
      <span className="absolute -right-1.5 -top-1.5 h-3 w-3 rounded-full border-2 border-neutral-950 bg-amber-400" />

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <PortDot color="emerald" />
          <h3 className="truncate text-base font-medium text-neutral-100">{title}</h3>
        </div>
        <div className="flex shrink-0 items-center gap-3 text-xs text-neutral-500 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={onTogglePin}
            className={pinned ? "text-amber-300" : "hover:text-neutral-200"}
            title={pinned ? "Unpin" : "Pin"}
          >
            <PinIcon className="h-3.5 w-3.5" />
          </button>
          <button onClick={onEdit} className="hover:text-neutral-200">
            Edit
          </button>
          <button onClick={onDelete} className="hover:text-red-400">
            Delete
          </button>
        </div>
      </div>

      {body && (
        <div className="mt-3 flex-1 rounded-lg border border-neutral-800/80 bg-neutral-950/60 px-3 py-2.5">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-400">{body}</p>
        </div>
      )}

      <p className="mt-3 text-[11px] text-neutral-600">
        updated{" "}
        {new Date(updatedAt).toLocaleString([], {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })}
      </p>
    </div>
  );
}

export { PortDot };
