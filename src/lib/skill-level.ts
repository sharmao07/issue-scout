
import type { SkillLevel } from "@/types/issue";

function normalizeLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function inferSkillLevel(
  labels: string[],
): SkillLevel {
  const normalized = labels.map(normalizeLabel).join(" ");

  // Good-first-issue labels take priority over other difficulty labels.
  if (
    /\bgood first issues?\b/.test(normalized) ||
    /\bfirst timers? only\b/.test(normalized) ||
    /\bbeginner(?: friendly)?\b/.test(normalized) ||
    /\beasy\b/.test(normalized) ||
    /\bup for grabs\b/.test(normalized) ||
    /\bnewcomer friendly\b/.test(normalized) ||
    /\bstarter issue\b/.test(normalized)
  ) {
    return "beginner";
  }

  if (
    /\b(intermediate|medium|moderate|mid level)\b/.test(normalized)
  ) {
    return "intermediate";
  }

  if (
    /\b(advanced|hard|difficult|complex|expert)\b/.test(normalized)
  ) {
    return "advanced";
  }

  return "unspecified";
}
