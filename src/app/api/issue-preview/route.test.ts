
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { GET } from "./route";

const fetchMock = vi.fn<typeof fetch>();

const fakeIssue = {
  id: 42,
  number: 42,
  title: "Fix the example bug",
  html_url: "https://github.com/acme/demo/issues/42",
  repository_url: "https://api.github.com/repos/acme/demo",
  user: { login: "octocat" },
  body: "Steps to reproduce and expected behavior.",
  state: "open" as const,
  labels: [
    { name: "good first issue", color: "7057ff" },
  ],
  comments: 3,
  created_at: "2026-10-18T12:00:00Z",
  updated_at: "2026-10-20T12:00:00Z",
};

function githubResponse(
  data: unknown,
  status = 200,
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GET /api/issue-preview", () => {
  it("returns a ScoutIssue for a public GitHub issue", async () => {
    fetchMock.mockResolvedValueOnce(
      githubResponse(fakeIssue),
    );

    const response = await GET(
      new Request(
        "http://localhost/api/issue-preview" +
          "?owner=acme&repo=demo&issue_number=42",
      ),
    );

    expect(response.status).toBe(200);

    const data = await response.json();

    expect(data.issue).toMatchObject({
      id: 42,
      number: 42,
      title: "Fix the example bug",
      repository: "acme/demo",
      repositoryUrl: "https://github.com/acme/demo",
      author: "octocat",
      body: "Steps to reproduce and expected behavior.",
      state: "open",
      level: "beginner",
    });

    expect(data.issue.labels).toEqual([
      { name: "good first issue", color: "7057ff" },
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);

    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "https://api.github.com/repos/acme/demo/issues/42",
    );
  });

  it("rejects invalid repository parameters", async () => {
    const response = await GET(
      new Request(
        "http://localhost/api/issue-preview" +
          "?owner=acme&repo=../other&issue_number=42",
      ),
    );

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid issue number", async () => {
    const response = await GET(
      new Request(
        "http://localhost/api/issue-preview" +
          "?owner=acme&repo=demo&issue_number=-1",
      ),
    );

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 404 for a missing issue", async () => {
    fetchMock.mockResolvedValueOnce(
      githubResponse({ message: "Not Found" }, 404),
    );

    const response = await GET(
      new Request(
        "http://localhost/api/issue-preview" +
          "?owner=acme&repo=demo&issue_number=404",
      ),
    );

    expect(response.status).toBe(404);
  });

  it("handles GitHub rate limiting", async () => {
    fetchMock.mockResolvedValueOnce(
      githubResponse(
        { message: "API rate limit exceeded" },
        403,
      ),
    );

    const response = await GET(
      new Request(
        "http://localhost/api/issue-preview" +
          "?owner=acme&repo=demo&issue_number=42",
      ),
    );

    expect(response.status).toBe(429);
  });

  it("rejects pull requests", async () => {
    fetchMock.mockResolvedValueOnce(
      githubResponse({
        ...fakeIssue,
        pull_request: {
          url: "https://api.github.com/repos/acme/demo/pulls/42",
        },
      }),
    );

    const response = await GET(
      new Request(
        "http://localhost/api/issue-preview" +
          "?owner=acme&repo=demo&issue_number=42",
      ),
    );

    expect(response.status).toBe(422);
  });
});
