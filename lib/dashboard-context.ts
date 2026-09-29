import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const getDashboardContext = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: shop } = await supabase
    .from("shops")
    .select(
      "id,name,slug,timezone,currency,phone,address,city,state",
    )
    .eq("owner_id", user.id)
    .single();

  if (!shop) redirect("/auth/provision");

  return { supabase, user, shop };
});
