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
    <section className="details-section">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4>Contribution tracker</h4>
          <p className="details-muted mt-1">{completedSteps} of {CHECKLIST_STEPS.length} steps completed</p>
        </div>
        <button type="button" onClick={onResetChecklist} className="text-action">Reset checklist</button>
      </div>

      <div className="mt-3 details-progress"><span style={{ width: `${completionPercent}%` }} /></div>

      <div className="details-surface mt-3 space-y-3">
        {CHECKLIST_STEPS.map((step, index) => (
          <label key={step} className="flex cursor-pointer items-start gap-3 text-[11px] leading-relaxed text-[var(--ink)]">
            <input
              type="checkbox"
              checked={checkedSteps[index] ?? false}
              onChange={() => onToggleStep(index)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--green)]"
            />
            <span className={checkedSteps[index] ? "text-[var(--muted)] line-through" : ""}>{step}</span>
          </label>
        ))}
      </div>

      <div className="details-surface mt-3 space-y-3">
        <div>
          <label htmlFor="contribution-status" className="mb-1.5 block font-semibold text-[var(--ink)]">Your status</label>
          <select
            id="contribution-status"
            value={status}
            onChange={(e) => onStatusChange(e.target.value as ContributionStatus)}
            className="details-form-control"
          >
            <option value="not-started">Not started</option>
            <option value="investigating">Investigating</option>
            <option value="working">Working on it</option>
            <option value="pr-opened">PR opened</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div>
          <label htmlFor="pull-request-url" className="mb-1.5 block font-semibold text-[var(--ink)]">Pull request URL</label>
          <input
            id="pull-request-url"
            type="url"
            value={pullRequestUrl}
            onChange={(e) => onPullRequestUrlChange(e.target.value)}
            placeholder="https://github.com/owner/repo/pull/123"
            className="details-form-control"
          />
          {validPullRequestUrl && <a href={validPullRequestUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block">Open your PR ↗</a>}
        </div>

        <div>
          <label htmlFor="contribution-notes" className="mb-1.5 block font-semibold text-[var(--ink)]">Notes</label>
          <textarea
            id="contribution-notes"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Things to check, files to explore, questions for the maintainers…"
            rows={4}
            className="details-form-control resize-y"
          />
        </div>
      </div>
    </section>
  );
}
