import { NextRequest, NextResponse } from "next/server";
import { initDb, query } from "@/lib/db";
import type { DbMessage } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await initDb();
  const { id } = await params;
  const messages = await query<DbMessage>(`
    SELECT id, session_id, role, content, sources, created_at
    FROM messages
    WHERE session_id = $1
    ORDER BY created_at ASC
  `, [id]);
  return NextResponse.json(messages);
}
