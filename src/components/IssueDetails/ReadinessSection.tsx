"use client";

import type { ReadinessSignal } from "@/types/readiness";

type Props = {
  loading: boolean;
  error?: string;
  signals: ReadinessSignal[] | null;
  totalScore: number | null;
  scoreLabel: string;
};

export default function ReadinessSection({
  loading,
  error,
  signals,
  totalScore,
  scoreLabel,
}: Props) {
  return (
    <section className="border-t border-gray-300 pt-3 text-xs">
      <h4 className="font-bold text-gray-800">Readiness Analysis</h4>

      {loading ? (
        <p className="mt-1 text-gray-500">Checking repository...</p>
      ) : signals && totalScore !== null ? (
        <div className="mt-2 space-y-2">
          <p>
            Score: <b>{totalScore} / 100</b> ({scoreLabel})
          </p>

          <div className="space-y-1.5 border border-gray-300 p-2">
            {signals.map((signal) => (
              <div key={signal.name} className="border-b border-gray-100 pb-1 last:border-b-0">
                <div className="flex justify-between font-medium text-gray-700">
                  <span>{signal.name}</span>
                  <span>
                    {signal.score} / {signal.maximum}
                  </span>
                </div>
                <ul className="list-disc list-inside text-gray-600">
                  {signal.evidence.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-1 text-gray-500">
          Readiness score unavailable. {error || ""}
        </p>
      )}
    </section>
  );
}
