import { getGeminiClient, MODEL } from "@/lib/gemini";

/** Transcribes a voice note. Telegram voice notes are OGG/Opus, which
 * Gemini accepts directly as inline audio. */
export async function transcribeAudio(base64: string, mimeType = "audio/ogg"): Promise<string> {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { data: base64, mimeType } },
          { text: "Transcribe this voice note exactly as spoken. Return only the transcript, no commentary." },
        ],
      },
    ],
  });
  return (response.text ?? "").trim();
}
