import { rbacConfig } from "../config/rbac";

export function hasPermission(roles: readonly string[], permission: string): boolean {
  return roles.some((role) => {
    const permissions = rbacConfig.rolePermissions[role] ?? [];
    return permissions.includes("*") || permissions.includes(permission);
  });
}

function readClaimPath(claims: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => {
    if (!value || typeof value !== "object") return undefined;
    return (value as Record<string, unknown>)[key];
  }, claims);
}

export function resolveRolesFromClaims(claims: Record<string, unknown>): string[] {
  const claimPath = process.env.OIDC_ROLE_CLAIM ?? "groups";
  const raw = readClaimPath(claims, claimPath);
  const groups = Array.isArray(raw)
    ? raw.filter((item): item is string => typeof item === "string")
    : typeof raw === "string"
      ? raw.split(/[ ,]+/).filter(Boolean)
      : [];

  const roles = groups.flatMap((group) => {
    const mapped = rbacConfig.identityGroupMappings[group];
    if (mapped) return [mapped];
    return group in rbacConfig.roles ? [group] : [];
  });

  return [...new Set(roles.length ? roles : [rbacConfig.defaultRole])];
}

export function visiblePermissions(roles: readonly string[]): string[] {
  return Object.keys(rbacConfig.permissions).filter((permission) =>
    hasPermission(roles, permission),
  );
}
