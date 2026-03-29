import type { LLMConfig } from "@/lib/types";

// ── Dialect detection ──────────────────────────────────────────────────────────

export type DbDialect = "postgres" | "mysql" | "sqlite";

export function detectDialect(url: string): DbDialect {
  if (url.startsWith("postgres://") || url.startsWith("postgresql://")) return "postgres";
  if (url.startsWith("mysql://") || url.startsWith("mysql2://")) return "mysql";
  // sqlite: explicit scheme, a file path, or ":memory:"
  return "sqlite";
}

// ── Connection string resolution ───────────────────────────────────────────────

function getConnectionString(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  // SAP BTP / Cloud Foundry — parse VCAP_SERVICES
  if (process.env.VCAP_SERVICES) {
    try {
      const vcap = JSON.parse(process.env.VCAP_SERVICES) as Record<
        string,
        { credentials: { uri?: string; url?: string } }[]
      >;
      for (const services of Object.values(vcap)) {
        for (const svc of services) {
          const uri = svc.credentials?.uri ?? svc.credentials?.url;
          if (uri) return uri;
        }
      }
    } catch { /* malformed VCAP — fall through */ }
  }

  throw new Error(
    "No database connection string found. Set DATABASE_URL in .env.local or configure it in Settings."
  );
}

// ── Generic query result row ───────────────────────────────────────────────────

type Row = Record<string, unknown>;

// ── Postgres adapter ──────────────────────────────────────────────────────────

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: import("pg").Pool | undefined;
  // eslint-disable-next-line no-var
  var _mysqlPool: import("mysql2/promise").Pool | undefined;
}

async function pgQuery<T>(url: string, sql: string, params?: unknown[]): Promise<T[]> {
  const { Pool } = await import("pg");
  if (!globalThis._pgPool || (globalThis._pgPool as unknown as { options: { connectionString: string } }).options?.connectionString !== url) {
    globalThis._pgPool?.end().catch(() => {});
    globalThis._pgPool = new Pool({ connectionString: url });
  }
  const result = await globalThis._pgPool.query(sql, params);
  return result.rows as T[];
}

// ── MySQL adapter ─────────────────────────────────────────────────────────────

async function mysqlQuery<T>(url: string, sql: string, params?: unknown[]): Promise<T[]> {
  const mysql = await import("mysql2/promise");
  if (!globalThis._mysqlPool) {
    globalThis._mysqlPool = mysql.createPool(url);
  }
  // mysql2 uses ? placeholders; translate postgres $1..$N
  const mysqlSql = sql.replace(/\$\d+/g, "?");
  const [rows] = await globalThis._mysqlPool.query(mysqlSql, params ?? []);
  return rows as T[];
}

// ── SQLite adapter ────────────────────────────────────────────────────────────

// better-sqlite3 is synchronous — wrap in a tiny async shim
let _sqliteDb: import("better-sqlite3").Database | undefined;
let _sqliteUrl = "";

