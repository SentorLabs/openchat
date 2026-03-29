import type { LLMConfig } from "@/lib/types";

export type { LLMConfig };

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMStreamChunk {
  delta: string;
}

export async function createLLMStream(
  messages: LLMMessage[],
  config: LLMConfig
): Promise<AsyncIterable<LLMStreamChunk>> {
  const { provider, model, apiKey, ollamaBaseUrl } = config;

  switch (provider) {
    case "openai":
      return createOpenAIStream(messages, apiKey, model);
    case "anthropic":
      return createAnthropicStream(messages, apiKey, model);
    case "gemini":
      return createGeminiStream(messages, apiKey, model);
    case "ollama":
      return createOllamaStream(messages, ollamaBaseUrl, model);
    default:
      throw new Error(
        `Unsupported provider: "${provider}". Valid options: openai, anthropic, gemini, ollama`
      );
  }
}

// ── OpenAI ────────────────────────────────────────────────────────────────────
async function createOpenAIStream(
  messages: LLMMessage[],
  apiKey: string,
  model: string
): Promise<AsyncIterable<LLMStreamChunk>> {
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({ apiKey });
  const stream = await client.chat.completions.create({
    model: model || "gpt-4o",
    max_tokens: 4096,
    stream: true,
    messages: messages as Parameters<typeof client.chat.completions.create>[0]["messages"],
  });
  return (async function* () {
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? "";
      if (delta) yield { delta };
    }
  })();
}

// ── Anthropic ─────────────────────────────────────────────────────────────────
async function createAnthropicStream(
  messages: LLMMessage[],
  apiKey: string,
  model: string
): Promise<AsyncIterable<LLMStreamChunk>> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey });

  const systemMsg = messages.find((m) => m.role === "system");
  const chatMessages = messages.filter((m) => m.role !== "system") as {
    role: "user" | "assistant";
    content: string;
  }[];

  const stream = await client.messages.stream({
    model: model || "claude-opus-4-6",
    max_tokens: 4096,
    system: systemMsg?.content,
    messages: chatMessages,
  });
  return (async function* () {
    for await (const chunk of stream) {
      if (
        chunk.type === "content_block_delta" &&
        chunk.delta.type === "text_delta"
      ) {
        yield { delta: chunk.delta.text };
      }
    }
  })();
}

// ── Google Gemini ─────────────────────────────────────────────────────────────
async function createGeminiStream(
  messages: LLMMessage[],
  apiKey: string,
  model: string
): Promise<AsyncIterable<LLMStreamChunk>> {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({ model: model || "gemini-2.0-flash" });

  const systemMsg = messages.find((m) => m.role === "system");
  const chatMessages = messages.filter((m) => m.role !== "system");

  const history = chatMessages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const lastMessage = chatMessages[chatMessages.length - 1];

  const chat = geminiModel.startChat({
    history,
    systemInstruction: systemMsg?.content,
  });

  const result = await chat.sendMessageStream(lastMessage?.content ?? "");
  return (async function* () {
    for await (const chunk of result.stream) {
      const delta = chunk.text();
      if (delta) yield { delta };
    }
  })();
}

// ── Ollama ────────────────────────────────────────────────────────────────────
async function createOllamaStream(
  messages: LLMMessage[],
  baseUrl: string,
  model: string
): Promise<AsyncIterable<LLMStreamChunk>> {
  const url = `${baseUrl || "http://localhost:11434"}/api/chat`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: model || "llama3", messages, stream: true }),
  });

  if (!res.ok || !res.body) throw new Error(`Ollama error: ${res.status}`);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  return (async function* () {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const lines = decoder
        .decode(value, { stream: true })
        .split("\n")
        .filter(Boolean);
      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          const delta = json.message?.content ?? "";
          if (delta) yield { delta };
        } catch {
          /* skip malformed lines */
        }
      }
    }
  })();
}
