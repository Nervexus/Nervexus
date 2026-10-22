import { IconTile } from "@/components/IconTile";
import { ClockIcon, CheckIcon } from "@/components/icons";

const PRIORITY_STYLE: Record<string, { bar: string; label: string; text: string }> = {
  high: { bar: "bg-red-400", label: "high", text: "text-red-400" },
  normal: { bar: "bg-neutral-600", label: "normal", text: "text-neutral-600" },
  low: { bar: "bg-neutral-800", label: "low", text: "text-neutral-600" },
};

export function ReminderCard({
  title,
  note,
  dueAt,
  priority,
  done,
  overdue,
  onToggleDone,
  onDelete,
}: {
  title: string;
  note: string | null;
  dueAt: string;
  priority: string;
  done: boolean;
  overdue: boolean;
  onToggleDone: () => void;
  onDelete: () => void;
}) {
  const style = PRIORITY_STYLE[priority] ?? PRIORITY_STYLE.normal;

  return (
    <div
      className={`gradient-border relative overflow-hidden rounded-2xl border bg-neutral-900/40 p-4 pl-5 backdrop-blur-sm transition-colors ${
        done ? "border-neutral-800/60 opacity-50" : "border-neutral-800/60 hover:border-neutral-700"
      }`}
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${style.bar}`} />

      <div className="flex items-start gap-3">
        <IconTile>{done ? <CheckIcon className="h-4 w-4" /> : <ClockIcon className="h-4 w-4" />}</IconTile>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className={`text-sm font-light ${done ? "text-neutral-400 line-through" : "text-neutral-100"}`}>
              {title}
            </h3>
            <div className="flex shrink-0 gap-3 text-xs text-neutral-500">
              <button onClick={onToggleDone} className="hover:text-neutral-200">
                {done ? "Undo" : "Done"}
              </button>
              <button onClick={onDelete} className="hover:text-red-400">
                Delete
              </button>
            </div>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className={`text-xs tracking-wide ${overdue ? "font-medium text-neutral-100" : "text-neutral-500"}`}>
              {overdue ? "overdue · " : ""}
              {new Date(dueAt).toLocaleString([], {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
            {priority !== "normal" && (
              <span className={`text-[11px] font-medium uppercase tracking-wide ${style.text}`}>
                {style.label}
              </span>
            )}
          </div>
          {note && <p className="mt-1.5 whitespace-pre-wrap text-sm text-neutral-400">{note}</p>}
        </div>
      </div>
    </div>
  );
}
