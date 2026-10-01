import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, PawPrint } from "lucide-react";
import {
  brandingStyle,
  DEFAULT_BRANDING,
  type BrandingTheme,
  type ShopPage,
} from "@/lib/branding";
import { demoShopfront, DEMO_SHOP_SLUG } from "@/lib/demo-data";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type ShopRecord = {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
} & BrandingTheme;

async function loadShopPage(shopSlug: string, pageSlug: string) {
  if (!hasSupabaseConfig()) {
    if (shopSlug !== DEMO_SHOP_SLUG) return null;
    const page = demoShopfront.pages.find(
      (entry) => entry.slug === pageSlug && entry.published,
    );
    if (!page) return null;
    return { shop: demoShopfront.shop, page };
  }

  const supabase = await createClient();
  const { data: shop } = await supabase
    .from("shops")
    .select(
      "id,name,slug,address,city,state,phone,theme_preset,primary_color,accent_color,background_color,surface_color,text_color,hero_title,hero_subtitle,show_ratings",
    )
    .eq("slug", shopSlug)
    .eq("active", true)
    .maybeSingle();

  if (!shop) return null;

  const { data: page } = await supabase
    .from("shop_pages")
    .select("id,shop_id,title,slug,content,published,sort_order")
    .eq("shop_id", shop.id)
    .eq("slug", pageSlug)
    .eq("published", true)
    .maybeSingle();

  if (!page) return null;
  return {
    shop: { ...DEFAULT_BRANDING, ...shop } as ShopRecord,
    page: page as ShopPage,
  };
}

export default async function TenantInfoPage({
  params,
}: {
  params: Promise<{ slug: string; pageSlug: string }>;
}) {
  const { slug, pageSlug } = await params;
  const data = await loadShopPage(slug, pageSlug);
  if (!data) notFound();

  const { shop, page } = data;
  const theme: BrandingTheme = {
    ...DEFAULT_BRANDING,
    theme_preset: shop.theme_preset,
    primary_color: shop.primary_color,
    accent_color: shop.accent_color,
    background_color: shop.background_color,
    surface_color: shop.surface_color,
    text_color: shop.text_color,
    hero_title: shop.hero_title,
    hero_subtitle: shop.hero_subtitle,
    show_ratings: shop.show_ratings,
  };

  return (
    <main className="info-page" style={brandingStyle(theme)}>
      <header className="site-header">
        <Link className="brand" href={`/${shop.slug}`}>
          <span className="brand-mark">
            <PawPrint size={20} fill="currentColor" />
          </span>
          <span>{shop.name}</span>
        </Link>
        <div className="header-meta">
          <div>
            <strong>{shop.address ?? "Online booking"}</strong>
            <span>
              <MapPin size={13} />{" "}
              {[shop.city, shop.state].filter(Boolean).join(", ") ||
                "Book your visit"}
            </span>
          </div>
          <Link className="owner-link" href={`/${shop.slug}`}>
            Book now
          </Link>
        </div>
      </header>

      <div className="info-page-shell">
        <p className="eyebrow">Shop info</p>
        <h1>{page.title}</h1>
        <div className="info-page-content">{page.content}</div>
        <div className="info-page-actions">
          <Link className="primary-button" href={`/${shop.slug}`}>
            Book an appointment
          </Link>
          <Link className="owner-link" href={`/${shop.slug}`}>
            Back to booking
          </Link>
        </div>
      </div>
    </main>
  );
}
