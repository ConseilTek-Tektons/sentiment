import { database } from "./db";
import { hasPermission } from "./rbac";

const workspaceId = process.env.WORKSPACE_ID ?? "00000000-0000-4000-8000-000000000001";

export async function hasEffectivePermission(
  roles: readonly string[],
  permission: string,
): Promise<boolean> {
  if (!process.env.DATABASE_URL && !process.env.PGHOST) {
    return hasPermission(roles, permission);
  }

  try {
    const sql = database();
    const policies = await sql<{ roleKey: string; permissions: string[] }[]>`
      select role_key, permissions
      from app.role_policy
      where organisation_id = ${workspaceId}
        and role_key in ${sql(roles)}
    `;
    if (policies.length === 0) return hasPermission(roles, permission);

    const byRole = new Map(policies.map((policy) => [policy.roleKey, policy.permissions]));
    return roles.some((role) => {
      const configured = byRole.get(role);
      return configured
        ? configured.includes("*") || configured.includes(permission)
        : hasPermission([role], permission);
    });
  } catch (error) {
    console.error("security.rbac_policy_unavailable", { message: String(error) });
    return false;
  }
}
