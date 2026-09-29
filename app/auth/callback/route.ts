import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const requestedNext = url.searchParams.get("next") || "/dashboard";
  const next =
    requestedNext.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: existingShop } = await supabase
          .from("shops")
          .select("id")
          .eq("owner_id", user.id)
          .maybeSingle();
        const metadata = user.user_metadata;

        if (
          !existingShop &&
          typeof metadata.shop_name === "string" &&
          typeof metadata.shop_slug === "string"
        ) {
          const { error: setupError } = await supabase.rpc(
            "create_shop_with_defaults",
            {
              p_name: metadata.shop_name,
              p_slug: metadata.shop_slug,
              p_timezone:
                typeof metadata.timezone === "string"
                  ? metadata.timezone
                  : "America/Los_Angeles",
            },
          );

          if (setupError) {
            return NextResponse.redirect(
              new URL("/dashboard?error=setup-failed", url.origin),
            );
          }
        }
      }

      return NextResponse.redirect(new URL(next, url.origin));
    }
  }

  return NextResponse.redirect(
    new URL("/login?error=confirmation_failed", url.origin),
  );
}
