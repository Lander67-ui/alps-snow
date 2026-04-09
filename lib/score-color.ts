// Returns Tailwind class names for a given score value (0–10)

export function scoreColorClass(score: number): string {
  if (score >= 8) return "score-excellent";
  if (score >= 6) return "score-good";
  if (score >= 4) return "score-moderate";
  if (score >= 2) return "score-poor";
  return "score-bad";
}

export function scoreBgClass(score: number): string {
  if (score >= 8) return "bg-score-excellent";
  if (score >= 6) return "bg-score-good";
  if (score >= 4) return "bg-score-moderate";
  if (score >= 2) return "bg-score-poor";
  return "bg-score-bad";
}

export function scoreLabel(score: number): string {
  if (score >= 8) return "Excellent";
  if (score >= 6) return "Good";
  if (score >= 4) return "Moderate";
  if (score >= 2) return "Poor";
  return "Very poor";
}

export function scoreHexColor(score: number): string {
  if (score >= 8) return "#1B7D3A";
  if (score >= 6) return "#4CAF50";
  if (score >= 4) return "#F5A623";
  if (score >= 2) return "#E85D3A";
  return "#C62828";
}
