import { NextRequest, NextResponse } from "next/server";
import { setConnectionUrl, initDb, detectDialect } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { databaseUrl } = (await req.json()) as { databaseUrl: string };
    if (!databaseUrl) {
      return NextResponse.json({ error: "databaseUrl is required" }, { status: 400 });
    }

    // Switch to the provided URL and attempt to initialise the schema
    setConnectionUrl(databaseUrl);
    process.env.DATABASE_URL = databaseUrl;
    await initDb();

    return NextResponse.json({ ok: true, dialect: detectDialect(databaseUrl) });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