async function sqliteQuery<T>(url: string, sql: string, params?: unknown[]): Promise<T[]> {
  const Database = (await import("better-sqlite3")).default;
  // Strip the "sqlite://" scheme if present; treat the rest as a file path
  const filePath = url.replace(/^sqlite:\/\//, "") || ":memory:";

  if (!_sqliteDb || _sqliteUrl !== filePath) {
    _sqliteDb?.close();
    _sqliteDb = new Database(filePath);
    _sqliteUrl = filePath;
  }

  // better-sqlite3 uses ? placeholders; translate postgres $1..$N
  const sqliteSql = sql.replace(/\$\d+/g, "?");
  const stmt = _sqliteDb.prepare(sqliteSql);

  // Use .all() for SELECT-like, .run() for INSERT/UPDATE/DELETE/CREATE
  const isSelect = /^\s*(SELECT|WITH|PRAGMA)/i.test(sqliteSql);
  if (isSelect) {
    return stmt.all(...(params ?? [])) as T[];
  }
  stmt.run(...(params ?? []));
  return [];
}

// ── Public query function ─────────────────────────────────────────────────────

let _connectionUrl = "";

export async function query<T = Row>(sql: string, params?: unknown[]): Promise<T[]> {
  const url = _connectionUrl || getConnectionString();
  const dialect = detectDialect(url);
  switch (dialect) {
    case "postgres": return pgQuery<T>(url, sql, params);
    case "mysql":    return mysqlQuery<T>(url, sql, params);
    case "sqlite":   return sqliteQuery<T>(url, sql, params);
  }
}

/** Update the active connection URL at runtime (called from the settings API). */
export function setConnectionUrl(url: string): void {
  if (url === _connectionUrl) return;
  _connectionUrl = url;
  // Reset pools so the next query opens a fresh connection
  globalThis._pgPool?.end().catch(() => {});
  globalThis._pgPool = undefined;
  globalThis._mysqlPool?.end().catch(() => {});
  globalThis._mysqlPool = undefined;
  _sqliteDb?.close();
  _sqliteDb = undefined;
  initialized = false; // re-run schema on next initDb() call
}

// ── Schema ────────────────────────────────────────────────────────────────────

function buildInitSql(dialect: DbDialect): string[] {
  if (dialect === "postgres") {
    return [
      `CREATE EXTENSION IF NOT EXISTS "pgcrypto"`,
      `CREATE TABLE IF NOT EXISTS sessions (
        id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        title      TEXT        NOT NULL DEFAULT 'New Chat',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      `CREATE TABLE IF NOT EXISTS messages (
        id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID        NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        role       TEXT        NOT NULL CHECK (role IN ('user','assistant')),
        content    TEXT        NOT NULL,
        sources    JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`,
      `CREATE INDEX IF NOT EXISTS messages_session_id_idx ON messages(session_id, created_at)`,
      `CREATE TABLE IF NOT EXISTS settings (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )`,
    ];
  }

  if (dialect === "mysql") {
    return [
      `CREATE TABLE IF NOT EXISTS sessions (
        id         CHAR(36)     NOT NULL PRIMARY KEY DEFAULT (UUID()),
        title      TEXT         NOT NULL,
        created_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
      `CREATE TABLE IF NOT EXISTS messages (
        id         CHAR(36)     NOT NULL PRIMARY KEY DEFAULT (UUID()),
        session_id CHAR(36)     NOT NULL,
        role       VARCHAR(16)  NOT NULL,
        content    LONGTEXT     NOT NULL,
        sources    JSON,
        created_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        CONSTRAINT fk_msg_session FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
      `CREATE INDEX IF NOT EXISTS messages_session_id_idx ON messages(session_id, created_at)`,
      `CREATE TABLE IF NOT EXISTS settings (
        \`key\`   VARCHAR(255) NOT NULL PRIMARY KEY,
        value TEXT         NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    ];
  }

  // SQLite
  return [
    `CREATE TABLE IF NOT EXISTS sessions (
      id         TEXT NOT NULL PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
      title      TEXT NOT NULL DEFAULT 'New Chat',
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    )`,
    `CREATE TABLE IF NOT EXISTS messages (
      id         TEXT NOT NULL PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
      session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      role       TEXT NOT NULL CHECK (role IN ('user','assistant')),
      content    TEXT NOT NULL,
      sources    TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    )`,
    `CREATE INDEX IF NOT EXISTS messages_session_id_idx ON messages(session_id, created_at)`,
    `CREATE TABLE IF NOT EXISTS settings (
      key   TEXT NOT NULL PRIMARY KEY,
      value TEXT NOT NULL
    )`,
  ];
}

let initialized = false;

export async function initDb(): Promise<void> {
  if (initialized) return;
  const url = _connectionUrl || getConnectionString();
  const dialect = detectDialect(url);
  for (const sql of buildInitSql(dialect)) {
    await query(sql);
  }
  initialized = true;
}

// ── Dialect-aware upsert helper ───────────────────────────────────────────────

export async function upsertSetting(key: string, value: string): Promise<void> {
  const url = _connectionUrl || getConnectionString();
  const dialect = detectDialect(url);

  if (dialect === "postgres") {
    await query(
      `INSERT INTO settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [key, value]
    );
  } else if (dialect === "mysql") {
    await query(
      `INSERT INTO settings (\`key\`, value) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE value = VALUES(value)`,
      [key, value]
    );
  } else {
    // SQLite
    await query(
      `INSERT INTO settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [key, value]
    );
  }
}

// ── LLM config ────────────────────────────────────────────────────────────────

const DEFAULT_SYSTEM_PROMPT = `You are a helpful, precise AI assistant. You answer questions with clarity and accuracy.

- Lead with the direct answer.
- Use **bold** for key terms.
- Distinguish between what is known, probable, and unknown.
- Say "I don't have reliable data on that" rather than guessing.
- End complex answers with a "**Key takeaway:**" line when helpful.`;

/** Load the active LLM config, merging DB settings over env-var fallbacks. */
export async function getConfig(): Promise<LLMConfig> {
  const rows = await query<{ key: string; value: string }>(
    `SELECT key, value FROM settings`
  );
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return {
    provider: (map.provider ?? process.env.LLM_PROVIDER ?? "openai") as LLMConfig["provider"],
    model:    map.model    ?? process.env.LLM_MODEL    ?? "",
    apiKey:   map.api_key  ?? process.env.LLM_API_KEY  ?? "",
    systemPrompt: map.system_prompt ?? process.env.LLM_SYSTEM_PROMPT ?? DEFAULT_SYSTEM_PROMPT,
    ollamaBaseUrl: map.ollama_base_url ?? process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
  };
}
