// Turns the Settings > Texting style choices into instructions for Laura.

export type TextingProfile = {
  textStyle: string;
  textLength: string;
  textEmoji: boolean;
  textNotes: string | null;
};

const STYLES: Record<string, string> = {
  pa: "Sharp, switched-on PA who knows him well: warm, quick, a bit dry. Proper sentences but relaxed.",
  mate:
    "Like a close mate texting: casual British, contractions, the odd 'yeah', 'sound', 'mate', light banter, " +
    "lowercase is fine. Never cringe or try-hard slang.",
  calm: "Calm and steady: gentle, reassuring, unhurried, never preachy.",
  minimal: "As few words as possible. Fragments are fine. No pleasantries at all.",
};

export function textingInstructions(p: TextingProfile | null): string {
  const style = STYLES[p?.textStyle ?? "pa"] ?? STYLES.pa;
  const lines = [
    "Texting style for this conversation (set by Madoxs in Settings -- follow it over the general guidance above):",
    `- Voice: ${style}`,
    p?.textLength === "normal"
      ? "- Length: a few lines is fine when it helps; still no essays."
      : "- Length: one or two short lines unless he asks for detail.",
    p?.textEmoji
      ? "- Emoji: allowed, sparingly -- one now and then where a real person would use one."
      : "- Emoji: none.",
  ];
  if (p?.textNotes) lines.push(`- His own notes on how you should text: ${p.textNotes}`);
  return lines.join("\n");
}
