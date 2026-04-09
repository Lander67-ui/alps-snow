import { loadLatestScores } from "@/lib/data-store";
import RankingClient from "./RankingClient";

export const revalidate = 3600;

export default function RankingPage() {
  const data = loadLatestScores();

  if (!data) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-4">🏔</div>
        <h1 className="text-xl font-bold text-slate-800 mb-2">No data yet</h1>
        <p className="text-slate-500 text-sm">
          Run{" "}
          <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs">
            npm run fetch-data
          </code>{" "}
          to load scores.
        </p>
      </div>
    );
  }

  const sorted = [
    ...data.resorts.filter((r) => !r.error).sort((a, b) => b.totalScore - a.totalScore),
    ...data.resorts.filter((r) => !!r.error),
  ];

  return <RankingClient resorts={sorted} updatedAt={data.fetchedAt} />;
}
