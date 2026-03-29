export interface Session {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_message?: string;
}

export interface Source {
  title: string;
  url: string;
}

export interface DbMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  sources: Source[] | null;
  created_at: string;
}

export interface UIMessage extends DbMessage {
  isStreaming?: boolean;
  displayContent: string;
}

export interface ChatApiRequest {
  sessionId: string;
  message: string;
}

export type LLMProvider = "openai" | "anthropic" | "gemini" | "ollama";

export interface LLMConfig {
  provider: LLMProvider;
  model: string;
  apiKey: string;
  systemPrompt: string;
  ollamaBaseUrl: string;
}
