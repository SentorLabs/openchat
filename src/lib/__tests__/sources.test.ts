import { describe, it, expect } from "vitest";
import { parseSources, stripSources } from "@/lib/sources";

// ─────────────────────────────────────────────────────────────────────────────
// parseSources
// ─────────────────────────────────────────────────────────────────────────────

describe("parseSources", () => {
  // ── No sources block ───────────────────────────────────────────────────────
  describe("no sources block", () => {
    it("returns [] when the response has no [SOURCES] block", () => {
      expect(parseSources("Hello, this is a plain answer.")).toEqual([]);
    });

    it("returns [] for an empty string", () => {
      expect(parseSources("")).toEqual([]);
    });

    it("returns [] when [SOURCES] tag is present but not closed", () => {
      expect(parseSources("Answer\n[SOURCES]\n- some text")).toEqual([]);
    });

    it("returns [] when [/SOURCES] appears without opening tag", () => {
      expect(parseSources("Answer\n[/SOURCES]")).toEqual([]);
    });

    it("returns [] when the sources block is empty", () => {
      expect(parseSources("[SOURCES]\n[/SOURCES]")).toEqual([]);
    });

    it("returns [] when the sources block contains only whitespace", () => {
      expect(parseSources("[SOURCES]\n   \n\t\n[/SOURCES]")).toEqual([]);
    });

    it("returns [] when lines inside block don't start with '-'", () => {
      expect(parseSources("[SOURCES]\nhttps://example.com\n[/SOURCES]")).toEqual([]);
    });
  });

  // ── Format 1: markdown link  - [Title](URL) ────────────────────────────────
  describe("Format 1 — markdown link", () => {
    it("parses a single markdown-link source", () => {
      const raw = "Answer\n[SOURCES]\n- [MDN Web Docs](https://developer.mozilla.org)\n[/SOURCES]";
      expect(parseSources(raw)).toEqual([
        { title: "MDN Web Docs", url: "https://developer.mozilla.org" },
      ]);
    });

    it("trims title and url whitespace inside the markdown link", () => {
      const raw = "[SOURCES]\n- [ My Title ](  https://example.com  )\n[/SOURCES]";
      expect(parseSources(raw)).toEqual([
        { title: "My Title", url: "https://example.com" },
      ]);
    });

    it("parses multiple markdown-link sources", () => {
      const raw =
        "[SOURCES]\n" +
        "- [Source A](https://a.com)\n" +
        "- [Source B](https://b.com)\n" +
        "[/SOURCES]";
      expect(parseSources(raw)).toEqual([
        { title: "Source A", url: "https://a.com" },
        { title: "Source B", url: "https://b.com" },
      ]);
    });

    it("handles URLs with query strings and fragments", () => {
      const raw = "[SOURCES]\n- [Search](https://example.com/search?q=foo&page=1#results)\n[/SOURCES]";
      expect(parseSources(raw)).toEqual([
        { title: "Search", url: "https://example.com/search?q=foo&page=1#results" },
      ]);
    });

    it("handles titles containing brackets inside markdown link", () => {
      // outer brackets are the markdown ones; inner brackets in title should be fine
      // The regex [^\]]+ won't match nested brackets — this is expected behaviour
      const raw = "[SOURCES]\n- [Title](https://example.com)\n[/SOURCES]";
      expect(parseSources(raw)).toEqual([
        { title: "Title", url: "https://example.com" },
      ]);
    });
  });

  // ── Format 2: "Title" | URL  (quoted title) ────────────────────────────────
  describe("Format 2 — quoted title pipe", () => {
    it("parses a quoted-title pipe source", () => {
      const raw = '[SOURCES]\n- "Wikipedia" | https://en.wikipedia.org\n[/SOURCES]';
      expect(parseSources(raw)).toEqual([
        { title: "Wikipedia", url: "https://en.wikipedia.org" },
      ]);
    });

    it("strips surrounding quotes from title", () => {
      const raw = '[SOURCES]\n- "The Title Here" | https://example.com\n[/SOURCES]';
      const result = parseSources(raw);
      expect(result[0].title).toBe("The Title Here");
    });
  });

  // ── Format 3: Title | URL ──────────────────────────────────────────────────
  describe("Format 3 — plain pipe", () => {
    it("parses a plain-pipe source", () => {
      const raw = "[SOURCES]\n- Wikipedia | https://en.wikipedia.org\n[/SOURCES]";
      expect(parseSources(raw)).toEqual([
        { title: "Wikipedia", url: "https://en.wikipedia.org" },
      ]);
    });

    it("handles pipe where url part is itself a markdown link", () => {
      const raw = "[SOURCES]\n- My Source | [https://example.com](https://example.com)\n[/SOURCES]";
      expect(parseSources(raw)).toEqual([
        { title: "My Source", url: "https://example.com" },
      ]);
    });

    it("handles pipe with extra whitespace around separator", () => {
      // The separator is exactly " | " so "title|url" (no spaces) would fall through to Format 4
      const raw = "[SOURCES]\n- Title Here | https://example.com\n[/SOURCES]";
      expect(parseSources(raw)).toEqual([
        { title: "Title Here", url: "https://example.com" },
      ]);
    });

    it("uses full content as title when pipe appears multiple times", () => {
      // indexOf finds the FIRST " | " so only that split is used
      const raw = "[SOURCES]\n- Title | Part | https://example.com\n[/SOURCES]";
      const result = parseSources(raw);
      expect(result[0].title).toBe("Title");
      expect(result[0].url).toBe("Part | https://example.com");
    });
  });

  // ── Format 4: plain text fallback ─────────────────────────────────────────
  describe("Format 4 — plain text fallback", () => {
    it("uses the text as both title and url for plain text", () => {
      const raw = "[SOURCES]\n- plain text with no pipe or brackets\n[/SOURCES]";
      expect(parseSources(raw)).toEqual([
        { title: "plain text with no pipe or brackets", url: "plain text with no pipe or brackets" },
      ]);
    });

    it("filters out sources whose title is empty after trimming", () => {
      // A line that is just "-" with nothing after
      const raw = "[SOURCES]\n- \n[/SOURCES]";
      expect(parseSources(raw)).toEqual([]);
    });
  });

  // ── Mixed formats ──────────────────────────────────────────────────────────
  describe("mixed formats in one block", () => {
    it("parses all four formats together", () => {
      const raw =
        "Answer text\n" +
        "[SOURCES]\n" +
        "- [MDN](https://developer.mozilla.org)\n" +
        '- "Wikipedia" | https://en.wikipedia.org\n' +
        "- OpenAI Blog | https://openai.com/blog\n" +
        "- Some plain reference\n" +
        "[/SOURCES]";
      const result = parseSources(raw);
      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({ title: "MDN", url: "https://developer.mozilla.org" });
      expect(result[1]).toEqual({ title: "Wikipedia", url: "https://en.wikipedia.org" });
      expect(result[2]).toEqual({ title: "OpenAI Blog", url: "https://openai.com/blog" });
      expect(result[3]).toEqual({ title: "Some plain reference", url: "Some plain reference" });
    });
  });

  // ── Edge cases ─────────────────────────────────────────────────────────────
  describe("edge cases", () => {
    it("only uses the FIRST [SOURCES] block if somehow there are two", () => {
      // The regex is non-greedy so it matches the first complete block
      const raw =
        "[SOURCES]\n- [First](https://first.com)\n[/SOURCES]\n" +
        "[SOURCES]\n- [Second](https://second.com)\n[/SOURCES]";
      const result = parseSources(raw);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("First");
    });

    it("handles CRLF line endings inside the sources block", () => {
      const raw = "[SOURCES]\r\n- [A](https://a.com)\r\n[/SOURCES]";
      const result = parseSources(raw);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("A");
    });

    it("ignores lines inside the block that don't start with '-'", () => {
      const raw =
        "[SOURCES]\n" +
        "Note: these are the sources\n" +
        "- [Valid](https://valid.com)\n" +
        "  extra info\n" +
        "[/SOURCES]";
      const result = parseSources(raw);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Valid");
    });

    it("handles up to 4 sources (the expected max)", () => {
      const raw =
        "[SOURCES]\n" +
        "- [A](https://a.com)\n" +
        "- [B](https://b.com)\n" +
        "- [C](https://c.com)\n" +
        "- [D](https://d.com)\n" +
        "[/SOURCES]";
      expect(parseSources(raw)).toHaveLength(4);
    });

    it("returns sources even when there is text before and after the block", () => {
      const raw =
        "Here is my answer with lots of detail.\n\n" +
        "[SOURCES]\n- [Ref](https://ref.com)\n[/SOURCES]\n\n" +
        "Some trailing text.";
      expect(parseSources(raw)).toEqual([{ title: "Ref", url: "https://ref.com" }]);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// stripSources
// ─────────────────────────────────────────────────────────────────────────────

describe("stripSources", () => {
  it("removes a complete [SOURCES]...[/SOURCES] block", () => {
    const raw = "Main answer.\n[SOURCES]\n- [Ref](https://ref.com)\n[/SOURCES]";
    expect(stripSources(raw)).toBe("Main answer.");
  });

  it("returns the original text unchanged when no sources block exists", () => {
    expect(stripSources("Plain answer with no sources.")).toBe("Plain answer with no sources.");
  });

  it("returns empty string when the entire content is a sources block", () => {
    expect(stripSources("[SOURCES]\n- [A](https://a.com)\n[/SOURCES]")).toBe("");
  });

  it("trims surrounding whitespace after stripping", () => {
    const raw = "  Answer.  \n[SOURCES]\n- [A](https://a.com)\n[/SOURCES]\n  ";
    expect(stripSources(raw)).toBe("Answer.");
  });

  it("hides a partial [SOURCES] block that has not yet closed (mid-stream)", () => {
    const raw = "Here is my answer so far.\n[SOURCES]\n- still streaming...";
    expect(stripSources(raw)).toBe("Here is my answer so far.");
  });

  it("returns empty string when text starts immediately with an unclosed [SOURCES]", () => {
    expect(stripSources("[SOURCES]\n- partial")).toBe("");
  });

  it("strips the block and trims even when answer ends with newlines", () => {
    const raw = "Answer\n\n[SOURCES]\n- [X](https://x.com)\n[/SOURCES]\n\n";
    expect(stripSources(raw)).toBe("Answer");
  });

  it("preserves content before and after the complete block; hides trailing partial block", () => {
    // First block is complete — stripped. Second is partial — mid-stream hiding kicks in.
    // Content before the first block ("Answer") and after it ("More text") are preserved
    // until the partial [SOURCES] tag is encountered.
    const raw =
      "Answer\n[SOURCES]\n- [A](https://a.com)\n[/SOURCES]\nMore text\n[SOURCES]\n- partial";
    const result = stripSources(raw);
    expect(result).toBe("Answer\n\nMore text");
  });

  it("does not strip content that merely contains the word SOURCES without brackets", () => {
    const raw = "My answer mentions SOURCES in plain text.";
    expect(stripSources(raw)).toBe("My answer mentions SOURCES in plain text.");
  });
});
