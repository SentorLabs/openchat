import type { Source } from "./types";

const SOURCES_RE = /\[SOURCES\]([\s\S]*?)\[\/SOURCES\]/;

export function parseSources(raw: string): Source[] {
  const match = raw.match(SOURCES_RE);
  if (!match) return [];
  return match[1]
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("-"))
    .map((line) => {
      const content = line.slice(1).trim();

      // Format 1: markdown link  - [Title](URL)
      const mdMatch = content.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (mdMatch) return { title: mdMatch[1].trim(), url: mdMatch[2].trim() };

      // Format 2: "Title" | URL  (quotes optional)
      // Format 3: Title | URL
      const pipeIdx = content.indexOf(" | ");
      if (pipeIdx !== -1) {
        const title = content.slice(0, pipeIdx).replace(/^"|"$/g, "").trim();
        // The URL part may itself be a markdown link like [https://...](https://...)
        const urlPart = content.slice(pipeIdx + 3).trim();
        const urlMd = urlPart.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        const url = urlMd ? urlMd[2].trim() : urlPart.replace(/^"|"$/g, "").trim();
        return { title, url };
      }

      // Format 4: plain text fallback
      return { title: content, url: content };
    })
    .filter((s) => s.title.length > 0);
}

export function stripSources(raw: string): string {
  // Remove completed [SOURCES]...[/SOURCES] block
  let out = raw.replace(SOURCES_RE, "").trim();
  // Also hide a partial [SOURCES] block that hasn't closed yet (mid-stream)
  const partialIdx = out.indexOf("[SOURCES]");
  if (partialIdx !== -1) out = out.slice(0, partialIdx).trim();
  return out;
}


