const OPTIONS: { value: string; label: string; active: string }[] = [
  { value: "low", label: "Low", active: "tag" },
  { value: "normal", label: "Normal", active: "tag tag-purple" },
  { value: "high", label: "High", active: "tag tag-red" },
];

export function PriorityPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="flex gap-1.5">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`${value === opt.value ? opt.active : "tag opacity-50 hover:opacity-100"} !px-2.5 !py-1 transition-opacity`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
