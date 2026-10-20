
"use client";

import { useEffect, useState } from "react";
import type { ScoutIssue } from "@/types/issue";

type Props = {
  issue: ScoutIssue;
  isSaved: boolean;
  onToggleSaved: () => void;
  onClose: () => void;
};

type ContributionStatus =
  | "not-started"
  | "investigating"
  | "working"
  | "pr-opened"
  | "completed";

type SavedContributionProgress = {
  checkedSteps: boolean[];
  status: ContributionStatus;
  notes: string;
  pullRequestUrl: string;
};

type ContributionGuide = {
  path: string;
  url: string;
};

type RepositoryPayload = {
  repository: {
    fullName: string;
    url: string;
    description: string | null;
    stars: number;
    forks: number;
    openItems: number;
    pushedAt: string | null;
    pushedDaysAgo: number | null;
    updatedAt: string;
    archived: boolean;
    disabled: boolean;
    defaultBranch: string;
    license: string | null;
  };
  contributionGuides: ContributionGuide[];
  contributionGuidesChecked: boolean;
};


type AvailabilityPayload = {
  issue: {
    number: number;
    title: string;
    url: string;
    state: "open" | "closed";
    locked: boolean;
    activeLockReason: string | null;
    assignees: Array<{
      login: string;
      url: string;
    }>;
    stateReason: string | null;
    closedAt: string | null;
    createdAt: string;
    updatedAt: string;
    commentCount: number;
    labels: Array<{
      name: string;
      color: string;
    }>;
  };
  recentComments: Array<{
    id: number;
    url: string;
    author: string;
    body: string | null;
    createdAt: string;
  }>;
  recentCommentsAvailable: boolean;
};


type ReadinessSignal = {
  name: string;
  score: number;
  maximum: number;
  evidence: string[];
};

const CHECKLIST_STORAGE_PREFIX =
  "issue-scout:contribution-progress:v1:";

const CHECKLIST_STEPS = [
  "Read the issue description and recent discussion.",
  "Check whether someone is already working on the issue.",
  "Read the contribution guide and code of conduct, if available.",
  "Reproduce the bug or understand the requested behavior.",
  "Find the relevant files and plan a focused change.",
  "Create a branch, implement the change, and run relevant tests.",
  "Review your diff and commit with a clear message.",
  "Open a pull request and link the original issue.",
];

function isContributionStatus(
  value: unknown,
): value is ContributionStatus {
  return (
    value === "not-started" ||
    value === "investigating" ||
    value === "working" ||
    value === "pr-opened" ||
    value === "completed"
  );
}

function formatDate(value: string | null): string {
  if (!value) return "Not available";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Not available"
    : date.toLocaleDateString();
}

function formatDateTime(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Not available"
    : date.toLocaleString();
}

