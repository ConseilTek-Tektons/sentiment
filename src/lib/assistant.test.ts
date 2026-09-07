import { describe, expect, it } from "vitest";

import { knowledgeArticles } from "../data/knowledge";
import { retrieveLocalKnowledge } from "./assistant";

describe("people knowledge retrieval", () => {
  it("prioritizes privacy policy for hidden cohort questions", () => {
    expect(retrieveLocalKnowledge("Why is this small cohort hidden?", knowledgeArticles)[0]?.id).toBe("anonymity-threshold");
  });
});
