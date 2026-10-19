
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
  labels: Array<{ name: string; color: string }>;
  comments: number;
  created_at: string;
  updated_at: string;
};

type GitHubSearchResponse = {
  total_count: number;
  items: GitHubIssue[];
};

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;

    const searchText = (params.get("q") ?? "")
      .replace(/[\r\n"]/g, " ")
      .trim()
      .slice(0, 100);

    const label = (params.get("label") ?? "")
      .replace(/[^\w .:-]/g, "")
      .trim()
      .slice(0, 60);

    const requestedLevel = params.get("level") ?? "all";
    const allowedLevels = [
      "all",
      "beginner",
      "intermediate",
      "advanced",
    ];

    const level = allowedLevels.includes(requestedLevel)
      ? requestedLevel
      : "all";

    const queryParts = ["is:issue", "is:open"];

    if (searchText) {
      queryParts.push(searchText);
    }

    if (label) {
      queryParts.push(`label:"${label}"`);
    }

    const apiUrl = new URL(
      "https://api.github.com/search/issues",
    );

    apiUrl.searchParams.set("q", queryParts.join(" "));
    apiUrl.searchParams.set("per_page", "100");
    apiUrl.searchParams.set("sort", "updated");
    apiUrl.searchParams.set("order", "desc");

    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      if (response.status === 403 || response.status === 429) {
        return Response.json(
          {
            error:
              "GitHub search is temporarily rate-limited. Wait a little and try again.",
          },
          { status: 429 },
        );
      }

      return Response.json(
        {
          error:
            "GitHub could not complete this search. Please try again later.",
        },
        { status: 502 },
      );
    }

    const data =
      (await response.json()) as GitHubSearchResponse;

    const issues: ScoutIssue[] = data.items.map((issue) => {
      const repository = issue.repository_url.replace(
        "https://api.github.com/repos/",
        "",
      );

      const labels = issue.labels.map((item) => ({
        name: item.name,
        color: item.color,
      }));

      return {
        id: issue.id,
        number: issue.number,
        title: issue.title,
        url: issue.html_url,
        repository,
        repositoryUrl: `https://github.com/${repository}`,
        author: issue.user?.login ?? "unknown",
        body: issue.body,
        labels,
        comments: issue.comments,
        createdAt: issue.created_at,
        updatedAt: issue.updated_at,
        level: inferSkillLevel(
          labels.map((item) => item.name),
        ),
      };
    });

    const filteredIssues =
      level === "all"
        ? issues
        : issues.filter((issue) => issue.level === level);

    return Response.json({
      total_count: data.total_count,
      returned_count: filteredIssues.length,
      issues: filteredIssues,
    });
  } catch {
    return Response.json(
      {
        error:
          "Unable to reach GitHub. Check your connection and try again.",
      },
      { status: 500 },
    );
  }
}
