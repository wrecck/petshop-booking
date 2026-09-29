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
      const provisionUrl = new URL("/auth/provision", url.origin);
      provisionUrl.searchParams.set("next", next);
      return NextResponse.redirect(provisionUrl);
    }
  }

  return NextResponse.redirect(
    new URL("/login?error=confirmation_failed", url.origin),
  );
}
