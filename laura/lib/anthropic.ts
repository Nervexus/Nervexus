import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";

const MODEL = "claude-sonnet-5-5";

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

let client: Anthropic | null = null;

function getClient() {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY is not set. Add it to .env.local to talk to Laura."
      );
    }
    client = new Anthropic({ apiKey });
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
const tools: Anthropic.Tool[] = [
  {
    name: "get_current_time",
    description: "Get the current date and time.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "create_note",
    description: "Save a note for the user to see later in their Notes list.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Short title for the note." },
        body: { type: "string", description: "The note's content." },
      },
      required: ["title", "body"],
    },
  },
];

async function runTool(name: string, input: unknown): Promise<string> {
  if (name === "get_current_time") {
    return new Date().toString();
  }
  if (name === "create_note") {
    const { title, body } = input as { title?: string; body?: string };
    if (!title || !body) return "Error: a note needs both a title and a body.";
    const note = await prisma.note.create({ data: { title, body } });
    return `Saved note "${note.title}".`;
  }
  return `Unknown tool: ${name}`;
}

export async function chat(history: ChatMessage[]): Promise<string> {
  const anthropic = getClient();
  const messages: Anthropic.MessageParam[] = history.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  for (let turn = 0; turn < 5; turn++) {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools,
      messages,
    });

    const toolUses = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );

    if (toolUses.length === 0) {
      const textBlock = response.content.find(
        (block): block is Anthropic.TextBlock => block.type === "text"
      );
      return textBlock?.text ?? "";
    }

    messages.push({ role: "assistant", content: response.content });
    messages.push({
      role: "user",
      content: await Promise.all(
        toolUses.map(async (toolUse) => ({
          type: "tool_result" as const,
          tool_use_id: toolUse.id,
          content: await runTool(toolUse.name, toolUse.input),
        }))
      ),
    });
  }

  return "Sorry, I got stuck thinking about that -- try asking again.";
}
