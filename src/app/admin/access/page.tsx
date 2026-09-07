import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";

import { authOptions } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { RbacMatrix } from "@/components/rbac-matrix";
import { hasEffectivePermission } from "@/lib/rbac-server";

export const dynamic = "force-dynamic";

export default async function AccessPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  if (!await hasEffectivePermission(session.user.roles, "access.manage")) {
    return (
      <AppShell user={session.user}>
        <div className="empty-state">
          <span>403</span>
          <h1>Access policy is restricted.</h1>
          <p>Your current role cannot manage workspace permissions.</p>
          <Link className="primary-button" href="/">Return to overview</Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell user={session.user}>
      <RbacMatrix />
    </AppShell>
  );
}
