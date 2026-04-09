"use client";

import { useState } from "react";
import Link from "next/link";
import { scoreHexColor, scoreLabel } from "@/lib/score-color";
import { ResortScore } from "@/lib/types";

function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function RankingRow({ resort, rank }: { resort: ResortScore; rank: number }) {
  const hasData = !resort.error && resort.rawData;
  const color = scoreHexColor(resort.totalScore);

  return (
    <Link
      href={`/resort/${resort.id}`}
      className="group flex items-center gap-4 bg-white rounded-2xl border border-slate-200 px-4 py-4 hover:border-slate-300 hover:shadow-sm transition-all"
    >
      <span className="text-sm font-medium text-slate-400 tabular-nums w-6 shrink-0 text-center">
        {resort.error ? "–" : rank}
      </span>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 text-[15px] leading-tight">{resort.name}</p>
        {hasData && (
          <p className="text-xs text-slate-400 mt-0.5 truncate">{resort.summary}</p>
        )}
        {resort.error && (
          <p className="text-xs text-red-400 mt-0.5">Data unavailable</p>
        )}
      </div>

      {hasData && (
        <div className="hidden sm:flex items-center gap-4 text-xs shrink-0">
          <span className="flex flex-col items-center gap-0.5">
            <span className="font-medium text-slate-700">{resort.rawData.snowDepth}cm</span>
            <span className="text-slate-400">base</span>
          </span>
          <span className="flex flex-col items-center gap-0.5">
            <span className={`font-medium ${resort.rawData.freshSnow24h > 0 ? "text-blue-600" : "text-slate-500"}`}>
              {resort.rawData.freshSnow24h > 0 ? `+${resort.rawData.freshSnow24h}cm` : "—"}
            </span>
            <span className="text-slate-400">24h snow</span>
          </span>
          <span className="flex flex-col items-center gap-0.5">
            <span className="font-medium text-slate-700">{resort.rawData.temperature}°C</span>
            <span className="text-slate-400">temp</span>
          </span>
          <span className="flex flex-col items-center gap-0.5">
            <span className="font-medium text-slate-700">{resort.rawData.windSpeed} km/h</span>
            <span className="text-slate-400">wind</span>
          </span>
        </div>
      )}

      <div className="flex flex-col items-end shrink-0 ml-2">
        <span className="text-2xl font-bold tabular-nums leading-none" style={{ color }}>
          {resort.error ? "—" : resort.totalScore.toFixed(1)}
        </span>
        {!resort.error && (
          <span className="text-[10px] font-medium mt-0.5" style={{ color }}>
            {scoreLabel(resort.totalScore)}
          </span>
        )}
      </div>

      <span className="text-slate-300 group-hover:text-slate-400 transition-colors text-sm shrink-0">→</span>
    </Link>
  );
}

export default function RankingClient({
  resorts,
  updatedAt,
}: {
  resorts: ResortScore[];
  updatedAt: string | null;
}) {
  const [filter, setFilter] = useState("");
  const norm = normalize(filter);
  const filtered = resorts.filter((r) =>
    norm ? normalize(r.name).includes(norm) : true
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Resort Ranking</h1>
        <p className="text-slate-500 text-sm mt-1">
          All resorts ranked by today&apos;s snow quality score
        </p>
        {updatedAt && (
          <p className="text-xs text-slate-400 mt-1">
            Updated{" "}
            {new Date(updatedAt).toLocaleTimeString("en-GB", {
              hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris",
            })}{" "}
            Paris time
          </p>
        )}
      </div>

      <div className="relative mb-4">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter resorts…"
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">No resorts match.</div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((resort, i) => (
            <RankingRow key={resort.id} resort={resort} rank={i + 1} />
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3 mt-6 pt-5 border-t border-slate-200">
        {[
          { range: "8–10", label: "Excellent", color: "#1B7D3A" },
          { range: "6–7.9", label: "Good", color: "#4CAF50" },
          { range: "4–5.9", label: "Moderate", color: "#F5A623" },
          { range: "2–3.9", label: "Poor", color: "#E85D3A" },
          { range: "0–1.9", label: "Very poor", color: "#C62828" },
        ].map((item) => (
          <span key={item.range} className="flex items-center gap-1.5 text-xs">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <span className="font-semibold" style={{ color: item.color }}>{item.range}</span>
            <span className="text-slate-400">{item.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
