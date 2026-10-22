export const GITHUB_HEADERS = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
} as const;

export function isValidSegment(value: string): boolean {
  return (
    /^[A-Za-z0-9_.-]{1,100}$/.test(value) &&
    value !== "." &&
    value !== ".."
  );
}

export function parsePositiveInt(value: string | null): number | null {
  if (!value || !/^[1-9]\d*$/.test(value)) return null;
  const num = Number(value);
  return Number.isSafeInteger(num) ? num : null;
}
