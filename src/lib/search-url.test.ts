import { describe, expect, it } from "vitest";

import {
  buildSearchUrl,
  parseSearchUrl,
  type SearchUrlState,
} from "./search-url";

describe("parseSearchUrl", () => {
  it("restores filters from a shared search URL", () => {
    const result = parseSearchUrl(
      "?search=1&q=compiler&language=Python" +
        "&label=bug&level=beginner&age=1w" +
        "&status=open&page=2",
    );

    expect(result.autoSearch).toBe(true);

    expect(result.state).toEqual({
      query: "compiler",
      language: "Python",
      label: "bug",
      level: "beginner",
      age: "1w",
      status: "open",
      page: 2,
    });
  });

  it("uses defaults when parameters are missing", () => {
    const result = parseSearchUrl("");

    expect(result.autoSearch).toBe(false);

    expect(result.state).toEqual({
      query: "",
      language: "",
      label: "",
      level: "all",
      age: "any",
      status: "open",
      page: 1,
    });
  });

  it("rejects invalid filter values and limits the page number", () => {
    const result = parseSearchUrl(
      "?search=1&level=invalid&age=invalid" +
        "&status=invalid&page=999",
    );

    expect(result.state.level).toBe("all");
    expect(result.state.age).toBe("any");
    expect(result.state.status).toBe("open");
    expect(result.state.page).toBe(20);
  });

  it("builds a complete shareable URL", () => {
    const state: SearchUrlState = {
      query: "compiler bug",
      language: "TypeScript",
      label: "good first issue",
      level: "beginner",
      age: "1w",
      status: "open",
      page: 2,
    };

    const result = new URL(
      buildSearchUrl(state, "https://issue-scout.example/"),
    );

    expect(result.origin).toBe("https://issue-scout.example");
    expect(result.pathname).toBe("/");
    expect(result.searchParams.get("search")).toBe("1");
    expect(result.searchParams.get("q")).toBe("compiler bug");
    expect(result.searchParams.get("language")).toBe("TypeScript");
    expect(result.searchParams.get("label")).toBe("good first issue");
    expect(result.searchParams.get("level")).toBe("beginner");
    expect(result.searchParams.get("age")).toBe("1w");
    expect(result.searchParams.get("status")).toBe("open");
    expect(result.searchParams.get("page")).toBe("2");
  });
});