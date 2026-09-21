import { NextResponse } from "next/server";
import { demoShopfront, DEMO_SHOP_SLUG } from "@/lib/demo-data";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

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
  const { data: shop, error } = await supabase
    .from("shops")
    .select("id,name,slug,timezone,address,city,state,phone")
    .eq("slug", slug)
    .eq("active", true)
    .single();

  if (error || !shop) {
    return NextResponse.json({ error: "Shop not found." }, { status: 404 });
  }

  const [{ data: services }, { data: staff }] = await Promise.all([
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
  ]);

  return NextResponse.json({
    shop,
    services: services ?? [],
    staff: staff ?? [],
  });
}
