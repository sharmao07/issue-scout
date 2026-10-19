import type { SkillLevel } from "@/types/issue";

export const SKILL_LEVEL_LABELS = {
  beginner: [
    "good first issue",
    "good first issues",
    "first timer only",
    "first timers only",
    "beginner",
    "beginner friendly",
    "easy",
    "up for grabs",
    "newcomer friendly",
    "starter issue",
  ],
  intermediate: [
    "intermediate",
    "medium",
    "moderate",
    "mid level",
  ],
  advanced: [
    "advanced",
    "hard",
    "difficult",
    "complex",
    "expert",
  ],
} as const;

function normalizeLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function inferSkillLevel(labels: string[]): SkillLevel {
  const normalized = new Set(labels.map(normalizeLabel));

  if (
    SKILL_LEVEL_LABELS.beginner.some((label) =>
      normalized.has(normalizeLabel(label)),
    )
  ) {
    return "beginner";
  }

  if (
    SKILL_LEVEL_LABELS.intermediate.some((label) =>
      normalized.has(normalizeLabel(label)),
    )
  ) {
    return "intermediate";
  }

  if (
    SKILL_LEVEL_LABELS.advanced.some((label) =>
      normalized.has(normalizeLabel(label)),
    )
  ) {
    return "advanced";
  }

  return "unspecified";
}