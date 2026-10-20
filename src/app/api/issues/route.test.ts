
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { GET } from "./route";

type FakeGitHubIssue = {
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

const baseIssue: FakeGitHubIssue = {
  id: 1,
  number: 1,
  title: "Add a beginner tutorial",
  html_url: "https://github.com/acme/demo/issues/1",
  repository_url: "https://api.github.com/repos/acme/demo",
  user: { login: "octocat" },
  body: "Write an introductory tutorial.",
  state: "open",
  labels: [{ name: "good first issue", color: "7057ff" }],
  comments: 0,
  created_at: "2026-10-18T12:00:00Z",
  updated_at: "2026-10-18T12:00:00Z",
};

function makeIssue(
  overrides: Partial<FakeGitHubIssue> = {},
): FakeGitHubIssue {
  return { ...baseIssue, ...overrides };
}

function githubResponse(
  items: FakeGitHubIssue[],
  totalCount = items.length,
  incompleteResults = false,
): Response {
  return new Response(
    JSON.stringify({
      total_count: totalCount,
      incomplete_results: incompleteResults,
      items,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GET /api/issues", () => {
  it("returns issues and defaults to open issues", async () => {
    fetchMock.mockResolvedValueOnce(
      githubResponse([makeIssue()]),
    );

    const response = await GET(
      new Request("http://localhost/api/issues"),
    );

    expect(response.status).toBe(200);

    const data = await response.json();

    expect(data.issues).toHaveLength(1);
    expect(data.issues[0].repository).toBe("acme/demo");
    expect(data.issues[0].level).toBe("beginner");
    expect(data.returned_count).toBe(1);
    expect(data.total_pages).toBe(1);

    const requestedUrl = new URL(
      String(fetchMock.mock.calls[0][0]),
    );

    const query = requestedUrl.searchParams.get("q") ?? "";

    expect(query).toContain("is:issue");
    expect(query).toContain("is:open");
    expect(query).toMatch(
      /created:<=\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/,
    );

    expect(requestedUrl.searchParams.get("per_page")).toBe("50");
    expect(requestedUrl.searchParams.get("page")).toBe("1");
    expect(requestedUrl.searchParams.get("sort")).toBe("created");
    expect(requestedUrl.searchParams.get("order")).toBe("desc");
  });

  it("excludes issues created less than 30 minutes ago", async () => {
    const recentIssue = makeIssue({
      id: 2,
      number: 2,
      title: "Created 2 minutes ago",
      created_at: new Date(
        Date.now() - 2 * 60 * 1000,
      ).toISOString(),
    });

    const oldEnoughIssue = makeIssue({
      id: 3,
      number: 3,
      title: "Created 35 minutes ago",
      created_at: new Date(
        Date.now() - 35 * 60 * 1000,
      ).toISOString(),
    });

    fetchMock.mockResolvedValueOnce(
      githubResponse([recentIssue, oldEnoughIssue]),
    );

    const response = await GET(
      new Request("http://localhost/api/issues"),
    );

    expect(response.status).toBe(200);

    const data = await response.json();

    expect(data.issues).toHaveLength(1);
    expect(data.issues[0].title).toBe(
      "Created 35 minutes ago",
    );
    expect(data.returned_count).toBe(1);
  });

  it("combines search terms, filters, and pagination", async () => {
    fetchMock.mockResolvedValueOnce(
      githubResponse(
        [
          makeIssue({
            state: "closed",
            labels: [
              { name: "bug", color: "d73a4a" },
              { name: "good first issue", color: "7057ff" },
            ],
          }),
        ],
        101,
      ),
    );

    const response = await GET(
      new Request(
        "http://localhost/api/issues" +
          "?q=compiler%20bug" +
          "&language=Python" +
          "&label=bug" +
          "&level=beginner" +
          "&age=1d" +
          "&status=closed" +
          "&page=2",
      ),
    );

    expect(response.status).toBe(200);

    const data = await response.json();

    expect(data.page).toBe(2);
    expect(data.total_count).toBe(101);
    expect(data.total_pages).toBe(3);
    expect(data.issues).toHaveLength(1);

    const requestedUrl = new URL(
      String(fetchMock.mock.calls[0][0]),
    );

    const query = requestedUrl.searchParams.get("q") ?? "";

    expect(query).toContain("is:issue");
    expect(query).toContain("is:closed");
    expect(query).toContain("compiler bug");
    expect(query).toContain('label:"bug"');
    expect(query).toContain("language:Python");
    expect(query).toContain("created:>=");
    expect(query).toContain("created:<=");
    expect(query).toContain('label:"good first issue"');

    expect(requestedUrl.searchParams.get("page")).toBe("2");
  });

  it("does not return pull requests as issues", async () => {
    fetchMock.mockResolvedValueOnce(
      githubResponse([
        makeIssue(),
        makeIssue({
          id: 2,
          number: 2,
          title: "A pull request",
          pull_request: {
            url: "https://api.github.com/repos/acme/demo/pulls/2",
          },
        }),
      ]),
    );

    const response = await GET(
      new Request("http://localhost/api/issues"),
    );

    const data = await response.json();

    expect(data.issues).toHaveLength(1);
    expect(data.returned_count).toBe(1);
    expect(data.issues[0].title).toBe(
      "Add a beginner tutorial",
    );
  });

  it("returns an empty list when GitHub finds no issues", async () => {
    fetchMock.mockResolvedValueOnce(githubResponse([], 0));

    const response = await GET(
      new Request("http://localhost/api/issues?q=unlikelyterm"),
    );

    expect(response.status).toBe(200);

    const data = await response.json();

    expect(data.issues).toEqual([]);
    expect(data.returned_count).toBe(0);
    expect(data.total_pages).toBe(1);
  });

  it("handles GitHub rate limits", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ message: "API rate limit exceeded" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    const response = await GET(
      new Request("http://localhost/api/issues"),
    );

    expect(response.status).toBe(429);

    const data = await response.json();

    expect(data.error).toContain("rate-limited");
  });
});
