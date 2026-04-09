// Helpers for reading and writing score/feedback JSON files
import fs from "fs";
import path from "path";
import { DailyScores, FeedbackEntry } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");

export function todayDateString(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Paris" }); // YYYY-MM-DD
}

// ── Scores ─────────────────────────────────────────────────────────────────

export function scoresPath(date: string): string {
  return path.join(DATA_DIR, "scores", `${date}.json`);
}

export function rawPath(date: string, resortId: string): string {
  return path.join(DATA_DIR, "raw", date, `${resortId}.json`);
}

export function saveScores(scores: DailyScores): void {
  const dir = path.join(DATA_DIR, "scores");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(scoresPath(scores.date), JSON.stringify(scores, null, 2), "utf8");
}

export function saveRaw(date: string, resortId: string, raw: unknown): void {
  const dir = path.join(DATA_DIR, "raw", date);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(rawPath(date, resortId), JSON.stringify(raw, null, 2), "utf8");
}

export function loadScores(date: string): DailyScores | null {
  const p = scoresPath(date);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as DailyScores;
  } catch {
    return null;
  }
}

export function loadLatestScores(): DailyScores | null {
  const dir = path.join(DATA_DIR, "scores");
  if (!fs.existsSync(dir)) return null;
  const files = fs
    .readdirSync(dir)
    .filter(f => f.endsWith(".json"))
    .sort()
    .reverse();
  if (!files.length) return null;
  return loadScores(files[0].replace(".json", ""));
}

// ── Feedback ───────────────────────────────────────────────────────────────

export function feedbackPath(date: string): string {
  return path.join(DATA_DIR, "feedback", `${date}.json`);
}

export function appendFeedback(entry: FeedbackEntry): void {
  const dir = path.join(DATA_DIR, "feedback");
  fs.mkdirSync(dir, { recursive: true });
  const p = feedbackPath(entry.date);
  const existing: FeedbackEntry[] = fs.existsSync(p)
    ? JSON.parse(fs.readFileSync(p, "utf8"))
    : [];
  existing.push(entry);
  fs.writeFileSync(p, JSON.stringify(existing, null, 2), "utf8");
}
