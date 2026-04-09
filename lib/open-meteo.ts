import { Resort } from "@/resorts.config";
import { RawWeatherData, ForecastDay } from "@/lib/types";

const BASE_URL = "https://api.open-meteo.com/v1/forecast";

interface OpenMeteoResponse {
  hourly: {
    time: string[];
    temperature_2m: number[];
    windspeed_10m: number[];
    windgusts_10m: number[];
    precipitation: number[];
    snowfall: number[];
    snow_depth: number[];
    weathercode: number[];
    cloudcover: number[];
    visibility: number[];
    freezinglevel_height: number[];
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    snowfall_sum: number[];
    windspeed_10m_max: number[];
    windgusts_10m_max: number[];
    weathercode: number[];
  };
}

export interface FetchResult {
  weather: RawWeatherData;
  forecast: ForecastDay[];
}

export async function fetchResortWeather(resort: Resort): Promise<FetchResult> {
  const params = new URLSearchParams({
    latitude: resort.latitude.toString(),
    longitude: resort.longitude.toString(),
    elevation: resort.primaryAltitude.toString(),
    hourly: [
      "temperature_2m",
      "windspeed_10m",
      "windgusts_10m",
      "precipitation",
      "snowfall",
      "snow_depth",
      "weathercode",
      "cloudcover",
      "visibility",
      "freezinglevel_height",
    ].join(","),
    daily: [
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_sum",
      "snowfall_sum",
      "windspeed_10m_max",
      "windgusts_10m_max",
      "weathercode",
    ].join(","),
    timezone: "Europe/Paris",
    forecast_days: "5",
    past_days: "3",
  });

  const url = `${BASE_URL}?${params}`;
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(
      `Open-Meteo API error ${response.status} for ${resort.id}: ${await response.text()}`
    );
  }

  const data: OpenMeteoResponse = await response.json();
  return parseWeatherData(data, resort);
}

function round1(v: number) {
  return Math.round(v * 10) / 10;
}

