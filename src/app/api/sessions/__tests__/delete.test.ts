import { describe, it, expect, beforeEach } from "vitest";
import { setConnectionUrl, initDb, query } from "@/lib/db";
import { DELETE } from "@/app/api/sessions/[id]/route";
import { NextRequest } from "next/server";

// Use a fresh in-memory SQLite database for each test
beforeEach(async () => {
  setConnectionUrl(":memory:");
  await initDb();
});

function makeRequest(id: string) {
  return new NextRequest(`http://localhost/api/sessions/${id}`, { method: "DELETE" });
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("DELETE /api/sessions/[id]", () => {
  it("deletes an existing session and returns 204", async () => {
    // Create a session
    await query(`INSERT INTO sessions (id, title) VALUES ('sess-1', 'Test Chat')`);
    const before = await query(`SELECT id FROM sessions WHERE id = 'sess-1'`);
    expect(before).toHaveLength(1);

    const res = await DELETE(makeRequest("sess-1"), makeParams("sess-1"));

    expect(res.status).toBe(204);
    const after = await query(`SELECT id FROM sessions WHERE id = 'sess-1'`);
    expect(after).toHaveLength(0);
  });

  it("cascades deletion to messages belonging to the session", async () => {
    await query(`INSERT INTO sessions (id, title) VALUES ('sess-2', 'Chat')`);
    await query(
      `INSERT INTO messages (id, session_id, role, content) VALUES ('msg-1', 'sess-2', 'user', 'hello')`
    );

    const res = await DELETE(makeRequest("sess-2"), makeParams("sess-2"));

    expect(res.status).toBe(204);
    const msgs = await query(`SELECT id FROM messages WHERE session_id = 'sess-2'`);
    expect(msgs).toHaveLength(0);
  });

  it("returns 204 even when the session does not exist (idempotent)", async () => {
    const res = await DELETE(makeRequest("nonexistent-id"), makeParams("nonexistent-id"));
    expect(res.status).toBe(204);
  });

  it("does not delete other sessions", async () => {
    await query(`INSERT INTO sessions (id, title) VALUES ('sess-a', 'A'), ('sess-b', 'B')`);

    await DELETE(makeRequest("sess-a"), makeParams("sess-a"));

    const remaining = await query(`SELECT id FROM sessions`);
    expect(remaining).toHaveLength(1);
    expect((remaining[0] as { id: string }).id).toBe("sess-b");
  });
});
