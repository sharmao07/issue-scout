
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

function jsonResponse(
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

const fakeIssue = {
  number: 42,
  title: "Fix the example bug",
  html_url: "https://github.com/acme/demo/issues/42",
  state: "open" as const,
  locked: true,
  active_lock_reason: "too heated",
  assignees: [
    {
      login: "octocat",
      html_url: "https://github.com/octocat",
    },
  ],
  state_reason: null,
  closed_at: null,
  created_at: "2026-10-18T12:00:00Z",
  updated_at: "2026-10-20T12:00:00Z",
  comments: 1,
  labels: [
    {
      name: "bug",
      color: "d73a4a",
    },
  ],
};

const fakeComments = [
  {
    id: 99,
    html_url:
      "https://github.com/acme/demo/issues/42#issuecomment-99",
    user: {
      login: "maintainer",
    },
    body: "Please include a regression test.",
    created_at: "2026-10-20T11:00:00Z",
  },
];

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GET /api/issue-availability", () => {
  it("returns the current issue status and recent comments", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(fakeIssue))
      .mockResolvedValueOnce(jsonResponse(fakeComments));

    const response = await GET(
      new Request(
        "http://localhost/api/issue-availability" +
          "?owner=acme&repo=demo&issue_number=42",
      ),
    );

    expect(response.status).toBe(200);

    const data = await response.json();

    expect(data.issue.state).toBe("open");
    expect(data.issue.locked).toBe(true);
    expect(data.issue.activeLockReason).toBe("too heated");
    expect(data.issue.assignees).toEqual([
      {
        login: "octocat",
        url: "https://github.com/octocat",
      },
    ]);

    expect(data.recentCommentsAvailable).toBe(true);
    expect(data.recentComments).toHaveLength(1);
    expect(data.recentComments[0].author).toBe("maintainer");
    expect(data.recentComments[0].body).toContain(
      "regression test",
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);

    const issueRequest = fetchMock.mock.calls[0][0];

    expect(String(issueRequest)).toBe(
      "https://api.github.com/repos/acme/demo/issues/42",
    );

    const commentsRequest = new URL(
      String(fetchMock.mock.calls[1][0]),
    );

    expect(commentsRequest.searchParams.get("sort")).toBe("created");
    expect(commentsRequest.searchParams.get("direction")).toBe(
      "desc",
    );
    expect(commentsRequest.searchParams.get("per_page")).toBe("3");
  });

  it("rejects invalid repository and issue parameters", async () => {
    const response = await GET(
      new Request(
        "http://localhost/api/issue-availability" +
          "?owner=acme&repo=../other&issue_number=42",
      ),
    );

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid issue number", async () => {
    const response = await GET(
      new Request(
        "http://localhost/api/issue-availability" +
          "?owner=acme&repo=demo&issue_number=-1",
      ),
    );

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 404 when GitHub cannot find the issue", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ message: "Not Found" }, 404),
    );

    const response = await GET(
      new Request(
        "http://localhost/api/issue-availability" +
          "?owner=acme&repo=demo&issue_number=404",
      ),
    );

    expect(response.status).toBe(404);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("keeps issue status when recent comments cannot load", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(fakeIssue))
      .mockResolvedValueOnce(
        jsonResponse(
          { message: "API rate limit exceeded" },
          403,
        ),
      );

    const response = await GET(
      new Request(
        "http://localhost/api/issue-availability" +
          "?owner=acme&repo=demo&issue_number=42",
      ),
    );

    expect(response.status).toBe(200);

    const data = await response.json();

    expect(data.issue.state).toBe("open");
    expect(data.recentComments).toEqual([]);
    expect(data.recentCommentsAvailable).toBe(false);
  });
});
