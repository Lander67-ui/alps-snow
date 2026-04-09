import { NextRequest, NextResponse } from "next/server";
import { appendFeedback, todayDateString } from "@/lib/data-store";
import { FeedbackEntry } from "@/lib/types";

const VALID_RATINGS = new Set(["too_high", "about_right", "too_low"]);
const COOKIE_NAME = "alps_feedback";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { resortId, date, rating } = body as Record<string, unknown>;

  if (typeof resortId !== "string" || !resortId) {
    return NextResponse.json({ error: "Missing resortId" }, { status: 400 });
  }
  if (typeof rating !== "string" || !VALID_RATINGS.has(rating)) {
    return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
  }

  const feedbackDate = typeof date === "string" ? date : todayDateString();

  // Simple rate limiting: check cookie to avoid duplicate feedback per resort per session
  const cookieValue = req.cookies.get(COOKIE_NAME)?.value ?? "";
  const seen: string[] = cookieValue ? cookieValue.split(",") : [];
  const feedbackKey = `${feedbackDate}:${resortId}`;

  if (seen.includes(feedbackKey)) {
    return NextResponse.json({ error: "Already submitted" }, { status: 429 });
  }

  const entry: FeedbackEntry = {
    resortId,
    date: feedbackDate,
    rating: rating as FeedbackEntry["rating"],
    submittedAt: new Date().toISOString(),
  };

  try {
    appendFeedback(entry);
  } catch (err) {
    console.error("[feedback API] Failed to save:", err);
    return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
  }

  // Set cookie so they can't spam — 24h expiry
  const response = NextResponse.json({ success: true });
  const updated = [...seen, feedbackKey].slice(-50).join(","); // cap at 50 entries
  response.cookies.set(COOKIE_NAME, updated, {
    maxAge: 86400,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return response;
}
