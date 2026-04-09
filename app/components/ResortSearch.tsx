"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface SearchResort {
  id: string;
  name: string;
  region: string;
  score: number | null;
  altitude: number;
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // strip accents
}

function matches(resort: SearchResort, query: string): boolean {
  if (!query.trim()) return false;
  const q = normalize(query);
  const haystack = normalize(`${resort.name} ${resort.region}`);
  // All space-separated words must match somewhere
  return q.split(/\s+/).every((word) => haystack.includes(word));
}

export default function ResortSearch({ resorts }: { resorts: SearchResort[] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const suggestions = query.trim().length > 0
    ? resorts.filter((r) => matches(r, query)).slice(0, 8)
    : [];

  const go = useCallback(
    (id: string) => {
      setQuery("");
      setOpen(false);
      router.push(`/resort/${id}`);
    },
    [router]
  );

  useEffect(() => {
    setActiveIdx(-1);
  }, [query]);

  useEffect(() => {
    if (activeIdx >= 0 && listRef.current) {
      const el = listRef.current.children[activeIdx] as HTMLElement;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIdx]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = activeIdx >= 0 ? suggestions[activeIdx] : suggestions[0];
      if (target) go(target.id);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIdx(-1);
    }
  }

  const scoreColor = (s: number | null) => {
    if (s === null) return "#94a3b8";
    if (s >= 8) return "#1B7D3A";
    if (s >= 6) return "#4CAF50";
    if (s >= 4) return "#F5A623";
    if (s >= 2) return "#E85D3A";
    return "#C62828";
  };

  return (
    <div className="relative w-full max-w-xl mx-auto">
      {/* Input */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-lg">
          🔍
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder="Search a ski area…"
          autoComplete="off"
          spellCheck={false}
          className="w-full pl-11 pr-4 py-4 text-base bg-white border border-slate-300 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400 text-slate-800"
        />
        {query && (
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { setQuery(""); inputRef.current?.focus(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm"
          >
            ✕
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && suggestions.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-30 mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden max-h-80 overflow-y-auto"
        >
          {suggestions.map((resort, i) => (
            <li
              key={resort.id}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => go(resort.id)}
              onMouseEnter={() => setActiveIdx(i)}
              className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors border-b border-slate-100 last:border-0 ${
                i === activeIdx ? "bg-slate-50" : "hover:bg-slate-50"
              }`}
            >
              <div>
                <p className="text-sm font-medium text-slate-800">{resort.name}</p>
                <p className="text-xs text-slate-400">
                  {resort.region} · {resort.altitude}m
                </p>
              </div>
              {resort.score !== null ? (
                <span
                  className="text-sm font-bold tabular-nums shrink-0 ml-3"
                  style={{ color: scoreColor(resort.score) }}
                >
                  {resort.score.toFixed(1)}
                </span>
              ) : (
                <span className="text-xs text-slate-300 ml-3">—</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* No results */}
      {open && query.trim().length > 0 && suggestions.length === 0 && (
        <div className="absolute z-30 mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-lg px-4 py-4 text-sm text-slate-400 text-center">
          No resort found for &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  );
}
