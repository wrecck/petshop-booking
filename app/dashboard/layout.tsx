import { Suspense } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { getDashboardContext } from "@/lib/dashboard-context";
import { hasSupabaseConfig } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

async function DashboardHeaderLoader() {
  const { shop } = await getDashboardContext();
  return <DashboardHeader shopName={shop.name} shopSlug={shop.slug} />;
}

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  if (!hasSupabaseConfig()) return children;

  return (
    <main className="dashboard-page">
      <Suspense fallback={<div className="dashboard-header-skeleton" />}>
        <DashboardHeaderLoader />
      </Suspense>
      {children}
    </main>
  );
}
