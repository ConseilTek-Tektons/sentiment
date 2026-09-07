import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/auth";
import { rbacConfig } from "@/config/rbac";
import { database } from "@/lib/db";
import { hasEffectivePermission } from "@/lib/rbac-server";

export const runtime = "nodejs";
const workspaceId = process.env.WORKSPACE_ID ?? "00000000-0000-4000-8000-000000000001";
const policySchema = z.object({ rolePermissions: z.record(z.string(), z.array(z.string()).max(100)) });
function defaultPolicy(): Record<string, string[]> {
  return Object.fromEntries(Object.entries(rbacConfig.rolePermissions).map(([role, grants]) => [role, [...grants]]));
}
async function authorized() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  if (!await hasEffectivePermission(session.user.roles, "access.manage")) return { response: NextResponse.json({ error: "Forbidden." }, { status: 403 }) };
  return { session };
}

export async function GET() {
  const access = await authorized();
  if (access.response) return access.response;
  if (!process.env.DATABASE_URL && !process.env.PGHOST) return NextResponse.json({ rolePermissions: defaultPolicy(), mode: "policy-as-code" });
  const sql = database();
  const rows = await sql<{ roleKey: string; permissions: string[] }[]>`
    select role_key, permissions from app.role_policy where organisation_id = ${workspaceId}
  `;
  const rolePermissions = defaultPolicy();
  for (const row of rows) rolePermissions[row.roleKey] = row.permissions;
  return NextResponse.json({ rolePermissions, mode: "postgres" });
}

export async function PUT(request: Request) {
  const access = await authorized();
  if (access.response) return access.response;
  if (!process.env.DATABASE_URL && !process.env.PGHOST) return NextResponse.json({ error: "PostgreSQL is required to save access policy." }, { status: 503 });
  const parsed = policySchema.safeParse(await request.json().catch(() => null));
  const roles = Object.keys(rbacConfig.roles);
  const permissions = new Set(Object.keys(rbacConfig.permissions));
  if (!parsed.success || roles.some((role) => !parsed.data.rolePermissions[role])) return NextResponse.json({ error: "A complete role policy is required." }, { status: 400 });
  if (Object.entries(parsed.data.rolePermissions).some(([role, grants]) => !roles.includes(role) || grants.some((grant) => grant !== "*" && !permissions.has(grant)))) return NextResponse.json({ error: "The policy contains an unknown role or permission." }, { status: 400 });
  const reviewed: Record<string, string[]> = { ...parsed.data.rolePermissions, owner: ["*"] };
  const sql = database();
  await sql.begin(async (transaction) => {
    await transaction`delete from app.role_policy where organisation_id = ${workspaceId}`;
    for (const role of roles) {
      await transaction`
        insert into app.role_policy (organisation_id, role_key, permissions, updated_by)
        values (${workspaceId}, ${role}, ${transaction.array(reviewed[role])}, ${access.session.user.id})
      `;
    }
    await transaction`
      insert into app.audit_event (organisation_id, actor_subject, action, entity_type, entity_id, payload)
      values (${workspaceId}, ${access.session.user.id}, 'rbac.policy.updated', 'role_policy', ${workspaceId}, ${transaction.json({ roles })})
    `;
  });
  return NextResponse.json({ rolePermissions: reviewed, mode: "postgres" });
}
