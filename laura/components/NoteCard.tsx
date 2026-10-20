function PortDot({ color }: { color: "emerald" | "neutral" }) {
  return (
    <span
      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
        color === "emerald" ? "bg-emerald-400" : "bg-neutral-600"
      }`}
    />
  );
}

/** A note rendered as a workflow-editor-style node: port dot, title, nested content panel. */
export function NoteCard({
  title,
  body,
  updatedAt,
  onEdit,
  onDelete,
}: {
  title: string;
  body: string;
  updatedAt: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group relative rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 transition-colors hover:border-emerald-500/40">
      <span className="absolute -right-1.5 -top-1.5 h-3 w-3 rounded-full border-2 border-neutral-950 bg-emerald-400" />

      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <PortDot color="emerald" />
          <h3 className="truncate text-sm font-medium text-neutral-100">{title}</h3>
        </div>
        <div className="flex shrink-0 gap-3 text-xs text-neutral-500 opacity-0 transition-opacity group-hover:opacity-100">
          <button onClick={onEdit} className="hover:text-neutral-200">
            Edit
          </button>
          <button onClick={onDelete} className="hover:text-red-400">
            Delete
          </button>
        </div>
      </div>

      {body && (
        <div className="mt-2.5 rounded-lg border border-neutral-800/80 bg-neutral-950/60 px-3 py-2">
          <p className="whitespace-pre-wrap text-sm text-neutral-400">{body}</p>
        </div>
      )}

      <p className="mt-2 text-[11px] text-neutral-600">
        updated {new Date(updatedAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
      </p>
    </div>
  );
}

export { PortDot };
