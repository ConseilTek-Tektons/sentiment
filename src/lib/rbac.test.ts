import { describe, expect, it } from "vitest";

import { hasPermission, resolveRolesFromClaims } from "./rbac";

describe("RBAC", () => {
  it("allows HR administrators to manage retention", () => expect(hasPermission(["hr_admin"], "retention.manage")).toBe(true));
  it("prevents employees from viewing aggregate analytics", () => expect(hasPermission(["employee"], "analytics.view")).toBe(false));
  it("maps IdP groups", () => expect(resolveRolesFromClaims({ groups: ["people-partners"] })).toEqual(["people_partner"]));
});