function parseWeatherData(data: OpenMeteoResponse, resort: Resort): FetchResult {
  const { hourly, daily } = data;

  // ── Find "now" in the hourly timeline ───────────────────────────────────
  // Use Paris time for the date string since that's the timezone we requested
  const nowParis = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Europe/Paris" })
  );
  const todayStr = nowParis.toISOString().slice(0, 10); // YYYY-MM-DD
  const nowHour = nowParis.getHours();

  // Find the hourly index for the current hour today
  let refIdx = hourly.time.findIndex(
    (t) => t.startsWith(todayStr) && parseInt(t.slice(11, 13)) === nowHour
  );
  // Fallback: last entry for today
  if (refIdx < 0) {
    refIdx = hourly.time.reduce(
      (last, t, i) => (t.startsWith(todayStr) ? i : last),
      0
    );
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  const sum = (arr: number[]) => arr.reduce((a, b) => a + (b ?? 0), 0);
  const avg = (arr: number[]) => (arr.length ? sum(arr) / arr.length : 0);
  const maxVal = (arr: number[]) => (arr.length ? Math.max(...arr) : 0);

  function pastHours(n: number) {
    const start = Math.max(0, refIdx - n);
    return {
      snowfall: hourly.snowfall.slice(start, refIdx + 1),
      precipitation: hourly.precipitation.slice(start, refIdx + 1),
      temperature: hourly.temperature_2m.slice(start, refIdx + 1),
      freezingLevel: hourly.freezinglevel_height.slice(start, refIdx + 1),
    };
  }

  function futureHours(n: number) {
    const end = Math.min(hourly.time.length - 1, refIdx + n);
    return {
      snowfall: hourly.snowfall.slice(refIdx, end + 1),
      precipitation: hourly.precipitation.slice(refIdx, end + 1),
      temperature: hourly.temperature_2m.slice(refIdx, end + 1),
      windspeed: hourly.windspeed_10m.slice(refIdx, end + 1),
      freezingLevel: hourly.freezinglevel_height.slice(refIdx, end + 1),
    };
  }

  // ── Past snowfall sums ───────────────────────────────────────────────────
  const past24 = pastHours(24);
  const past48 = pastHours(48);
  const past72 = pastHours(72);
  const next24 = futureHours(24);
  const next48 = futureHours(48);

  const freshSnow24h = round1(sum(past24.snowfall));
  const freshSnow48h = round1(sum(past48.snowfall));
  const freshSnow72h = round1(sum(past72.snowfall));

  // ── Rain detection ───────────────────────────────────────────────────────
  // Rain = precipitation present AND freezing level is ABOVE resort altitude
  function detectRain(hours: ReturnType<typeof pastHours>): boolean {
    return hours.precipitation.some(
      (p, i) => p > 0 && (hours.freezingLevel[i] ?? 0) > resort.primaryAltitude
    );
  }

  const rainDetected24h = detectRain(past24);
  const rainDetected48h = !rainDetected24h && detectRain(past48);
  const rainDetected72h = !rainDetected24h && !rainDetected48h && detectRain(past72);

  // ── Current conditions ───────────────────────────────────────────────────
  const currentTemp = hourly.temperature_2m[refIdx] ?? avg(past24.temperature);
  const currentWind = hourly.windspeed_10m[refIdx] ?? 0;
  const currentGusts = hourly.windgusts_10m[refIdx] ?? 0;
  const currentCloudCover = hourly.cloudcover[refIdx] ?? 50;
  const currentVisibility = hourly.visibility[refIdx] ?? 10000;
  const currentFreezingLevel = hourly.freezinglevel_height[refIdx] ?? 1500;
  // snow_depth in Open-Meteo is metres → convert to cm
  const snowDepth = Math.round((hourly.snow_depth[refIdx] ?? 0) * 100);
  const avgTemp48h = avg(past48.temperature);

  // Active snowfall: average of the last 3 hours
  const recentSnow = hourly.snowfall.slice(Math.max(0, refIdx - 2), refIdx + 1);
  const activeSnowfallRate = round1(avg(recentSnow));

  // ── Forecast summary values ──────────────────────────────────────────────
  const snowfallForecast24h = round1(sum(next24.snowfall));
  const snowfallForecast48h = round1(sum(next48.snowfall));
  const forecastMaxTemp48h = round1(maxVal(next48.temperature));
  const forecastWindSpeed24h = Math.round(maxVal(next24.windspeed));
  const forecastRain24h = next24.precipitation.some(
    (p, i) => p > 0 && (next24.freezingLevel[i] ?? 0) > resort.primaryAltitude
  );
  const weatherCode = hourly.weathercode[refIdx] ?? 0;

  // ── Data completeness ─────────────────────────────────────────────────────
  const keyFields = [currentTemp, currentWind, currentFreezingLevel, snowDepth];
  const validCount = keyFields.filter((v) => v != null && !isNaN(v)).length;
  const dataCompleteness = validCount / keyFields.length;

  const weather: RawWeatherData = {
    freshSnow24h,
    freshSnow48h,
    freshSnow72h,
    temperature: round1(currentTemp),
    avgTemp48h: round1(avgTemp48h),
    windSpeed: Math.round(currentWind),
    windGusts: Math.round(currentGusts),
    visibility: Math.round(currentVisibility),
    cloudCover: Math.round(currentCloudCover),
    freezingLevel: Math.round(currentFreezingLevel),
    snowDepth,
    snowfallForecast24h,
    snowfallForecast48h,
    rainDetected24h,
    rainDetected48h,
    rainDetected72h,
    activeSnowfallRate,
    forecastMaxTemp48h,
    forecastWindSpeed24h,
    forecastRain24h,
    weatherCode,
    dataCompleteness,
  };

  // ── Build 5-day forecast from daily data ─────────────────────────────────
  // Find today's index in the daily array
  const todayDailyIdx = daily.time.findIndex((d) => d === todayStr);

  const forecast: ForecastDay[] = [];
  for (let i = 1; i <= 5; i++) {
    const idx = todayDailyIdx >= 0 ? todayDailyIdx + i : i;
    if (idx >= daily.time.length) break;

    const snow = daily.snowfall_sum[idx] ?? 0;
    const tMin = daily.temperature_2m_min[idx] ?? 0;
    const tMax = daily.temperature_2m_max[idx] ?? 0;
    const precip = daily.precipitation_sum[idx] ?? 0;
    const windMax = Math.round(daily.windspeed_10m_max[idx] ?? 0);

    // Compute average daily freezing level from hourly data for this day
    const dayDate = daily.time[idx];
    const dayHourlyIdx = hourly.time
      .map((t, hi) => ({ t, hi }))
      .filter(({ t }) => t.startsWith(dayDate));
    const dayFreezingLevels = dayHourlyIdx.map(
      ({ hi }) => hourly.freezinglevel_height[hi] ?? 0
    );
    const avgFreezingLevel =
      dayFreezingLevels.length > 0 ? avg(dayFreezingLevels) : currentFreezingLevel;

    const rainRisk = precip > 0 && avgFreezingLevel > resort.primaryAltitude;

    // Simple estimated score
    let estScore = 5;
    if (rainRisk) {
      estScore = Math.max(1.5, estScore - 3);
    } else if (snow >= 15) {
      estScore = 8.5;
    } else if (snow >= 10) {
      estScore = 7.5;
    } else if (snow >= 5) {
      estScore = 6.5;
    } else if (snow >= 2) {
      estScore = 5.5;
    } else if (tMax > 5) {
      estScore = 3.5;
    } else if (tMax < -2) {
      estScore = 5.0; // cold & dry — preserved
    }

    // One-word summary
    let summary = "Cold & dry";
    if (rainRisk) summary = "Rain risk";
    else if (snow >= 15) summary = "Heavy snow";
    else if (snow >= 5) summary = "Light snow";
    else if (tMax > 5) summary = "Warm";
    else if (tMax > 0 && tMax <= 5) summary = "Mild";
    else if (tMax < -8) summary = "Very cold";

    forecast.push({
      date: dayDate,
      estimatedScore: Math.round(Math.min(10, Math.max(0, estScore)) * 10) / 10,
      snowfall: round1(snow),
      tempMin: Math.round(tMin),
      tempMax: Math.round(tMax),
      windMax,
      summary,
      confidence: i <= 2 ? "reliable" : "estimate",
    });
  }

  return { weather, forecast };
}
