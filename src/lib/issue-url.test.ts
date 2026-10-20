
import { describe, expect, it } from "vitest";

import {
  buildIssuePreviewUrl,
  parseIssuePreviewUrl,
} from "./issue-url";

describe("parseIssuePreviewUrl", () => {
  it("parses a valid direct issue link", () => {
    expect(
      parseIssuePreviewUrl(
        "?issue=acme%2Fdemo%2F42",
      ),
    ).toEqual({
      owner: "acme",
      repo: "demo",
      issueNumber: 42,
    });
  });

  it("returns null when no issue parameter exists", () => {
    expect(parseIssuePreviewUrl("?search=1&q=Python")).toBeNull();
  });

  it("rejects malformed issue links", () => {
    expect(parseIssuePreviewUrl("?issue=acme/demo")).toBeNull();
    expect(
      parseIssuePreviewUrl("?issue=../demo/42"),
    ).toBeNull();
    expect(
      parseIssuePreviewUrl("?issue=acme/demo/0"),
    ).toBeNull();
    expect(
      parseIssuePreviewUrl("?issue=acme/demo/99999999999999999999"),
    ).toBeNull();
  });
});

describe("buildIssuePreviewUrl", () => {
  it("builds a direct issue link", () => {
    const result = new URL(
      buildIssuePreviewUrl(
        "acme/demo",
        42,
        "https://issue-scout.example/",
      ),
    );

    expect(result.origin).toBe("https://issue-scout.example");
    expect(result.pathname).toBe("/");
    expect(result.searchParams.get("issue")).toBe("acme/demo/42");
  });

  it("replaces existing query parameters", () => {
    const result = new URL(
      buildIssuePreviewUrl(
        "acme/demo",
        42,
        "https://issue-scout.example/?search=1&q=Python",
      ),
    );

    expect(result.searchParams.get("issue")).toBe("acme/demo/42");
    expect(result.searchParams.has("search")).toBe(false);
    expect(result.searchParams.has("q")).toBe(false);
  });

  it("rejects invalid issue data", () => {
    expect(() =>
      buildIssuePreviewUrl(
        "../demo",
        42,
        "https://issue-scout.example/",
      ),
    ).toThrow("Invalid repository or issue number.");
  });
});
