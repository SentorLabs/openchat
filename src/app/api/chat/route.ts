import { NextRequest } from "next/server";
import { initDb, query, getConfig, getDialect, sqlTrunc, sqlNow } from "@/lib/db";
import { parseSources } from "@/lib/sources";
import { createLLMStream } from "@/lib/llm";
import type { ChatApiRequest, DbMessage } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    await initDb();

    const { sessionId, message } = (await req.json()) as ChatApiRequest;

    if (!sessionId || !message?.trim()) {
      return new Response("Invalid request", { status: 400 });
    }

    const text = message.trim();

    await query(
      `INSERT INTO messages (session_id, role, content) VALUES ($1, 'user', $2)`,
      [sessionId, text]
    );

    const dialect = getDialect();

    const [{ count }] = await query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM messages WHERE session_id = $1 AND role = 'user'`,
      [sessionId]
    );
    if (parseInt(count) === 1) {
      await query(
        `UPDATE sessions SET title = ${sqlTrunc(dialect, "$1", 60)}, updated_at = ${sqlNow(dialect)} WHERE id = $2`,
        [text, sessionId]
      );
    }

    const history = await query<Pick<DbMessage, "role" | "content">>(
      `SELECT role, content FROM messages
       WHERE session_id = $1
       ORDER BY created_at DESC LIMIT 20`,
      [sessionId]
    );
    const contextMessages = history.reverse();

    const config = await getConfig();

    // Always append the sources instruction so it works with any custom system prompt
    const SOURCES_INSTRUCTION = `\n\nAt the end of EVERY response append a sources block in this exact format — no exceptions:\n\n[SOURCES]\n- Source title | URL or short description\n[/SOURCES]\n\nInclude 1–4 sources relevant to your answer. Use real URLs where possible; otherwise describe the source.`;
    const systemContent = config.systemPrompt + SOURCES_INSTRUCTION;

    const stream = await createLLMStream(
      [{ role: "system", content: systemContent }, ...contextMessages],
      config
    );

    const encoder = new TextEncoder();
    let accumulated = "";

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            accumulated += chunk.delta;
            controller.enqueue(encoder.encode(chunk.delta));
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
          try {
            const sources = parseSources(accumulated);
            await query(
              `INSERT INTO messages (session_id, role, content, sources)
               VALUES ($1, 'assistant', $2, $3)`,
              [sessionId, accumulated, sources.length ? JSON.stringify(sources) : null]
            );
            await query(
              `UPDATE sessions SET updated_at = ${sqlNow(dialect)} WHERE id = $1`,
              [sessionId]
            );
          } catch (dbErr) {
            console.error("OpenChat: failed to save assistant message:", dbErr);
          }
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("OpenChat API error:", err);
    return new Response("Internal server error", { status: 500 });
  }
}

