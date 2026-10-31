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

/** One sent call or text as a flat row. */
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
    <div className="row !items-start">
      <span className={`row-icon ${failed ? "!text-red-400" : ""}`}>
        <iconify-icon icon={kind === "call" ? "solar:phone-calling-linear" : "solar:chat-round-line-linear"} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block whitespace-pre-wrap text-[14px] text-text">{message}</span>
        <span className={`mt-0.5 block text-[12px] ${failed ? "text-red-400" : "text-muted"}`}>
          {kind === "call" ? "Call" : "Text"}
          {failed ? ` · ${error ?? "Failed to send."}` : ""}
        </span>
      </span>
      <span className="shrink-0 pt-0.5 text-[11px] text-dim">{timeAgo(createdAt)}</span>
    </div>
  );
}
