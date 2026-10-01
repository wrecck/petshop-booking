import { NextResponse } from "next/server";
import { DEFAULT_BRANDING } from "@/lib/branding";
import { demoShopfront, DEMO_SHOP_SLUG } from "@/lib/demo-data";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type ShopRow = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  currency: string;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  theme_preset: string | null;
  primary_color: string | null;
  accent_color: string | null;
  background_color: string | null;
  surface_color: string | null;
  text_color: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  show_ratings: boolean | null;
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;

  if (!hasSupabaseConfig()) {
    return slug === DEMO_SHOP_SLUG
      ? NextResponse.json(demoShopfront)
      : NextResponse.json({ error: "Shop not found." }, { status: 404 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shops")
    .select(
      "id,name,slug,timezone,currency,address,city,state,phone,theme_preset,primary_color,accent_color,background_color,surface_color,text_color,hero_title,hero_subtitle,show_ratings",
    )
    .eq("slug", slug)
    .eq("active", true)
    .single();

  const shop = data as ShopRow | null;
  if (error || !shop) {
    return NextResponse.json({ error: "Shop not found." }, { status: 404 });
  }

  const [{ data: services }, { data: staff }, { data: pages }] =
    await Promise.all([
      supabase
        .from("services")
        .select("id,shop_id,name,description,duration_minutes,price_cents")
        .eq("shop_id", shop.id)
        .eq("active", true)
        .order("sort_order"),
      supabase
        .from("staff")
        .select("id,shop_id,name,role,initials,color")
        .eq("shop_id", shop.id)
        .eq("active", true)
        .order("created_at"),
      supabase
        .from("shop_pages")
        .select("id,shop_id,title,slug,content,published,sort_order")
        .eq("shop_id", shop.id)
        .eq("published", true)
        .order("sort_order"),
    ]);

  return NextResponse.json({
    shop: {
      ...DEFAULT_BRANDING,
      ...shop,
    },
    services: services ?? [],
    staff: staff ?? [],
    pages: pages ?? [],
  });
}
