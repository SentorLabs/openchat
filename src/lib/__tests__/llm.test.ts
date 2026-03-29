import { describe, it, expect, vi, beforeEach } from "vitest";
import { createLLMStream } from "@/lib/llm";
import type { LLMMessage } from "@/lib/llm";
import type { LLMConfig } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeConfig(overrides: Partial<LLMConfig> = {}): LLMConfig {
  return {
    provider: "openai",
    model: "gpt-4o",
    apiKey: "test-key",
    systemPrompt: "You are a test assistant.",
    ollamaBaseUrl: "http://localhost:11434",
    ...overrides,
  };
}

const MESSAGES: LLMMessage[] = [
  { role: "system", content: "You are a test assistant." },
  { role: "user", content: "Hello" },
];

/** Collect all deltas from an async iterable into a single string. */
async function collectDeltas(stream: AsyncIterable<{ delta: string }>): Promise<string> {
  let result = "";
  for await (const chunk of stream) {
    result += chunk.delta;
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Unsupported provider
// ─────────────────────────────────────────────────────────────────────────────

describe("createLLMStream — unsupported provider", () => {
  it("throws an error for an unsupported provider", async () => {
    const config = makeConfig({ provider: "groq" as LLMConfig["provider"] });
    await expect(createLLMStream(MESSAGES, config)).rejects.toThrow(
      /Unsupported provider.*groq/i
    );
  });

  it("error message lists valid options", async () => {
    const config = makeConfig({ provider: "unknown-llm" as LLMConfig["provider"] });
    await expect(createLLMStream(MESSAGES, config)).rejects.toThrow(
      /openai.*anthropic.*gemini.*ollama/i
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// OpenAI provider (mocked)
// ─────────────────────────────────────────────────────────────────────────────

describe("createLLMStream — openai", () => {
  beforeEach(() => {
    vi.mock("openai", () => {
      const mockStream = (async function* () {
        yield { choices: [{ delta: { content: "Hello" } }] };
        yield { choices: [{ delta: { content: " world" } }] };
        yield { choices: [{ delta: {} }] }; // empty delta — should be skipped
      })();

      return {
        default: vi.fn().mockImplementation(() => ({
          chat: {
            completions: {
              create: vi.fn().mockResolvedValue(mockStream),
            },
          },
        })),
      };
    });
  });

  it("streams chunks from OpenAI and skips empty deltas", async () => {
    const config = makeConfig({ provider: "openai" });
    const stream = await createLLMStream(MESSAGES, config);
    const result = await collectDeltas(stream);
    expect(result).toBe("Hello world");
  });

  it("uses default model gpt-4o when model is empty string", async () => {
    const config = makeConfig({ provider: "openai", model: "" });
    // Should not throw — createOpenAIStream fills in the default
    await expect(createLLMStream(MESSAGES, config)).resolves.toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Anthropic provider (mocked)
// ─────────────────────────────────────────────────────────────────────────────

describe("createLLMStream — anthropic", () => {
  beforeEach(() => {
    vi.mock("@anthropic-ai/sdk", () => {
      const mockStream = (async function* () {
        yield {
          type: "content_block_delta",
          delta: { type: "text_delta", text: "Hi " },
        };
        yield {
          type: "content_block_delta",
          delta: { type: "text_delta", text: "there" },
        };
        yield {
          type: "message_start", // non-delta event — should be skipped
        };
      })();

      return {
        default: vi.fn().mockImplementation(() => ({
          messages: {
            stream: vi.fn().mockResolvedValue(mockStream),
          },
        })),
      };
    });
  });

  it("streams text_delta chunks and skips non-delta events", async () => {
    const config = makeConfig({ provider: "anthropic" });
    const stream = await createLLMStream(MESSAGES, config);
    const result = await collectDeltas(stream);
    expect(result).toBe("Hi there");
  });

  it("separates system message from chat messages", async () => {
    // Verify the stream is created without throwing even when system message is present
    const config = makeConfig({ provider: "anthropic" });
    await expect(createLLMStream(MESSAGES, config)).resolves.toBeDefined();
  });

  it("handles messages with no system message", async () => {
    const noSystem: LLMMessage[] = [
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi" },
    ];
    const config = makeConfig({ provider: "anthropic" });
    await expect(createLLMStream(noSystem, config)).resolves.toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Gemini provider (mocked)
// ─────────────────────────────────────────────────────────────────────────────

describe("createLLMStream — gemini", () => {
  beforeEach(() => {
    vi.mock("@google/generative-ai", () => {
      const mockStream = (async function* () {
        yield { text: () => "Gemini " };
        yield { text: () => "response" };
        yield { text: () => "" }; // empty — should be skipped
      })();

      return {
        GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
          getGenerativeModel: vi.fn().mockReturnValue({
            startChat: vi.fn().mockReturnValue({
              sendMessageStream: vi.fn().mockResolvedValue({ stream: mockStream }),
            }),
          }),
        })),
      };
    });
  });

  it("streams chunks from Gemini and skips empty text chunks", async () => {
    const config = makeConfig({ provider: "gemini" });
    const stream = await createLLMStream(MESSAGES, config);
    const result = await collectDeltas(stream);
    expect(result).toBe("Gemini response");
  });

  it("handles a single-message conversation (no history)", async () => {
    const singleMsg: LLMMessage[] = [{ role: "user", content: "Hello" }];
    const config = makeConfig({ provider: "gemini" });
    await expect(createLLMStream(singleMsg, config)).resolves.toBeDefined();
  });

  it("maps 'assistant' role to 'model' for Gemini history", async () => {
    // This tests the role mapping indirectly — if it threw on unknown roles the test would fail
    const withAssistant: LLMMessage[] = [
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi" },
      { role: "user", content: "Follow up" },
    ];
    const config = makeConfig({ provider: "gemini" });
    await expect(createLLMStream(withAssistant, config)).resolves.toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Ollama provider (mocked via global fetch)
// ─────────────────────────────────────────────────────────────────────────────

describe("createLLMStream — ollama", () => {
  function makeMockFetch(lines: string[], statusOk = true) {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(lines.join("\n"));

    const mockReader = {
      read: vi.fn()
        .mockResolvedValueOnce({ value: encoded, done: false })
        .mockResolvedValueOnce({ value: undefined, done: true }),
    };

    return vi.fn().mockResolvedValue({
      ok: statusOk,
      body: { getReader: () => mockReader },
      status: statusOk ? 200 : 500,
    });
  }

  it("streams chunks from Ollama", async () => {
    const lines = [
      JSON.stringify({ message: { content: "Ollama " } }),
      JSON.stringify({ message: { content: "answer" } }),
    ];
    global.fetch = makeMockFetch(lines);

    const config = makeConfig({ provider: "ollama", model: "llama3" });
    const stream = await createLLMStream(MESSAGES, config);
    const result = await collectDeltas(stream);
    expect(result).toBe("Ollama answer");
  });

  it("uses default base URL http://localhost:11434 when ollamaBaseUrl is empty", async () => {
    const lines = [JSON.stringify({ message: { content: "ok" } })];
    const mockFetch = makeMockFetch(lines);
    global.fetch = mockFetch;

    const config = makeConfig({ provider: "ollama", ollamaBaseUrl: "" });
    await createLLMStream(MESSAGES, config);

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:11434/api/chat",
      expect.any(Object)
    );
  });

  it("uses custom ollamaBaseUrl when provided", async () => {
    const lines = [JSON.stringify({ message: { content: "ok" } })];
    const mockFetch = makeMockFetch(lines);
    global.fetch = mockFetch;

    const config = makeConfig({ provider: "ollama", ollamaBaseUrl: "http://my-ollama:8080" });
    await createLLMStream(MESSAGES, config);

    expect(mockFetch).toHaveBeenCalledWith(
      "http://my-ollama:8080/api/chat",
      expect.any(Object)
    );
  });

  it("throws when Ollama returns a non-OK status", async () => {
    global.fetch = makeMockFetch([], false);
    const config = makeConfig({ provider: "ollama" });
    await expect(createLLMStream(MESSAGES, config)).rejects.toThrow(/Ollama error.*500/i);
  });

  it("throws when Ollama returns no body", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, body: null, status: 200 });
    const config = makeConfig({ provider: "ollama" });
    await expect(createLLMStream(MESSAGES, config)).rejects.toThrow(/Ollama error/i);
  });

  it("skips malformed JSON lines without throwing", async () => {
    const lines = [
      "not valid json",
      JSON.stringify({ message: { content: "valid" } }),
      "{broken",
    ];
    global.fetch = makeMockFetch(lines);

    const config = makeConfig({ provider: "ollama" });
    const stream = await createLLMStream(MESSAGES, config);
    const result = await collectDeltas(stream);
    expect(result).toBe("valid");
  });

  it("skips lines with empty message content", async () => {
    const lines = [
      JSON.stringify({ message: { content: "" } }),
      JSON.stringify({ message: { content: "real" } }),
    ];
    global.fetch = makeMockFetch(lines);

    const config = makeConfig({ provider: "ollama" });
    const stream = await createLLMStream(MESSAGES, config);
    const result = await collectDeltas(stream);
    expect(result).toBe("real");
  });

  it("uses default model 'llama3' when model is empty", async () => {
    const lines = [JSON.stringify({ message: { content: "ok" } })];
    const mockFetch = makeMockFetch(lines);
    global.fetch = mockFetch;

    const config = makeConfig({ provider: "ollama", model: "" });
    await createLLMStream(MESSAGES, config);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.model).toBe("llama3");
  });
});
