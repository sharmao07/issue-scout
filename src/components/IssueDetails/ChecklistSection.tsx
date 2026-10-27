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
    <section className="border-t border-gray-300 pt-3 text-xs">
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-bold text-gray-800">
          Contribution Checklist ({completedSteps}/{CHECKLIST_STEPS.length} - {completionPercent}%)
        </h4>

        <button
          type="button"
          onClick={onResetChecklist}
          className="text-blue-600 underline"
        >
          Reset
        </button>
      </div>

      {/* Checklist items */}
      <div className="mt-2 space-y-1">
        {CHECKLIST_STEPS.map((step, index) => (
          <label
            key={step}
            className="flex items-start gap-2 cursor-pointer text-gray-800"
          >
            <input
              type="checkbox"
              checked={checkedSteps[index] ?? false}
              onChange={() => onToggleStep(index)}
              className="mt-0.5"
            />
            <span className={checkedSteps[index] ? "line-through text-gray-400" : ""}>
              {step}
            </span>
          </label>
        ))}
      </div>

      {/* Status, PR URL, and Notes Form */}
      <div className="mt-3 space-y-2 border border-gray-300 p-2">
        <div className="flex items-center gap-2">
          <label htmlFor="contribution-status" className="font-medium text-gray-700">
            Status:
          </label>
          <select
            id="contribution-status"
            value={status}
            onChange={(e) => onStatusChange(e.target.value as ContributionStatus)}
            className="border border-gray-400 bg-white px-2 py-0.5 text-xs text-gray-800"
          >
            <option value="not-started">Not started</option>
            <option value="investigating">Investigating</option>
            <option value="working">Working on it</option>
            <option value="pr-opened">PR opened</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div>
          <label htmlFor="pull-request-url" className="block font-medium text-gray-700 mb-0.5">
            PR URL:
          </label>
          <input
            id="pull-request-url"
            type="url"
            value={pullRequestUrl}
            onChange={(e) => onPullRequestUrlChange(e.target.value)}
            placeholder="https://github.com/owner/repo/pull/123"
            className="w-full border border-gray-400 bg-white px-2 py-1 text-xs text-gray-800"
          />
          {validPullRequestUrl && (
            <a
              href={validPullRequestUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-0.5 inline-block text-blue-600 underline"
            >
              Open PR
            </a>
          )}
        </div>

        <div>
          <label htmlFor="contribution-notes" className="block font-medium text-gray-700 mb-0.5">
            Notes:
          </label>
          <textarea
            id="contribution-notes"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Write notes here..."
            rows={3}
            className="w-full border border-gray-400 bg-white px-2 py-1 text-xs text-gray-800"
          />
        </div>
      </div>
    </section>
  );
}
