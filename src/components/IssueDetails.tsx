"use client";

import { useEffect, useState } from "react";
import type { ScoutIssue } from "@/types/issue";
import type { AvailabilityPayload } from "@/types/contribution";
import type { RepositoryPayload } from "@/types/repository";
import { calculateReadiness } from "@/lib/readiness";
import { useContributionProgress } from "@/hooks/useContributionProgress";
import ReadinessSection from "./IssueDetails/ReadinessSection";
import RepoHealthSection from "./IssueDetails/RepoHealthSection";
import AvailabilitySection from "./IssueDetails/AvailabilitySection";
import ChecklistSection from "./IssueDetails/ChecklistSection";

type Props = {
  issue: ScoutIssue;
  isSaved: boolean;
  onToggleSaved: () => void;
  onClose: () => void;
};

function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : date.toLocaleString();
}

export default function IssueDetails({
  issue,
  isSaved,
  onToggleSaved,
  onClose,
}: Props) {
  // 1. Repository Data
  const [repositoryData, setRepositoryData] = useState<RepositoryPayload | null>(null);
  const [repositoryLoading, setRepositoryLoading] = useState(true);
  const [repositoryError, setRepositoryError] = useState("");

  // 2. Live Availability Data
  const [availabilityData, setAvailabilityData] = useState<AvailabilityPayload | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [availabilityError, setAvailabilityError] = useState("");
  const [refreshCount, setRefreshCount] = useState(0);

  // 3. Contribution Progress Hook
  const checklist = useContributionProgress(issue.url);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Fetch repository metadata
  useEffect(() => {
    const controller = new AbortController();
    async function loadRepository() {
      const [owner = "", repo = ""] = issue.repository.split("/");
      try {
        const params = new URLSearchParams({ owner, repo });
        const res = await fetch(`/api/repository?${params.toString()}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        const result = await res.json();

        if (!res.ok || !("repository" in result)) {
          throw new Error(result.error ?? "Failed to load repository details.");
        }
        setRepositoryData(result);
        setRepositoryError("");
      } catch (err) {
        if (controller.signal.aborted) return;
        setRepositoryData(null);
        setRepositoryError(err instanceof Error ? err.message : "Error loading repository.");
      } finally {
        if (!controller.signal.aborted) setRepositoryLoading(false);
      }
    }

    loadRepository();
    return () => controller.abort();
  }, [issue.repository]);

  // Fetch live issue status
  useEffect(() => {
    const controller = new AbortController();
    async function loadAvailability() {
      const [owner = "", repo = ""] = issue.repository.split("/");
      try {
        const params = new URLSearchParams({
          owner,
          repo,
          issue_number: String(issue.number),
        });
        const res = await fetch(`/api/issue-availability?${params.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        const result = await res.json();

        if (!res.ok || !("issue" in result)) {
          throw new Error(result.error ?? "Failed to check issue status.");
        }
        if (controller.signal.aborted) return;
        setAvailabilityData(result);
        setAvailabilityError("");
      } catch (err) {
        if (controller.signal.aborted) return;
        setAvailabilityData(null);
        setAvailabilityError(err instanceof Error ? err.message : "Error checking availability.");
      } finally {
        if (!controller.signal.aborted) setAvailabilityLoading(false);
      }
    }

    loadAvailability();
    return () => controller.abort();
  }, [issue.repository, issue.number, refreshCount]);

  const readiness =
    repositoryData?.contributionGuidesChecked
      ? calculateReadiness(issue, repositoryData)
      : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="issue-preview-title"
        className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-white/15 bg-[#0b101c] shadow-2xl"
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-white/10 bg-[#0b101c]/95 px-5 py-4 backdrop-blur sm:px-7">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-cyan-200">
            [ Issue details ]
          </p>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-white/15 px-3 py-2 text-sm text-slate-300 transition hover:border-cyan-300/40 hover:text-cyan-200"
          >
            Close ✕
          </button>
        </div>

        <div className="space-y-9 p-5 sm:p-7">
          {/* Main Issue Overview */}
          <section>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <a
                href={issue.repositoryUrl}
                target="_blank"
                rel="noreferrer"
                className="break-all text-sm font-semibold text-cyan-200 hover:underline"
              >
                {issue.repository}
              </a>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                  issue.state === "open"
                    ? "bg-emerald-400/10 text-emerald-300"
                    : "bg-slate-400/10 text-slate-300"
                }`}
              >
                {issue.state}
              </span>
            </div>

            <h2
              id="issue-preview-title"
              className="mt-4 text-2xl font-bold leading-tight tracking-tight sm:text-3xl"
            >
              {issue.title}
              <span className="ml-2 text-base font-medium text-slate-500">
                #{issue.number}
              </span>
            </h2>

            <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
              <span className="rounded-full bg-white/5 px-3 py-1.5 capitalize">
                {issue.level}
              </span>
              <span>{issue.comments} comments</span>
              <span>by {issue.author}</span>
              <span>Created {formatDateTime(issue.createdAt)}</span>
              <span>Updated {formatDateTime(issue.updatedAt)}</span>
            </div>

            <h3 className="mt-6 text-sm font-semibold text-slate-200">Issue description</h3>
            <p className="mt-3 whitespace-pre-wrap wrap-break-words text-sm leading-7 text-slate-300">
              {issue.body?.trim() || "No description provided by the author."}
            </p>

            {issue.labels.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {issue.labels.map((item) => (
                  <span
                    key={item.name}
                    className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300"
                  >
                    {item.name}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3 border-t border-white/10 pt-5">
              <button
                type="button"
                onClick={onToggleSaved}
                aria-pressed={isSaved}
                className="rounded-lg border border-white/15 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/40 hover:text-cyan-200"
              >
                {isSaved ? "★ Remove from saved" : "☆ Save issue"}
              </button>

              <a
                href={issue.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-cyan-300 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
              >
                Open issue on GitHub ↗
              </a>
            </div>
          </section>

          {/* Section 1: Availability Check */}
          <AvailabilitySection
            loading={availabilityLoading}
            error={availabilityError}
            data={availabilityData}
            originalTitle={issue.title}
            onRefresh={() => {
              setAvailabilityLoading(true);
              setAvailabilityError("");
              setAvailabilityData(null);
              setRefreshCount((c) => c + 1);
            }}
          />

          {/* Section 2: Readiness Score */}
          <ReadinessSection
            loading={repositoryLoading}
            error={repositoryError}
            signals={readiness?.signals ?? null}
            totalScore={readiness?.totalScore ?? null}
            scoreLabel={readiness?.label ?? ""}
          />

          {/* Section 3: Repository Signals */}
          <RepoHealthSection
            loading={repositoryLoading}
            error={repositoryError}
            data={repositoryData}
            issueRepoUrl={issue.repositoryUrl}
          />

          {/* Section 4: Contribution Companion Checklist */}
          <ChecklistSection
            checkedSteps={checklist.checkedSteps}
            completedSteps={checklist.completedSteps}
            completionPercent={checklist.completionPercent}
            status={checklist.status}
            notes={checklist.notes}
            pullRequestUrl={checklist.pullRequestUrl}
            validPullRequestUrl={checklist.validPullRequestUrl}
            onToggleStep={checklist.toggleStep}
            onResetChecklist={checklist.resetChecklist}
            onStatusChange={checklist.setStatus}
            onNotesChange={checklist.setNotes}
            onPullRequestUrlChange={checklist.setPullRequestUrl}
          />
        </div>
      </section>
    </div>
  );
}
