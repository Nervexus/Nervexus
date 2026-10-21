const OPTIONS: { value: string; label: string; active: string }[] = [
  { value: "low", label: "Low", active: "border-neutral-500 bg-neutral-500/10 text-neutral-300" },
  { value: "normal", label: "Normal", active: "border-amber-500 bg-amber-500/10 text-amber-300" },
  { value: "high", label: "High", active: "border-red-400 bg-red-400/10 text-red-300" },
];

export function PriorityPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex gap-2">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded-sm border px-3 py-1 text-xs font-medium uppercase tracking-wide transition-colors ${
            value === opt.value ? opt.active : "border-neutral-800 text-neutral-500 hover:text-neutral-300"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
