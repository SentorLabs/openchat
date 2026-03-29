import { NextRequest, NextResponse } from "next/server";
import { initDb, upsertSetting, getConfig, setConnectionUrl, detectDialect } from "@/lib/db";
import type { LLMConfig } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  try {
    await initDb();
    const config = await getConfig();
    const dbUrl = process.env.DATABASE_URL ?? "";
    return NextResponse.json({
      ...config,
      apiKey: config.apiKey ? "••••••••" : "",
      apiKeySet: config.apiKey.length > 0,
      // Return the dialect so the UI can show which DB type is active
      dbDialect: detectDialect(dbUrl),
      dbUrlSet: dbUrl.length > 0,
    });
  } catch (err) {
    console.error("GET /api/settings error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<LLMConfig> & {
      clearApiKey?: boolean;
      databaseUrl?: string;
    };

    // ── Database URL ────────────────────────────────────────────────────────
    // If the caller provides a new database URL, switch connections first
    // so the subsequent settings upsert targets the new DB.
    if (body.databaseUrl && body.databaseUrl !== "••••••••") {
      setConnectionUrl(body.databaseUrl);
      // Persist it as DATABASE_URL in process.env for the lifetime of this process
      // (it will be lost on restart — user must also update their .env / platform config)
      process.env.DATABASE_URL = body.databaseUrl;
    }

    await initDb();

    // ── LLM settings ────────────────────────────────────────────────────────
    if (body.provider)     await upsertSetting("provider",       body.provider);
    if (body.model)        await upsertSetting("model",           body.model);
    if (body.ollamaBaseUrl) await upsertSetting("ollama_base_url", body.ollamaBaseUrl);
    if (body.systemPrompt !== undefined)
                           await upsertSetting("system_prompt",   body.systemPrompt);

    // API key: only update if the user typed a real value (not the masked placeholder)
    if (body.apiKey && body.apiKey !== "••••••••") {
      await upsertSetting("api_key", body.apiKey);
    }
    if (body.clearApiKey) {
      await upsertSetting("api_key", "");
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/settings error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
