import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/auth";
import { database } from "@/lib/db";
import { hasEffectivePermission } from "@/lib/rbac-server";

export const runtime = "nodejs";

const querySchema = z.object({
  cycleId: z.string().uuid(),
  dimension: z.enum(["team", "location", "tenure", "manager"]),
});

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!await hasEffectivePermission(session.user.roles, "analytics.view")) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    cycleId: url.searchParams.get("cycleId"),
    dimension: url.searchParams.get("dimension"),
  });
  if (!parsed.success) return NextResponse.json({ error: "A valid cycle and supported dimension are required." }, { status: 400 });
  if (!process.env.DATABASE_URL && !process.env.PGHOST) return NextResponse.json({ data: [], mode: "demo-ui", minimumRespondents: 5 });

  const sql = database();
  const rows = await sql`
    select cohort, respondents, score
    from app.cohort_scores(${parsed.data.cycleId}::uuid, ${parsed.data.dimension}, 5)
  `;
  return NextResponse.json({ data: rows, mode: "postgres", minimumRespondents: 5 });
}
