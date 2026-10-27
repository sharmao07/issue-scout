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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="issue-preview-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-gray-400 bg-white p-4 text-xs text-gray-900"
      >
        {/* Header bar */}
        <div className="flex items-start justify-between border-b border-gray-300 pb-2">
          <div>
            <h2 id="issue-preview-title" className="text-base font-bold">
              {issue.title} (#{issue.number})
            </h2>
            <p className="text-gray-600">
              Repository:{" "}
              <a
                href={issue.repositoryUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline"
              >
                {issue.repository}
              </a>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="border border-gray-400 bg-gray-100 px-2 py-0.5 text-xs text-gray-800 hover:bg-gray-200"
            aria-label="Close dialog"
          >
            Close [X]
          </button>
        </div>

        {/* Metadata & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 py-2">
          <div className="flex flex-wrap items-center gap-2 text-gray-600">
            <span>Status: <b>{issue.state}</b></span>
            <span>·</span>
            <span>Level: <b>{issue.level}</b></span>
            <span>·</span>
            <span>By {issue.author}</span>
            <span>·</span>
            <span>{formatDateTime(issue.createdAt)}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleSaved}
              className="border border-gray-400 bg-gray-100 px-2 py-0.5 text-xs text-gray-800 hover:bg-gray-200"
            >
              {isSaved ? "Saved" : "Save"}
            </button>
            <a
              href={issue.url}
              target="_blank"
              rel="noreferrer"
              className="border border-gray-400 bg-gray-100 px-2 py-0.5 text-xs text-gray-800 hover:bg-gray-200"
            >
              Open on GitHub
            </a>
          </div>
        </div>

        {/* Issue Description */}
        <div className="py-3">
          <h3 className="font-bold text-gray-800">Description:</h3>
          <p className="mt-1 whitespace-pre-wrap text-gray-700">
            {issue.body?.trim() || "No description provided."}
          </p>

          {issue.labels.length > 0 && (
            <div className="mt-2 text-gray-600">
              <b>Labels:</b> {issue.labels.map((l) => l.name).join(", ")}
            </div>
          )}
        </div>

        {/* Detailed Sections */}
        <div className="space-y-4">
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

          <ReadinessSection
            loading={repositoryLoading}
            error={repositoryError}
            signals={readiness?.signals ?? null}
            totalScore={readiness?.totalScore ?? null}
            scoreLabel={readiness?.label ?? ""}
          />

          <RepoHealthSection
            loading={repositoryLoading}
            error={repositoryError}
            data={repositoryData}
            issueRepoUrl={issue.repositoryUrl}
          />

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
