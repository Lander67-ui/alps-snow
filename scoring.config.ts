// ============================================================
// SCORING CONFIGURATION
// ============================================================
// This file controls EVERYTHING about how resort scores are
// calculated. You can safely edit any number, threshold, or
// weight here without touching any other code.
//
// HOW TO READ THIS FILE:
//   - "weight" values must sum to 1.0  (e.g. 0.45 + 0.25 + 0.15 + 0.15 = 1.0)
//   - All scores are on a 0–10 scale before weighting
//   - Modifiers can push a score above 10 or below 0, but
//     the final result is always clamped to [0, 10]
// ============================================================

export const scoringConfig = {

  // ----------------------------------------------------------
  // COMPOSITE WEIGHTS
  // How much each sub-score contributes to the final score.
  // Must sum to exactly 1.0.
  // ----------------------------------------------------------
  weights: {
    snow: 0.45,      // Snow quality — the single most important factor
    weather: 0.25,   // Weather comfort (temperature, wind, visibility)
    altitude: 0.15,  // Freezing level vs resort altitude (rain risk)
    trend: 0.15,     // 24–48h forecast outlook
  },

  // ----------------------------------------------------------
  // SNOW QUALITY SUB-SCORE  (weight: 0.45)
  // ----------------------------------------------------------
  snow: {
    // Fresh snowfall in the last 24 hours.
    // Thresholds are in cm. The FIRST matching threshold wins
    // (list must be ordered highest → lowest).
    freshSnow24hThresholds: [
      { min: 20, score: 10, label: "Deep powder" },
      { min: 15, score: 9,  label: "Great fresh snow" },
      { min: 10, score: 8,  label: "Good fresh snow" },
      { min: 5,  score: 6,  label: "Light fresh snow" },
      { min: 2,  score: 4,  label: "Dusting" },
      { min: 0,  score: 1,  label: "No fresh snow" },
    ],

    // If 24h snowfall is under 2cm, fall back to the 48h total.
    freshSnow48hFallback: {
      minSnow48h: 15,  // cm needed over 48h to trigger fallback score
      score: 5,
      label: "Recent snow (48h)",
    },

    // If 48h snowfall is also under 2cm, fall back to the 72h total.
    freshSnow72hFallback: {
      minSnow72h: 20,  // cm needed over 72h to trigger fallback score
      score: 3,
      label: "Snow a few days ago (72h)",
    },

    // Snow preservation modifier (-3 … +2)
    // Warmer temps degrade snow; cold temps preserve it.
    preservationModifiers: {
      veryGood:    { maxTemp: -5, modifier: 2,  label: "Snow well preserved" },
      good:        { maxTemp: -1, modifier: 1,  label: "Snow OK" },
      marginal:    { maxTemp: 2,  modifier: 0,  label: "Marginal preservation" },
      degrading:   { modifier: -2, label: "Snow degrading" },  // above 2°C
      // Rain is handled separately — it overrides all preservation logic
    },

    // Rain penalty — the most critical downgrade in the model.
    // Rain at resort altitude is detected when:
    //   freezingLevel > primaryAltitude AND precipitation > 0
    rainPenalties: {
      last24h: -4,  // Rain in the last 24h — very bad
      last48h: -2,  // Rain 25–48h ago
      last72h: -1,  // Rain 49–72h ago — impact fading
    },

    // Additional modifier for rain preserving modifier when rain is detected
    rainPreservationModifier: -3, // Replaces normal preservation when rain detected at altitude

    // Snow depth (total snowpack base) modifier
    depthModifiers: {
      deep:     { min: 100, modifier: 1,   label: "Deep base" },
      adequate: { min: 50,  modifier: 0.5, label: "Adequate base" },
      thin:     { max: 30,  modifier: -1,  label: "Thin base" },
    },

    // Altitude resilience — high resorts preserve snow better.
    altitudeModifiers: {
      high:   { min: 2500, modifier: 0.5  },
      medium: { min: 2000, modifier: 0.25 },
      low:    { max: 1500, modifier: -0.5 },
    },

    // Snowmaking can compensate when natural snowpack is thin.
    snowMakingModifiers: {
      high:   { maxDepthForBonus: 50, modifier: 1   },
      medium: { maxDepthForBonus: 50, modifier: 0.5 },
      // "low" and "none" get no bonus
    },
  },

  // ----------------------------------------------------------
  // WEATHER CONDITIONS SUB-SCORE  (weight: 0.25)
  // ----------------------------------------------------------
  weather: {
    // Temperature comfort score (0–4).
    // Ideal skiing: -12°C to -5°C. Too cold or too warm = bad.
    temperatureScores: [
      { minTemp: -12, maxTemp: -5, score: 4, label: "Ideal skiing temperature" },
      { minTemp: -5,  maxTemp: -1, score: 3, label: "Good temperature" },
      { minTemp: -1,  maxTemp: 3,  score: 2, label: "Mild — snow softening" },
      { minTemp: -99, maxTemp: -15, score: 1, label: "Very cold" },
      { minTemp: 5,   maxTemp: 99, score: 1, label: "Too warm, slushy" },
      // Fallback (not matched above, e.g. -15 to -12 or 3 to 5)
    ],
    temperatureFallbackScore: 2, // For temps in -15 to -12 or 3 to 5 gaps

    // Wind score (0–3). Higher wind = lower score.
    windScores: [
      { maxWind: 20,  score: 3,   label: "Calm" },
      { maxWind: 35,  score: 2,   label: "Breezy" },
      { maxWind: 50,  score: 1,   label: "Windy — some lifts may close" },
      { maxWind: 999, score: 0,   label: "Storm winds — likely lift closures" },
    ],

    // Visibility / cloud cover score (0–3).
    visibilityScores: {
      clear:    { maxCloudCover: 25,  score: 3,   label: "Clear skies" },
      partlyCloudy: { maxCloudCover: 60, score: 2.5, label: "Partly cloudy" },
      overcast: { maxCloudCover: 100, score: 1.5, label: "Overcast but visible" },
      fogWhiteout: { score: 0.5, label: "Fog / whiteout" }, // when visibility < threshold
      fogVisibilityThreshold: 2000, // metres — below this = fog/whiteout
    },

    // Active snowfall during the day — magical, but heavy = poor visibility.
    activeSnowfallModifiers: {
      light: { maxSnowfall: 3,   modifier: 0.5,  label: "Light snowfall — beautiful" },
      heavy: { modifier: -0.5, label: "Heavy snowfall — reduced visibility" },
    },
    activeSnowfallThresholdForBonus: 0.5, // cm/h minimum to trigger light bonus
    activeSnowfallThresholdForHeavy: 3,   // cm/h above this = heavy penalty
  },

  // ----------------------------------------------------------
  // FREEZING LEVEL & ALTITUDE RISK SUB-SCORE  (weight: 0.15)
  // ----------------------------------------------------------
  altitude: {
    // How far below the resort's primaryAltitude is the freezing level?
    // Positive gap = good (freezing level is well below resort).
    // Negative gap = bad (freezing level is above resort = rain risk).
    //
    // freezingGap = primaryAltitude - freezingLevel
    //
    thresholds: [
      { minGap: 500,  score: 10, label: "Well below resort — fully frozen" },
      { minGap: 200,  score: 8,  label: "Below resort — solid conditions" },
      { minGap: 0,    score: 6,  label: "Near resort level — watch closely" },
      { minGap: -200, score: 4,  label: "Marginal — snow/rain line at resort" },
      { minGap: -500, score: 2,  label: "Above resort — rain risk" },
      { minGap: -9999,score: 0,  label: "Well above resort — likely raining" },
    ],
    // Interpolate linearly between thresholds for smoother scores
    interpolate: true,
  },

  // ----------------------------------------------------------
  // TREND / OUTLOOK SUB-SCORE  (weight: 0.15)
  // ----------------------------------------------------------
  trend: {
    // Start from a neutral 5, then add/subtract modifiers.
    baseScore: 5,

    // Forecast snowfall modifiers (next 24h)
    snowfallForecastModifiers: [
      { min: 10, modifier: 3, label: "Heavy snow coming" },
      { min: 5,  modifier: 2, label: "Good snow forecast" },
      { min: 2,  modifier: 1, label: "Light snow forecast" },
    ],

    // Stable cold: no snow but temperatures staying below 0
    stableColdModifier: 1,      // No snow, but cold temps preserving conditions
    stableColdMaxTemp: 0,        // °C — must be below this to count as "stable cold"

    // Warming trend
    warmingModifier: -1,         // Penalty if temps rise significantly
    warmingThreshold: 5,         // °C — if temp rises by this much in 48h, apply penalty

    // Rain in forecast
    rainForecastModifier: -3,    // Rain forecast in next 24h — severe penalty

    // Strong wind forecast
    strongWindForecastModifier: -2, // Wind > threshold in next 24h
    strongWindThreshold: 50,        // km/h
  },

  // ----------------------------------------------------------
  // CONFIDENCE LEVEL
  // ----------------------------------------------------------
  confidence: {
    // "high"   — all API data available, past_days data complete, no anomalies
    // "medium" — some data missing, or relying mainly on forecast
    // "low"    — significant data gaps or anomalies
    missingDataThreshold: 2,   // number of missing key fields that drops to "medium"
    anomalyThreshold: 4,       // number of missing fields that drops to "low"
  },

  // ----------------------------------------------------------
  // AUTO-GENERATED SUMMARY TEMPLATES
  // ----------------------------------------------------------
  // Conditions are checked in ORDER — first match wins.
  // Each entry has:
  //   condition: a key describing which data to check
  //   threshold: the value that triggers this template
  //   template:  the output string (use {variable} placeholders)
  // ----------------------------------------------------------
  summaryConditions: [
    // Rain conditions — always surface these first
    { condition: "rainDetected24h",    template: "Stay home — rain at resort level has damaged the snowpack." },
    { condition: "rainDetected48h",    template: "Recent rain has softened the snow. Expect heavy, wet conditions." },

    // Excellent powder conditions
    { condition: "freshSnow24h>=20",   template: "Epic powder day — {freshSnow24h}cm overnight and more coming." },
    { condition: "freshSnow24h>=10",   template: "Fresh powder! {freshSnow24h}cm overnight. Get on the slopes early." },
    { condition: "freshSnow24h>=5",    template: "Light overnight snowfall ({freshSnow24h}cm). Top-ups on a solid base." },

    // Upcoming snow in forecast
    { condition: "snowForecast24h>=10",template: "Powder incoming — {snowForecast24h}cm expected in the next 24 hours." },
    { condition: "snowForecast24h>=5", template: "Snow on the way. {snowForecast24h}cm forecast — conditions improving." },

    // Good preserved snow
    { condition: "coldAndDry",         template: "No new snow, but cold temps are keeping the base firm. Good groomed skiing." },

    // Warm spring conditions
    { condition: "warmAndSunny",       template: "Spring skiing — warm and sunny. Go early for the best snow before it softens." },

    // Warming trend warning
    { condition: "warmingTrend",       template: "Warming trend ahead. Enjoy today — conditions may deteriorate soon." },

    // Decent but unremarkable
    { condition: "decentBase",         template: "Decent conditions overall. Solid base, nothing spectacular." },

    // Poor / stay away
    { condition: "lowScore",           template: "Not great — no fresh snow in days and conditions are below average." },

    // Fallback
    { condition: "default",            template: "Mixed conditions. Check the details before heading out." },
  ],
} as const;

export type ScoringConfig = typeof scoringConfig;
