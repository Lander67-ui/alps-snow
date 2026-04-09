import Link from "next/link";
import { loadLatestScores } from "@/lib/data-store";
import { ResortScore } from "@/lib/types";
import { scoreColorClass, scoreHexColor } from "@/lib/score-color";

export const revalidate = 3600;

// ── Formatting helpers ─────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    timeZone: "Europe/Paris",
  });
}

function formatTime(isoStr: string): string {
  return new Date(isoStr).toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris",
  });
}

// ── Sub-score bar ──────────────────────────────────────────────────────────

function SubScoreBar({ subScores }: { subScores: ResortScore["subScores"] }) {
  const segments = [
    { label: "Snow", value: subScores.snow, weight: 0.45 },
    { label: "Weather", value: subScores.weather, weight: 0.25 },
    { label: "Altitude", value: subScores.altitude, weight: 0.15 },
    { label: "Trend", value: subScores.trend, weight: 0.15 },
  ];
  return (
    <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden" aria-hidden>
      {segments.map((s) => (
        <div
          key={s.label}
          style={{ width: `${s.weight * 100}%`, backgroundColor: scoreHexColor(s.value) }}
        />
      ))}
    </div>
  );
}

// ── Confidence badge ───────────────────────────────────────────────────────

function ConfidenceBadge({ level }: { level: ResortScore["confidence"] }) {
  if (level === "high") return null;
  return (
    <span
      className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${
        level === "medium"
          ? "bg-amber-50 text-amber-700 border-amber-200"
          : "bg-red-50 text-red-700 border-red-200"
      }`}
    >
      {level === "medium" ? "Limited data" : "Unreliable"}
    </span>
  );
}

// ── Snow freshness indicator ───────────────────────────────────────────────

function SnowTag({ fresh24h }: { fresh24h: number }) {
  if (fresh24h >= 10)
    return (
      <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full">
        ❄ {fresh24h}cm fresh
      </span>
    );
  if (fresh24h >= 2)
    return (
      <span className="text-[11px] text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full">
        ❄ {fresh24h}cm
      </span>
    );
  return null;
}

// ── Resort card ────────────────────────────────────────────────────────────

function ResortCard({ resort, rank }: { resort: ResortScore; rank: number }) {
  const colorClass = scoreColorClass(resort.totalScore);
  const hasData = !resort.error && resort.rawData;

  return (
    <Link
      href={`/resort/${resort.id}`}
      className="group block bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 hover:border-slate-300 hover:shadow-md transition-all duration-150 active:scale-[0.995]"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left */}
        <div className="flex-1 min-w-0">
          {/* Name row */}
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="text-xs text-slate-400 tabular-nums w-4 shrink-0">#{rank}</span>
            <h2 className="font-semibold text-slate-900 text-[15px] leading-tight">{resort.name}</h2>
            <span className="text-xs text-slate-400">{resort.rawData?.snowDepth ?? 0}cm base</span>
            {hasData && <SnowTag fresh24h={resort.rawData.freshSnow24h} />}
            <ConfidenceBadge level={resort.confidence} />
          </div>

          {/* Weather line */}
          {hasData && (
            <p className="text-xs text-slate-400 mb-2">
              {resort.rawData.temperature}°C · {resort.rawData.windSpeed} km/h wind · {resort.rawData.freezingLevel}m freeze line
            </p>
          )}

          {/* Summary */}
          <p className="text-sm text-slate-600 leading-snug mb-3">{resort.summary}</p>

          {/* Sub-score bar */}
          <SubScoreBar subScores={resort.subScores} />

          {/* Sub-score labels */}
          <div className="mt-1.5 flex gap-3 text-[11px] text-slate-400">
            <span>
              <span className="font-medium" style={{ color: scoreHexColor(resort.subScores.snow) }}>
                {resort.subScores.snow.toFixed(1)}
              </span>{" "}
              snow
            </span>
            <span>
              <span className="font-medium" style={{ color: scoreHexColor(resort.subScores.weather) }}>
                {resort.subScores.weather.toFixed(1)}
              </span>{" "}
              weather
            </span>
            <span>
              <span className="font-medium" style={{ color: scoreHexColor(resort.subScores.altitude) }}>
                {resort.subScores.altitude.toFixed(1)}
              </span>{" "}
              altitude
            </span>
            <span>
              <span className="font-medium" style={{ color: scoreHexColor(resort.subScores.trend) }}>
                {resort.subScores.trend.toFixed(1)}
              </span>{" "}
              trend
            </span>
          </div>
        </div>

        {/* Right — score number */}
        <div className="flex flex-col items-end shrink-0 pt-0.5 gap-0.5">
          <span className={`text-[42px] font-bold tabular-nums leading-none ${colorClass}`}>
            {resort.error ? "–" : resort.totalScore.toFixed(1)}
          </span>
          <span className="text-xs text-slate-400">/10</span>
          <span className="text-xs text-slate-300 group-hover:text-slate-400 transition-colors mt-1">→</span>
        </div>
      </div>
    </Link>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────

function NoDataState() {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
      <div className="text-5xl mb-4">🏔</div>
      <h2 className="text-lg font-semibold text-slate-800 mb-2">No snow data yet</h2>
      <p className="text-slate-500 text-sm max-w-xs mx-auto leading-relaxed mb-4">
        Scores haven&apos;t been fetched yet. Run this command in the project folder:
      </p>
      <code className="inline-block bg-slate-100 text-slate-700 px-3 py-2 rounded-lg text-sm font-mono">
        npm run fetch-data
      </code>
    </div>
  );
}

// ── Score legend ───────────────────────────────────────────────────────────

const LEGEND = [
  { range: "8–10", label: "Excellent", color: "#1B7D3A" },
  { range: "6–7.9", label: "Good", color: "#4CAF50" },
  { range: "4–5.9", label: "Moderate", color: "#F5A623" },
  { range: "2–3.9", label: "Poor", color: "#E85D3A" },
  { range: "0–1.9", label: "Very poor", color: "#C62828" },
];

// ── Page ───────────────────────────────────────────────────────────────────

export default function HomePage() {
  const data = loadLatestScores();
  const sorted = data
    ? [
        ...data.resorts.filter((r) => !r.error).sort((a, b) => b.totalScore - a.totalScore),
        ...data.resorts.filter((r) => !!r.error),
      ]
    : [];

  return (
    <div>
      {/* Page header */}
      <div className="mb-5">
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight leading-tight">
          French Alps — Snow Quality
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Daily scores for 10 resorts based on live weather data
        </p>
        {data ? (
          <p className="text-xs text-slate-400 mt-1">
            {formatDate(data.date)} · Updated {formatTime(data.fetchedAt)} Paris time
          </p>
        ) : null}
      </div>

      {/* Legend */}
      {data && (
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-5">
          {LEGEND.map((item) => (
            <span key={item.range} className="flex items-center gap-1.5 text-xs">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="font-semibold" style={{ color: item.color }}>
                {item.range}
              </span>
              <span className="text-slate-400">{item.label}</span>
            </span>
          ))}
        </div>
      )}

      {/* Resort cards */}
      {!data ? (
        <NoDataState />
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map((resort, i) => (
            <ResortCard key={resort.id} resort={resort} rank={i + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
