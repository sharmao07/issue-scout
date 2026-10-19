
import type { SkillLevel } from "@/types/issue";

type RatedLevel = Exclude<SkillLevel, "unspecified">;

type Signal = {
  pattern: RegExp;
  points: number;
};

const EXPLICIT_LABELS: Record<RatedLevel, RegExp> = {
  beginner:
    /\b(good first issue|first timers only|beginner(?: friendly)?|easy|low hanging fruit|up for grabs|newcomer friendly|starter issue)\b/i,
  intermediate:
    /\b(intermediate|medium difficulty|moderate difficulty)\b/i,
  advanced:
    /\b(advanced|hard|difficult|complex|expert)\b/i,
};

const BEGINNER_TITLE_SIGNALS: Signal[] = [
  {
    pattern:
      /\b(typo|spelling|misspelling|punctuation|broken link|incorrect link|wording|text correction)\b/i,
    points: 5,
  },
  {
    pattern:
      /\b(readme|documentation|docs|examples|translation|localization)\b/i,
    points: 3,
  },
  {
    pattern:
      /\b(simple|small|quick|minor)\s+(change|fix|update|improvement|cleanup)\b/i,
    points: 3,
  },
];

const BEGINNER_BODY_SIGNALS: Signal[] = [
  {
    pattern:
      /\b(good first issue|beginner friendly|new contributors welcome|first contribution|typo|misspelling|broken link)\b/i,
    points: 4,
  },
  {
    pattern:
      /\b(update|correct|fix)\s+(the\s+)?(readme|documentation|docs|example|wording)\b/i,
    points: 2,
  },
];

const INTERMEDIATE_TITLE_SIGNALS: Signal[] = [
  {
    pattern:
      /\b(implement|feature request|integration|endpoint|validation|parser|parsing|unit test|test coverage|support for)\b/i,
    points: 3,
  },
  {
    pattern:
      /\b(fix|bug|error|crash|failure|incorrect|handle|handling)\b/i,
    points: 2,
  },
  {
    pattern:
      /\b(add|update|improve|support|validate|parse|test)\b/i,
    points: 1,
  },
  {
    pattern:
      /\b(api|request|response|configuration|input|output)\b/i,
    points: 1,
  },
];

const INTERMEDIATE_BODY_SIGNALS: Signal[] = [
  {
    pattern:
      /\b(steps to reproduce|expected behavior|actual behavior|acceptance criteria|test case|edge case|error handling|input validation)\b/i,
    points: 2,
  },
  {
    pattern:
      /\b(unit tests?|integration tests?|regression test)\b/i,
    points: 2,
  },
];

const ADVANCED_TITLE_SIGNALS: Signal[] = [
  {
    pattern:
      /\b(architecture|redesign|rewrite|race condition|deadlock|thread safety|concurrency|memory leak|performance bottleneck|scalability|backward compatibility|breaking change|distributed system|security vulnerability|database migration|core refactor|lock-free|compiler internals)\b/i,
    points: 5,
  },
  {
    pattern:
      /\b(migration|optimi[sz]e|optimization|throughput|latency|memory usage|cross-platform refactor|protocol redesign)\b/i,
    points: 3,
  },
];

const ADVANCED_BODY_SIGNALS: Signal[] = [
  {
    pattern:
      /\b(race condition|deadlock|thread safety|concurrency|memory leak|performance bottleneck|backward compatibility|security vulnerability|architecture redesign|database migration|distributed system|compiler internals|lock-free)\b/i,
    points: 3,
  },
  {
    pattern:
      /\b(multiple subsystems|breaking changes|backwards compatibility|data consistency|high contention|large scale refactor)\b/i,
    points: 2,
  },
];

function normalizeLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreSignals(text: string, signals: Signal[]): number {
  return signals.reduce(
    (score, signal) =>
      score + (signal.pattern.test(text) ? signal.points : 0),
    0,
  );
}

export function inferSkillLevel(
  labels: string[],
  title = "",
  body = "",
): SkillLevel {
  const normalizedLabels = labels.map(normalizeLabel);

  // Explicit maintainer difficulty labels are stronger than text guesses.
  const declaredLevels = (
    Object.entries(EXPLICIT_LABELS) as [RatedLevel, RegExp][]
  ).filter(([, pattern]) =>
    normalizedLabels.some((label) => pattern.test(label)),
  );

  // Contradictory difficulty labels mean we should not guess.
  if (declaredLevels.length > 1) {
    return "unspecified";
  }

  if (declaredLevels.length === 1) {
    return declaredLevels[0][0];
  }

  const normalizedTitle = title.toLowerCase();
  const normalizedBody = body.toLowerCase();

  const scores: Record<RatedLevel, number> = {
    beginner:
      scoreSignals(normalizedTitle, BEGINNER_TITLE_SIGNALS) +
      scoreSignals(normalizedBody, BEGINNER_BODY_SIGNALS),
    intermediate:
      scoreSignals(normalizedTitle, INTERMEDIATE_TITLE_SIGNALS) +
      scoreSignals(normalizedBody, INTERMEDIATE_BODY_SIGNALS),
    advanced:
      scoreSignals(normalizedTitle, ADVANCED_TITLE_SIGNALS) +
      scoreSignals(normalizedBody, ADVANCED_BODY_SIGNALS),
  };

  const ranked = (
    Object.entries(scores) as [RatedLevel, number][]
  ).sort((a, b) => b[1] - a[1]);

  const [bestLevel, bestScore] = ranked[0];
  const secondBestScore = ranked[1][1];

  // Require meaningful evidence and a clear winner.
  // This helps avoid presenting a weak guess as a reliable rating.
  if (bestScore < 3 || bestScore - secondBestScore < 2) {
    return "unspecified";
  }

  return bestLevel;
}
