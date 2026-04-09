import { scoringConfig } from "@/scoring.config";
import { Resort } from "@/resorts.config";
import { RawWeatherData, SubScores, Confidence, ResortScore, ForecastDay } from "@/lib/types";

// ── helpers ────────────────────────────────────────────────────────────────

function clamp(value: number, min = 0, max = 10): number {
  return Math.max(min, Math.min(max, value));
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

// ── Sub-score 1: Snow Quality ──────────────────────────────────────────────

export function calcSnowScore(data: RawWeatherData, resort: Resort): number {
  const cfg = scoringConfig.snow;

  // 1. Fresh snow base score (from 24h, with 48h/72h fallbacks)
  let freshScore = 1; // default — no fresh snow
  if (data.freshSnow24h >= 2) {
    for (const threshold of cfg.freshSnow24hThresholds) {
      if (data.freshSnow24h >= threshold.min) {
        freshScore = threshold.score;
        break;
      }
    }
  } else if (data.freshSnow48h >= cfg.freshSnow48hFallback.minSnow48h) {
    freshScore = cfg.freshSnow48hFallback.score;
  } else if (data.freshSnow72h >= cfg.freshSnow72hFallback.minSnow72h) {
    freshScore = cfg.freshSnow72hFallback.score;
  }

  // 2. Snow preservation modifier (based on avg temp last 48h)
  let preservationModifier = 0;
  if (data.rainDetected24h || data.rainDetected48h) {
    // Rain overrides all preservation logic
    preservationModifier = cfg.rainPreservationModifier;
  } else {
    const t = data.avgTemp48h;
    if (t < cfg.preservationModifiers.veryGood.maxTemp) {
      preservationModifier = cfg.preservationModifiers.veryGood.modifier;
    } else if (t < cfg.preservationModifiers.good.maxTemp) {
      preservationModifier = cfg.preservationModifiers.good.modifier;
    } else if (t < cfg.preservationModifiers.marginal.maxTemp) {
      preservationModifier = cfg.preservationModifiers.marginal.modifier;
    } else {
      preservationModifier = cfg.preservationModifiers.degrading.modifier;
    }
  }

  // 3. Rain penalty
  let rainPenalty = 0;
  if (data.rainDetected24h) {
    rainPenalty = cfg.rainPenalties.last24h;
  } else if (data.rainDetected48h) {
    rainPenalty = cfg.rainPenalties.last48h;
  } else if (data.rainDetected72h) {
    rainPenalty = cfg.rainPenalties.last72h;
  }

  // 4. Snow depth modifier
  let depthModifier = 0;
  if (data.snowDepth >= cfg.depthModifiers.deep.min) {
    depthModifier = cfg.depthModifiers.deep.modifier;
  } else if (data.snowDepth >= cfg.depthModifiers.adequate.min) {
    depthModifier = cfg.depthModifiers.adequate.modifier;
  } else if (data.snowDepth < cfg.depthModifiers.thin.max) {
    depthModifier = cfg.depthModifiers.thin.modifier;
  }

  // 5. Altitude resilience modifier
  let altitudeModifier = 0;
  if (resort.primaryAltitude >= cfg.altitudeModifiers.high.min) {
    altitudeModifier = cfg.altitudeModifiers.high.modifier;
  } else if (resort.primaryAltitude >= cfg.altitudeModifiers.medium.min) {
    altitudeModifier = cfg.altitudeModifiers.medium.modifier;
  } else if (resort.primaryAltitude < cfg.altitudeModifiers.low.max) {
    altitudeModifier = cfg.altitudeModifiers.low.modifier;
  }

  // 6. Snowmaking modifier (compensates when base is thin)
  let snowMakingModifier = 0;
  if (resort.snowMakingCoverage === "high" && data.snowDepth < cfg.snowMakingModifiers.high.maxDepthForBonus) {
    snowMakingModifier = cfg.snowMakingModifiers.high.modifier;
  } else if (resort.snowMakingCoverage === "medium" && data.snowDepth < cfg.snowMakingModifiers.medium.maxDepthForBonus) {
    snowMakingModifier = cfg.snowMakingModifiers.medium.modifier;
  }

  const raw = freshScore + preservationModifier + rainPenalty + depthModifier + altitudeModifier + snowMakingModifier;
  return clamp(raw);
}

// ── Sub-score 2: Weather Conditions ───────────────────────────────────────

export function calcWeatherScore(data: RawWeatherData): number {
  const cfg = scoringConfig.weather;

  // Temperature comfort (0–4)
  let tempScore: number = cfg.temperatureFallbackScore;
  const t = data.temperature;
  for (const entry of cfg.temperatureScores) {
    if (t >= entry.minTemp && t < entry.maxTemp) {
      tempScore = entry.score;
      break;
    }
  }

  // Wind score (0–3)
  let windScore = 0;
  for (const entry of cfg.windScores) {
    if (data.windSpeed < entry.maxWind) {
      windScore = entry.score;
      break;
    }
  }

  // Visibility / cloud cover (0–3)
  let visScore: number;
  if (data.visibility < cfg.visibilityScores.fogVisibilityThreshold) {
    visScore = cfg.visibilityScores.fogWhiteout.score;
  } else if (data.cloudCover <= cfg.visibilityScores.clear.maxCloudCover) {
    visScore = cfg.visibilityScores.clear.score;
  } else if (data.cloudCover <= cfg.visibilityScores.partlyCloudy.maxCloudCover) {
    visScore = cfg.visibilityScores.partlyCloudy.score;
  } else {
    visScore = cfg.visibilityScores.overcast.score;
  }

  // Active snowfall bonus/penalty
  let snowfallModifier = 0;
  if (data.activeSnowfallRate >= cfg.activeSnowfallThresholdForHeavy) {
    snowfallModifier = cfg.activeSnowfallModifiers.heavy.modifier;
  } else if (data.activeSnowfallRate >= cfg.activeSnowfallThresholdForBonus) {
    snowfallModifier = cfg.activeSnowfallModifiers.light.modifier;
  }

  const raw = tempScore + windScore + visScore + snowfallModifier;
  return clamp(raw);
}

// ── Sub-score 3: Freezing Level & Altitude Risk ────────────────────────────

export function calcAltitudeScore(data: RawWeatherData, resort: Resort): number {
  const cfg = scoringConfig.altitude;
  const gap = resort.primaryAltitude - data.freezingLevel; // positive = good

  if (!cfg.interpolate) {
    for (const entry of cfg.thresholds) {
      if (gap >= entry.minGap) return entry.score;
    }
    return 0;
  }

  // Linear interpolation between thresholds
  const thresholds = [...cfg.thresholds].reverse(); // ascending order
  for (let i = 0; i < thresholds.length - 1; i++) {
    const lower = thresholds[i];
    const upper = thresholds[i + 1];
    if (gap >= lower.minGap && gap < upper.minGap) {
      const t = (gap - lower.minGap) / (upper.minGap - lower.minGap);
      return lower.score + t * (upper.score - lower.score);
    }
  }

  // Outside range — use boundary values
  const sorted = cfg.thresholds; // already descending
  if (gap >= sorted[0].minGap) return sorted[0].score;
  return sorted[sorted.length - 1].score;
}

// ── Sub-score 4: Trend / Outlook ──────────────────────────────────────────

export function calcTrendScore(data: RawWeatherData): number {
  const cfg = scoringConfig.trend;
  let score = cfg.baseScore;

  // Snowfall forecast modifiers
  let snowModifierApplied = false;
  for (const entry of cfg.snowfallForecastModifiers) {
    if (data.snowfallForecast24h >= entry.min) {
      score += entry.modifier;
      snowModifierApplied = true;
      break;
    }
  }

  // Stable cold (no snow but temps staying cold)
  if (!snowModifierApplied && data.temperature < cfg.stableColdMaxTemp && !data.rainDetected24h) {
    score += cfg.stableColdModifier;
  }

  // Warming trend
  if (data.forecastMaxTemp48h - data.temperature > cfg.warmingThreshold) {
    score += cfg.warmingModifier;
  }

  // Rain in forecast
  if (data.forecastRain24h) {
    score += cfg.rainForecastModifier;
  }

  // Strong wind forecast
  if (data.forecastWindSpeed24h > cfg.strongWindThreshold) {
    score += cfg.strongWindForecastModifier;
  }

  return clamp(score);
}

// ── Composite Score ────────────────────────────────────────────────────────

export function calcCompositeScore(subScores: SubScores): number {
  const w = scoringConfig.weights;
  const total =
    subScores.snow    * w.snow    +
    subScores.weather * w.weather +
    subScores.altitude * w.altitude +
    subScores.trend   * w.trend;
  return round1(clamp(total));
}

// ── Confidence Level ───────────────────────────────────────────────────────

export function calcConfidence(data: RawWeatherData): Confidence {
  const cfg = scoringConfig.confidence;
  if (data.dataCompleteness >= 1) return "high";
  const missingCount = Math.round((1 - data.dataCompleteness) * 5);
  if (missingCount >= cfg.anomalyThreshold) return "low";
  if (missingCount >= cfg.missingDataThreshold) return "medium";
  return "high";
}

// ── Auto-generated Summary ─────────────────────────────────────────────────

export function generateSummary(data: RawWeatherData, total: number): string {
  if (data.rainDetected24h) {
    return "Stay home — rain at resort level has damaged the snowpack.";
  }
  if (data.rainDetected48h) {
    return "Recent rain has softened the snow. Expect heavy, wet conditions.";
  }
  if (data.freshSnow24h >= 20) {
    return `Epic powder day — ${data.freshSnow24h}cm overnight and more coming.`;
  }
  if (data.freshSnow24h >= 10) {
    return `Fresh powder! ${data.freshSnow24h}cm overnight. Get on the slopes early.`;
  }
  if (data.freshSnow24h >= 5) {
    return `Light overnight snowfall (${data.freshSnow24h}cm). Top-ups on a solid base.`;
  }
  if (data.snowfallForecast24h >= 10) {
    return `Powder incoming — ${data.snowfallForecast24h}cm expected in the next 24 hours.`;
  }
  if (data.snowfallForecast24h >= 5) {
    return `Snow on the way. ${data.snowfallForecast24h}cm forecast — conditions improving.`;
  }
  if (data.temperature < -2 && !data.rainDetected72h && data.snowDepth > 40) {
    return "No new snow, but cold temps are keeping the base firm. Good groomed skiing.";
  }
  if (data.temperature > 4 && data.cloudCover < 40) {
    return "Spring skiing — warm and sunny. Go early for the best snow before it softens.";
  }
  if (data.forecastMaxTemp48h - data.temperature > 5) {
    return "Warming trend ahead. Enjoy today — conditions may deteriorate soon.";
  }
  if (total >= 6 && data.snowDepth >= 50) {
    return "Decent conditions overall. Solid base, nothing spectacular.";
  }
  if (total < 4) {
    return "Not great — no fresh snow in days and conditions are below average.";
  }
  return "Mixed conditions. Check the details before heading out.";
}

// ── 5-day Forecast Scores ─────────────────────────────────────────────────

export function buildForecastDays(
  dailyData: {
    dates: string[];
    snowfall: number[];
    tempMin: number[];
    tempMax: number[];
    weathercodes: number[];
    precipitation: number[];
    freezingLevels?: number[];
  },
  resort: Resort,
  todayIdx: number
): ForecastDay[] {
  const days: ForecastDay[] = [];

  for (let i = 1; i <= 5; i++) {
    const idx = todayIdx + i;
    if (idx >= dailyData.dates.length) break;

    const snow = dailyData.snowfall[idx] ?? 0;
    const tMin = dailyData.tempMin[idx] ?? 0;
    const tMax = dailyData.tempMax[idx] ?? 0;
    const _wcode = dailyData.weathercodes[idx] ?? 0; void _wcode;
    const precip = dailyData.precipitation[idx] ?? 0;

    // Rough estimated score (simplified)
    let estScore = 5;
    if (snow >= 15) estScore = 8.5;
    else if (snow >= 10) estScore = 7.5;
    else if (snow >= 5) estScore = 6.5;
    else if (tMax < 0) estScore = 5.5;
    else if (tMax > 5) estScore = 4;
    if (precip > 0 && (dailyData.freezingLevels?.[idx] ?? 0) > resort.primaryAltitude) {
      estScore = Math.max(2, estScore - 3);
    }

    let summary = "Cold & dry";
    if (snow >= 10) summary = "Powder";
    else if (snow >= 3) summary = "Light snow";
    else if (tMax > 5) summary = "Warm";
    else if (precip > 0) summary = "Rain risk";
    else if (tMax < -5) summary = "Cold";

    days.push({
      date: dailyData.dates[idx],
      estimatedScore: round1(clamp(estScore)),
      snowfall: Math.round(snow * 10) / 10,
      tempMin: Math.round(tMin),
      tempMax: Math.round(tMax),
      windMax: 0, // not available in this code path; open-meteo.ts populates it
      summary,
      confidence: i <= 2 ? "reliable" : "estimate",
    });
  }

  return days;
}

// ── Main entry point ───────────────────────────────────────────────────────

export function scoreResort(data: RawWeatherData, resort: Resort): Omit<ResortScore, "forecast"> {
  const snowScore    = round1(calcSnowScore(data, resort));
  const weatherScore = round1(calcWeatherScore(data));
  const altScore     = round1(calcAltitudeScore(data, resort));
  const trendScore   = round1(calcTrendScore(data));

  const subScores: SubScores = {
    snow: snowScore,
    weather: weatherScore,
    altitude: altScore,
    trend: trendScore,
  };

  const totalScore = calcCompositeScore(subScores);
  const confidence = calcConfidence(data);
  const summary    = generateSummary(data, totalScore);

  return {
    id: resort.id,
    name: resort.name,
    totalScore,
    confidence,
    summary,
    subScores,
    rawData: data,
  };
}
