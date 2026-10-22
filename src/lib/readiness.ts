import type { ReadinessResult, ReadinessSignal } from "@/types/readiness";
import type { RepositoryPayload } from "@/types/repository";
import type { ScoutIssue } from "@/types/issue";

const STRUCTURED_KEYWORDS =
  /\b(steps to reproduce|expected behavior|actual behavior|acceptance criteria|definition of done|test case|how to reproduce|proposed solution)\b/i;

export function getScoreLabel(score: number): string {
  if (score >= 80) return "Strong signals";
  if (score >= 60) return "Promising signals";
  if (score >= 40) return "Mixed signals";
  return "Limited evidence";
}

export function calculateReadiness(
  issue: ScoutIssue,
  repoData: RepositoryPayload,
): ReadinessResult {
  const body = issue.body?.trim() ?? "";
  const wordCount = body ? body.split(/\s+/).length : 0;

  // 1. Issue Clarity (out of 35)
  let clarityScore = 0;
  if (body.length >= 500) clarityScore += 20;
  else if (body.length >= 200) clarityScore += 16;
  else if (body.length >= 80) clarityScore += 12;
  else if (body.length > 0) clarityScore += 6;

  const hasStructure = STRUCTURED_KEYWORDS.test(body);
  if (hasStructure) clarityScore += 10;
  if (issue.labels.some((l) => l.name.trim())) clarityScore += 5;

  const clarityEvidence = [
    body
      ? `Description contains ${wordCount} words and ${body.length} characters.`
      : "The issue has no written description.",
    hasStructure
      ? "Description mentions reproduction steps, expected behavior, tests, or acceptance criteria."
      : "No common reproduction, testing, or acceptance-criteria phrases were detected.",
    issue.labels.length > 0
      ? `The issue has ${issue.labels.length} label(s).`
      : "The issue has no labels.",
  ];

  // 2. Repository Activity (out of 35)
  const repo = repoData.repository;
  const days = repo.pushedDaysAgo;
  let activityScore = 0;

  if (repo.archived || repo.disabled) {
    activityScore = 0;
  } else if (days !== null) {
    if (days <= 7) activityScore = 35;
    else if (days <= 30) activityScore = 30;
    else if (days <= 90) activityScore = 22;
    else if (days <= 180) activityScore = 12;
    else activityScore = 5;
  }

  const activityEvidence: string[] = [];
  if (repo.archived || repo.disabled) {
    activityEvidence.push("Repository is archived or disabled.");
    if (repo.archived) {
      activityEvidence.push("Archived repositories may no longer accept contributions.");
    }
    if (repo.disabled) {
      activityEvidence.push("GitHub reports that this repository is disabled.");
    }
  } else if (days === null) {
    activityEvidence.push("A valid repository last-push date was not available.");
  } else {
    activityEvidence.push(
      days === 0
        ? "Repository was last pushed today."
        : `Repository was last pushed ${days} day(s) ago.`,
    );
  }

  // 3. Documentation (out of 30)
  const guideCount = repoData.contributionGuides.length;
  const docScore = guideCount > 0 ? 30 : 8;
  const docEvidence =
    guideCount > 0
      ? [
          `Found ${guideCount} contribution guide file(s).`,
          ...repoData.contributionGuides.map((g) => g.path),
        ]
      : [
          "No CONTRIBUTING.md file was found in the checked locations.",
          "Check the README and repository instructions manually.",
        ];

  const signals: ReadinessSignal[] = [
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
      score: docScore,
      maximum: 30,
      evidence: docEvidence,
    },
  ];

  const totalScore = signals.reduce((sum, s) => sum + s.score, 0);

  return {
    signals,
    totalScore,
    label: getScoreLabel(totalScore),
  };
}
