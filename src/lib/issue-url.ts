import { isValidSegment } from "@/lib/github";

export type IssuePreviewTarget = {
  owner: string;
  repo: string;
  issueNumber: number;
};

export function parseIssuePreviewUrl(search: string): IssuePreviewTarget | null {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const value = params.get("issue");
  if (!value) return null;

  const match = value.match(/^([^/]+)\/([^/]+)\/([1-9]\d*)$/);
  if (!match) return null;

  const [, owner, repo, issueNumberText] = match;
  if (!owner || !repo || !isValidSegment(owner) || !isValidSegment(repo)) {
    return null;
  }

  const issueNumber = Number(issueNumberText);
  if (!Number.isSafeInteger(issueNumber)) return null;

  return { owner, repo, issueNumber };
}

export function buildIssuePreviewUrl(
  repository: string,
  issueNumber: number,
  baseUrl: string,
): string {
  const [owner, repo, ...extra] = repository.split("/");

  if (
    !owner ||
    !repo ||
    extra.length > 0 ||
    !isValidSegment(owner) ||
    !isValidSegment(repo) ||
    !Number.isSafeInteger(issueNumber) ||
    issueNumber < 1
  ) {
    throw new Error("Invalid repository or issue number.");
  }

  const url = new URL(baseUrl);
  url.pathname = "/";
  url.search = "";
  url.hash = "";
  url.searchParams.set("issue", `${owner}/${repo}/${issueNumber}`);

  return url.toString();
}
