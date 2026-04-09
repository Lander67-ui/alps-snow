import { notFound } from "next/navigation";
import Link from "next/link";
import { loadLatestScores } from "@/lib/data-store";
import { getResortById, resorts } from "@/resorts.config";
import { ResortScore, ForecastDay } from "@/lib/types";
import { scoreColorClass, scoreHexColor, scoreLabel } from "@/lib/score-color";
import FeedbackWidget from "./FeedbackWidget";

export const revalidate = 3600;

export function generateStaticParams() {
  return resorts.map((r) => ({ id: r.id }));
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    timeZone: "Europe/Paris",
  });
}

function formatTime(isoStr: string) {
  return new Date(isoStr).toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris",
  });
}

// ── Sub-score bar row ──────────────────────────────────────────────────────

function SubScoreRow({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  const color = scoreHexColor(value);
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm font-bold tabular-nums" style={{ color }}>
          {value.toFixed(1)}<span className="text-xs font-normal text-slate-400">/10</span>
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${(value / 10) * 100}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-xs text-slate-400 mt-0.5">{description}</p>
    </div>
  );
}

// ── Data row ───────────────────────────────────────────────────────────────

function DataRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: "good" | "warn" | "bad";
}) {
  const valueClass =
    highlight === "bad"
      ? "text-red-700 font-semibold"
      : highlight === "warn"
      ? "text-amber-700"
      : highlight === "good"
      ? "text-green-700"
      : "text-slate-800";
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-sm tabular-nums ${valueClass}`}>{value}</span>
    </div>
  );
}

// ── 5-day forecast card ────────────────────────────────────────────────────

function ForecastCard({ day }: { day: ForecastDay }) {
  const isEst = day.confidence === "estimate";
  const color = scoreHexColor(day.estimatedScore);
  const dateLabel = new Date(day.date + "T12:00:00").toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Paris",
  });
  return (
    <div className="flex-1 min-w-[110px] max-w-[160px] bg-white rounded-xl border border-slate-200 p-3">
      <p className="text-[11px] text-slate-400 mb-1.5">{dateLabel}</p>
      <p className="text-2xl font-bold tabular-nums leading-none mb-1" style={{ color }}>
        {isEst ? `~${Math.round(day.estimatedScore)}` : day.estimatedScore.toFixed(1)}
      </p>
      <p className="text-xs font-medium text-slate-600 mb-1.5">{day.summary}</p>
      {day.snowfall > 0 && (
        <p className="text-xs text-blue-600 mb-0.5">❄ {day.snowfall}cm</p>
      )}
      <p className="text-xs text-slate-400">
        {day.tempMin}° / {day.tempMax}°C
      </p>
      {isEst && (
        <p className="text-[10px] text-slate-300 mt-1.5">rough estimate</p>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ResortPage({ params }: { params: { id: string } }) {
  const resortConfig = getResortById(params.id);
  if (!resortConfig) notFound();

  const data = loadLatestScores();
  const resort: ResortScore | undefined = data?.resorts.find((r) => r.id === params.id);
  const hasData = resort && !resort.error && resort.rawData;
  const colorClass = hasData ? scoreColorClass(resort.totalScore) : "text-slate-400";

  return (
    <div>
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors mb-5"
      >
        ← All resorts
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              {resortConfig.region}
            </p>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
              {resortConfig.name}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {resortConfig.baseAltitude}–{resortConfig.topAltitude}m range ·{" "}
              {resortConfig.primaryAltitude}m primary altitude ·{" "}
              {resortConfig.aspect} aspect
            </p>
            <p className="text-sm text-slate-400 mt-0.5">{resortConfig.description}</p>
          </div>

          {hasData && (
            <div className="text-right shrink-0">
              <div className={`text-5xl font-bold tabular-nums leading-none ${colorClass}`}>
                {resort.totalScore.toFixed(1)}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">/10</div>
              <div className="text-xs font-medium mt-0.5" style={{ color: scoreHexColor(resort.totalScore) }}>
                {scoreLabel(resort.totalScore)}
              </div>
            </div>
          )}
        </div>

        {hasData && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            {resort.confidence !== "high" && (
              <span
                className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border mr-2 mb-2 ${
                  resort.confidence === "medium"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-red-50 text-red-700 border-red-200"
                }`}
              >
                {resort.confidence === "medium" ? "Limited data" : "Unreliable data"}
              </span>
            )}
            <p className="text-[15px] text-slate-700 leading-relaxed">{resort.summary}</p>
            {data && (
              <p className="text-xs text-slate-400 mt-1.5">
                {formatDate(data.date)} · Updated {formatTime(data.fetchedAt)} Paris time
              </p>
            )}
          </div>
        )}
      </div>

      {/* No data */}
      {!hasData && (
        <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-8 text-center mb-4">
          <p className="text-slate-500 text-sm">
            {resort?.error
              ? `⚠ Data unavailable: ${resort.error}`
              : "No data available yet. Run npm run fetch-data to load today's scores."}
          </p>
        </div>
      )}

      {hasData && (
        <>
          {/* Score breakdown */}
          <section className="bg-white rounded-2xl border border-slate-200 p-5 mb-4">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Score breakdown
            </h2>
            <div className="flex flex-col gap-5">
              <SubScoreRow
                label="Snow Quality (45%)"
                value={resort.subScores.snow}
                description="Fresh snowfall, snow depth, temperature preservation, rain history"
              />
              <SubScoreRow
                label="Weather Conditions (25%)"
                value={resort.subScores.weather}
                description="Temperature comfort, wind speed, and visibility"
              />
              <SubScoreRow
                label="Freezing Level (15%)"
                value={resort.subScores.altitude}
                description="How far below the resort the freezing line sits — determines rain vs snow"
              />
              <SubScoreRow
                label="Trend & Outlook (15%)"
                value={resort.subScores.trend}
                description="What's coming in the next 24–48 hours"
              />
            </div>
          </section>

          {/* Current conditions */}
          <section className="bg-white rounded-2xl border border-slate-200 p-5 mb-4">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Current conditions
            </h2>
            <DataRow label="Temperature" value={`${resort.rawData.temperature}°C`} />
            <DataRow label="Wind speed" value={`${resort.rawData.windSpeed} km/h`} />
            <DataRow label="Wind gusts" value={`${resort.rawData.windGusts} km/h`} />
            <DataRow
              label="Freezing level"
              value={`${resort.rawData.freezingLevel}m`}
              highlight={
                resort.rawData.freezingLevel > resortConfig.primaryAltitude
                  ? "bad"
                  : resort.rawData.freezingLevel > resortConfig.primaryAltitude - 200
                  ? "warn"
                  : "good"
              }
            />
            <DataRow
              label="Cloud cover"
              value={`${resort.rawData.cloudCover}%`}
            />
            <DataRow
              label="Visibility"
              value={
                resort.rawData.visibility >= 10000
                  ? "Clear (10km+)"
                  : `${(resort.rawData.visibility / 1000).toFixed(1)}km`
              }
            />
          </section>

          {/* Snow data */}
          <section className="bg-white rounded-2xl border border-slate-200 p-5 mb-4">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Snow
            </h2>
            <DataRow
              label="Snow depth (base)"
              value={`${resort.rawData.snowDepth} cm`}
              highlight={
                resort.rawData.snowDepth >= 100
                  ? "good"
                  : resort.rawData.snowDepth < 30
                  ? "bad"
                  : undefined
              }
            />
            <DataRow
              label="Fresh snow — last 24h"
              value={`${resort.rawData.freshSnow24h} cm`}
              highlight={resort.rawData.freshSnow24h >= 10 ? "good" : undefined}
            />
            <DataRow
              label="Fresh snow — last 48h"
              value={`${resort.rawData.freshSnow48h} cm`}
            />
            <DataRow
              label="Fresh snow — last 72h"
              value={`${resort.rawData.freshSnow72h} cm`}
            />
            <DataRow
              label="Forecast — next 24h"
              value={`${resort.rawData.snowfallForecast24h} cm`}
              highlight={resort.rawData.snowfallForecast24h >= 5 ? "good" : undefined}
            />
            <DataRow
              label="Forecast — next 48h"
              value={`${resort.rawData.snowfallForecast48h} cm`}
            />
            <DataRow
              label="Rain detected — last 24h"
              value={resort.rawData.rainDetected24h ? "Yes ⚠" : "No"}
              highlight={resort.rawData.rainDetected24h ? "bad" : "good"}
            />
            <DataRow
              label="Rain detected — last 48h"
              value={resort.rawData.rainDetected48h ? "Yes" : "No"}
              highlight={resort.rawData.rainDetected48h ? "warn" : undefined}
            />
          </section>

          {/* 5-day forecast */}
          {resort.forecast && resort.forecast.length > 0 && (
            <section className="mb-4">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                5-day outlook
              </h2>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {resort.forecast.map((day) => (
                  <ForecastCard key={day.date} day={day} />
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Days 3–5 are rough estimates (~). Forecast accuracy decreases with time.
              </p>
            </section>
          )}
        </>
      )}

      {/* Feedback */}
      {data && (
        <div className="mb-6">
          <FeedbackWidget resortId={params.id} date={data.date} />
        </div>
      )}

      {/* Resort meta */}
      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-500">
        <span className="font-medium text-slate-700">{resortConfig.name}</span> ·{" "}
        {resortConfig.region} · Snowmaking:{" "}
        <span className="capitalize">{resortConfig.snowMakingCoverage}</span> ·{" "}
        Base {resortConfig.baseAltitude}m · Top {resortConfig.topAltitude}m ·{" "}
        Scored at {resortConfig.primaryAltitude}m
      </div>
    </div>
  );
}
