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
    <section className="border-t border-white/10 pt-7">
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-cyan-200">
        [ Readiness analysis ]
      </p>

      <h3 className="mt-2 text-xl font-bold">Is this a promising contribution?</h3>

      <p className="mt-2 text-sm leading-6 text-slate-400">
        This score summarizes observable signals from GitHub. It is an automated estimate, not a guarantee that the issue is unclaimed or easy.
      </p>

      {loading ? (
        <div className="mt-5 rounded-lg border border-white/10 bg-white/2 p-5 text-sm text-slate-400">
          Checking repository activity and contribution guides…
        </div>
      ) : signals && totalScore !== null ? (
        <div className="mt-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500">Evidence score</p>
              <p className="mt-1 text-3xl font-bold tabular-nums">
                {totalScore}
                <span className="ml-1 text-base font-medium text-slate-500">/ 100</span>
              </p>
            </div>

            <span className="rounded-md border border-cyan-300/20 bg-cyan-300/5 px-3 py-2 text-xs font-semibold text-cyan-200">
              {scoreLabel}
            </span>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-cyan-300 transition-all"
              style={{ width: `${totalScore}%` }}
            />
          </div>

          <div className="mt-5 grid gap-3">
            {signals.map((signal) => (
              <article
                key={signal.name}
                className="rounded-lg border border-white/10 bg-white/2 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-semibold text-slate-100">{signal.name}</h4>
                  <span className="font-mono text-xs text-cyan-200">
                    {signal.score}/{signal.maximum}
                  </span>
                </div>

                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-400">
                  {signal.evidence.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="text-cyan-300" aria-hidden="true">
                        —
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <div
          role="status"
          className="mt-5 rounded-lg border border-amber-300/20 bg-amber-300/4 p-5"
        >
          <p className="font-semibold text-amber-100">Readiness score unavailable</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            {error || "The contribution-guide checks could not be completed."} Try again later and review the repository manually.
          </p>
        </div>
      )}
    </section>
  );
}
