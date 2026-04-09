"use client";

import { useState } from "react";

type Rating = "too_high" | "about_right" | "too_low";

export default function FeedbackWidget({
  resortId,
  date,
}: {
  resortId: string;
  date: string;
}) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(rating: Rating) {
    setLoading(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resortId, date, rating }),
      });
    } catch {
      // silent — feedback is best-effort
    }
    setSubmitted(true);
    setLoading(false);
  }

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
        <p className="text-green-800 text-sm font-medium">Thanks for the feedback! It helps us improve.</p>
      </div>
    );
  }

  const buttons: { rating: Rating; label: string; style: string }[] = [
    {
      rating: "too_high",
      label: "Score too high",
      style: "border-slate-200 text-slate-600 hover:border-red-300 hover:text-red-700 hover:bg-red-50",
    },
    {
      rating: "about_right",
      label: "About right",
      style: "border-slate-200 text-slate-600 hover:border-green-300 hover:text-green-700 hover:bg-green-50",
    },
    {
      rating: "too_low",
      label: "Score too low",
      style: "border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50",
    },
  ];

  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
      <p className="text-sm text-slate-600 mb-3 font-medium">
        Did you ski here today? Was our score accurate?
      </p>
      <div className="flex gap-2 flex-wrap">
        {buttons.map((btn) => (
          <button
            key={btn.rating}
            onClick={() => submit(btn.rating)}
            disabled={loading}
            className={`px-3 py-2 rounded-lg text-sm border font-medium transition-all min-h-[44px] disabled:opacity-50 ${btn.style}`}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}