function getReadinessSignals(
  issue: ScoutIssue,
  data: RepositoryPayload,
): ReadinessSignal[] {
  const body = issue.body?.trim() ?? "";
  const wordCount = body ? body.split(/\s+/).length : 0;

  // Issue clarity: maximum 35 points.
  let clarityScore = 0;

  if (body.length >= 500) clarityScore += 20;
  else if (body.length >= 200) clarityScore += 16;
  else if (body.length >= 80) clarityScore += 12;
  else if (body.length > 0) clarityScore += 6;

  const hasStructuredContext =
    /\b(steps to reproduce|expected behavior|actual behavior|acceptance criteria|definition of done|test case|how to reproduce|proposed solution)\b/i.test(
      body,
    );

  if (hasStructuredContext) clarityScore += 10;

  if (issue.labels.some((item) => item.name.trim())) {
    clarityScore += 5;
  }

  const clarityEvidence = [
    body
      ? `Description contains ${wordCount} words and ${body.length} characters.`
      : "The issue has no written description.",
    hasStructuredContext
      ? "Description mentions reproduction steps, expected behavior, tests, or acceptance criteria."
      : "No common reproduction, testing, or acceptance-criteria phrases were detected.",
    issue.labels.length > 0
      ? `The issue has ${issue.labels.length} label(s).`
      : "The issue has no labels.",
  ];

  // Repository activity: maximum 35 points.
  const repository = data.repository;
  const days = repository.pushedDaysAgo;
  let activityScore = 0;

  if (repository.archived || repository.disabled) {
    activityScore = 0;
  } else if (days !== null) {
    if (days <= 7) activityScore = 35;
    else if (days <= 30) activityScore = 30;
    else if (days <= 90) activityScore = 22;
    else if (days <= 180) activityScore = 12;
    else activityScore = 5;
  }

  const activityEvidence =
    repository.archived || repository.disabled
      ? ["Repository is archived or disabled."]
      : days === null
        ? ["A valid repository last-push date was not available."]
        : [
            days === 0
              ? "Repository was last pushed today."
              : `Repository was last pushed ${days} day(s) ago.`,
          ];

  if (repository.archived) {
    activityEvidence.push(
      "Archived repositories may no longer accept contributions.",
    );
  }

  if (repository.disabled) {
    activityEvidence.push(
      "GitHub reports that this repository is disabled.",
    );
  }

  // Documentation: maximum 30 points.
  // A missing guide receives partial credit because instructions
  // may be present in the README or elsewhere.
  const guideScore =
    data.contributionGuides.length > 0 ? 30 : 8;

  const guideEvidence =
    data.contributionGuides.length > 0
      ? [
          `Found ${data.contributionGuides.length} contribution guide file(s).`,
          ...data.contributionGuides.map((guide) => guide.path),
        ]
      : [
          "No CONTRIBUTING.md file was found in the checked locations.",
          "Check the README and repository instructions manually.",
        ];

  return [
    {
      name: "Issue clarity",
      score: clarityScore,
      maximum: 35,
      evidence: clarityEvidence,
    },
    {
      name: "Repository activity",
      score: activityScore,
      maximum: 35,
      evidence: activityEvidence,
    },
    {
      name: "Contribution documentation",
      score: guideScore,
      maximum: 30,
      evidence: guideEvidence,
    },
  ];
}

function scoreLabel(score: number): string {
  if (score >= 80) return "Strong signals";
  if (score >= 60) return "Promising signals";
  if (score >= 40) return "Mixed signals";
  return "Limited evidence";
}

function getValidPullRequestUrl(value: string): string | null {
  try {
    const url = new URL(value.trim());

    if (
      url.protocol === "https:" &&
      url.hostname === "github.com" &&
      url.port === "" &&
      /^\/[^/]+\/[^/]+\/pull\/\d+\/?$/.test(url.pathname)
    ) {
      return url.href;
    }
  } catch {
    // The field may be empty or incomplete while the user types.
  }

  return null;
}

