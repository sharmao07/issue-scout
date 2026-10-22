"use client";

import { CHECKLIST_STEPS } from "@/hooks/useContributionProgress";
import type { ContributionStatus } from "@/types/contribution";

type Props = {
  checkedSteps: boolean[];
  completedSteps: number;
  completionPercent: number;
  status: ContributionStatus;
  notes: string;
  pullRequestUrl: string;
  validPullRequestUrl: string | null;
  onToggleStep: (index: number) => void;
  onResetChecklist: () => void;
  onStatusChange: (status: ContributionStatus) => void;
  onNotesChange: (notes: string) => void;
  onPullRequestUrlChange: (url: string) => void;
};

export default function ChecklistSection({
  checkedSteps,
  completedSteps,
  completionPercent,
  status,
  notes,
  pullRequestUrl,
  validPullRequestUrl,
  onToggleStep,
  onResetChecklist,
  onStatusChange,
  onNotesChange,
  onPullRequestUrlChange,
}: Props) {
  return (
    <section className="border-t border-white/10 pt-7">
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-cyan-200">
        [ Contribution tracker ]
      </p>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold">Your contribution checklist</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Track your progress from issue discovery to pull request. Progress is saved locally in your browser.
          </p>
        </div>

        <button
          type="button"
          onClick={onResetChecklist}
          className="rounded-md border border-white/15 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-cyan-300/40 hover:text-cyan-200"
        >
          Reset checklist
        </button>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-slate-400">
            {completedSteps} of {CHECKLIST_STEPS.length} completed
          </span>
          <span className="font-mono text-cyan-200">{completionPercent}%</span>
        </div>

        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-label="Contribution checklist progress"
          aria-valuemin={0}
          aria-valuemax={CHECKLIST_STEPS.length}
          aria-valuenow={completedSteps}
        >
          <div
            className="h-full rounded-full bg-cyan-300 transition-all"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {CHECKLIST_STEPS.map((step, index) => (
          <label
            key={step}
            className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/10 bg-white/2 p-4 transition hover:border-cyan-300/25"
          >
            <input
              type="checkbox"
              checked={checkedSteps[index] ?? false}
              onChange={() => onToggleStep(index)}
              className="mt-1 size-4 shrink-0 accent-cyan-300"
            />
            <span
              className={`text-sm leading-6 ${
                checkedSteps[index] ? "text-slate-500 line-through" : "text-slate-200"
              }`}
            >
              {step}
            </span>
          </label>
        ))}
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div>
          <label
            htmlFor="contribution-status"
            className="mb-2 block text-sm font-semibold text-slate-200"
          >
            Contribution status
          </label>
          <select
            id="contribution-status"
            value={status}
            onChange={(e) => onStatusChange(e.target.value as ContributionStatus)}
            className="w-full rounded-lg border border-white/10 bg-[#101626] px-3 py-3 text-sm text-slate-100 outline-none focus:border-cyan-300"
          >
            <option value="not-started">Not started</option>
            <option value="investigating">Investigating the issue</option>
            <option value="working">Working on a solution</option>
            <option value="pr-opened">Pull request opened</option>
            <option value="completed">Contribution completed</option>
          </select>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Update this as you work through the contribution.
          </p>
        </div>

        <div>
          <label
            htmlFor="pull-request-url"
            className="mb-2 block text-sm font-semibold text-slate-200"
          >
            Pull request URL
          </label>
          <input
            id="pull-request-url"
            type="url"
            value={pullRequestUrl}
            onChange={(e) => onPullRequestUrlChange(e.target.value)}
            placeholder="https://github.com/owner/repo/pull/123"
            className="w-full rounded-lg border border-white/10 bg-[#101626] px-3 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-300"
          />
          {validPullRequestUrl ? (
            <a
              href={validPullRequestUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-xs font-semibold text-cyan-200 hover:underline"
            >
              Open tracked pull request ↗
            </a>
          ) : (
            <p className="mt-2 text-xs text-slate-500">
              Add your GitHub pull-request link when one exists.
            </p>
          )}
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="contribution-notes"
            className="mb-2 block text-sm font-semibold text-slate-200"
          >
            Personal notes
          </label>
          <textarea
            id="contribution-notes"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Record reproduction steps, relevant files, ideas, questions, or next actions..."
            rows={5}
            className="w-full resize-y rounded-lg border border-white/10 bg-[#101626] px-4 py-3 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-300"
          />
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Notes, status, PR URL, and checklist are saved in this browser and not sent to GitHub.
          </p>
        </div>
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-500">
        Issue Scout tracks your checklist locally. Always verify details on GitHub before submitting work.
      </p>
    </section>
  );
}
