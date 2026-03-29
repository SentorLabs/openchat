"use client";

import { useState } from "react";
import type { Source } from "@/lib/types";

export default function SourcesBanner({ sources }: { sources: Source[] }) {
  const [open, setOpen] = useState(false);
  if (!sources.length) return null;

  return (
    <div
      className="mt-2 rounded-lg overflow-hidden text-xs"
      style={{ border: "1px solid rgba(168,85,247,0.2)" }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 cursor-pointer transition-colors"
        style={{
          background: "rgba(168,85,247,0.06)",
          color: "#c4b5fd",
        }}
      >
        <div className="flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          <span className="font-medium">Sources ({sources.length})</span>
        </div>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* List */}
      <div
        style={{
          maxHeight: open ? "300px" : "0",
          overflow: "hidden",
          transition: "max-height 0.2s ease",
        }}
      >
        <ul
          className="px-3 py-2 space-y-1.5"
          style={{ background: "rgba(168,85,247,0.03)" }}
        >
          {sources.map((s, i) => (
            <li key={i} className="flex items-start gap-2">
              <span style={{ color: "rgba(168,85,247,0.5)" }} className="mt-0.5">
                ◈
              </span>
              {s.url.startsWith("http") ? (
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline underline-offset-2 leading-relaxed"
                  style={{ color: "#a78bfa" }}
                >
                  {s.title}
                  <svg
                    className="inline ml-1 opacity-60"
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              ) : (
                <span className="leading-relaxed" style={{ color: "#a78bfa" }}>
                  {s.title}
                  {s.url !== s.title && (
                    <span style={{ color: "rgba(167,139,250,0.5)" }}>
                      {" "}— {s.url}
                    </span>
                  )}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
