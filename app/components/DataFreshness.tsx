
"use client";

import { useEffect, useState } from "react";

export default function DataFreshness({
  fetchedAt,
}: {
  fetchedAt: string;
}) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, []);

  const timestamp = Date.parse(fetchedAt);
  const invalid = !Number.isFinite(timestamp);
  const ageHours =
    now === null ? null : (now - timestamp) / 3600000;

  const stale =
    invalid || (ageHours !== null && ageHours >= 12);
  const delayed = ageHours !== null && ageHours >= 8;

  const status = stale
    ? "⚠ Weather data outdated"
    : delayed
    ? "⚠ Weather update delayed"
    : ageHours === null
    ? "Checking data freshness"
    : "✓ Weather data up to date";

  const colors = stale
    ? "bg-red-50 border-red-200 text-red-800"
    : delayed
    ? "bg-amber-50 border-amber-200 text-amber-800"
    : "bg-slate-50 border-slate-200 text-slate-700";

  const date = invalid
    ? "Unknown"
    : new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Paris",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(timestamp));

  return (
    <div className={`w-full rounded-xl border p-4 mb-4 ${colors}`}>
      <p className="text-sm font-semibold">{status}</p>
      <p className="text-xs mt-1">
        Last update: {date} (Paris time).
        Weather conditions are model estimates.
      </p>
    </div>
  );
}
