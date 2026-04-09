import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="max-w-2xl">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors mb-5"
      >
        ← All resorts
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">About Alps Snow</h1>
      <p className="text-sm text-slate-500 mb-8">
        How the scores are calculated, what we measure, and what we don&apos;t.
      </p>

      <div className="flex flex-col gap-8">

        <Section title="What this is">
          <p>
            Alps Snow gives you a single, honest daily score for 10 French Alps ski resorts — calculated
            each morning using real weather data from the Open-Meteo API. No corporate PR, no resort-supplied
            conditions reports. Just a formula applied to actual atmospheric data.
          </p>
          <p className="mt-2">
            The goal: help you decide where to go on any given day, in under 10 seconds.
          </p>
        </Section>

        <Section title="The composite score (0–10)">
          <p className="mb-4">
            Each resort gets a score built from four independent sub-scores. Each sub-score is 0–10,
            and they&apos;re combined using a weighted average:
          </p>
          <div className="space-y-4">
            <WeightRow
              label="Snow Quality"
              pct="45%"
              color="#3B82F6"
              description="The most important factor. We look at: fresh snowfall in the last 24h, 48h, and 72h (more recent counts more); how well the snow has been preserved by cold temperatures; whether rain has been detected at resort altitude; the total snow base depth; and the resort's altitude and snowmaking capacity."
            />
            <WeightRow
              label="Weather Conditions"
              pct="25%"
              color="#8B5CF6"
              description="Temperature comfort (ideal skiing: −12°C to −5°C), wind speed (> 50 km/h = lift closures), and visibility. Light snowfall while you ski is a tiny bonus — heavy snowfall that whites everything out is a small penalty."
            />
            <WeightRow
              label="Freezing Level"
              pct="15%"
              color="#F59E0B"
              description="The single most reliable indicator of whether it's snowing or raining at the resort. If the freezing level is well below the skiing altitude — great. If it's above — you have rain, and that destroys snow quality fast."
            />
            <WeightRow
              label="Trend & Outlook"
              pct="15%"
              color="#10B981"
              description="Starts at 5 (neutral), then adjusts up or down based on what's coming in the next 24–48 hours: heavy snow incoming (+3), light snow (+1–2), rain forecast (−3), storm winds (−2), or warming trend (−1)."
            />
          </div>
        </Section>

        <Section title="Rain detection — the critical penalty">
          <p>
            Rain at resort altitude is the worst thing that can happen to ski conditions.
            We detect it precisely: if the freezing level was{" "}
            <strong>above the resort&apos;s primary skiing altitude</strong> AND precipitation
            was recorded, that counts as rain — not snow.
          </p>
          <p className="mt-2">
            Rain in the last 24 hours applies a <strong>−4 penalty</strong> to the snow sub-score,
            plus sets the preservation modifier to −3. This combination can bring even a powder resort
            to a very low total score. That&apos;s intentional — rain genuinely wrecks conditions.
          </p>
        </Section>

        <Section title="Score colour guide">
          <div className="space-y-2">
            {[
              { range: "8–10", label: "Excellent", color: "#1B7D3A", desc: "Exceptional conditions. Go." },
              { range: "6–7.9", label: "Good", color: "#4CAF50", desc: "Solid skiing day. Expect good pistes or recent powder." },
              { range: "4–5.9", label: "Moderate", color: "#F5A623", desc: "Decent if you&apos;re going anyway. Nothing special." },
              { range: "2–3.9", label: "Poor", color: "#E85D3A", desc: "Below average. Consider waiting for better conditions." },
              { range: "0–1.9", label: "Very poor", color: "#C62828", desc: "Stay home. Rain, slush, or no snow." },
            ].map((item) => (
              <div key={item.range} className="flex items-start gap-3">
                <span
                  className="shrink-0 text-xs font-bold px-2 py-1 rounded text-white tabular-nums"
                  style={{ backgroundColor: item.color }}
                >
                  {item.range}
                </span>
                <div>
                  <span className="text-sm font-medium text-slate-700">{item.label}</span>
                  <span className="text-sm text-slate-500"> — {item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Confidence levels">
          <div className="space-y-2.5">
            <ConfRow
              label="High confidence"
              style="bg-green-50 text-green-700 border-green-200"
              desc="All API data fetched successfully. Past 3 days complete. Score is reliable."
            />
            <ConfRow
              label="Limited data"
              style="bg-amber-50 text-amber-700 border-amber-200"
              desc="Some fields were missing, or the API returned partial data. Treat as a rough guide."
            />
            <ConfRow
              label="Unreliable"
              style="bg-red-50 text-red-700 border-red-200"
              desc="Significant data gaps. Score may not reflect actual conditions. Check local sources."
            />
          </div>
        </Section>

        <Section title="5-day forecast">
          <p>
            Days 1 and 2 are based on reliable numerical weather model output.
            Days 3–5 are rougher estimates — shown as &ldquo;~7&rdquo; instead of &ldquo;7.2&rdquo;.
            Use them to spot big incoming storms, not for precise planning.
          </p>
        </Section>

        <Section title="Data source">
          <p>
            All weather data comes from{" "}
            <a
              href="https://open-meteo.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-800"
            >
              Open-Meteo
            </a>
            , a free, open-source weather API using global forecast models (GFS, ECMWF, etc.).
            We request data at each resort&apos;s primary skiing altitude — not the valley floor —
            which gives more accurate snow and temperature readings.
          </p>
          <p className="mt-2">
            Data is fetched and published each morning at approximately 6:00 AM Paris time.
          </p>
        </Section>

        <Section title="What this does NOT cover">
          <ul className="text-sm text-slate-600 space-y-1.5">
            {[
              "Lift status (open / closed)",
              "Piste grooming reports",
              "Crowd levels or queue times",
              "Off-piste safety or avalanche risk — use ANENA bulletins for that",
              "Resort webcam feeds",
              "Historical data or trend charts",
              "Ticket prices or deals",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-slate-300 shrink-0 mt-0.5">–</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-900">
            <strong>Disclaimer:</strong> This is a decision-support tool, not a guarantee.
            Mountain conditions change rapidly. Always check local resort information,
            weather forecasts, and avalanche bulletins before heading out.
            We accept no responsibility for decisions made based on these scores.
          </p>
        </div>

      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-slate-800 border-b border-slate-200 pb-1.5 mb-3">
        {title}
      </h2>
      <div className="text-sm text-slate-600 leading-relaxed">{children}</div>
    </section>
  );
}

function WeightRow({
  label,
  pct,
  color,
  description,
}: {
  label: string;
  pct: string;
  color: string;
  description: string;
}) {
  return (
    <div className="flex gap-3 items-start">
      <span
        className="shrink-0 text-xs font-bold px-1.5 py-0.5 rounded text-white mt-0.5"
        style={{ backgroundColor: color }}
      >
        {pct}
      </span>
      <div>
        <p className="font-medium text-slate-700 text-sm">{label}</p>
        <p className="text-slate-500 text-sm mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function ConfRow({
  label,
  style,
  desc,
}: {
  label: string;
  style: string;
  desc: string;
}) {
  return (
    <div className="flex gap-3 items-start">
      <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border ${style}`}>
        {label}
      </span>
      <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
    </div>
  );
}
