
type GitHubIssue = {
  number: number;
  title: string;
  html_url: string;
  state: "open" | "closed";
  locked: boolean;
  active_lock_reason?: string | null;
  assignees?: Array<{
    login: string;
    html_url: string;
  }> | null;
  state_reason?: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  comments: number;
  labels: Array<{
    name: string;
    color: string;
  }>;
  pull_request?: unknown;
};

type GitHubIssueComment = {
  id: number;
  html_url: string;
  user: {
    login: string;
  } | null;
  body: string | null;
  created_at: string;
};

type AvailabilityComment = {
  id: number;
  url: string;
  author: string;
  body: string | null;
  createdAt: string;
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
      {
        error: "A valid repository owner and name are required.",
      },
      400,
    );
  }

  if (
    !/^[1-9]\d*$/.test(issueNumberText) ||
    !Number.isSafeInteger(Number(issueNumberText))
  ) {
    return jsonResponse(
      {
        error: "A valid positive issue number is required.",
      },
      400,
    );
  }

  const issueNumber = Number(issueNumberText);
  const repositoryPath =
    `https://api.github.com/repos/` +
    `${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;

  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  try {
    // Always request the current issue state.
    const issueResponse = await fetch(
      `${repositoryPath}/issues/${issueNumber}`,
      {
        headers,
        cache: "no-store",
      },
    );

    if (issueResponse.status === 404) {
      return jsonResponse(
        {
          error:
            "This issue or its public repository could not be found.",
        },
        404,
      );
    }

    if (
      issueResponse.status === 403 ||
      issueResponse.status === 429
    ) {
      return jsonResponse(
        {
          error:
            "GitHub refused or rate-limited this request. Try again later.",
        },
        429,
      );
    }

    if (issueResponse.status === 422) {
      return jsonResponse(
        {
          error: "GitHub rejected the issue request.",
        },
        400,
      );
    }

    if (!issueResponse.ok) {
      return jsonResponse(
        {
          error: "Unable to refresh the issue from GitHub.",
        },
        502,
      );
    }

    const data = (await issueResponse.json()) as GitHubIssue;

    // The GitHub Issues API can also return pull requests.
    if (data.pull_request) {
      return jsonResponse(
        {
          error:
            "This endpoint supports issues, not pull requests.",
        },
        422,
      );
    }

    // Recent comments supplement the current issue snapshot.
    // If comments cannot be loaded, preserve the status information.
    const commentsUrl = new URL(
      `${repositoryPath}/issues/${issueNumber}/comments`,
    );

    commentsUrl.searchParams.set("per_page", "3");
    commentsUrl.searchParams.set("sort", "created");
    commentsUrl.searchParams.set("direction", "desc");

    let recentComments: AvailabilityComment[] = [];
    let recentCommentsAvailable = false;

    try {
      const commentsResponse = await fetch(commentsUrl, {
        headers,
        cache: "no-store",
      });

      if (commentsResponse.ok) {
        const comments =
          (await commentsResponse.json()) as GitHubIssueComment[];

        recentComments = comments.slice(0, 3).map((comment) => ({
          id: comment.id,
          url: comment.html_url,
          author: comment.user?.login ?? "unknown",
          body: comment.body,
          createdAt: comment.created_at,
        }));

        recentCommentsAvailable = true;
      }
    } catch {
      // Recent discussion is optional; issue status is still useful.
    }

    return jsonResponse({
      issue: {
        number: data.number,
        title: data.title,
        url: data.html_url,
        state: data.state,
        locked: data.locked,
        activeLockReason: data.active_lock_reason ?? null,
        assignees: (data.assignees ?? []).map((assignee) => ({
          login: assignee.login,
          url: assignee.html_url,
        })),
        stateReason: data.state_reason ?? null,
        closedAt: data.closed_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        commentCount: data.comments,
        labels: data.labels.map((label) => ({
          name: label.name,
          color: label.color,
        })),
      },
      recentComments,
      recentCommentsAvailable,
    });
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
