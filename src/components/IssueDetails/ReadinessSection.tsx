"use client";

import type { ReadinessSignal } from "@/types/readiness";

type Props = {
  loading: boolean;
  error?: string;
  signals: ReadinessSignal[] | null;
  totalScore: number | null;
  scoreLabel: string;
};

export default function ReadinessSection({ loading, error, signals, totalScore, scoreLabel }: Props) {
  return (
    <section className="details-section">
      <h4>Repository readiness</h4>
      <p className="details-muted mt-1">A quick signal based on repository activity and contribution information.</p>

      {loading ? (
        <p className="details-muted mt-3">Checking repository…</p>
      ) : signals && totalScore !== null ? (
        <div className="details-surface mt-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-2xl font-bold tracking-tight text-[var(--ink)]">{totalScore}<span className="ml-1 text-sm font-medium text-[var(--muted)]">/ 100</span></div>
              <p className="details-muted mt-0.5">{scoreLabel}</p>
            </div>
            <div className="w-28 pb-1">
              <div className="details-progress"><span style={{ width: `${Math.max(0, Math.min(100, totalScore))}%` }} /></div>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {signals.map((signal) => (
              <div key={signal.name} className="border-t border-[var(--line)] pt-3">
                <div className="flex justify-between gap-3 font-semibold text-[var(--ink)]">
                  <span>{signal.name}</span>
                  <span>{signal.score} / {signal.maximum}</span>
                </div>
                <ul className="mt-1 list-inside list-disc leading-relaxed">
                  {signal.evidence.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="details-muted mt-3">Readiness score unavailable. {error || ""}</p>
      )}
    </section>
  );
}
