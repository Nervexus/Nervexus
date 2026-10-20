import { GoogleGenAI, Type, type Content, type FunctionDeclaration } from "@google/genai";
import { prisma } from "@/lib/db";

const MODEL = "gemini-flash-latest";

const SYSTEM_PROMPT = `You are Laura, a personal voice/text assistant. You are warm, direct, and
efficient -- you sound like a sharp human assistant, not a generic chatbot.
Keep replies short enough to read comfortably as a text message or hear as
speech: a sentence or two for most things, more only when the user actually
asked for detail.

You do not yet have real-world tools wired up beyond the ones listed for
this conversation. Don't claim to have sent an email, made a call, or
booked something unless a tool call in this conversation actually did it.
If asked to do something you can't do yet, say so plainly and briefly
explain what's still missing (e.g. "I'm not connected to your email yet").

When you do have a tool that takes a real-world, hard-to-undo action
(sending an email, making a call, booking something), describe exactly
what you're about to do and ask for a yes before calling it -- unless the
user has already clearly confirmed earlier in this same conversation.
Creating a note is low-stakes and reversible, so that one doesn't need
confirmation -- just do it when asked, or when the user says something
clearly worth remembering.

You never have access to the Vault. If asked for a password or secret,
say you can't see the Vault's contents and the user should look it up
there themselves.`;

let client: GoogleGenAI | null = null;

function getClient() {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY is not set. Add it to .env.local to talk to Laura."
      );
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

// Deliberately not exposing Vault reads/writes as a tool: an LLM
// conversation is the wrong place for secrets to flow through,
// especially once this talks over SMS/voice in later phases.
const tools: FunctionDeclaration[] = [
  {
    name: "get_current_time",
    description: "Get the current date and time.",
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: "create_note",
    description: "Save a note for the user to see later in their Notes list.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Short title for the note." },
        body: { type: Type.STRING, description: "The note's content." },
      },
      required: ["title", "body"],
    },
  },
];

async function runTool(
  name: string,
  args: Record<string, unknown>
): Promise<Record<string, unknown>> {
  if (name === "get_current_time") {
    return { result: new Date().toString() };
  }
  if (name === "create_note") {
    const { title, body } = args as { title?: string; body?: string };
    if (!title || !body) {
      return { error: "a note needs both a title and a body" };
    }
    const note = await prisma.note.create({ data: { title, body } });
    return { result: `Saved note "${note.title}".` };
  }
  return { error: `Unknown tool: ${name}` };
}

export async function chat(history: ChatMessage[]): Promise<string> {
  const ai = getClient();
  const contents: Content[] = history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  for (let turn = 0; turn < 5; turn++) {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        tools: [{ functionDeclarations: tools }],
      },
    });

    const functionCalls = response.functionCalls;
    if (!functionCalls || functionCalls.length === 0) {
      return response.text ?? "";
    }

    // Echo back the model's own content verbatim (not just the function
    // calls) -- it carries a thoughtSignature per part that Gemini
    // requires on the next turn for multi-step tool use.
    const modelContent = response.candidates?.[0]?.content;
    contents.push(
      modelContent ?? {
        role: "model",
        parts: functionCalls.map((call) => ({ functionCall: call })),
      }
    );

    const responses = await Promise.all(
      functionCalls.map(async (call) => ({
        functionResponse: {
          name: call.name,
          id: call.id,
          response: await runTool(call.name ?? "", call.args ?? {}),
        },
      }))
    );

    contents.push({ role: "user", parts: responses });
  }

  return "Sorry, I got stuck thinking about that -- try asking again.";
}
