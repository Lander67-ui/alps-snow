export type Confidence = "high" | "medium" | "low";

export interface SubScores {
  snow: number;
  weather: number;
  altitude: number;
  trend: number;
}

export interface RawWeatherData {
  freshSnow24h: number;
  freshSnow48h: number;
  freshSnow72h: number;
  temperature: number;
  avgTemp48h: number;
  windSpeed: number;
  windGusts: number;
  visibility: number;
  cloudCover: number;
  freezingLevel: number;
  snowDepth: number;
  snowfallForecast24h: number;
  snowfallForecast48h: number;
  rainDetected24h: boolean;
  rainDetected48h: boolean;
  rainDetected72h: boolean;
  activeSnowfallRate: number;
  forecastMaxTemp48h: number;
  forecastWindSpeed24h: number;
  forecastRain24h: boolean;
  weatherCode: number;
  dataCompleteness: number;
}

export interface ForecastDay {
  date: string;
  estimatedScore: number;
  snowfall: number;
  tempMin: number;
  tempMax: number;
  windMax: number;       // max wind speed (km/h)
  summary: string;
  confidence: "reliable" | "estimate";
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
  error?: string;
}

export interface DailyScores {
  date: string;
  fetchedAt: string;
  resorts: ResortScore[];
}

export interface FeedbackEntry {
  resortId: string;
  date: string;
  rating: "too_high" | "about_right" | "too_low";
  submittedAt: string;
}
