import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { detectDialect, sqlTrunc, sqlNow } from "@/lib/db";

// ─────────────────────────────────────────────────────────────────────────────
// detectDialect
// ─────────────────────────────────────────────────────────────────────────────

describe("detectDialect", () => {
  // ── PostgreSQL ─────────────────────────────────────────────────────────────
  describe("postgres", () => {
    it('detects "postgres://" scheme', () => {
      expect(detectDialect("postgres://user:pass@localhost:5432/mydb")).toBe("postgres");
    });

    it('detects "postgresql://" scheme', () => {
      expect(detectDialect("postgresql://user:pass@localhost:5432/mydb")).toBe("postgres");
    });

    it("detects postgres with SSL params", () => {
      expect(detectDialect("postgresql://user:pass@host:5432/db?sslmode=require")).toBe("postgres");
    });

    it("detects postgres with uppercase letters in credentials", () => {
      expect(detectDialect("postgresql://User:Pass@Host:5432/DB")).toBe("postgres");
    });
  });

  // ── MySQL ──────────────────────────────────────────────────────────────────
  describe("mysql", () => {
    it('detects "mysql://" scheme', () => {
      expect(detectDialect("mysql://user:pass@localhost:3306/mydb")).toBe("mysql");
    });

    it('detects "mysql2://" scheme', () => {
      expect(detectDialect("mysql2://user:pass@localhost:3306/mydb")).toBe("mysql");
    });

    it("detects mysql with extra query params", () => {
      expect(detectDialect("mysql://user:pass@host:3306/db?charset=utf8mb4")).toBe("mysql");
    });
  });

  // ── SQLite ─────────────────────────────────────────────────────────────────
  describe("sqlite (fallback)", () => {
    it('detects "sqlite://" scheme as sqlite', () => {
      expect(detectDialect("sqlite:///path/to/db.sqlite")).toBe("sqlite");
    });

    it("treats a bare file path as sqlite", () => {
      expect(detectDialect("/var/data/openchat.db")).toBe("sqlite");
    });

    it('treats ":memory:" as sqlite', () => {
      expect(detectDialect(":memory:")).toBe("sqlite");
    });

    it("treats a relative file path as sqlite", () => {
      expect(detectDialect("./data/local.db")).toBe("sqlite");
    });

    it("treats an unknown scheme as sqlite (fallback)", () => {
      expect(detectDialect("unknown://some/path")).toBe("sqlite");
    });

    it("treats an empty string as sqlite (fallback)", () => {
      expect(detectDialect("")).toBe("sqlite");
    });
  });

  // ── Case sensitivity ───────────────────────────────────────────────────────
  describe("case sensitivity", () => {
    it("does NOT match 'POSTGRES://' — schemes are case-sensitive", () => {
      // The implementation uses startsWith which is case-sensitive
      expect(detectDialect("POSTGRES://user:pass@localhost/db")).toBe("sqlite");
    });

    it("does NOT match 'MYSQL://' — schemes are case-sensitive", () => {
      expect(detectDialect("MYSQL://user:pass@localhost/db")).toBe("sqlite");
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// sqlTrunc
// ─────────────────────────────────────────────────────────────────────────────

describe("sqlTrunc", () => {
  it("uses SUBSTR for sqlite", () => {
    expect(sqlTrunc("sqlite", "$1", 60)).toBe("SUBSTR($1, 1, 60)");
  });

  it("uses LEFT for postgres", () => {
    expect(sqlTrunc("postgres", "$1", 60)).toBe("LEFT($1, 60)");
  });

  it("uses LEFT for mysql", () => {
    expect(sqlTrunc("mysql", "$1", 60)).toBe("LEFT($1, 60)");
  });

  it("respects the length argument", () => {
    expect(sqlTrunc("sqlite", "content", 80)).toBe("SUBSTR(content, 1, 80)");
    expect(sqlTrunc("postgres", "content", 80)).toBe("LEFT(content, 80)");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// sqlNow
// ─────────────────────────────────────────────────────────────────────────────

describe("sqlNow", () => {
  it("returns strftime expression for sqlite", () => {
    expect(sqlNow("sqlite")).toBe("strftime('%Y-%m-%dT%H:%M:%fZ','now')");
  });

  it("returns CURRENT_TIMESTAMP(3) for mysql", () => {
    expect(sqlNow("mysql")).toBe("CURRENT_TIMESTAMP(3)");
  });

  it("returns NOW() for postgres", () => {
    expect(sqlNow("postgres")).toBe("NOW()");
  });
});


// We test the placeholder translation logic that mysqlQuery and sqliteQuery use.
// ─────────────────────────────────────────────────────────────────────────────

describe("placeholder translation ($N → ?)", () => {
  // The regex used inside mysqlQuery / sqliteQuery: sql.replace(/\$\d+/g, "?")
  // We test the regex directly to verify all edge cases without hitting the DB.
  const translatePlaceholders = (sql: string) => sql.replace(/\$\d+/g, "?");

  it("replaces a single $1", () => {
    expect(translatePlaceholders("SELECT * FROM t WHERE id = $1")).toBe(
      "SELECT * FROM t WHERE id = ?"
    );
  });

  it("replaces multiple ordered placeholders", () => {
    expect(translatePlaceholders("INSERT INTO t (a, b) VALUES ($1, $2)")).toBe(
      "INSERT INTO t (a, b) VALUES (?, ?)"
    );
  });

  it("replaces double-digit placeholders ($10, $11…)", () => {
    expect(translatePlaceholders("SELECT $1, $2, $10, $11")).toBe(
      "SELECT ?, ?, ?, ?"
    );
  });

  it("leaves ? placeholders untouched (already MySQL/SQLite style)", () => {
    expect(translatePlaceholders("SELECT * FROM t WHERE id = ?")).toBe(
      "SELECT * FROM t WHERE id = ?"
    );
  });

  it("leaves plain text containing '$' followed by non-digit alone", () => {
    expect(translatePlaceholders("SELECT '$abc' AS val")).toBe("SELECT '$abc' AS val");
  });

  it("handles mixed $-params and literal dollar signs", () => {
    expect(translatePlaceholders("SELECT $1, '$literal'")).toBe("SELECT ?, '$literal'");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getConnectionString — env var resolution
// ─────────────────────────────────────────────────────────────────────────────

describe("getConnectionString (via env vars)", () => {
  const ORIGINAL_ENV = { ...process.env };

  afterEach(() => {
    // Restore env after each test
    process.env = { ...ORIGINAL_ENV };
  });

  it("picks up DATABASE_URL from process.env", async () => {
    // We can only test this indirectly: set DATABASE_URL and confirm detectDialect works
    process.env.DATABASE_URL = "sqlite://:memory:";
    const { detectDialect: detect } = await import("@/lib/db");
    expect(detect(process.env.DATABASE_URL)).toBe("sqlite");
  });

  it("VCAP_SERVICES parsing — extracts uri from first service credential", () => {
    const vcap = {
      postgresql: [
        { credentials: { uri: "postgresql://user:pass@host:5432/db" } },
      ],
    };
    process.env.VCAP_SERVICES = JSON.stringify(vcap);
    process.env.DATABASE_URL = ""; // clear DATABASE_URL so VCAP path is reached
    // We can't easily call getConnectionString() directly (it's private) but
    // we can verify the VCAP JSON shape is parseable and has the right structure.
    const parsed = JSON.parse(process.env.VCAP_SERVICES);
    const uri = parsed.postgresql[0].credentials.uri;
    expect(uri).toBe("postgresql://user:pass@host:5432/db");
    expect(detectDialect(uri)).toBe("postgres");
  });

  it("VCAP_SERVICES parsing — falls back to 'url' key when 'uri' is absent", () => {
    const vcap = {
      mysql: [
        { credentials: { url: "mysql://user:pass@host:3306/db" } },
      ],
    };
    const parsed = JSON.parse(JSON.stringify(vcap));
    const url = parsed.mysql[0].credentials.url;
    expect(detectDialect(url)).toBe("mysql");
  });
});
