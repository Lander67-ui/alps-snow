#!/usr/bin/env tsx
/**
 * npm run test-scoring
 *
 * Interactive formula tester. Pass a JSON file as argument, or run
 * interactively and answer the prompts.
 *
 * Usage:
 *   npm run test-scoring                      # interactive mode
 *   npm run test-scoring -- input.json        # file mode
 *
 * Example input.json:
 * {
 *   "freshSnow24h": 15,
 *   "temperature": -8,
 *   "windSpeed": 20,
 *   "freezingLevel": 1500,
 *   "snowDepth": 80,
 *   "resortId": "val-thorens"
 * }
 */

import * as readline from "readline";
import { resorts, getResortById } from "../resorts.config";
import {
  calcSnowScore,
  calcWeatherScore,
  calcAltitudeScore,
  calcTrendScore,
  calcCompositeScore,
  calcConfidence,
  generateSummary,
} from "../lib/scoring";
import { RawWeatherData } from "../lib/types";

function defaultData(): RawWeatherData {
  return {
    freshSnow24h: 0,
    freshSnow48h: 0,
    freshSnow72h: 0,
    temperature: -5,
    avgTemp48h: -5,
    windSpeed: 15,
    windGusts: 25,
    visibility: 10000,
    cloudCover: 20,
    freezingLevel: 1500,
    snowDepth: 60,
    snowfallForecast24h: 0,
    snowfallForecast48h: 0,
    rainDetected24h: false,
    rainDetected48h: false,
    rainDetected72h: false,
    activeSnowfallRate: 0,
    forecastMaxTemp48h: -3,
    forecastWindSpeed24h: 20,
    forecastRain24h: false,
    weatherCode: 0,
    dataCompleteness: 1,
  };
}

function printResult(data: RawWeatherData, resortId: string) {
  const resort = getResortById(resortId) ?? resorts[0];
  console.log(`\n${"═".repeat(56)}`);
  console.log(`  Resort: ${resort.name} (${resort.primaryAltitude}m, ${resort.snowMakingCoverage} snowmaking)`);
  console.log(`${"─".repeat(56)}`);

  const snow    = parseFloat(calcSnowScore(data, resort).toFixed(1));
  const weather = parseFloat(calcWeatherScore(data).toFixed(1));
  const alt     = parseFloat(calcAltitudeScore(data, resort).toFixed(1));
  const trend   = parseFloat(calcTrendScore(data).toFixed(1));

  const subScores = { snow, weather, altitude: alt, trend };
  const total  = calcCompositeScore(subScores);
  const conf   = calcConfidence(data);
  const summary = generateSummary(data, total);

  console.log(`  Snow Quality   : ${snow}/10`);
  console.log(`  Weather        : ${weather}/10`);
  console.log(`  Altitude Risk  : ${alt}/10`);
  console.log(`  Trend          : ${trend}/10`);
  console.log(`${"─".repeat(56)}`);
  console.log(`  TOTAL SCORE    : ${total}/10  (${conf} confidence)`);
  console.log(`  Summary        : ${summary}`);
  console.log(`${"═".repeat(56)}\n`);
}

async function interactiveMode() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q: string, def: string) => new Promise<string>((resolve) => {
    rl.question(`${q} [${def}]: `, (ans) => resolve(ans.trim() || def));
  });

  console.log("\n🏔  Alps Snow — Formula Tester");
  console.log("Press Enter to accept the default value shown in brackets.\n");

  const data = defaultData();

  // Resort selection
  console.log("Available resorts:");
  resorts.forEach((r, i) => console.log(`  ${i + 1}. ${r.name} (${r.primaryAltitude}m)`));
  const resortIdx = parseInt(await ask("\nResort number", "1")) - 1;
  const resort = resorts[Math.max(0, Math.min(resortIdx, resorts.length - 1))];

  data.freshSnow24h = parseFloat(await ask("Fresh snow last 24h (cm)", "0"));
  data.freshSnow48h = parseFloat(await ask("Fresh snow last 48h (cm)", "0"));
  data.freshSnow72h = parseFloat(await ask("Fresh snow last 72h (cm)", "0"));
  data.temperature  = parseFloat(await ask("Current temperature (°C)", "-5"));
  data.avgTemp48h   = parseFloat(await ask("Avg temperature last 48h (°C)", String(data.temperature)));
  data.windSpeed    = parseFloat(await ask("Wind speed (km/h)", "15"));
  data.freezingLevel = parseFloat(await ask("Freezing level altitude (m)", "1500"));
  data.snowDepth    = parseFloat(await ask("Snow depth / base (cm)", "60"));
  data.cloudCover   = parseFloat(await ask("Cloud cover (0-100%)", "20"));
  data.visibility   = parseFloat(await ask("Visibility (metres)", "10000"));
  data.snowfallForecast24h = parseFloat(await ask("Forecast snowfall next 24h (cm)", "0"));

  const rainAns = await ask("Rain detected last 24h? (y/n)", "n");
  data.rainDetected24h = rainAns.toLowerCase() === "y";

  rl.close();
  printResult(data, resort.id);
}

async function fileMode(filePath: string) {
  const fs = await import("fs");
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const data: RawWeatherData = { ...defaultData(), ...raw };
  printResult(data, raw.resortId ?? "val-thorens");
}

const arg = process.argv[2];
if (arg) {
  fileMode(arg).catch(console.error);
} else {
  interactiveMode().catch(console.error);
}
