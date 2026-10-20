import Anthropic from "@anthropic-ai/sdk";

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
user has already clearly confirmed earlier in this same conversation.`;

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

// A single demo tool for now, to prove the tool-calling loop works end to
// end before the real tools (send_email, create_calendar_event, ...) get
// wired up in the next phase.
const tools: Anthropic.Tool[] = [
  {
    name: "get_current_time",
    description: "Get the current date and time.",
    input_schema: { type: "object", properties: {} },
  },
];

function runTool(name: string, _input: unknown): string {
  if (name === "get_current_time") {
    return new Date().toString();
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
      content: toolUses.map((toolUse) => ({
        type: "tool_result" as const,
        tool_use_id: toolUse.id,
        content: runTool(toolUse.name, toolUse.input),
      })),
    });
  }

  return "Sorry, I got stuck thinking about that -- try asking again.";
}
