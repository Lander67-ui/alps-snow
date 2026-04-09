#!/usr/bin/env tsx
/**
 * npm run fetch-data
 *
 * Fetches weather from Open-Meteo for all 10 resorts, calculates scores,
 * and saves them to:
 *   data/scores/[date].json   ← loaded by the website
 *   data/raw/[date]/[id].json ← raw API data for debugging
 *
 * Run manually: npm run fetch-data
 * Runs automatically: GitHub Actions cron every morning at 6:00 AM Paris time
 */

import { resorts } from "../resorts.config";
import { fetchResortWeather } from "../lib/open-meteo";
import { scoreResort } from "../lib/scoring";
import { saveScores, saveRaw, todayDateString } from "../lib/data-store";
import { DailyScores, ResortScore } from "../lib/types";

// Open-Meteo free tier: max ~10 req/min. Use batches of 3 with a 1.2s gap.
const BATCH_SIZE = 3;
const DELAY_MS = 1200;

async function main() {
  const date = todayDateString();
  console.log(`\n🏔  Alps Snow — fetching data for ${date}\n`);

  const startTime = Date.now();
  const scores: ResortScore[] = [];

  for (let i = 0; i < resorts.length; i += BATCH_SIZE) {
    const batch = resorts.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.allSettled(
      batch.map(async (resort) => {
        const { weather, forecast } = await fetchResortWeather(resort);
        saveRaw(date, resort.id, weather);
        const scored = scoreResort(weather, resort);
        return { ...scored, forecast } as ResortScore;
      })
    );

    for (let j = 0; j < batch.length; j++) {
      const resort = batch[j];
      const result = batchResults[j];
      if (result.status === "fulfilled") {
        scores.push(result.value);
        process.stdout.write(
          `  ✓ ${resort.name.padEnd(24)} → ${result.value.totalScore}/10  (${result.value.confidence} confidence)\n`
        );
      } else {
        const msg =
          result.reason instanceof Error ? result.reason.message : String(result.reason);
        process.stdout.write(`  ✗ ${resort.name.padEnd(24)} → ERROR: ${msg}\n`);
        scores.push({
          id: resort.id,
          name: resort.name,
          totalScore: 0,
          confidence: "low",
          summary: "Data unavailable — API error.",
          subScores: { snow: 0, weather: 0, altitude: 0, trend: 0 },
          rawData: undefined as unknown as ResortScore["rawData"],
          forecast: [],
          error: msg,
        });
      }
    }

    if (i + BATCH_SIZE < resorts.length) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  const dailyScores: DailyScores = {
    date,
    fetchedAt: new Date().toISOString(),
    resorts: scores,
  };

  saveScores(dailyScores);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✅  Done in ${elapsed}s — saved to data/scores/${date}.json`);

  // Summary table
  const hr = "─".repeat(57);
  console.log(`\n${hr}`);
  console.log("RESORT                   SCORE  SNOW  WTHR  ALT  TRND");
  console.log(hr);
  const sorted = [...scores].sort((a, b) => b.totalScore - a.totalScore);
  for (const r of sorted) {
    if (r.error) {
      console.log(`${r.name.padEnd(24)}  ERROR`);
    } else {
      const s = r.subScores;
      console.log(
        `${r.name.padEnd(24)}  ${String(r.totalScore).padStart(4)}  ` +
          `${String(s.snow).padStart(4)}  ${String(s.weather).padStart(4)}  ` +
          `${String(s.altitude).padStart(3)}  ${String(s.trend).padStart(4)}`
      );
    }
  }
  console.log(`${hr}\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
