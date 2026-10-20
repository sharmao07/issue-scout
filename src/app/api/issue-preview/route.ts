
import { inferSkillLevel } from "@/lib/skill-level";
import type { ScoutIssue } from "@/types/issue";

type GitHubIssue = {
  id: number;
  number: number;
  title: string;
  html_url: string;
  repository_url: string;
  user: {
    login: string;
  } | null;
  body: string | null;
  state: "open" | "closed";
  labels: Array<{
    name: string;
    color: string;
  }>;
  comments: number;
  created_at: string;
  updated_at: string;
  pull_request?: unknown;
};

function jsonResponse(
  data: unknown,
  status = 200,
): Response {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

function isValidSegment(value: string): boolean {
  return (
    /^[A-Za-z0-9_.-]{1,100}$/.test(value) &&
    value !== "." &&
    value !== ".."
  );
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  const owner = params.get("owner") ?? "";
  const repo = params.get("repo") ?? "";
  const issueNumberText = params.get("issue_number") ?? "";

  if (!isValidSegment(owner) || !isValidSegment(repo)) {
    return jsonResponse(
      { error: "A valid repository owner and name are required." },
      400,
    );
  }

  if (
    !/^[1-9]\d*$/.test(issueNumberText) ||
    !Number.isSafeInteger(Number(issueNumberText))
  ) {
    return jsonResponse(
      { error: "A valid positive issue number is required." },
      400,
    );
  }

  try {
    const apiUrl =
      `https://api.github.com/repos/` +
      `${encodeURIComponent(owner)}/` +
      `${encodeURIComponent(repo)}/issues/` +
      `${issueNumberText}`;

    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    });

    if (response.status === 404) {
      return jsonResponse(
        {
          error:
            "Issue not found or no longer publicly accessible.",
        },
        404,
      );
    }

    if (response.status === 403 || response.status === 429) {
      return jsonResponse(
        {
          error:
            "GitHub rate-limited this request. Try again later.",
        },
        429,
      );
    }

    if (response.status === 422) {
      return jsonResponse(
        { error: "GitHub rejected the issue request." },
        400,
      );
    }

    if (!response.ok) {
      return jsonResponse(
        { error: "Unable to load this issue from GitHub." },
        502,
      );
    }

    const data = (await response.json()) as GitHubIssue;

    // GitHub's Issues API also returns pull requests.
    if (data.pull_request) {
      return jsonResponse(
        {
          error:
            "This link points to a pull request, not an issue.",
        },
        422,
      );
    }

    const repository = data.repository_url.replace(
      "https://api.github.com/repos/",
      "",
    );

    // Map GitHub's response to the existing ScoutIssue type.
    const issue: ScoutIssue = {
      id: data.id,
      number: data.number,
      title: data.title,
      url: data.html_url,
      repository,
      repositoryUrl: `https://github.com/${repository}`,
      author: data.user?.login ?? "unknown",
      body: data.body,
      labels: data.labels.map((label) => ({
        name: label.name,
        color: label.color,
      })),
      comments: data.comments,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      state: data.state,
      level: inferSkillLevel(
        data.labels.map((label) => label.name),
      ),
    };

    return jsonResponse({ issue });
  } catch {
    return jsonResponse(
      {
        error:
          "Unable to reach GitHub. Check your connection and try again.",
      },
      502,
    );
  }
}
