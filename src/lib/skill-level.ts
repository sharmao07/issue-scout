import type { SkillLevel } from "@/types/issue";

export function inferSkillLevel(
  labels: string[],
): SkillLevel {
  const normalized = labels.join(" ").toLowerCase();

  if (
    /good first issue|first[- ]timers[- ]only|beginner|easy/.test(
      normalized,
    )
  ) {
    return "beginner";
  }

  if (
    /advanced|hard|complex/.test(normalized)
  ) {
    return "advanced";
  }

  return "intermediate";
}