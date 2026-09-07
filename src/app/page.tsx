import { getServerSession } from "next-auth";

import { authOptions, demoEnabled } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { ProductDashboard } from "@/components/product-dashboard";
import { SignInCard } from "@/components/sign-in-card";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return (
      <SignInCard
        demoEnabled={demoEnabled}
        enterpriseEnabled={Boolean(process.env.OIDC_ISSUER)}
      />
    );
  }

  return (
    <AppShell user={session.user}>
      <ProductDashboard roles={session.user.roles} />
    </AppShell>
  );
}
