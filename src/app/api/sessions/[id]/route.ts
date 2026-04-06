import { NextRequest, NextResponse } from "next/server";
import { initDb, query } from "@/lib/db";

export const runtime = "nodejs";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const { id } = await params;
    await query(`DELETE FROM sessions WHERE id = $1`, [id]);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("DELETE /api/sessions/[id] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
