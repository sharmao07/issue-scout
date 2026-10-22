import { GITHUB_HEADERS, isValidSegment, parsePositiveInt } from "@/lib/github";
import type { AvailabilityComment } from "@/types/contribution";

type GitHubIssue = {
  number: number;
  title: string;
  html_url: string;
  state: "open" | "closed";
  locked: boolean;
  active_lock_reason?: string | null;
  assignees?: Array<{ login: string; html_url: string }> | null;
  state_reason?: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  comments: number;
  labels: Array<{ name: string; color: string }>;
  pull_request?: unknown;
};

type GitHubComment = {
  id: number;
  html_url: string;
  user: { login: string } | null;
  body: string | null;
  created_at: string;
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

  const repoBase = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;

  try {
    const issueRes = await fetch(`${repoBase}/issues/${issueNumber}`, {
      headers: GITHUB_HEADERS,
      cache: "no-store",
    });

    if (issueRes.status === 404) {
      return noStoreJson({ error: "This issue or its public repository could not be found." }, 404);
    }

    if (issueRes.status === 403 || issueRes.status === 429) {
      return noStoreJson({ error: "GitHub refused or rate-limited this request. Try again later." }, 429);
    }

    if (issueRes.status === 422) {
      return noStoreJson({ error: "GitHub rejected the issue request." }, 400);
    }

    if (!issueRes.ok) {
      return noStoreJson({ error: "Unable to refresh the issue from GitHub." }, 502);
    }

    const data = (await issueRes.json()) as GitHubIssue;

    if (data.pull_request) {
      return noStoreJson({ error: "This endpoint supports issues, not pull requests." }, 422);
    }

    // Attempt to fetch latest 3 comments (graceful fallback if comments fail)
    let recentComments: AvailabilityComment[] = [];
    let recentCommentsAvailable = false;

    try {
      const commentsUrl = new URL(`${repoBase}/issues/${issueNumber}/comments`);
      commentsUrl.searchParams.set("per_page", "3");
      commentsUrl.searchParams.set("sort", "created");
      commentsUrl.searchParams.set("direction", "desc");

      const commentsRes = await fetch(commentsUrl, {
        headers: GITHUB_HEADERS,
        cache: "no-store",
      });

      if (commentsRes.ok) {
        const comments = (await commentsRes.json()) as GitHubComment[];
        recentComments = comments.slice(0, 3).map((c) => ({
          id: c.id,
          url: c.html_url,
          author: c.user?.login ?? "unknown",
          body: c.body,
          createdAt: c.created_at,
        }));
        recentCommentsAvailable = true;
      }
    } catch {
      // Comments are optional; primary issue data remains valid
    }

    return noStoreJson({
      issue: {
        number: data.number,
        title: data.title,
        url: data.html_url,
        state: data.state,
        locked: data.locked,
        activeLockReason: data.active_lock_reason ?? null,
        assignees: (data.assignees ?? []).map((a) => ({
          login: a.login,
          url: a.html_url,
        })),
        stateReason: data.state_reason ?? null,
        closedAt: data.closed_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        commentCount: data.comments,
        labels: data.labels.map((l) => ({ name: l.name, color: l.color })),
      },
      recentComments,
      recentCommentsAvailable,
    });
  } catch {
    return noStoreJson(
      { error: "Unable to reach GitHub. Check your connection and try again." },
      502,
    );
  }
}
