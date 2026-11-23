
import DataFreshness from "@/app/components/DataFreshness";

<div className="flex flex-col items-center">

{data && (
  <div className="w-full max-w-xl px-4">
    <DataFreshness fetchedAt={data.fetchedAt} />
  </div>
)}

import Link from "next/link";
import { resorts } from "@/resorts.config";
import { loadLatestScores } from "@/lib/data-store";
import { scoreHexColor } from "@/lib/score-color";
import ResortSearch, { SearchResort } from "@/app/components/ResortSearch";

export const revalidate = 3600;

export default function HomePage() {
  const data = loadLatestScores();

  // Build the search list: static resort list enriched with current score
  const scoreMap = new Map(data?.resorts.map((r) => [r.id, r.totalScore]) ?? []);
  const searchResorts: SearchResort[] = resorts.map((r) => ({
    id: r.id,
    name: r.name,
    region: r.region,
    altitude: r.primaryAltitude,
    score: scoreMap.get(r.id) ?? null,
  }));

  // Top 3 scoring resorts for quick picks
  const topResorts = data
    ? [...data.resorts]
        .filter((r) => !r.error)
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, 3)
    : [];

  return (
    <div className="flex flex-col items-center">
      {/* ── Hero ───────────────────────────────────────────────────── */}
      <div className="w-full text-center pt-10 pb-8 px-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight mb-3">
          Find your next powder day
        </h1>
        <p className="text-slate-500 text-base sm:text-lg max-w-md mx-auto leading-relaxed">
          Search a ski area to see today&apos;s snow quality score and the upcoming forecast.
        </p>
      </div>

      {/* ── Search ─────────────────────────────────────────────────── */}
      <div className="w-full px-4 mb-10">
        <ResortSearch resorts={searchResorts} />
        <p className="text-center text-xs text-slate-400 mt-3">
          10 French Alps resorts · Updated daily at 6 AM Paris time
        </p>
      </div>

      {/* ── Quick picks ────────────────────────────────────────────── */}
      {topResorts.length > 0 && (
        <div className="w-full px-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center">
            Today&apos;s top conditions
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto">
            {topResorts.map((resort) => (
              <Link
                key={resort.id}
                href={`/resort/${resort.id}`}
                className="group bg-white rounded-2xl border border-slate-200 p-4 hover:border-slate-300 hover:shadow-md transition-all text-center"
              >
                <p className="text-sm font-semibold text-slate-800 mb-1 group-hover:text-slate-900">
                  {resort.name}
                </p>
                <p
                  className="text-3xl font-bold tabular-nums leading-none mb-1"
                  style={{ color: scoreHexColor(resort.totalScore) }}
                >
                  {resort.totalScore.toFixed(1)}
                </p>
                <p className="text-xs text-slate-400">/10</p>
                {resort.rawData && (
                  <p className="text-xs text-slate-400 mt-2">
                    {resort.rawData.freshSnow24h > 0
                      ? `❄ ${resort.rawData.freshSnow24h}cm fresh`
                      : `${resort.rawData.snowDepth}cm base`}
                  </p>
                )}
              </Link>
            ))}
          </div>
          <div className="text-center mt-5">
            <Link
              href="/ranking"
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
            >
              View full ranking →
            </Link>
          </div>
        </div>
      )}

      {/* No data yet */}
      {!data && (
        <div className="w-full max-w-sm mx-auto px-4 mt-6 bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
          <div className="text-4xl mb-3">🏔</div>
          <p className="text-slate-500 text-sm leading-relaxed">
            No data yet. Run{" "}
            <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs">
              npm run fetch-data
            </code>{" "}
            to load today&apos;s scores.
          </p>
        </div>
      )}
    </div>
  );
}
