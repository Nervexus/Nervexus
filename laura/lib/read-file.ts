import { prisma } from "@/lib/db";
import { getGeminiClient, MODEL } from "@/lib/gemini";
import { fileKind, imageMime, tableAsText, tableFromFile } from "@/lib/files";
import { textingInstructions } from "@/lib/texting";

/** Answers a question about a file he sent (photo, PDF, spreadsheet, CSV, text), in Laura's voice. */
export async function answerAboutFile(buf: Buffer, mime: string | null, name: string | null, question: string): Promise<string> {
  const kind = fileKind(mime, name);
  if (!kind) return "I can't open that type of file. Photos, PDFs, Excel (.xlsx), CSV and text files all work.";
  const profile = await prisma.profile.findUnique({ where: { id: "me" } }).catch(() => null);

  const filePart =
    kind === "image"
      ? { inlineData: { data: buf.toString("base64"), mimeType: imageMime(mime, name) } }
      : kind === "pdf"
        ? { inlineData: { data: buf.toString("base64"), mimeType: "application/pdf" } }
        : { text: `File "${name ?? "file"}":\n${kind === "text" ? buf.toString("utf8").slice(0, 30000) : tableAsText(await tableFromFile(buf, kind))}` };

  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [filePart, { text: question }] }],
    config: {
      systemInstruction:
        "You are Laura, Madoxs Harvey's personal assistant, replying by text message about a file he just sent. " +
        "Answer what he asked using what's actually in the file; if he didn't ask anything specific, give the few points " +
        "that matter (dates, amounts, deadlines, what he needs to do). Plain text, no formatting, no markdown. Never " +
        "repeat his question back. If something isn't in the file, say so rather than guessing.\n\n" +
        textingInstructions(profile),
    },
  });
  return (response.text ?? "").trim() || "I couldn't make anything out of that file.";
}