export default function IssueDetails({
  issue,
  isSaved,
  onToggleSaved,
  onClose,
}: Props) {
  const [repositoryData, setRepositoryData] =
    useState<RepositoryPayload | null>(null);

  const [repositoryLoading, setRepositoryLoading] =
    useState(true);

  const [repositoryError, setRepositoryError] = useState("");

    const [availabilityData, setAvailabilityData] =
    useState<AvailabilityPayload | null>(null);

    const [availabilityLoading, setAvailabilityLoading] =
    useState(true);

    const [availabilityError, setAvailabilityError] = useState("");

    const [availabilityRefreshVersion, setAvailabilityRefreshVersion] =
    useState(0);

  const checklistStorageKey =
    CHECKLIST_STORAGE_PREFIX + encodeURIComponent(issue.url);

  const [checkedSteps, setCheckedSteps] = useState<boolean[]>(
    () => Array(CHECKLIST_STEPS.length).fill(false),
  );

  const [contributionStatus, setContributionStatus] =
    useState<ContributionStatus>("not-started");

  const [contributionNotes, setContributionNotes] = useState("");

  const [pullRequestUrl, setPullRequestUrl] = useState("");

  const [progressReady, setProgressReady] = useState(false);

  // Restore saved contribution progress after browser mounting.
  // Supports the previous checklist-only localStorage format too.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(
        checklistStorageKey,
      );

      if (stored) {
        const parsed: unknown = JSON.parse(stored);

        if (Array.isArray(parsed)) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- Restore saved checklist progress after mounting.
          setCheckedSteps(
            CHECKLIST_STEPS.map(
              (_, index) => parsed[index] === true,
            ),
          );
        } else if (
          typeof parsed === "object" &&
          parsed !== null
        ) {
          const progress =
            parsed as Partial<SavedContributionProgress>;

          if (
            Array.isArray(progress.checkedSteps) &&
            progress.checkedSteps.length ===
              CHECKLIST_STEPS.length
          ) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- Restore saved checklist progress after mounting.
            setCheckedSteps(
              CHECKLIST_STEPS.map(
                (_, index) =>
                  progress.checkedSteps?.[index] === true,
              ),
            );
          }

          if (isContributionStatus(progress.status)) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- Restore saved status after mounting.
            setContributionStatus(progress.status);
          }

          if (typeof progress.notes === "string") {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- Restore saved notes after mounting.
            setContributionNotes(progress.notes);
          }

          if (typeof progress.pullRequestUrl === "string") {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- Restore saved PR URL after mounting.
            setPullRequestUrl(progress.pullRequestUrl);
          }
        }
      }
    } catch {
      // Ignore invalid or unavailable browser storage.
    } finally {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Enable persistence after the initial browser-storage read.
      setProgressReady(true);
    }
  }, [checklistStorageKey]);

  // Save progress only after the initial storage read completes.
  useEffect(() => {
    if (!progressReady) return;

    const progress: SavedContributionProgress = {
      checkedSteps,
      status: contributionStatus,
      notes: contributionNotes,
      pullRequestUrl,
    };

    try {
      window.localStorage.setItem(
        checklistStorageKey,
        JSON.stringify(progress),
      );
    } catch {
      // Progress remains available during this session.
    }
  }, [
    checkedSteps,
    contributionStatus,
    contributionNotes,
    pullRequestUrl,
    checklistStorageKey,
    progressReady,
  ]);

  // Close the dialog using Escape.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // Load public repository information and contribution guides.
  useEffect(() => {
    const controller = new AbortController();

    async function loadRepository() {
      const [owner, repo] = issue.repository.split("/");

      try {
        const params = new URLSearchParams({
          owner: owner ?? "",
          repo: repo ?? "",
        });

        const response = await fetch(
          `/api/repository?${params.toString()}`,
          {
            signal: controller.signal,
            headers: {
              Accept: "application/json",
            },
          },
        );

        const result = (await response.json()) as
          | RepositoryPayload
          | { error?: string };

        if (
          !response.ok ||
          !("repository" in result) ||
          !Array.isArray(result.contributionGuides)
        ) {
          throw new Error(
            "error" in result && result.error
              ? result.error
              : "Repository information could not be loaded.",
          );
        }

        setRepositoryData(result);
        setRepositoryError("");
      } catch (reason) {
        if (controller.signal.aborted) return;

        setRepositoryData(null);
        setRepositoryError(
          reason instanceof Error
            ? reason.message
            : "Unable to load repository information.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setRepositoryLoading(false);
        }
      }
    }

    void loadRepository();

    return () => controller.abort();
  }, [issue.repository]);


    useEffect(() => {
    const controller = new AbortController();

    async function loadAvailability() {
        const [owner = "", repo = ""] = issue.repository.split("/");

        const params = new URLSearchParams({
        owner,
        repo,
        issue_number: String(issue.number),
        });

        try {
        const response = await fetch(
            `/api/issue-availability?${params.toString()}`,
            {
            signal: controller.signal,
            cache: "no-store",
            headers: {
                Accept: "application/json",
            },
            },
        );

        const result = (await response.json()) as
            | AvailabilityPayload
            | { error?: string };

        if (
            !response.ok ||
            !("issue" in result) ||
            !Array.isArray(result.recentComments)
        ) {
            throw new Error(
            "error" in result && result.error
                ? result.error
                : "Current issue status could not be loaded.",
            );
        }

        if (controller.signal.aborted) return;

        setAvailabilityData(result);
        setAvailabilityError("");
        } catch (reason) {
        if (controller.signal.aborted) return;

        setAvailabilityData(null);
        setAvailabilityError(
            reason instanceof Error
            ? reason.message
            : "Unable to refresh the issue status.",
        );
        } finally {
        if (!controller.signal.aborted) {
            setAvailabilityLoading(false);
        }
        }
    }

    void loadAvailability();

    return () => controller.abort();
    }, [
    issue.repository,
    issue.number,
    availabilityRefreshVersion,
    ]);


  const completedSteps = checkedSteps.filter(Boolean).length;

  const completionPercent = Math.round(
    (completedSteps / CHECKLIST_STEPS.length) * 100,
  );

  const readinessSignals =
    repositoryData?.contributionGuidesChecked
      ? getReadinessSignals(issue, repositoryData)
      : null;

  const readinessScore = readinessSignals
    ? readinessSignals.reduce(
        (sum, signal) => sum + signal.score,
        0,
      )
    : null;

  const validPullRequestUrl =
    getValidPullRequestUrl(pullRequestUrl);

   
  function refreshAvailability() {
    setAvailabilityLoading(true);
    setAvailabilityError("");
    setAvailabilityData(null);
    setAvailabilityRefreshVersion((current) => current + 1);
    }
    

  function toggleStep(index: number) {
    setCheckedSteps((current) =>
      current.map((checked, stepIndex) =>
        stepIndex === index ? !checked : checked,
      ),
    );
  }

  function resetChecklist() {
    setCheckedSteps(Array(CHECKLIST_STEPS.length).fill(false));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="issue-preview-title"
        className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-white/15 bg-[#0b101c] shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-white/10 bg-[#0b101c]/95 px-5 py-4 backdrop-blur sm:px-7">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-cyan-200">
            [ Issue intelligence ]
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
          {/* Issue overview */}
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
              <span>
                Created {formatDateTime(issue.createdAt)}
              </span>
              <span>
                Updated {formatDateTime(issue.updatedAt)}
              </span>
            </div>

            <h3 className="mt-6 text-sm font-semibold text-slate-200">
              Issue description
            </h3>

            <p className="mt-3 whitespace-pre-wrap wrap-break-words text-sm leading-7 text-slate-300">
              {issue.body?.trim() ||
                "No description provided by the issue author."}
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
                {isSaved
                  ? "★ Remove from saved"
                  : "☆ Save issue"}
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

          
            {/* Phase 4: live issue availability */}
            <section
            className="border-t border-white/10 pt-7"
            aria-live="polite"
            >
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-cyan-200">
                    [ 04 / Issue availability ]
                </p>

                <h3 className="mt-2 text-xl font-bold">
                    Check before you contribute
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                    Refresh the issue directly from GitHub before starting work.
                </p>
                </div>

                <button
                type="button"
                onClick={refreshAvailability}
                disabled={availabilityLoading}
                className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-slate-300 transition hover:border-cyan-300/40 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                {availabilityLoading
                    ? "Checking GitHub..."
                    : "Refresh from GitHub ↻"}
                </button>
            </div>

            {availabilityLoading && (
                <div
                role="status"
                className="mt-5 rounded-lg border border-white/10 bg-white/2 p-5 text-sm text-slate-400"
                >
                Fetching the latest issue status from GitHub...
                </div>
            )}

            {availabilityError && (
                <div
                role="alert"
                className="mt-5 rounded-lg border border-red-400/20 bg-red-400/5 p-5"
                >
                <p className="font-semibold text-red-200">
                    Could not refresh issue status
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                    {availabilityError}
                </p>
                <p className="mt-2 text-sm text-slate-400">
                    Open the original GitHub issue to verify its current state.
                </p>
                </div>
            )}

            {availabilityData && !availabilityLoading && (
                <div className="mt-5 space-y-4">
                <div className="rounded-lg border border-white/10 bg-white/2 p-5">
                    <div className="flex flex-wrap items-center gap-2">
                    <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        availabilityData.issue.state === "open"
                            ? "bg-emerald-400/10 text-emerald-300"
                            : "bg-amber-400/10 text-amber-200"
                        }`}
                    >
                        {availabilityData.issue.state.toUpperCase()}
                    </span>

                    {availabilityData.issue.locked && (
                        <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-200">
                        LOCKED
                        </span>
                    )}
                    </div>

                    {availabilityData.issue.title !== issue.title && (
                    <p className="mt-4 text-sm leading-6 text-amber-100">
                        The issue title has changed since these search results were
                        loaded. Current GitHub title:{" "}
                        <span className="font-semibold">
                        {availabilityData.issue.title}
                        </span>
                    </p>
                    )}

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-white/10 p-4">
                        <p className="text-xs text-slate-500">
                        Last updated on GitHub
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                        {formatDateTime(availabilityData.issue.updatedAt)}
                        </p>
                    </div>

                    <div className="rounded-lg border border-white/10 p-4">
                        <p className="text-xs text-slate-500">
                        Public comment count
                        </p>
                        <p className="mt-1 text-sm font-semibold tabular-nums">
                        {availabilityData.issue.commentCount}
                        </p>
                    </div>
                    </div>

                    {availabilityData.issue.state === "closed" && (
                    <div
                        role="alert"
                        className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/5 p-4"
                    >
                        <p className="font-semibold text-amber-100">
                        This issue is closed.
                        </p>

                        {availabilityData.issue.stateReason && (
                        <p className="mt-2 text-sm text-slate-300">
                            GitHub close reason:{" "}
                            {availabilityData.issue.stateReason.replace(/_/g, " ")}
                        </p>
                        )}

                        {availabilityData.issue.closedAt && (
                        <p className="mt-2 text-sm text-slate-400">
                            Closed on{" "}
                            {formatDateTime(availabilityData.issue.closedAt)}.
                        </p>
                        )}

                        <p className="mt-2 text-sm leading-6 text-slate-400">
                        Review the discussion and linked pull requests before
                        investing time in a solution.
                        </p>
                    </div>
                    )}

                    {availabilityData.issue.locked && (
                    <div
                        role="status"
                        className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/5 p-4"
                    >
                        <p className="font-semibold text-amber-100">
                        This discussion is locked.
                        </p>

                        {availabilityData.issue.activeLockReason && (
                        <p className="mt-2 text-sm text-slate-300">
                            Lock reason:{" "}
                            {availabilityData.issue.activeLockReason}
                        </p>
                        )}

                        <p className="mt-2 text-sm leading-6 text-slate-400">
                        You may be unable to comment on this issue.
                        </p>
                    </div>
                    )}

                    <div className="mt-5">
                    <h4 className="font-semibold text-slate-100">
                        Assigned contributors
                    </h4>

                    {availabilityData.issue.assignees.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                        {availabilityData.issue.assignees.map((assignee) => (
                            <a
                            key={assignee.login}
                            href={assignee.url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-cyan-200 hover:border-cyan-300/40 hover:underline"
                            >
                            @{assignee.login} ↗
                            </a>
                        ))}
                        </div>
                    ) : (
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                        No assignee is listed on GitHub. This does not establish
                        that the issue is unclaimed.
                        </p>
                    )}

                    <p className="mt-3 text-xs leading-5 text-slate-500">
                        Assignment information alone cannot confirm whether someone
                        is actively working on this issue.
                    </p>
                    </div>

                    {availabilityData.issue.labels.length > 0 && (
                    <div className="mt-5">
                        <h4 className="font-semibold text-slate-100">
                        Current GitHub labels
                        </h4>

                        <div className="mt-3 flex flex-wrap gap-2">
                        {availabilityData.issue.labels.map((label) => (
                            <span
                            key={label.name}
                            className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300"
                            >
                            {label.name}
                            </span>
                        ))}
                        </div>
                    </div>
                    )}

                    <a
                    href={availabilityData.issue.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-block text-sm font-semibold text-cyan-200 hover:underline"
                    >
                    Verify current issue on GitHub ↗
                    </a>
                </div>

                <div className="rounded-lg border border-white/10 bg-white/2 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="font-semibold text-slate-100">
                        Recent discussion
                    </h4>

                    <span className="text-xs text-slate-500">
                        Latest 3 comments
                    </span>
                    </div>

                    {!availabilityData.recentCommentsAvailable ? (
                    <p className="mt-3 text-sm leading-6 text-slate-400">
                        The current issue status loaded, but recent comments could
                        not be retrieved. Check the original issue on GitHub.
                    </p>
                    ) : availabilityData.recentComments.length === 0 ? (
                    <p className="mt-3 text-sm leading-6 text-slate-400">
                        No public comments were returned for this issue.
                    </p>
                    ) : (
                    <div className="mt-4 space-y-3">
                        {availabilityData.recentComments.map((comment) => {
                        const body = comment.body?.trim() ?? "";

                        return (
                            <article
                            key={comment.id}
                            className="rounded-lg border border-white/10 p-4"
                            >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <a
                                href={comment.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm font-semibold text-cyan-200 hover:underline"
                                >
                                @{comment.author} ↗
                                </a>

                                <span className="text-xs text-slate-500">
                                {formatDateTime(comment.createdAt)}
                                </span>
                            </div>

                            <p className="mt-3 whitespace-pre-wrap wrap-break-words text-sm leading-6 text-slate-300">
                                {body
                                ? `${body.slice(0, 280)}${
                                    body.length > 280 ? "…" : ""
                                    }`
                                : "This comment has no text content."}
                            </p>
                            </article>
                        );
                        })}
                    </div>
                    )}
                </div>
                </div>
            )}
            </section>


          {/* Phase 2: readiness evidence */}
          <section className="border-t border-white/10 pt-7">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-cyan-200">
              [ 01 / Readiness evidence ]
            </p>

            <h3 className="mt-2 text-xl font-bold">
              Is this a promising contribution?
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              This score summarizes observable signals. It is not a
              probability of success, proof that the issue is unclaimed,
              or a guarantee that the task is easy.
            </p>

            {repositoryLoading ? (
              <div className="mt-5 rounded-lg border border-white/10 bg-white/2 p-5 text-sm text-slate-400">
                Checking repository activity and contribution guides…
              </div>
            ) : readinessSignals && readinessScore !== null ? (
              <div className="mt-5">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-xs text-slate-500">
                      Evidence score
                    </p>
                    <p className="mt-1 text-3xl font-bold tabular-nums">
                      {readinessScore}
                      <span className="ml-1 text-base font-medium text-slate-500">
                        / 100
                      </span>
                    </p>
                  </div>

                  <span className="rounded-md border border-cyan-300/20 bg-cyan-300/5 px-3 py-2 text-xs font-semibold text-cyan-200">
                    {scoreLabel(readinessScore)}
                  </span>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-cyan-300 transition-all"
                    style={{ width: `${readinessScore}%` }}
                  />
                </div>

                <div className="mt-5 grid gap-3">
                  {readinessSignals.map((signal) => (
                    <article
                      key={signal.name}
                      className="rounded-lg border border-white/10 bg-white/2 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="font-semibold text-slate-100">
                          {signal.name}
                        </h4>
                        <span className="font-mono text-xs text-cyan-200">
                          {signal.score}/{signal.maximum}
                        </span>
                      </div>

                      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-400">
                        {signal.evidence.map((item) => (
                          <li key={item} className="flex gap-2">
                            <span
                              className="text-cyan-300"
                              aria-hidden="true"
                            >
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
                <p className="font-semibold text-amber-100">
                  Readiness score unavailable
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {repositoryError ||
                    "The contribution-guide checks could not be completed."}{" "}
                  Try again later and review the repository manually.
                </p>
              </div>
            )}
          </section>

          {/* Phase 2: repository health */}
          <section className="border-t border-white/10 pt-7">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-cyan-200">
              [ 02 / Repository health ]
            </p>

            <h3 className="mt-2 text-xl font-bold">
              Repository signals
            </h3>

            {repositoryLoading ? (
              <p className="mt-4 text-sm text-slate-400">
                Loading public repository details…
              </p>
            ) : repositoryData ? (
              <>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {repositoryData.repository.description ||
                    "No repository description is available."}
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-white/10 p-4">
                    <p className="text-xs text-slate-500">Stars</p>
                    <p className="mt-1 text-lg font-bold tabular-nums">
                      {repositoryData.repository.stars.toLocaleString()}
                    </p>
                  </div>

                  <div className="rounded-lg border border-white/10 p-4">
                    <p className="text-xs text-slate-500">Forks</p>
                    <p className="mt-1 text-lg font-bold tabular-nums">
                      {repositoryData.repository.forks.toLocaleString()}
                    </p>
                  </div>

                  <div className="rounded-lg border border-white/10 p-4">
                    <p className="text-xs text-slate-500">Open items</p>
                    <p className="mt-1 text-lg font-bold tabular-nums">
                      {repositoryData.repository.openItems.toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      GitHub&apos;s count may include pull requests.
                    </p>
                  </div>

                  <div className="rounded-lg border border-white/10 p-4">
                    <p className="text-xs text-slate-500">Last push</p>
                    <p className="mt-1 text-sm font-semibold">
                      {formatDate(repositoryData.repository.pushedAt)}
                    </p>
                  </div>

                  <div className="rounded-lg border border-white/10 p-4">
                    <p className="text-xs text-slate-500">License</p>
                    <p className="mt-1 text-sm font-semibold">
                      {repositoryData.repository.license ||
                        "Not detected"}
                    </p>
                  </div>

                  <div className="rounded-lg border border-white/10 p-4">
                    <p className="text-xs text-slate-500">
                      Default branch
                    </p>
                    <p className="mt-1 break-all text-sm font-semibold">
                      {repositoryData.repository.defaultBranch}
                    </p>
                  </div>
                </div>

                {(repositoryData.repository.archived ||
                  repositoryData.repository.disabled) && (
                  <p className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/4 p-4 text-sm text-amber-100">
                    {repositoryData.repository.archived
                      ? "This repository is archived."
                      : "GitHub reports that this repository is disabled."}{" "}
                    Verify that it still accepts contributions before
                    starting.
                  </p>
                )}

                <div className="mt-5">
                  <h4 className="font-semibold">
                    Contribution instructions
                  </h4>

                  {repositoryData.contributionGuides.length > 0 ? (
                    <ul className="mt-3 space-y-2">
                      {repositoryData.contributionGuides.map((guide) => (
                        <li key={guide.path}>
                          <a
                            href={guide.url}
                            target="_blank"
                            rel="noreferrer"
                            className="break-all text-sm font-semibold text-cyan-200 hover:underline"
                          >
                            {guide.path} ↗
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      No CONTRIBUTING.md file was found in the common
                      locations checked. Review the repository README,
                      code of conduct, and pinned project instructions.
                    </p>
                  )}

                  <a
                    href={`${repositoryData.repository.url}/blob/${encodeURIComponent(repositoryData.repository.defaultBranch)}/README.md`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block text-sm font-semibold text-cyan-200 hover:underline"
                  >
                    Check repository README ↗
                  </a>
                </div>
              </>
            ) : (
              <p className="mt-4 text-sm text-slate-400">
                {repositoryError ||
                  "Repository health information is currently unavailable."}
              </p>
            )}

            <a
              href={issue.repositoryUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-block text-sm font-semibold text-cyan-200 hover:underline"
            >
              Open repository on GitHub ↗
            </a>
          </section>

          {/* Phase 3: contribution companion */}
          <section className="border-t border-white/10 pt-7">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-cyan-200">
              [ 03 / Contribution companion ]
            </p>

            <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold">
                  Your contribution checklist
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Track your progress from issue discovery to pull
                  request. Progress is saved separately for this issue
                  in your browser.
                </p>
              </div>

              <button
                type="button"
                onClick={resetChecklist}
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
                <span className="font-mono text-cyan-200">
                  {completionPercent}%
                </span>
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
                    checked={checkedSteps[index]}
                    onChange={() => toggleStep(index)}
                    className="mt-1 size-4 shrink-0 accent-cyan-300"
                  />

                  <span
                    className={`text-sm leading-6 ${
                      checkedSteps[index]
                        ? "text-slate-500 line-through"
                        : "text-slate-200"
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
                  value={contributionStatus}
                  onChange={(event) =>
                    setContributionStatus(
                      event.target.value as ContributionStatus,
                    )
                  }
                  className="w-full rounded-lg border border-white/10 bg-[#101626] px-3 py-3 text-sm text-slate-100 outline-none focus:border-cyan-300"
                >
                  <option value="not-started">Not started</option>
                  <option value="investigating">
                    Investigating the issue
                  </option>
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
                  onChange={(event) =>
                    setPullRequestUrl(event.target.value)
                  }
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
                  value={contributionNotes}
                  onChange={(event) =>
                    setContributionNotes(event.target.value)
                  }
                  placeholder="Record reproduction steps, relevant files, ideas, questions, or next actions..."
                  rows={5}
                  className="w-full resize-y rounded-lg border border-white/10 bg-[#101626] px-4 py-3 text-sm leading-6 text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-300"
                />

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Notes, status, the pull-request URL, and checklist
                  progress are stored in this browser. They are not
                  sent to GitHub.
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs leading-5 text-slate-500">
              Issue Scout tracks your checklist locally. It cannot
              verify whether the issue is claimed, whether tests pass,
              or whether a pull request is merged or accepted. Always
              verify those details on GitHub.
            </p>
          </section>
        </div>
      </section>
    </div>
  );
}
