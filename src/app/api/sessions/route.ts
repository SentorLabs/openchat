import { NextResponse } from "next/server";
import { initDb, query, insertAndReturn } from "@/lib/db";
import type { Session } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  try {
    await initDb();
    const sessions = await query<Session>(`
      SELECT s.id, s.title, s.created_at, s.updated_at,
             SUBSTR((
               SELECT content FROM messages
               WHERE session_id = s.id
               ORDER BY created_at DESC LIMIT 1
             ), 1, 80) AS last_message
      FROM sessions s
      ORDER BY s.updated_at DESC
      LIMIT 50
    `);
    return NextResponse.json(sessions);
  } catch (err) {
    console.error("GET /api/sessions error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST() {
  try {
    await initDb();
    const session = await insertAndReturn<Session>(
      `INSERT INTO sessions (title) VALUES ('New Chat')`,
      `SELECT id, title, created_at, updated_at FROM sessions ORDER BY created_at DESC LIMIT 1`
    );
    return NextResponse.json(session);
  } catch (err) {
    console.error("POST /api/sessions error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
