
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { GET } from "./route.js";

const fetchMock = vi.fn<typeof fetch>();

const fakeRepository = {
  full_name: "acme/demo",
  html_url: "https://github.com/acme/demo",
  description: "A demonstration project.",
  stargazers_count: 120,
  forks_count: 30,
  open_issues_count: 8,
  pushed_at: "2026-10-18T12:00:00Z",
  updated_at: "2026-10-18T12:00:00Z",
  archived: false,
  disabled: false,
  default_branch: "main",
  license: { spdx_id: "MIT" },
};

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GET /api/repository", () => {
  it("returns repository health and detects a contribution guide", async () => {
    fetchMock.mockImplementation(async (input) => {
      const url = String(input);

      if (url === "https://api.github.com/repos/acme/demo") {
        return new Response(JSON.stringify(fakeRepository), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.endsWith("/main/CONTRIBUTING.md")) {
        return new Response(null, { status: 200 });
      }

      return new Response(null, { status: 404 });
    });

    const response = await GET(
      new Request(
        "http://localhost/api/repository?owner=acme&repo=demo",
      ),
    );

    expect(response.status).toBe(200);

    const data = await response.json();

    expect(data.repository.fullName).toBe("acme/demo");
    expect(data.repository.stars).toBe(120);
    expect(data.repository.forks).toBe(30);
    expect(data.repository.license).toBe("MIT");
    expect(data.repository.pushedDaysAgo).toEqual(
      expect.any(Number),
    );

    expect(data.contributionGuidesChecked).toBe(true);
    expect(data.contributionGuides).toEqual([
      {
        path: "CONTRIBUTING.md",
        url: "https://github.com/acme/demo/blob/main/CONTRIBUTING.md",
      },
    ]);
  });

  it("rejects invalid repository parameters", async () => {
    const response = await GET(
      new Request(
        "http://localhost/api/repository?owner=acme&repo=../other",
      ),
    );

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports a missing public repository", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Not Found" }), {
        status: 404,
      }),
    );

    const response = await GET(
      new Request(
        "http://localhost/api/repository?owner=acme&repo=missing",
      ),
    );

    expect(response.status).toBe(404);
  });
});
