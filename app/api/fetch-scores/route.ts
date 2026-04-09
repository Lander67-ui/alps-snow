import { NextRequest, NextResponse } from "next/server";
import { resorts } from "@/resorts.config";
import { fetchResortWeather } from "@/lib/open-meteo";
import { scoreResort } from "@/lib/scoring";
import { saveScores, saveRaw, todayDateString } from "@/lib/data-store";
import { DailyScores, ResortScore } from "@/lib/types";

// Open-Meteo free tier rate limiting: batches of 3 with a delay
const BATCH_SIZE = 3;
const DELAY_MS = 1200;

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = process.env.ADMIN_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const date = todayDateString();
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
      } else {
        const msg =
          result.reason instanceof Error ? result.reason.message : String(result.reason);
        console.error(`[fetch-scores API] Failed for ${resort.id}:`, msg);
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

  return NextResponse.json({
    success: true,
    date,
    fetchedAt: dailyScores.fetchedAt,
    resorts: scores.map((r) => ({
      id: r.id,
      name: r.name,
      totalScore: r.totalScore,
      confidence: r.confidence,
      forecastDays: r.forecast?.length ?? 0,
      error: r.error,
    })),
  });
}
