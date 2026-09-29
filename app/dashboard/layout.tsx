import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard-header";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  if (!hasSupabaseConfig()) return children;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: shop } = await supabase
    .from("shops")
    .select("name,slug")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!shop) redirect("/auth/provision");

  return (
    <main className="dashboard-page">
      <DashboardHeader shopName={shop.name} shopSlug={shop.slug} />
      {children}
    </main>
  );
}
