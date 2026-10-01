import { cache } from "react";
import { redirect } from "next/navigation";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const getDashboardContext = cache(async () => {
  if (!hasSupabaseConfig()) redirect("/");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: shop } = await supabase
    .from("shops")
    .select(
      "id,name,slug,timezone,currency,phone,address,city,state,theme_preset,primary_color,accent_color,background_color,surface_color,text_color,hero_title,hero_subtitle,show_ratings",
    )
    .eq("owner_id", user.id)
    .single();

  if (!shop) redirect("/auth/provision");

  return { supabase, user, shop };
});
