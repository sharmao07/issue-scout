import { GITHUB_HEADERS, isValidSegment, parsePositiveInt } from "@/lib/github";
import { inferSkillLevel } from "@/lib/skill-level";
import type { ScoutIssue } from "@/types/issue";

type GitHubIssue = {
  id: number;
  number: number;
  title: string;
  html_url: string;
  repository_url: string;
  user: { login: string } | null;
  body: string | null;
  state: "open" | "closed";
  labels: Array<{ name: string; color: string }>;
  comments: number;
  created_at: string;
  updated_at: string;
  pull_request?: unknown;
};

function noStoreJson(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner") ?? "";
  const repo = searchParams.get("repo") ?? "";
  const issueNumber = parsePositiveInt(searchParams.get("issue_number"));

  if (!isValidSegment(owner) || !isValidSegment(repo)) {
    return noStoreJson({ error: "A valid repository owner and name are required." }, 400);
  }

  if (issueNumber === null) {
    return noStoreJson({ error: "A valid positive issue number is required." }, 400);
  }

  try {
    const apiUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues/${issueNumber}`;
    const response = await fetch(apiUrl, {
      headers: GITHUB_HEADERS,
      cache: "no-store",
    });

    if (response.status === 404) {
      return noStoreJson({ error: "Issue not found or no longer publicly accessible." }, 404);
    }

    if (response.status === 403 || response.status === 429) {
      return noStoreJson({ error: "GitHub rate-limited this request. Try again later." }, 429);
    }

    if (response.status === 422) {
      return noStoreJson({ error: "GitHub rejected the issue request." }, 400);
    }

    if (!response.ok) {
      return noStoreJson({ error: "Unable to load this issue from GitHub." }, 502);
    }

    const data = (await response.json()) as GitHubIssue;

    // Filter out PRs returned by the Issues API
    if (data.pull_request) {
      return noStoreJson({ error: "This link points to a pull request, not an issue." }, 422);
    }

    const repository = data.repository_url.replace("https://api.github.com/repos/", "");

    const issue: ScoutIssue = {
      id: data.id,
      number: data.number,
      title: data.title,
      url: data.html_url,
      repository,
      repositoryUrl: `https://github.com/${repository}`,
      author: data.user?.login ?? "unknown",
      body: data.body,
      labels: data.labels.map((l) => ({ name: l.name, color: l.color })),
      comments: data.comments,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      state: data.state,
      level: inferSkillLevel(data.labels.map((l) => l.name)),
    };

    return noStoreJson({ issue });
  } catch {
    return noStoreJson(
      { error: "Unable to reach GitHub. Check your connection and try again." },
      502,
    );
  }
}
