"use client";

import { useEffect, useRef, useState } from "react";

type Prefs = {
  textStyle: "pa" | "mate" | "calm" | "minimal";
  textLength: "short" | "normal";
  textEmoji: boolean;
  textNotes: string | null;
  morningOn: boolean;
  morningTime: string;
  afternoonOn: boolean;
  afternoonTime: string;
  nightOn: boolean;
  nightTime: string;
  motivation: boolean;
  motivationTone: "harsh" | "firm" | "gentle";
};

const STYLES: { value: Prefs["textStyle"]; label: string; example: string }[] = [
  { value: "pa", label: "Warm PA", example: "You're booked in for 7! I'd head off around 6:20, the A326 gets slow." },
  { value: "mate", label: "Close mate", example: "sorted mate, 7 o'clock. leave by 20 past, A326 is a nightmare" },
  { value: "calm", label: "Calm", example: "All set for 7. No rush, but leaving around 6:20 keeps it easy." },
  { value: "minimal", label: "Minimal", example: "7pm. Leave 6:20." },
];

const TONES: { value: Prefs["motivationTone"]; label: string; example: string }[] = [
  { value: "harsh", label: "Harsh", example: "0 sent this week. The car won't buy itself. Send the 10 before you touch your phone." },
  { value: "firm", label: "Firm", example: "Outreach is at zero this week. Today's the day it changes. 10 messages after your shift." },
  { value: "gentle", label: "Gentle", example: "Quiet week on outreach so far. Ten messages today would get things moving." },
];

/** Settings > Texting style and Daily messages. Saves as you change things. */
export function MessageSettings() {
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ part: string; text: string } | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) {
          setPrefs(d.profile);
          setNotes(d.profile.textNotes ?? "");
        }
      })
      .catch(() => {});
  }, []);

  async function save(patch: Partial<Prefs>) {
    setPrefs((p) => (p ? { ...p, ...patch } : p));
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setSaved(res.ok ? "Saved" : "Couldn't save");
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(null), 1800);
  }

  async function showPreview(part: "morning" | "afternoon" | "night") {
    setPreviewing(true);
    try {
      const d = await fetch(`/api/routine/preview?part=${part}`).then((r) => r.json());
      setPreview({ part, text: d.text ?? d.error ?? "Couldn't build the preview." });
    } finally {
      setPreviewing(false);
    }
  }

  if (!prefs) return <div className="card card-pad text-[13px] text-muted">Loading…</div>;

  const style = STYLES.find((s) => s.value === prefs.textStyle) ?? STYLES[0];
  const tone = TONES.find((t) => t.value === prefs.motivationTone) ?? TONES[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="card card-pad">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-text">Texting style</h2>
            <p className="text-[12.5px] text-muted">How Laura sounds on Telegram and in chat.</p>
          </div>
          {saved && <span className="text-[12px] text-lilac">{saved}</span>}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {STYLES.map((s) => (
            <button
              key={s.value}
              onClick={() => save({ textStyle: s.value })}
              className={`item px-3 py-2.5 text-left text-[13px] ${prefs.textStyle === s.value ? "!border-white/10 !bg-ink !text-white" : "text-muted"}`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p className="item mt-3 px-3.5 py-2.5 text-[13px] text-text">
          <span className="mr-2 text-[11.5px] text-dim">Sounds like</span>
          {style.example}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <div className="tabs">
            {(["short", "normal"] as const).map((l) => (
              <button key={l} onClick={() => save({ textLength: l })} className={`tab ${prefs.textLength === l ? "is-active" : ""}`}>
                {l === "short" ? "Short replies" : "A bit longer"}
              </button>
            ))}
          </div>
          <button onClick={() => save({ textEmoji: !prefs.textEmoji })} className={`tag !px-2.5 !py-1.5 ${prefs.textEmoji ? "tag-purple" : ""}`}>
            Emoji {prefs.textEmoji ? "on" : "off"}
          </button>
        </div>

        <label className="label mt-4 block" htmlFor="text-notes">
          Your own rules
        </label>
        <textarea
          id="text-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => notes !== (prefs.textNotes ?? "") && save({ textNotes: notes })}
          rows={2}
          placeholder="e.g. call me Mads, don't say 'mate', no full stop at the end of a text"
          className="input mt-2 resize-none"
        />
      </div>

      <div className="card card-pad">
        <h2 className="text-[15px] font-semibold text-text">Daily messages</h2>
        <p className="text-[12.5px] text-muted">When each text lands on Telegram (UK time).</p>

        <div className="mt-4 grid grid-cols-1 gap-2">
          {(
            [
              ["morning", "Morning", "Today's plan and a push", prefs.morningOn, prefs.morningTime],
              ["afternoon", "Afternoon check-in", "What's left today", prefs.afternoonOn, prefs.afternoonTime],
              ["night", "Night", "Tomorrow's schedule + tonight's checklist", prefs.nightOn, prefs.nightTime],
            ] as const
          ).map(([part, label, hint, on, time]) => (
            <div key={part} className="item flex items-center gap-3 px-3.5 py-3">
              <button
                onClick={() => save({ [`${part}On`]: !on } as Partial<Prefs>)}
                aria-label={`${label} ${on ? "on" : "off"}`}
                className={`check ${on ? "is-on" : ""}`}
              >
                {on && (
                  <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M2.5 6.5l2.2 2L9.5 3.5" />
                  </svg>
                )}
              </button>
              <span className="min-w-0 flex-1">
                <span className={`block text-[13.5px] ${on ? "text-text" : "text-dim"}`}>{label}</span>
                <span className="block truncate text-[11.5px] text-dim">{hint}</span>
              </span>
              <input
                type="time"
                value={time}
                disabled={!on}
                onChange={(e) => e.target.value && save({ [`${part}Time`]: e.target.value } as Partial<Prefs>)}
                className="input !w-auto !py-1.5 font-mono disabled:opacity-40"
              />
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button onClick={() => save({ motivation: !prefs.motivation })} className={`tag !px-2.5 !py-1.5 ${prefs.motivation ? "tag-purple" : ""}`}>
            Motivation {prefs.motivation ? "on" : "off"}
          </button>
          {prefs.motivation && (
            <div className="tabs">
              {TONES.map((t) => (
                <button key={t.value} onClick={() => save({ motivationTone: t.value })} className={`tab ${prefs.motivationTone === t.value ? "is-active" : ""}`}>
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
        {prefs.motivation && (
          <p className="item mt-3 px-3.5 py-2.5 text-[13px] text-text">
            <span className="mr-2 text-[11.5px] text-dim">e.g.</span>
            {tone.example}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => showPreview("morning")} disabled={previewing} className="btn">
            Preview morning
          </button>
          <button onClick={() => showPreview("afternoon")} disabled={previewing} className="btn">
            Preview afternoon
          </button>
          <button onClick={() => showPreview("night")} disabled={previewing} className="btn">
            Preview night
          </button>
        </div>
        {preview && (
          <pre className="item mt-3 whitespace-pre-wrap px-3.5 py-3 font-sans text-[13px] leading-relaxed text-text">{preview.text}</pre>
        )}
      </div>
    </div>
  );
}
