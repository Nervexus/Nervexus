import { IconTile } from "@/components/IconTile";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function CallLogCard({
  kind,
  message,
  status,
  error,
  createdAt,
}: {
  kind: string;
  message: string;
  status: string;
  error: string | null;
  createdAt: string;
}) {
  const failed = status === "failed";
  return (
    <div
      className={`gradient-border relative flex items-start gap-3 rounded-2xl border p-4 backdrop-blur-sm ${
        failed ? "border-red-900/60 bg-red-950/20" : "border-neutral-800/60 bg-neutral-900/40"
      }`}
    >
      <IconTile>
        <iconify-icon
          icon={kind === "call" ? "solar:phone-calling-linear" : "solar:chat-round-line-linear"}
          className="text-lg"
        />
      </IconTile>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <span className="font-mono text-[11px] uppercase tracking-widest text-neutral-500">
            {kind === "call" ? "Call" : "Text"}
          </span>
          <span className="shrink-0 text-[11px] text-neutral-600">{timeAgo(createdAt)}</span>
        </div>
        <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-200">{message}</p>
        {failed && <p className="mt-1.5 text-xs text-red-400">{error ?? "Failed to send."}</p>}
      </div>
    </div>
  );
}
