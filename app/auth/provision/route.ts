import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestedNext = url.searchParams.get("next") || "/dashboard";
  const next =
    requestedNext.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/dashboard";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  const { data: existingShop } = await supabase
    .from("shops")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (existingShop) {
    return NextResponse.redirect(new URL(next, url.origin));
  }

  const metadata = user.user_metadata;
  if (
    typeof metadata.shop_name !== "string" ||
    typeof metadata.shop_slug !== "string"
  ) {
    return NextResponse.redirect(
      new URL("/?error=shop-profile-missing", url.origin),
    );
  }

  const { error } = await supabase.rpc("create_shop_with_defaults", {
    p_name: metadata.shop_name,
    p_slug: metadata.shop_slug,
    p_timezone:
      typeof metadata.timezone === "string"
        ? metadata.timezone
        : "America/Los_Angeles",
  });

  if (error) {
    return NextResponse.redirect(
      new URL("/?error=shop-setup-failed", url.origin),
    );
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
