// Shared TypeScript types used across the whole project

export type Confidence = "high" | "medium" | "low";

export interface SubScores {
  snow: number;
  weather: number;
  altitude: number;
  trend: number;
}

export interface RawWeatherData {
  freshSnow24h: number;      // cm of snowfall in last 24h
  freshSnow48h: number;      // cm of snowfall in last 48h
  freshSnow72h: number;      // cm of snowfall in last 72h
  temperature: number;       // current temperature at primaryAltitude (°C)
  avgTemp48h: number;        // average temperature over last 48h (°C)
  windSpeed: number;         // current wind speed (km/h)
  windGusts: number;         // current wind gusts (km/h)
  visibility: number;        // visibility in metres (derived from weathercode/cloudcover)
  cloudCover: number;        // cloud cover 0–100%
  freezingLevel: number;     // current freezing level altitude (m)
  snowDepth: number;         // total snowpack depth (cm)
  snowfallForecast24h: number; // expected snowfall next 24h (cm)
  snowfallForecast48h: number; // expected snowfall next 24–48h (cm)
  rainDetected24h: boolean;  // rain (not snow) detected in last 24h at primary altitude
  rainDetected48h: boolean;  // rain detected in last 25–48h
  rainDetected72h: boolean;  // rain detected in last 49–72h
  activeSnowfallRate: number; // current snowfall rate (cm/h, average of last few hours)
  forecastMaxTemp48h: number; // max forecast temperature in next 48h (for warming trend)
  forecastWindSpeed24h: number; // max forecast wind in next 24h
  forecastRain24h: boolean;   // rain forecast in next 24h
  weatherCode: number;        // WMO weather code for today
  dataCompleteness: number;   // 0–1, fraction of fields that have real (non-fallback) data
}

export interface ForecastDay {
  date: string;           // YYYY-MM-DD
  estimatedScore: number; // approximate score for that day
  snowfall: number;       // expected snowfall (cm)
  tempMin: number;        // min temperature (°C)
  tempMax: number;        // max temperature (°C)
  summary: string;        // one-word label
  confidence: "reliable" | "estimate"; // day 1–2 = reliable, 3–5 = estimate
}

export interface ResortScore {
  id: string;
  name: string;
  totalScore: number;
  confidence: Confidence;
  summary: string;
  subScores: SubScores;
  rawData: RawWeatherData;
  forecast: ForecastDay[];
  error?: string; // set if data fetch failed for this resort
}

export interface DailyScores {
  date: string;        // YYYY-MM-DD
  fetchedAt: string;   // ISO timestamp
  resorts: ResortScore[];
}

export interface FeedbackEntry {
  resortId: string;
  date: string;
  rating: "too_high" | "about_right" | "too_low";
  submittedAt: string;
}
