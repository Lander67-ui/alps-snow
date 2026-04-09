import { notFound } from "next/navigation";
import Link from "next/link";
import { loadLatestScores } from "@/lib/data-store";
import { getResortById, resorts } from "@/resorts.config";
import { ResortScore, ForecastDay, RawWeatherData } from "@/lib/types";
import { scoreHexColor, scoreLabel } from "@/lib/score-color";
import FeedbackWidget from "./FeedbackWidget";

export const revalidate = 3600;

export function generateStaticParams() {
  return resorts.map((r) => ({ id: r.id }));
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatTime(isoStr: string) {
  return new Date(isoStr).toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris",
  });
}

function formatDayDate(dateStr: string, style: "short" | "long" = "short") {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-GB", {
    weekday: style === "long" ? "long" : "short",
    day: "numeric",
    month: "short",
    timeZone: "Europe/Paris",
  });
}

function weatherLabel(code: number): string {
  if (code === 0) return "Clear sky";
  if (code <= 3) return "Partly cloudy";
  if (code <= 48) return "Foggy";
  if (code <= 55) return "Light drizzle";
  if (code <= 65) return "Rain";
  if (code <= 75) return "Snowfall";
  if (code === 77) return "Snow grains";
  if (code <= 82) return "Rain showers";
  if (code <= 86) return "Snow showers";
  if (code >= 95) return "Thunderstorm";
  return "Mixed";
}

function weatherEmoji(code: number): string {
  if (code === 0) return "☀️";
  if (code <= 3) return "⛅";
  if (code <= 48) return "🌫️";
  if (code <= 55) return "🌦️";
  if (code <= 65) return "🌧️";
  if (code <= 75) return "🌨️";
  if (code === 77) return "🌨️";
  if (code <= 82) return "🌧️";
  if (code <= 86) return "🌨️";
  if (code >= 95) return "⛈️";
  return "🌤️";
}

