
type GitHubRepository = {
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  pushed_at: string | null;
  updated_at: string;
  archived: boolean;
  disabled: boolean;
  default_branch: string;
  license: { spdx_id: string } | null;
};

const CONTRIBUTING_PATHS = [
  "CONTRIBUTING.md",
  ".github/CONTRIBUTING.md",
  "docs/CONTRIBUTING.md",
] as const;

function isValidSegment(value: string): boolean {
  return (
    /^[A-Za-z0-9_.-]{1,100}$/.test(value) &&
    value !== "." &&
    value !== ".."
  );
}

function encodePathSegments(value: string): string {
  return value.split("/").map(encodeURIComponent).join("/");
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const owner = params.get("owner") ?? "";
  const repo = params.get("repo") ?? "";

  if (!isValidSegment(owner) || !isValidSegment(repo)) {
    return Response.json(
      { error: "A valid repository owner and name are required." },
      { status: 400 },
    );
  }

  try {
    const apiUrl =
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;

    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      next: { revalidate: 3600 },
    });

    if (response.status === 404) {
      return Response.json(
        {
          error:
            "Repository not found or no longer publicly accessible.",
        },
        { status: 404 },
      );
    }

    if (response.status === 403 || response.status === 429) {
      return Response.json(
        {
          error:
            "GitHub rate-limited this request. Try again later.",
        },
        { status: 429 },
      );
    }

    if (!response.ok) {
      return Response.json(
        { error: "Unable to load repository health information." },
        { status: 502 },
      );
    }

    const data = (await response.json()) as GitHubRepository;

    const pushedTimestamp = data.pushed_at
      ? Date.parse(data.pushed_at)
      : NaN;

    const pushedDaysAgo = Number.isFinite(pushedTimestamp)
      ? Math.max(
          0,
          Math.floor(
            (Date.now() - pushedTimestamp) / 86_400_000,
          ),
        )
      : null;

    const branchPath = encodePathSegments(data.default_branch);

    const guideChecks = await Promise.all(
      CONTRIBUTING_PATHS.map(async (path) => {
        const rawUrl =
          `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/${branchPath}/${path}`;

        try {
          const result = await fetch(rawUrl, {
            method: "HEAD",
            redirect: "follow",
            next: { revalidate: 3600 },
          });

          return {
            path,
            exists: result.ok,
            checked:
              result.status === 200 || result.status === 404,
          };
        } catch {
          return {
            path,
            exists: false,
            checked: false,
          };
        }
      }),
    );

    const contributionGuides = guideChecks
      .filter((check) => check.exists)
      .map((check) => ({
        path: check.path,
        url:
          `https://github.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/blob/${branchPath}/${check.path}`,
      }));

    return Response.json({
      repository: {
        fullName: data.full_name,
        url: data.html_url,
        description: data.description,
        stars: data.stargazers_count,
        forks: data.forks_count,
        openItems: data.open_issues_count,
        pushedAt: data.pushed_at,
        pushedDaysAgo,
        updatedAt: data.updated_at,
        archived: data.archived,
        disabled: data.disabled,
        defaultBranch: data.default_branch,
        license: data.license?.spdx_id ?? null,
      },
      contributionGuides,
      contributionGuidesChecked: guideChecks.every(
        (check) => check.checked,
      ),
    });
  } catch {
    return Response.json(
      {
        error:
          "Unable to reach GitHub. Check your connection and try again.",
      },
      { status: 502 },
    );
  }
}
