import { describe, expect, it } from "vitest";

import { enforceAnonymityThreshold } from "./anonymity";

describe("anonymity enforcement", () => {
  it("masks both score and change below the threshold", () => {
    const result = enforceAnonymityThreshold({ cohort: "Small team", respondents: 4, score: 91, change: 8 }, 5);
    expect(result.masked).toBe(true);
    expect(result.visibleScore).toBeNull();
    expect(result.visibleChange).toBeNull();
  });

  it("reveals aggregate values at the threshold", () => {
    const result = enforceAnonymityThreshold({ cohort: "Eligible team", respondents: 5, score: 76, change: 3 }, 5);
    expect(result.visibleScore).toBe(76);
  });
});