// ── Stat card (for the stats grid) ────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "blue" | "red" | "green" | "amber";
}) {
  const accentClass =
    accent === "blue" ? "text-blue-600" :
    accent === "red" ? "text-red-600" :
    accent === "green" ? "text-green-700" :
    accent === "amber" ? "text-amber-600" :
    "text-slate-800";

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-xl font-bold tabular-nums leading-tight ${accentClass}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Forecast day card ──────────────────────────────────────────────────────

function ForecastCard({ day }: { day: ForecastDay }) {
  const isEst = day.confidence === "estimate";

  return (
    <div className="flex-1 min-w-[120px] max-w-[180px] bg-white rounded-xl border border-slate-200 p-3.5">
      {/* Date */}
      <p className="text-[11px] font-semibold text-slate-400 mb-0.5 uppercase tracking-wide">
        {isEst ? "~" : ""}{formatDayDate(day.date)}
      </p>

      {/* Condition */}
      <p className="text-2xl mb-1" aria-hidden>
        {day.summary === "Rain risk" ? "🌧️" :
         day.summary === "Heavy snow" ? "❄️" :
         day.summary === "Light snow" ? "🌨️" :
         day.summary === "Warm" ? "☀️" :
         day.summary === "Mild" ? "⛅" :
         day.summary === "Very cold" ? "🥶" : "❄️"}
      </p>
      <p className="text-xs font-medium text-slate-600 mb-3">{day.summary}</p>

      {/* Snowfall — most important */}
      <div className="mb-2">
        <p className={`text-sm font-bold tabular-nums ${day.snowfall > 0 ? "text-blue-600" : "text-slate-400"}`}>
          {day.snowfall > 0 ? `❄ ${day.snowfall}cm` : "No snow"}
        </p>
      </div>

      {/* Temp */}
      <div className="flex items-center gap-1 text-xs text-slate-500 mb-1.5">
        <span className="font-medium text-slate-800">{day.tempMax}°</span>
        <span className="text-slate-300">/</span>
        <span>{day.tempMin}°C</span>
      </div>

      {/* Wind */}
      {day.windMax > 0 && (
        <p className={`text-xs tabular-nums ${day.windMax > 50 ? "text-amber-600 font-medium" : "text-slate-400"}`}>
          💨 {day.windMax} km/h
        </p>
      )}
    </div>
  );
}

// ── Recent snowfall section ────────────────────────────────────────────────

function SnowHistory({ raw }: { raw: RawWeatherData }) {
  const total72 = raw.freshSnow72h;
  const lastSnowText =
    raw.freshSnow24h >= 1 ? "Snowfall in the last 24 hours" :
    raw.freshSnow48h >= 1 ? "Last meaningful snowfall: 1–2 days ago" :
    raw.freshSnow72h >= 1 ? "Last meaningful snowfall: 2–3 days ago" :
    "No significant snowfall in the last 3 days";

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-5 mb-4">
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
        Recent snowfall
      </h2>

      {/* Summary sentence */}
      <p className="text-sm text-slate-600 mb-4 italic">{lastSnowText}</p>

      {/* 3-column timeline */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "24h", value: raw.freshSnow24h },
          { label: "48h", value: raw.freshSnow48h },
          { label: "72h", value: raw.freshSnow72h },
        ].map(({ label, value }) => (
          <div key={label} className="text-center">
            <p className={`text-xl font-bold tabular-nums ${value > 0 ? "text-blue-600" : "text-slate-300"}`}>
              {value > 0 ? `${value}` : "0"}
              <span className="text-sm font-normal ml-0.5">cm</span>
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Last {label}</p>
          </div>
        ))}
      </div>

      {/* Rain warning */}
      {raw.rainDetected24h && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700 font-medium">
          ⚠ Rain detected at resort altitude in the last 24h — snowpack quality is affected
        </div>
      )}
      {!raw.rainDetected24h && raw.rainDetected48h && (
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
          Rain detected 1–2 days ago. Surface snow may have been affected.
        </div>
      )}

      {total72 > 0 && (
        <p className="text-xs text-slate-400 mt-3">
          Total over 72h: <span className="font-medium text-slate-600">{total72}cm</span>
        </p>
      )}
    </section>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ResortPage({ params }: { params: { id: string } }) {
  const resortConfig = getResortById(params.id);
  if (!resortConfig) notFound();

  const data = loadLatestScores();
  const resort: ResortScore | undefined = data?.resorts.find((r) => r.id === params.id);
  const hasData = resort && !resort.error && resort.rawData;
  const score = hasData ? resort.totalScore : null;
  const scoreColor = score !== null ? scoreHexColor(score) : "#94a3b8";

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back */}
      <Link
        href="/ranking"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors mb-5"
      >
        ← Back to ranking
      </Link>

      {/* ── Header card ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 mb-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left: name + meta */}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              {resortConfig.region}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
              {resortConfig.name}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {resortConfig.baseAltitude}–{resortConfig.topAltitude}m altitude
            </p>
          </div>

          {/* Right: score */}
          <div className="text-right shrink-0">
            <div
              className="text-5xl sm:text-6xl font-bold tabular-nums leading-none"
              style={{ color: scoreColor }}
            >
              {score !== null ? score.toFixed(1) : "–"}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">/10 score</p>
            {score !== null && (
              <p className="text-sm font-semibold mt-0.5" style={{ color: scoreColor }}>
                {scoreLabel(score)}
              </p>
            )}
          </div>
        </div>

        {/* Summary + timestamp */}
        {hasData && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            {resort.confidence !== "high" && (
              <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border mr-2 mb-2 ${
                resort.confidence === "medium"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}>
                {resort.confidence === "medium" ? "Limited data" : "Unreliable data"}
              </span>
            )}
            <p className="text-base text-slate-700 leading-relaxed">{resort.summary}</p>
            {data && (
              <p className="text-xs text-slate-400 mt-2">
                Updated {formatTime(data.fetchedAt)} Paris time ·{" "}
                {weatherEmoji(resort.rawData.weatherCode)}{" "}
                {weatherLabel(resort.rawData.weatherCode)}
              </p>
            )}
          </div>
        )}

        {!hasData && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-sm text-slate-400">
              {resort?.error
                ? `Data unavailable: ${resort.error}`
                : "No data available yet. Run npm run fetch-data."}
            </p>
          </div>
        )}
      </div>

      {hasData && (
        <>
          {/* ── Stats grid ─────────────────────────────────────── */}
          <section className="mb-4">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Current conditions
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <StatCard
                label="Temperature"
                value={`${resort.rawData.temperature}°C`}
                sub={`Avg 48h: ${resort.rawData.avgTemp48h}°C`}
                accent={resort.rawData.temperature > 3 ? "amber" : resort.rawData.temperature < -10 ? "blue" : undefined}
              />
              <StatCard
                label="Wind"
                value={`${resort.rawData.windSpeed} km/h`}
                sub={`Gusts: ${resort.rawData.windGusts} km/h`}
                accent={resort.rawData.windSpeed > 50 ? "red" : resort.rawData.windSpeed > 35 ? "amber" : undefined}
              />
              <StatCard
                label="Snow base"
                value={`${resort.rawData.snowDepth} cm`}
                sub={resort.rawData.snowDepth >= 100 ? "Deep base" : resort.rawData.snowDepth < 30 ? "Thin base" : "Adequate"}
                accent={resort.rawData.snowDepth >= 100 ? "green" : resort.rawData.snowDepth < 30 ? "red" : undefined}
              />
              <StatCard
                label="Freezing line"
                value={`${resort.rawData.freezingLevel}m`}
                sub={resort.rawData.freezingLevel > resortConfig.primaryAltitude ? "Above resort ⚠" : "Below resort ✓"}
                accent={resort.rawData.freezingLevel > resortConfig.primaryAltitude ? "red" : "green"}
              />
              <StatCard
                label="Visibility"
                value={resort.rawData.visibility >= 10000 ? "Clear" : `${(resort.rawData.visibility / 1000).toFixed(1)}km`}
                sub={`Cloud cover: ${resort.rawData.cloudCover}%`}
              />
              <StatCard
                label="Snow forecast"
                value={`${resort.rawData.snowfallForecast24h} cm`}
                sub="Expected next 24h"
                accent={resort.rawData.snowfallForecast24h >= 5 ? "blue" : undefined}
              />
            </div>
          </section>

          {/* ── Recent snowfall ────────────────────────────────── */}
          <SnowHistory raw={resort.rawData} />

          {/* ── 5-day forecast ─────────────────────────────────── */}
          {resort.forecast && resort.forecast.length > 0 && (
            <section className="mb-4">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Upcoming forecast
              </h2>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {resort.forecast.map((day) => (
                  <ForecastCard key={day.date} day={day} />
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Days marked ~ are rough estimates. Accuracy decreases after day 2.
              </p>
            </section>
          )}
        </>
      )}

      {/* ── Feedback ───────────────────────────────────────────── */}
      {data && (
        <div className="mb-5">
          <FeedbackWidget resortId={params.id} date={data.date} />
        </div>
      )}

      {/* ── Resort info footer ─────────────────────────────────── */}
      <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-xs text-slate-400">
        <span className="font-medium text-slate-600">{resortConfig.name}</span>
        {" · "}{resortConfig.description}
        {" · "}Snowmaking: <span className="capitalize">{resortConfig.snowMakingCoverage}</span>
        {" · "}{resortConfig.aspect} aspect
      </div>
    </div>
  );
}
