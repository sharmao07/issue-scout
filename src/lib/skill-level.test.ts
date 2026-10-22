import { describe, expect, it } from "vitest";
import { inferSkillLevel } from "./skill-level";

describe("inferSkillLevel", () => {
  it.each([
    ["good first issue", "beginner"],
    ["good-first-issue", "beginner"],
    ["good_first_issue", "beginner"],
    ["beginner friendly", "beginner"],
    ["easy", "beginner"],
    ["intermediate", "intermediate"],
    ["mid-level", "intermediate"],
    ["moderate", "intermediate"],
    ["advanced", "advanced"],
    ["difficult", "advanced"],
    ["hard", "advanced"],
    ["expert", "advanced"],
    ["documentation", "unspecified"],
    ["not easy", "unspecified"],
    ["hard-coded feature", "unspecified"],
  ] as const)(
    "classifies %s correctly",
    (label, expected) => {
      expect(inferSkillLevel([label])).toBe(expected);
    },
  );

  it("prioritizes beginner labels", () => {
    expect(
      inferSkillLevel(["hard", "good-first-issue"]),
    ).toBe("beginner");
  });

  it("prioritizes intermediate over advanced", () => {
    expect(inferSkillLevel(["hard", "medium"])).toBe(
      "intermediate",
    );
  });

  it("handles empty labels", () => {
    expect(inferSkillLevel([])).toBe("unspecified");
  });
});